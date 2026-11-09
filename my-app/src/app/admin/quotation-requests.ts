import { Component, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-admin-quotation-requests',
  standalone: false,
  templateUrl: './quotation-requests.html',
  styleUrl: './quotation-requests.css',
})
export class AdminQuotationRequestsComponent {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  readonly requests = signal<any[]>([]);
  readonly coupons = signal<any[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly viewing = signal<any | null>(null);
  selectedCouponCode = '';
  paymentStatus = 'pending';
  paymentMethod = '';
  paymentNote = '';
  couponError = signal('');

  readonly activeCoupons = computed(() => (this.coupons() || []).filter((c) => c.status === 'hoạt động' || c.active));

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true);
    this.http.get<any>('/api/quotation-requests').subscribe({
      next: (r) => { this.requests.set(r.requests || r || []); this.loading.set(false); },
      error: () => { this.toast.error('Không tải được yêu cầu báo giá.'); this.loading.set(false); },
    });
    this.http.get<any>('/api/coupons?limit=200&active=true').subscribe({
      next: (r) => this.coupons.set(r.coupons || r || []),
      error: () => this.coupons.set([]),
    });
  }

  open(req: any): void {
    this.viewing.set({ ...req });
    this.selectedCouponCode = req?.appliedCoupon?.code || '';
    this.paymentStatus = req?.paymentStatus || 'pending';
    this.paymentMethod = req?.paymentMethod || '';
    this.paymentNote = req?.paymentNote || '';
    this.couponError.set('');
  }
  close(): void { this.viewing.set(null); this.couponError.set(''); }

  private selectedCoupon(): any | null {
    const code = String(this.selectedCouponCode || '').trim().toUpperCase();
    return code ? (this.activeCoupons().find((c) => c.code === code) || null) : null;
  }

  previewDiscount(): number {
    const c = this.selectedCoupon();
    const base = Number(this.viewing()?.totalEstimate || 0);
    if (!c) return 0;
    if (Number(c.minOrderValue || 0) > 0 && base < Number(c.minOrderValue)) return 0;
    let d = c.discountType === 'percent' ? Math.round((base * Number(c.discountValue || 0)) / 100) : Number(c.discountValue || 0);
    if (c.discountType === 'percent' && Number(c.maxDiscount || 0) > 0) d = Math.min(d, Number(c.maxDiscount));
    return Math.max(0, Math.min(d, base));
  }
  previewQuotedTotal(): number { return Math.max(0, Number(this.viewing()?.totalEstimate || 0) - this.previewDiscount()); }

  couponLabel(c: any): string {
    if (!c) return '';
    return c.discountType === 'percent' ? `Giảm ${c.discountValue}%` : `Giảm ${this.formatMoney(c.discountValue)}`;
  }
  paymentLabel(s: string): string { return ({ pending: 'Chưa thanh toán', paid: 'Đã thanh toán', failed: 'Thanh toán thất bại', refunded: 'Đã hoàn tiền' } as any)[s] || s || 'Chưa thanh toán'; }
  paymentMethodLabel(s: string): string { return ({ '': 'Chưa chọn', cod: 'COD (thu hộ)', bank_transfer: 'Chuyển khoản' } as any)[s] || s; }
  statusLabel(s: string): string { return ({ new: 'Mới', processing: 'Đang xử lý', quoted: 'Đã báo giá', accepted: 'Khách đã đồng ý', done: 'Hoàn tất' } as any)[s] || s; }

  clearCoupon(): void {
    const v = this.viewing(); if (!v) return;
    this.selectedCouponCode = '';
    this.save({ clearCoupon: true, sendQuoteMail: true }, 'Đã gỡ mã và gửi báo giá mới.');
  }

  applyAndSend(): void {
    const v = this.viewing(); if (!v || this.saving()) return;
    const code = String(this.selectedCouponCode || '').trim().toUpperCase();
    this.couponError.set('');
    const c = code ? this.activeCoupons().find((x) => x.code === code) : null;
    if (c && Number(c.minOrderValue || 0) > 0 && Number(v.totalEstimate || 0) < Number(c.minOrderValue)) {
      this.couponError.set(`Mã ${code} yêu cầu giá trị tối thiểu ${this.formatMoney(c.minOrderValue)}.`); return;
    }
    this.save({ couponCode: code, sendQuoteMail: true, status: v.status === 'new' ? 'quoted' : v.status }, 'Đã cập nhật báo giá.');
  }

  savePayment(): void {
    this.save({ paymentStatus: this.paymentStatus, paymentMethod: this.paymentMethod, paymentNote: this.paymentNote }, 'Đã cập nhật thanh toán.');
  }

  private save(body: any, fallback: string): void {
    const v = this.viewing(); if (!v || this.saving()) return;
    this.saving.set(true);
    this.http.patch<any>(`/api/quotation-requests/${v._id}`, body).subscribe({
      next: (r) => {
        this.toast.success(r?.message || fallback);
        this.saving.set(false);
        if (r.request) { this.upsertRequest(r.request); this.viewing.set({ ...r.request }); this.selectedCouponCode = r.request?.appliedCoupon?.code || ''; this.paymentStatus = r.request?.paymentStatus || 'pending'; this.paymentMethod = r.request?.paymentMethod || ''; this.paymentNote = r.request?.paymentNote || ''; }
      },
      error: (e) => { this.toast.error(e?.error?.message || 'Không thể cập nhật.'); this.saving.set(false); },
    });
  }

  private upsertRequest(doc: any): void {
    if (!doc?._id) return;
    this.requests.update((list) => list.map((x) => (x._id === doc._id ? doc : x)));
  }

  updateStatus(id: string, status: string): void {
    this.http.patch<any>(`/api/quotation-requests/${id}`, { status }).subscribe({
      next: (r) => { if (r?.request) this.upsertRequest(r.request); this.toast.success(r?.message || 'Đã cập nhật trạng thái.'); },
      error: () => this.toast.error('Không thể cập nhật trạng thái.'),
    });
  }

  formatMoney(n: number): string { return (Number(n) || 0).toLocaleString('vi-VN') + 'đ'; }
}