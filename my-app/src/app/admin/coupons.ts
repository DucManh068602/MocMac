import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-coupons',
  standalone: false,
  template: `
    <div class="list-page">
      <header class="list-header">
        <h2>Mã giảm giá ({{ coupons().length }})</h2>
        <button type="button" class="btn-add" (click)="showForm.set(true); editing.set(null); form = {}">Thêm</button>
      </header>

      @if (showForm()) {
        <div class="form-card">
          <h3>{{ editing() ? 'Sửa' : 'Thêm' }} mã giảm giá</h3>
          <div class="form-grid">
            <input class="form-input" placeholder="Mã" [(ngModel)]="form.code" />
            <input class="form-input" placeholder="Giảm giá (%)" type="number" [(ngModel)]="form.discount" />
            <input class="form-input" placeholder="Số lượng" type="number" [(ngModel)]="form.usageLimit" />
            <input class="form-input" placeholder="Ngày hết hạn" type="date" [(ngModel)]="form.expiresAt" />
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
                <td>{{ c.discount }}%</td>
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
  readonly coupons = signal<any[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);
  form: any = {};

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

  editCoupon(c: any): void {
    this.editing.set(c);
    this.form = { ...c };
    this.showForm.set(true);
  }

  saveCoupon(): void {
    const f = this.form;
    if (this.editing()) {
      this.http.put('/api/coupons/' + f._id, f).subscribe(() => {
        this.loadCoupons();
        this.showForm.set(false);
      });
    } else {
      this.http.post('/api/coupons', f).subscribe(() => {
        this.loadCoupons();
        this.showForm.set(false);
      });
    }
  }

  deleteCoupon(id: string): void {
    if (confirm('Xóa mã giảm giá này?')) {
      this.http.delete('/api/coupons/' + id).subscribe(() => this.loadCoupons());
    }
  }
}
