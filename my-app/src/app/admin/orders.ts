import { Component, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-admin-orders',
  standalone: false,
  template: `
    <div class="list-page">
      <header class="list-header">
        <h2>Đơn hàng ({{ orders().length }})</h2>
        <div class="admin-filters">
          <div class="filter-group">
            <input
              class="filter-input"
              placeholder="Tìm mã đơn/MST/khách hàng..."
              [(ngModel)]="searchTerm"
              (input)="onFilterChange()"
              style="width: 200px"
            />
          </div>
          <div class="filter-group">
            <select class="filter-select" [(ngModel)]="statusFilter" (change)="onFilterChange()" style="width: 140px">
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ xử lý</option>
              <option value="processing">Đang xử lý</option>
              <option value="shipped">Đã giao</option>
              <option value="delivered">Đã nhận</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
          <div class="filter-group">
            <select class="filter-select" [(ngModel)]="paymentFilter" (change)="onFilterChange()" style="width: 140px">
              <option value="">Tất cả thanh toán</option>
              <option value="pending">Chưa thanh toán</option>
              <option value="paid">Đã thanh toán</option>
              <option value="failed">Thất bại</option>
              <option value="refunded">Hoàn tiền</option>
            </select>
          </div>
          <button
            type="button"
            class="filter-reset"
            (click)="resetFilters()"
            [disabled]="!searchTerm && !statusFilter && !paymentFilter"
          >
            Xóa bộ lọc
          </button>
        </div>
      </header>

      <div class="stats-grid">
        <div class="stat-card stat--moss">
          <span class="stat-value">{{ stats().total }}</span>
          <span class="stat-label">Tổng đơn</span>
        </div>
        <div class="stat-card stat--clay">
          <span class="stat-value">{{ stats().pending }}</span>
          <span class="stat-label">Chờ xử lý</span>
        </div>
        <div class="stat-card stat--earth">
          <span class="stat-value">{{ stats().processing }}</span>
          <span class="stat-label">Đang giao</span>
        </div>
        <div class="stat-card stat--sage">
          <span class="stat-value">{{ stats().delivered }}</span>
          <span class="stat-label">Đã giao</span>
        </div>
        <div class="stat-card stat--ink">
          <span class="stat-value">{{ stats().cancelled }}</span>
          <span class="stat-label">Đã hủy</span>
        </div>
      </div>

      <div class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Khách hàng</th>
              <th>Tổng</th>
              <th>Trạng thái</th>
              <th>Thanh toán</th>
              <th>Ngày</th>
            </tr>
          </thead>
          <tbody>
            @for (order of orders(); track order._id) {
              <tr>
                <td>{{ order.orderId || order._id?.toString().slice(-8) || '—' }}</td>
                <td>{{ order.customerInfo?.name || order.user?.name || '—' }}</td>
                <td>{{ order.total }}đ</td>
                <td>
                  <span class="status-badge" [ngClass]="'status-' + (order.status || 'pending')">
                    {{ statusLabel(order.status) }}
                  </span>
                  <select class="status-select" [value]="order.status" (change)="updateStatus(order._id, $event)">
                    <option value="pending">Chờ xử lý</option>
                    <option value="processing">Đang xử lý</option>
                    <option value="shipped">Đã giao</option>
                    <option value="delivered">Đã nhận</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </td>
                <td>
                  <span class="status-badge payment-badge" [ngClass]="'payment-' + (order.paymentStatus || 'pending')">
                    {{ paymentLabel(order.paymentStatus) }}
                  </span>
                  <select class="payment-select" [value]="order.paymentStatus || 'pending'" (change)="updatePayment(order._id, $event)">
                    <option value="pending">Chưa thanh toán</option>
                    <option value="paid">Đã thanh toán</option>
                  </select>
                </td>
                <td>{{ order.createdAt | date:'short' }}</td>
              </tr>
            } @empty {
              <tr><td colspan="6">Chưa có đơn hàng nào.</td></tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination
        [currentPage]="page()"
        [totalPages]="totalPages()"
        (pageChange)="page.set($event); loadOrders()"
      ></app-pagination>
    </div>
  `,
  styleUrls: ['./admin-list.css', './orders.css'],
})
export class AdminOrdersComponent {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  readonly orders = signal<any[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  searchTerm = '';
  statusFilter = '';
  paymentFilter = '';

  readonly stats = computed(() => {
    const o = this.orders();
    return {
      total: o.length,
      pending: o.filter((x: any) => x.status === 'pending').length,
      processing: o.filter((x: any) => ['processing', 'shipped'].includes(x.status)).length,
      delivered: o.filter((x: any) => x.status === 'delivered').length,
      cancelled: o.filter((x: any) => x.status === 'cancelled').length,
    };
  });

  constructor() {
    this.loadOrders();
  }

  onFilterChange(): void {
    this.page.set(1);
    this.loadOrders();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.paymentFilter = '';
    this.page.set(1);
    this.loadOrders();
  }

  loadOrders(): void {
    const params = new URLSearchParams({
      page: String(this.page()),
      limit: '20',
    });
    if (this.searchTerm) params.set('q', this.searchTerm);
    if (this.statusFilter) params.set('status', this.statusFilter);
    if (this.paymentFilter) params.set('paymentStatus', this.paymentFilter);

    this.http.get('/api/orders?' + params.toString()).subscribe((r: any) => {
      const items = Array.isArray(r.orders) ? r.orders : (r.orders?.orders || []);
      this.orders.set(items);
      this.totalPages.set(r.totalPages || 1);
    });
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Chờ xử lý',
      processing: 'Đang xử lý',
      shipped: 'Đã giao',
      delivered: 'Đã nhận',
      cancelled: 'Đã hủy',
    };
    return labels[status] || 'Chờ xử lý';
  }

  updateStatus(id: string, event: Event): void {
    const status = (event.target as HTMLSelectElement).value;
    this.http.patch('/api/orders/' + id + '/status', { status }).subscribe({
      next: () => { this.toast.success('Cập nhật trạng thái đơn hàng thành công'); this.loadOrders(); },
      error: () => this.toast.error('Không thể cập nhật trạng thái'),
    });
  }

  updatePayment(id: string, event: Event): void {
    const paymentStatus = (event.target as HTMLSelectElement).value;
    this.http.patch('/api/orders/' + id + '/payment', { paymentStatus }).subscribe({
      next: () => { this.toast.success('Cập nhật trạng thái thanh toán'); this.loadOrders(); },
      error: () => this.toast.error('Không thể cập nhật thanh toán'),
    });
  }

  paymentLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Chưa thanh toán',
      paid: 'Đã thanh toán',
      failed: 'Thất bại',
      refunded: 'Hoàn tiền',
    };
    return labels[status] || 'Chưa thanh toán';
  }
}
