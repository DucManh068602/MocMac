import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-my-quotations',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-quotations.html',
  styleUrl: './my-quotations.scss',
})
export class MyQuotationsComponent {
  private http = inject(HttpClient);
  readonly auth = inject(AuthService);

  readonly quotations = signal<any[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    if (!this.auth.isAuthenticated()) { this.loading.set(false); this.error.set('Bạn cần đăng nhập để xem quà tặng đã mua.'); return; }
    this.http.get<any>('/api/quotation-requests/mine').subscribe({
      next: (r) => {
        this.quotations.set(Array.isArray(r?.requests) ? r.requests : []);
        this.loading.set(false);
      },
      error: () => { this.quotations.set([]); this.loading.set(false); this.error.set('Không thể tải danh sách quà tặng. Vui lòng thử lại.'); },
    });
  }

  statusLabel(s: string): string { return ({ new: 'Mới', processing: 'Đang xử lý', quoted: 'Đã báo giá', accepted: 'Đã đồng ý', done: 'Hoàn tất' } as any)[s] || s || '—'; }
  payLabel(s: string): string { return ({ pending: 'Chưa thanh toán', paid: 'Đã thanh toán', failed: 'Thất bại', refunded: 'Đã hoàn tiền' } as any)[s] || s || 'Chưa thanh toán'; }
  money(n: number): string { return (Number(n) || 0).toLocaleString('vi-VN') + 'đ'; }
  shortId(id: string): string { return id ? String(id).slice(-6).toUpperCase() : ''; }
  giftNames(q: any): string { return (q.items || []).map((it: any) => it.name).join(', ') || 'Chưa có sản phẩm'; }
  giftQty(q: any): number { return (q.items || []).reduce((s: number, it: any) => s + (Number(it.quantity) || 0), 0); }
}
