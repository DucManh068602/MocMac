import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-users',
  standalone: false,
  template: `
    <div class="list-page">
      <header class="list-header">
        <h2>Người dùng ({{ users().length }})</h2>
      </header>
      <div class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Tên</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Ngày</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            @for (u of users(); track u._id) {
              <tr>
                <td>{{ u.name }}</td>
                <td>{{ u.email }}</td>
                <td>{{ u.role }}</td>
                <td>{{ u.active ? 'Hoạt động' : 'Vô hiệu' }}</td>
                <td>{{ u.createdAt | date:'short' }}</td>
                <td>
                  <button type="button" class="btn-small" (click)="toggleUser(u._id)">
                    {{ u.active ? 'Vô hiệu' : 'Kích hoạt' }}
                  </button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6">Chưa có người dùng.</td></tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination
        [currentPage]="page()"
        [totalPages]="totalPages()"
        (pageChange)="page.set($event); loadUsers()"
      ></app-pagination>
    </div>
  `,
  styleUrls: ['./admin-list.css'],
})
export class AdminUsersComponent {
  private http = inject(HttpClient);
  readonly users = signal<any[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(1);

  constructor() {
    this.loadUsers();
  }

  loadUsers(): void {
    this.http.get('/api/users?page=' + this.page() + '&limit=20').subscribe((r: any) => {
      const items = Array.isArray(r) ? r : (r.users || []);
      this.users.set(items);
      this.totalPages.set(r.totalPages || 1);
    });
  }

  toggleUser(id: string): void {
    this.http.patch('/api/users/' + id + '/toggle-active', {}).subscribe(() => this.loadUsers());
  }
}
