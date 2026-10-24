import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-products',
  standalone: false,
  styleUrls: ['./admin-list.css'],
  template: `
    <div class="list-page">
      <header class="list-header">
        <h2>Sản phẩm ({{ products().length }})</h2>
      </header>
      <div class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Tên</th>
              <th>Danh mục</th>
              <th>Giá</th>
              <th>Tồn kho</th>
            </tr>
          </thead>
          <tbody>
            @for (p of products(); track p.id) {
              <tr>
                <td>{{ p.id }}</td>
                <td>{{ p.name }}</td>
                <td>{{ p.cat }}</td>
                <td>{{ p.price }}đ</td>
                <td>{{ p.inStock ? 'Có' : 'Hết' }}</td>
              </tr>
            } @empty {
              <tr><td colspan="5">Chưa có sản phẩm nào.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AdminProductsComponent {
  private http = inject(HttpClient);
  readonly products = signal<any[]>([]);

  constructor() {
    this.http.get('/api/products').subscribe((r: any) =>
      this.products.set(Array.isArray(r) ? r : (r.products || []))
    );
  }
}
