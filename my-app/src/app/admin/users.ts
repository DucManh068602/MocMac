import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-users',
  standalone: false,
  styleUrls: ['./admin-list.css'],
  template: `
    <div class="list-page">
      <header class="list-header">
        <h2>Tài khoản ({{ users().length }})</h2>
      </header>
      <div class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Tên</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            @for (u of users(); track u._id) {
              <tr>
                <td>{{ u.name }}</td>
                <td>{{ u.email }}</td>
                <td>
                  <select (change)="updateRole(u._id, $event)">
                    <option value="admin" [selected]="u.role === 'admin'">Admin</option>
                    <option value="staff" [selected]="u.role === 'staff'">Staff</option>
                    <option value="customer" [selected]="u.role === 'customer'">Customer</option>
                  </select>
                </td>
                <td>{{ u.createdAt | date:'short' }}</td>
              </tr>
            } @empty {
              <tr><td colspan="4">Chưa có tài khoản nào.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AdminUsersComponent {
  private http = inject(HttpClient);
  readonly users = signal<any[]>([]);

  constructor() {
    this.http.get('/api/users').subscribe((r: any) => this.users.set(r.users || []));
  }

  updateRole(id: string, event: Event): void {
    const role = (event.target as HTMLSelectElement).value;
    this.http.patch('/api/users/' + id + '/role', { role }).subscribe(() => {
      this.users.update(list => list.map(u => u._id === id ? { ...u, role } : u));
    });
  }
}
