import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-regions',
  standalone: false,
  styleUrls: ['./admin-list.css'],
  template: `
    <div class="list-page">
      <header class="list-header">
        <h2>Vùng miền ({{ regions().length }})</h2>
      </header>
      <div class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Tên</th>
              <th>Sản phẩm</th>
              <th>Mô tả</th>
            </tr>
          </thead>
          <tbody>
            @for (r of regions(); track r._id || r.slug) {
              <tr>
                <td>{{ r.name }}</td>
                <td>{{ r.productCount || 0 }}</td>
                <td>{{ r.description }}</td>
              </tr>
            } @empty {
              <tr><td colspan="3">Chưa có vùng miền nào.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AdminRegionsComponent {
  private http = inject(HttpClient);
  readonly regions = signal<any[]>([]);

  constructor() {
    this.http.get('/api/regions').subscribe((r: any) =>
      this.regions.set(Array.isArray(r) ? r : (r.regions || []))
    );
  }
}
