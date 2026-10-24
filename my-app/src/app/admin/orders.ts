import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-orders',
  standalone: false,
  styleUrls: ['./admin-list.css'],
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
                <td>{{ order.customerInfo?.name || order.user?.name || '—' }}</td>
                <td>{{ order.total }}đ</td>
                <td>{{ order.status }}</td>
                <td>{{ order.paymentStatus || order.paymentMethod }}</td>
                <td>{{ order.createdAt | date:'short' }}</td>
              </tr>
            } @empty {
              <tr><td colspan="6">Chưa có đơn hàng nào.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AdminOrdersComponent {
  private http = inject(HttpClient);
  readonly orders = signal<any[]>([]);

  constructor() {
    this.http.get('/api/orders').subscribe((r: any) => this.orders.set(r.orders || []));
  }
}
