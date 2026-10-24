import { Component, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-admin-users',
  standalone: false,
  template: `
    <div class="list-page">
      <header class="list-header">
        <h2>Tài khoản ({{ users().length }})</h2>
      </header>

      <div class="stats-grid">
        <div class="stat-card stat--moss">
          <span class="stat-value">{{ stats().total }}</span>
          <span class="stat-label">Tổng tài khoản</span>
        </div>
        <div class="stat-card stat--clay">
          <span class="stat-value">{{ stats().admins }}</span>
          <span class="stat-label">Quản trị viên</span>
        </div>
        <div class="stat-card stat--earth">
          <span class="stat-value">{{ stats().staff }}</span>
          <span class="stat-label">Nhân viên</span>
        </div>
        <div class="stat-card stat--sage">
          <span class="stat-value">{{ stats().collaborators }}</span>
          <span class="stat-label">Cộng tác viên</span>
        </div>
        <div class="stat-card stat--sky">
          <span class="stat-value">{{ stats().cooperatives }}</span>
          <span class="stat-label">Hợp tác xã</span>
        </div>
        <div class="stat-card stat--sand">
          <span class="stat-value">{{ stats().customers }}</span>
          <span class="stat-label">Khách hàng</span>
        </div>
      </div>

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
                <td>{{ u.isActive ? 'Hoạt động' : 'Vô hiệu' }}</td>
                <td>{{ u.createdAt | date:'short' }}</td>
                <td>
                  @if (u.isActive) {
                    <button type="button" class="btn-small btn--warn" (click)="deactivateUser(u._id)">
                      Vô hiệu
                    </button>
                  } @else {
                    <select #sel (change)="activateUser(u._id, sel.value)">
                      <option value="">Kích hoạt</option>
                      <option value="admin">Quản trị viên</option>
                      <option value="staff">Nhân viên</option>
                      <option value="collaborator">Cộng tác viên</option>
                      <option value="cooperative">Hợp tác xã</option>
                    </select>
                  }
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
  private toast = inject(ToastService);
  readonly users = signal<any[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(1);

  readonly stats = computed(() => {
    const u = this.users();
    return {
      total: u.length,
      admins: u.filter((x: any) => x.role === 'admin').length,
      staff: u.filter((x: any) => x.role === 'staff').length,
      collaborators: u.filter((x: any) => x.role === 'collaborator').length,
      cooperatives: u.filter((x: any) => x.role === 'cooperative').length,
      customers: u.filter((x: any) => x.role === 'customer').length,
    };
  });

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

  activateUser(id: string, role: string): void {
    if (!role) return;
    this.http.patch('/api/users/' + id + '/activate', { role }).subscribe({
      next: () => { this.toast.success('Kích hoạt tài khoản thành công'); this.loadUsers(); },
      error: () => this.toast.error('Không thể kích hoạt tài khoản'),
    });
  }

  deactivateUser(id: string): void {
    this.http.patch('/api/users/' + id + '/deactivate', {}).subscribe({
      next: () => { this.toast.success('Hủy kích hoạt tài khoản'); this.loadUsers(); },
      error: () => this.toast.error('Không thể hủy kích hoạt tài khoản'),
    });
  }
}
