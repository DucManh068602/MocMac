import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-orders',
  standalone: false,
  template: `
    <div class="list-page">
      <header class="list-header">
        <h2>Đơn hàng ({{ orders().length }})</h2>
      </header>
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
                <td>{{ order._id?.toString().slice(-8) || '—' }}</td>
                <td>{{ order.customerInfo?.name || '—' }}</td>
                <td>{{ order.total }}đ</td>
                <td>
                  <select (change)="updateStatus(order._id, $event)">
                    <option value="pending">Chờ xử lý</option>
                    <option value="processing" [selected]="order.status === 'processing'">Đang xử lý</option>
                    <option value="shipped" [selected]="order.status === 'shipped'">Đã giao</option>
                    <option value="delivered" [selected]="order.status === 'delivered'">Đã nhận</option>
                    <option value="cancelled" [selected]="order.status === 'cancelled'">Đã hủy</option>
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
  styleUrls: ['./admin-list.css'],
})
export class AdminOrdersComponent {
  private http = inject(HttpClient);
  readonly orders = signal<any[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(1);

  constructor() {
    this.loadOrders();
  }

  loadOrders(): void {
    this.http.get('/api/orders?page=' + this.page() + '&limit=20').subscribe((r: any) => {
      this.orders.set(Array.isArray(r.orders) ? r.orders : (r.orders?.orders || []));
      this.totalPages.set(r.totalPages || 1);
    });
  }

  updateStatus(id: string, event: Event): void {
    const status = (event.target as HTMLSelectElement).value;
    this.http.patch('/api/orders/' + id + '/status', { status }).subscribe(() => this.loadOrders());
  }
}
