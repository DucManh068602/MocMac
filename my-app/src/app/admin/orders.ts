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
                <td>{{ order.paymentStatus || order.paymentMethod }}</td>
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

  loadOrders(): void {
    this.http.get('/api/orders?page=' + this.page() + '&limit=20').subscribe((r: any) => {
      const items = Array.isArray(r.orders) ? r.orders : (r.orders?.orders || []);
      this.orders.set(items);
      this.totalPages.set(r.totalPages || 1);
    });
  }

  updateStatus(id: string, event: Event): void {
    const status = (event.target as HTMLSelectElement).value;
    this.http.patch('/api/orders/' + id + '/status', { status }).subscribe({
      next: () => { this.toast.success('Cập nhật trạng thái đơn hàng thành công'); this.loadOrders(); },
      error: () => this.toast.error('Không thể cập nhật trạng thái'),
    });
  }
}
