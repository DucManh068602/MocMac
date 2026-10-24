import { Component, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-admin-coupons',
  standalone: false,
  template: `
    <div class="list-page">
      <header class="list-header">
        <h2>Mã giảm giá ({{ coupons().length }})</h2>
        <button type="button" class="btn-add" (click)="startCreate(); showForm.set(true)">Thêm</button>
      </header>

      <div class="stats-grid">
        <div class="stat-card stat--moss">
          <span class="stat-value">{{ stats().total }}</span>
          <span class="stat-label">Tổng mã</span>
        </div>
        <div class="stat-card stat--clay">
          <span class="stat-value">{{ stats().active }}</span>
          <span class="stat-label">Đang hoạt động</span>
        </div>
        <div class="stat-card stat--earth">
          <span class="stat-value">{{ stats().used }}</span>
          <span class="stat-label">Đã dùng</span>
        </div>
      </div>

      @if (showForm()) {
        <div class="form-card">
          <h3>{{ editing() ? 'Sửa' : 'Thêm' }} mã giảm giá</h3>
             <div class="form-grid">
            <input class="form-input" placeholder="Mã" [(ngModel)]="form.code" />
            <select class="form-input" [(ngModel)]="form.discountType">
              <option value="percent">Phần trăm (%)</option>
              <option value="amount">Số tiền (đ)</option>
            </select>
            <input class="form-input" placeholder="Giá trị giảm" type="number" [(ngModel)]="form.discountValue" />
            <input class="form-input" placeholder="Số lượng" type="number" [(ngModel)]="form.usageLimit" />
            <input class="form-input" placeholder="Ngày hết hạn" type="date" [(ngModel)]="form.expiryDate" />
            <input class="form-input" placeholder="Tối thiểu (đơn)" type="number" [(ngModel)]="form.minOrderValue" />
          </div>
          <div class="form-actions">
            <button type="button" class="btn-save" (click)="saveCoupon()">Lưu</button>
            <button type="button" class="btn-cancel" (click)="showForm.set(false)">Hủy</button>
          </div>
        </div>
      }

      <div class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Giảm giá</th>
              <th>Đã dùng</th>
              <th>Hết hạn</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            @for (c of coupons(); track c._id) {
              <tr>
                <td>{{ c.code }}</td>
                <td>{{ c.discountType === 'percent' ? (c.discountValue + '%') : (c.discountValue + 'đ') }}</td>
                <td>{{ c.usedCount || 0 }}/{{ c.usageLimit }}</td>
                <td>{{ c.expiresAt | date:'shortDate' }}</td>
                <td>{{ c.active ? 'Hoạt động' : 'Vô hiệu' }}</td>
                <td>
                  <button type="button" class="btn-small" (click)="editCoupon(c)">Sửa</button>
                  <button type="button" class="btn-small btn-delete" (click)="deleteCoupon(c._id)">Xóa</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6">Chưa có mã giảm giá.</td></tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination
        [currentPage]="page()"
        [totalPages]="totalPages()"
        (pageChange)="page.set($event); loadCoupons()"
      ></app-pagination>
    </div>
  `,
  styleUrls: ['./admin-list.css'],
})
export class AdminCouponsComponent {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  readonly coupons = signal<any[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);
  form: any = {};

  readonly stats = computed(() => {
    const c = this.coupons();
    return {
      total: c.length,
      active: c.filter((x: any) => x.active).length,
      used: c.reduce((s: number, x: any) => s + (x.usedCount || 0), 0),
    };
  });

  constructor() {
    this.loadCoupons();
  }

  loadCoupons(): void {
    this.http.get('/api/coupons?page=' + this.page() + '&limit=20').subscribe((r: any) => {
      const items = Array.isArray(r) ? r : (r.coupons || []);
      this.coupons.set(items);
      this.totalPages.set(r.totalPages || 1);
    });
  }

  startCreate(): void {
    this.editing.set(null);
    this.form = { code: '', discountType: 'percent', discountValue: 0, usageLimit: 0, expiryDate: '', minOrderValue: 0 };
  }

  editCoupon(c: any): void {
    this.editing.set(c);
    this.form = { ...c };
    this.showForm.set(true);
  }

  saveCoupon(): void {
    const f = { ...this.form };
    if (this.editing()) {
      this.http.put('/api/coupons/' + f._id, f).subscribe({
        next: () => { this.toast.success('Cập nhật mã giảm giá thành công'); this.loadCoupons(); this.showForm.set(false); },
        error: () => this.toast.error('Không thể cập nhật mã giảm giá'),
      });
    } else {
      this.http.post('/api/coupons', f).subscribe({
        next: () => { this.toast.success('Thêm mã giảm giá thành công'); this.loadCoupons(); this.showForm.set(false); },
        error: () => this.toast.error('Không thể thêm mã giảm giá'),
      });
    }
  }

  deleteCoupon(id: string): void {
    if (confirm('Xóa mã giảm giá này?')) {
      this.http.delete('/api/coupons/' + id).subscribe({
        next: () => { this.toast.success('Xóa mã giảm giá thành công'); this.loadCoupons(); },
        error: () => this.toast.error('Không thể xóa mã giảm giá'),
      });
    }
  }
}
