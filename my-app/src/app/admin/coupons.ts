import { Component, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from './toast.service';
import { ConfirmService } from './confirm.service';

@Component({
  selector: 'app-admin-coupons',
  standalone: false,
  template: `
    <div class="list-page">
      <header class="list-header">
        <h2>Mã giảm giá ({{ total() }})</h2>
        <div class="admin-filters">
          <div class="filter-group"><input class="filter-input" placeholder="Tìm mã..." [(ngModel)]="searchTerm" (input)="onFilterChange()" style="width: 160px" /></div>
          <div class="filter-group">
            <select class="filter-select" [(ngModel)]="activeFilter" (change)="onFilterChange()" style="width: 140px">
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang bật</option>
              <option value="inactive">Đang tắt</option>
            </select>
          </div>
          <button type="button" class="filter-reset" (click)="resetFilters()" [disabled]="!searchTerm && !activeFilter">Xóa bộ lọc</button>
        </div>
        <div class="header-actions">
          <button type="button" class="btn-ghost" (click)="openHolidays()">Mã ngày lễ</button>
          <button type="button" class="btn-ghost" (click)="goNotify()">Gửi thông báo mã</button>
          <button type="button" class="btn-add" (click)="startCreate()">Thêm mã</button>
        </div>
      </header>

      <div class="stats-grid">
        <div class="stat-card stat--moss"><span class="stat-value">{{ stats().total }}</span><span class="stat-label">Tổng mã (trang)</span></div>
        <div class="stat-card stat--clay"><span class="stat-value">{{ stats().active }}</span><span class="stat-label">Đang hiệu lực</span></div>
        <div class="stat-card stat--earth"><span class="stat-value">{{ stats().used }}</span><span class="stat-label">Lượt đã dùng</span></div>
      </div>

      @if (showForm()) {
        <div class="form-card coupon-form-card">
          <h3>{{ editing() ? 'Sửa mã giảm giá' : 'Thêm mã giảm giá' }}</h3>
          <div class="form-grid coupon-form-grid">
            <label class="field">Mã <input class="form-input" placeholder="VD: MOCMAC10" [(ngModel)]="form.code" [disabled]="!!editing()" /></label>
            <label class="field">Loại giảm
              <select class="form-input" [(ngModel)]="form.discountType"><option value="percent">Phần trăm (%)</option><option value="fixed">Số tiền (đ)</option></select>
            </label>
            <label class="field">Giá trị giảm <input class="form-input" type="number" min="0" [(ngModel)]="form.discountValue" /></label>
            <label class="field">Giảm tối đa (đ, % dùng) <input class="form-input" type="number" min="0" [(ngModel)]="form.maxDiscount" /></label>
            <label class="field">Đơn tối thiểu (đ) <input class="form-input" type="number" min="0" [(ngModel)]="form.minOrderValue" /></label>
            <label class="field">Số lượt dùng (0 = không giới hạn) <input class="form-input" type="number" min="0" [(ngModel)]="form.usageLimit" /></label>
            <label class="field">Ngày bắt đầu <input class="form-input" type="date" [(ngModel)]="form.startsAt" /></label>
            <label class="field">Ngày hết hạn <input class="form-input" type="date" [(ngModel)]="form.expiryDate" /></label>
            <label class="field field-check"><input type="checkbox" [(ngModel)]="form.active" /> Kích hoạt mã</label>
            <label class="field field-check"><input type="checkbox" [(ngModel)]="form.freeShipping" /> Miễn phí vận chuyển</label>
            <label class="field field-wide">Mô tả/ghi chú <input class="form-input" placeholder="Áp dụng cho..., không áp dụng với..." [(ngModel)]="form.description" /></label>
          </div>
          @if (preview()) { <p class="coupon-preview">Xem nhanh: <strong>{{ preview() }}</strong>{{ form.startsAt ? ' · Bắt đầu ' + form.startsAt : '' }}{{ form.expiryDate ? ' · Hết hạn ' + form.expiryDate : '' }}</p> }
          <div class="form-actions">
            <button type="button" class="btn-save" (click)="saveCoupon()" [disabled]="saving()">{{ saving() ? 'Đang lưu...' : 'Lưu' }}</button>
            <button type="button" class="btn-cancel" (click)="showForm.set(false)">Hủy</button>
          </div>
        </div>
      }

      <div class="table-wrap">
        <table class="admin-table">
          <thead><tr><th>Mã</th><th>Ưu đãi</th><th>Điều kiện</th><th>Đã dùng</th><th>Bắt đầu</th><th>Hết hạn</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
          <tbody>
            @for (c of coupons(); track c._id) {
              <tr>
                <td><strong>{{ c.code }}</strong>@if (c.description) {<div class="subtext">{{ c.description }}</div>}</td>
                <td>{{ c.discountType === 'percent' ? ('Giảm ' + c.discountValue + '%') : ('Giảm ' + formatMoney(c.discountValue)) }}@if (c.maxDiscount) {<div class="subtext">Tối đa {{ formatMoney(c.maxDiscount) }}</div>}</td>
                <td>{{ c.minOrderValue ? ('Đơn từ ' + formatMoney(c.minOrderValue)) : 'Không giới hạn' }}</td>
                <td>{{ c.usedCount || 0 }} / {{ c.usageLimit ? c.usageLimit : '∞' }}</td>
                <td>{{ c.startsAt | date:'dd/MM/yyyy' }}</td>
                <td>{{ c.expiryDate | date:'dd/MM/yyyy' }}</td>
                <td><span class="status-badge" [ngClass]="statusClass(c.status)">{{ statusLabel(c.status) }}</span>@if (c.freeShipping) { <span class="status-badge status-free">Free Ship</span> }</td>
                <td class="actions">
                  <button type="button" class="btn-small" (click)="editCoupon(c)">Sửa</button>
                  <button type="button" class="btn-small" (click)="notifyCoupon(c)">Thông báo</button>
                  <button type="button" class="btn-small btn-delete" (click)="deleteCoupon(c._id, c.code)">Xóa</button>
                </td>
              </tr>
            } @empty {
              <tr>          <td colspan="8">Chưa có mã giảm giá.</td></tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination [currentPage]="page()" [totalPages]="totalPages()" (pageChange)="page.set($event); loadCoupons()"></app-pagination>
    </div>
  `,
  styleUrls: ['./admin-list.css', './coupons.css'],
})
export class AdminCouponsComponent {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  readonly coupons = signal<any[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly total = signal(0);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);
  readonly saving = signal(false);
  form: any = {};
  searchTerm = '';
  activeFilter = '';

  readonly stats = computed(() => {
    const c = this.coupons();
    return { total: this.total() || c.length, active: c.filter((x: any) => x.status === 'hoạt động').length, used: c.reduce((s: number, x: any) => s + (Number(x.usedCount) || 0), 0) };
  });

  constructor() { this.loadCoupons(); }

  statusLabel(s: string): string { return ({ 'hoạt động': 'Hoạt động', 'hết hạn': 'Hết hạn', 'hết lượt sử dụng': 'Hết lượt', 'vô hiệu': 'Đã tắt' } as any)[s] || s || '—'; }
  statusClass(s: string): string { return ({ 'hoạt động': 'status-visible', 'hết hạn': 'status-expired', 'hết lượt sử dụng': 'status-out', 'vô hiệu': 'status-hidden' } as any)[s] || 'status-visible'; }
  formatMoney(n: any): string { return (Number(n) || 0).toLocaleString('vi-VN') + 'đ'; }
  preview(): string { if (!this.form?.code && !this.form?.discountValue) return ''; return `${String(this.form.code || 'MÃ').toUpperCase()} - ${this.form.discountType === 'percent' ? `giảm ${this.form.discountValue || 0}%` : `giảm ${this.formatMoney(this.form.discountValue)}`}`; }

  onFilterChange(): void { this.page.set(1); this.loadCoupons(); }
  resetFilters(): void { this.searchTerm = ''; this.activeFilter = ''; this.page.set(1); this.loadCoupons(); }

  loadCoupons(): void {
    const params = new URLSearchParams({ page: String(this.page()), limit: '20' });
    if (this.searchTerm) params.set('q', this.searchTerm);
    if (this.activeFilter) params.set('active', this.activeFilter === 'active' ? 'true' : 'false');
    this.http.get<any>('/api/coupons?' + params.toString()).subscribe({
      next: (r) => { this.coupons.set(Array.isArray(r) ? r : (r.coupons || [])); this.totalPages.set(r.totalPages || 1); this.total.set(r.total || 0); },
      error: () => this.toast.error('Không tải được danh sách mã giảm giá.'),
    });
  }

  openHolidays(): void { window.location.assign('/admin/holiday-coupons'); }

  startCreate(): void {
    this.editing.set(null);
    const nextMonth = new Date(); nextMonth.setMonth(nextMonth.getMonth() + 1);
    this.form = { code: '', discountType: 'percent', discountValue: 10, maxDiscount: 0, usageLimit: 0, expiryDate: nextMonth.toISOString().slice(0, 10), minOrderValue: 0, active: true, description: '', startsAt: new Date().toISOString().slice(0, 10), freeShipping: false };
    this.showForm.set(true);
  }

  editCoupon(c: any): void {
    this.editing.set(c);
    this.form = { ...c, expiryDate: c.expiryDate ? new Date(c.expiryDate).toISOString().slice(0, 10) : '', startsAt: c.startsAt ? new Date(c.startsAt).toISOString().slice(0, 10) : '', freeShipping: Boolean(c.freeShipping) };
    this.showForm.set(true);
  }

  saveCoupon(): void {
    if (this.saving()) return;
    if (!String(this.form.code || '').trim() || this.form.discountValue === '' || this.form.discountValue === null) { this.toast.error('Vui lòng nhập mã và giá trị giảm.'); return; }
    if (!this.form.expiryDate) { this.toast.error('Vui lòng chọn ngày hết hạn.'); return; }
    const f = { ...this.form, code: String(this.form.code).toUpperCase().trim() };
    this.saving.set(true);
    const req = this.editing() ? this.http.patch<any>('/api/coupons/' + f._id, f) : this.http.post<any>('/api/coupons', f);
    req.subscribe({
      next: (r) => { this.toast.success(r?.message || 'Đã lưu mã giảm giá.'); this.saving.set(false); this.showForm.set(false); this.loadCoupons(); },
      error: (e) => { this.toast.error(e?.error?.message || 'Không thể lưu mã giảm giá.'); this.saving.set(false); },
    });
  }

  goNotify(): void { window.location.assign('/admin/notifications?tab=promo'); }
  notifyCoupon(c: any): void {
    const payload = {
      code: c.code || '',
      discountType: c.discountType || 'percent',
      discountValue: Number(c.discountValue || 0),
      maxDiscount: Number(c.maxDiscount || 0),
      minOrderValue: Number(c.minOrderValue || 0),
      usageLimit: Number(c.usageLimit || 0),
      usedCount: Number(c.usedCount || 0),
      expiryDate: c.expiryDate || '',
      description: c.description || '',
      status: c.status || '',
    };
    try { sessionStorage.setItem('mm_notify_coupon', JSON.stringify(payload)); } catch {}
    window.location.assign('/admin/notifications?tab=promo&from=coupon&code=' + encodeURIComponent(payload.code));
  }

  async deleteCoupon(id: string, code?: string): Promise<void> {
    const ok = await this.confirm.confirm({ title: 'Xác nhận xóa', message: `Xóa mã giảm giá ${code || ''}?`, confirmText: 'Xóa', danger: true });
    if (!ok) return;
    this.http.delete<any>('/api/coupons/' + id).subscribe({
      next: (r) => { this.toast.success(r?.message || 'Đã xóa mã giảm giá.'); this.loadCoupons(); },
      error: (e) => this.toast.error(e?.error?.message || 'Không thể xóa mã giảm giá.'),
    });
  }
}
