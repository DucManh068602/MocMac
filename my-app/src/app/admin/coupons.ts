import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-coupons',
  standalone: false,
  styleUrls: ['./admin-list.css'],
  template: `
    <div class="list-page">
      <header class="list-header">
        <h2>Mã giảm giá ({{ coupons().length }})</h2>
        <button type="button" class="btn-add" (click)="showForm.set(true)">Thêm mã</button>
      </header>

      @if (showForm()) {
        <div class="form-card">
          <h3>{{ editingCoupon() ? 'Sửa' : 'Thêm' }} mã giảm giá</h3>
          <div class="form-grid">
            <input class="form-input" placeholder="Mã" [(ngModel)]="form.code" />
            <input class="form-input" placeholder="Miêu tả" [(ngModel)]="form.description" />
            <select class="form-input" [(ngModel)]="form.discountType">
              <option value="percent">Phần trăm</option>
              <option value="fixed">Số tiền</option>
            </select>
            <input class="form-input" type="number" placeholder="Giá trị giảm" [(ngModel)]="form.discountValue" />
            <input class="form-input" type="number" placeholder="Đơn tối thiểu" [(ngModel)]="form.minOrderValue" />
            <input class="form-input" type="number" placeholder="Giảm tối đa" [(ngModel)]="form.maxDiscount" />
            <input class="form-input" type="number" placeholder="Số lần dùng" [(ngModel)]="form.usageLimit" />
            <input class="form-input" type="date" [(ngModel)]="form.expiryDate" />
          </div>
          <div class="form-actions">
            <button type="button" class="btn-save" (click)="saveCoupon()">Lưu</button>
            <button type="button" class="btn-cancel" (click)="cancelForm()">Hủy</button>
          </div>
        </div>
      }

      <div class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Kiểu</th>
              <th>Giá trị</th>
              <th>Đơn tối thiểu</th>
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
                <td>{{ c.discountType }}</td>
                <td>{{ c.discountValue }}</td>
                <td>{{ c.minOrderValue || 0 }}đ</td>
                <td>{{ c.usedCount || 0 }}/{{ c.usageLimit || '∞' }}</td>
                <td>{{ c.expiryDate | date:'shortDate' }}</td>
                <td>{{ c.active ? 'Bật' : 'Tắt' }}</td>
                <td>
                  <button type="button" class="btn-small" (click)="editCoupon(c)">Sửa</button>
                  <button type="button" class="btn-small btn-delete" (click)="deleteCoupon(c._id)">Xóa</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="8">Chưa có mã giảm giá nào.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AdminCouponsComponent {
  private http = inject(HttpClient);
  readonly coupons = signal<any[]>([]);
  readonly showForm = signal(false);
  readonly editingCoupon = signal<any>(null);
  form: any = {
    code: '', description: '', discountType: 'percent', discountValue: 0,
    minOrderValue: 0, maxDiscount: 0, usageLimit: 0, expiryDate: '',
  };

  constructor() {
    this.loadCoupons();
  }

  loadCoupons(): void {
    this.http.get('/api/coupons').subscribe((r: any) => this.coupons.set(r.coupons || []));
  }

  editCoupon(c: any): void {
    this.editingCoupon.set(c);
    this.form = { ...c };
    this.showForm.set(true);
  }

  saveCoupon(): void {
    const f = this.form;
    const payload = {
      code: f.code, description: f.description, discountType: f.discountType,
      discountValue: f.discountValue, minOrderValue: f.minOrderValue,
      maxDiscount: f.maxDiscount, usageLimit: f.usageLimit, expiryDate: f.expiryDate,
      active: f.active,
    };

    if (this.editingCoupon()) {
      this.http.patch('/api/coupons/' + this.editingCoupon()._id, payload).subscribe(() => {
        this.loadCoupons();
        this.cancelForm();
      });
    } else {
      this.http.post('/api/coupons', payload).subscribe(() => {
        this.loadCoupons();
        this.cancelForm();
      });
    }
  }

  deleteCoupon(id: string): void {
    if (confirm('Xóa mã giảm giá này?')) {
      this.http.delete('/api/coupons/' + id).subscribe(() => this.loadCoupons());
    }
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingCoupon.set(null);
    this.form = {
      code: '', description: '', discountType: 'percent', discountValue: 0,
      minOrderValue: 0, maxDiscount: 0, usageLimit: 0, expiryDate: '',
    };
  }
}
