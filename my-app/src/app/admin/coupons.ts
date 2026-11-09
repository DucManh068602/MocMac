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
        <h2>Mã giảm giá ({{ coupons().length }})</h2>
        <div class="admin-filters">
          <div class="filter-group">
            <input
              class="filter-input"
              placeholder="Tìm mã..."
              [(ngModel)]="searchTerm"
              (input)="onFilterChange()"
              style="width: 160px"
            />
          </div>
          <div class="filter-group">
            <select class="filter-select" [(ngModel)]="activeFilter" (change)="onFilterChange()" style="width: 130px">
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Vô hiệu</option>
            </select>
          </div>
          <button
            type="button"
            class="filter-reset"
            (click)="resetFilters()"
            [disabled]="!searchTerm && !activeFilter"
          >
            Xóa bộ lọc
          </button>
        </div>
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
              <option value="fixed">Số tiền (đ)</option>
            </select>
            <input class="form-input" placeholder="Giá trị giảm" type="number" [(ngModel)]="form.discountValue" />
            <input class="form-input" placeholder="Số lượng" type="number" [(ngModel)]="form.usageLimit" />
            <input class="form-input" placeholder="Ngày hết hạn" type="date" [(ngModel)]="form.expiryDate" />
            <input class="form-input" placeholder="Tối thiểu (đơn)" type="number" [(ngModel)]="form.minOrderValue" />
            <label class="checkbox">
              <input type="checkbox" [(ngModel)]="form.active" />
              <span>Hoạt động</span>
            </label>
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
                <td>{{ c.expiryDate | date:'shortDate' }}</td>
                <td>
                  <span class="status-badge" [ngClass]="statusClass(c.status)">
                    {{ statusLabel(c.status) }}
                  </span>
                </td>
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
  private confirm = inject(ConfirmService);
  readonly coupons = signal<any[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);
  form: any = {};
  searchTerm = '';
  activeFilter = '';

  readonly stats = computed(() => {
    const c = this.coupons();
    return {
      total: c.length,
      active: c.filter((x: any) => x.active).length,
      used: c.reduce((s: number, x: any) => s + (x.usedCount || 0), 0),
    };
  });

  statusLabel(s: string): string {
    switch (s) {
      case 'hoạt động': return 'Hoạt động';
      case 'hết hạn': return 'Hết hạn';
      case 'hết lượt sử dụng': return 'Hết lượt';
      case 'vô hiệu': return 'Vô hiệu';
      default: return 'Hoạt động';
    }
  }

  statusClass(s: string): string {
    switch (s) {
      case 'hoạt động': return 'status-visible';
      case 'hết hạn': return 'status-expired';
      case 'hết lượt sử dụng': return 'status-out';
      case 'vô hiệu': return 'status-hidden';
      default: return 'status-visible';
    }
  }

  constructor() {
    this.loadCoupons();
  }

  onFilterChange(): void {
    this.page.set(1);
    this.loadCoupons();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.activeFilter = '';
    this.page.set(1);
    this.loadCoupons();
  }

  loadCoupons(): void {
    const params = new URLSearchParams({
      page: String(this.page()),
      limit: '20',
    });
    if (this.searchTerm) params.set('q', this.searchTerm);
    if (this.activeFilter) params.set('active', this.activeFilter === 'active' ? 'true' : 'false');

    this.http.get('/api/coupons?' + params.toString()).subscribe((r: any) => {
      const items = Array.isArray(r) ? r : (r.coupons || []);
      this.coupons.set(items);
      this.totalPages.set(r.totalPages || 1);
    });
  }

  startCreate(): void {
    this.editing.set(null);
    this.form = { code: '', discountType: 'percent', discountValue: 0, usageLimit: 0, expiryDate: '', minOrderValue: 0, active: true };
  }

  editCoupon(c: any): void {
    this.editing.set(c);
    this.form = { ...c };
    this.showForm.set(true);
  }

  saveCoupon(): void {
    const f = { ...this.form };

    if (this.editing()) {
      this.http.patch('/api/coupons/' + f._id, f).subscribe({
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

  async deleteCoupon(id: string): Promise<void> {
    const ok = await this.confirm.confirm({ title: 'Xác nhận xóa', message: 'Xóa mã giảm giá này?', confirmText: 'Xóa', danger: true });
    if (!ok) return;
    this.http.delete('/api/coupons/' + id).subscribe({
      next: () => { this.toast.success('Xóa mã giảm giá thành công'); this.loadCoupons(); },
      error: () => this.toast.error('Không thể xóa mã giảm giá'),
    });
  }
}
