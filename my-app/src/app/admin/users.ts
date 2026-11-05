import { Component, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from './toast.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-users',
  standalone: false,
  template: `
    <div class="list-page">
      <header class="list-header">
        <h2>Tài khoản ({{ users().length }})</h2>
        <div class="admin-filters">
          <div class="filter-group">
            <input
              class="filter-input"
              placeholder="Tìm tên/email..."
              [(ngModel)]="searchTerm"
              (input)="onFilterChange()"
              style="width: 180px"
            />
          </div>
          <div class="filter-group">
            <select class="filter-select" [(ngModel)]="roleFilter" (change)="onFilterChange()" style="width: 140px">
              <option value="">Tất cả vai trò</option>
              <option value="admin-staff">Quản trị + Nhân viên</option>
              <option value="admin">Quản trị viên</option>
              <option value="staff">Nhân viên</option>
              <option value="collaborator">Cộng tác viên</option>
              <option value="cooperative">Hợp tác xã</option>
              <option value="customer">Khách hàng</option>
            </select>
          </div>
          <div class="filter-group">
            <select class="filter-select" [(ngModel)]="statusFilter" (change)="onFilterChange()" style="width: 120px">
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Vô hiệu</option>
            </select>
          </div>
          <button
            type="button"
            class="filter-reset"
            (click)="resetFilters()"
            [disabled]="!searchTerm && !roleFilter && !statusFilter"
          >
            Xóa bộ lọc
          </button>
        </div>
        <button type="button" class="btn-add" (click)="startCreate(); showForm.set(true)">Thêm</button>
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

      @if (showForm()) {
        <div class="form-card">
          <h3>{{ editing() ? 'Sửa' : 'Thêm' }} tài khoản</h3>
          <div class="form-grid">
            <input class="form-input" placeholder="Họ tên" [(ngModel)]="form.name" />
            <input class="form-input" placeholder="Email" type="email" [(ngModel)]="form.email" />
            <input class="form-input" placeholder="Số điện thoại" [(ngModel)]="form.phone" />
            <input class="form-input" placeholder="Mật khẩu" type="password" [(ngModel)]="form.password" />
            <select class="form-input" [(ngModel)]="form.role">
              <option value="">Loại tài khoản</option>
              <option value="admin">Quản trị viên</option>
              <option value="staff">Nhân viên</option>
              <option value="collaborator">Cộng tác viên</option>
              <option value="cooperative">Hợp tác xã</option>
              <option value="customer">Khách hàng</option>
            </select>
            <label class="form-checkbox">
              <input type="checkbox" [(ngModel)]="form.isActive" />
              <span>Khóa tài khoản (isActive = false)</span>
            </label>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-save" (click)="saveUser()">Lưu</button>
            <button type="button" class="btn-cancel" (click)="showForm.set(false)">Hủy</button>
          </div>
        </div>
      }

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
                  <button type="button" class="btn-small" (click)="editUser(u)">Sửa</button>
                  @if (u.isActive) {
                    @if (!isSuperAdmin(u)) {
                      <button type="button" class="btn-small btn--warn" (click)="deactivateUser(u._id)">
                        Vô hiệu
                      </button>
                      <button type="button" class="btn-small btn-toggle" (click)="toggleLock(u._id, true)">
                        🔒 Khóa
                      </button>
                    } @else {
                      <span class="text-muted">Bảo vệ</span>
                    }
                  } @else {
                    <select (change)="onActivateSelect(u._id, $event)">
                      <option value="">Kích hoạt</option>
                      <option value="customer">Khách hàng</option>
                      <option value="admin">Quản trị viên</option>
                      <option value="staff">Nhân viên</option>
                      <option value="collaborator">Cộng tác viên</option>
                      <option value="cooperative">Hợp tác xã</option>
                    </select>
                    <button type="button" class="btn-small btn-toggle" (click)="toggleLock(u._id, false, u.role)">
                      🔓 Mở khóa
                    </button>
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
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);
  form: any = {};
  searchTerm = '';
  roleFilter = '';
  statusFilter = '';

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

  onFilterChange(): void {
    this.page.set(1);
    this.loadUsers();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.roleFilter = '';
    this.statusFilter = '';
    this.page.set(1);
    this.loadUsers();
  }

  loadUsers(): void {
    const params = new URLSearchParams({
      page: String(this.page()),
      limit: '20',
    });
    if (this.searchTerm) params.set('q', this.searchTerm);
    if (this.roleFilter) params.set('role', this.roleFilter);
    if (this.statusFilter) params.set('isActive', this.statusFilter === 'active' ? 'true' : 'false');

    this.http.get('/api/users?' + params.toString()).subscribe((r: any) => {
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

  onActivateSelect(id: string, event: Event): void {
    const role = (event.target as HTMLSelectElement).value;
    this.activateUser(id, role);
  }

  deactivateUser(id: string): void {
    this.http.patch('/api/users/' + id + '/deactivate', {}).subscribe({
      next: () => { this.toast.success('Hủy kích hoạt tài khoản'); this.loadUsers(); },
      error: () => this.toast.error('Không thể hủy kích hoạt tài khoản'),
    });
  }

  toggleLock(id: string, lock: boolean, currentRole?: string): void {
    const endpoint = lock ? 'deactivate' : 'activate';
    let payload: any = {};
    if (!lock) {
      if (currentRole === 'customer') {
        payload = { role: 'customer' };
      } else if (['collaborator', 'cooperative', 'staff', 'admin'].includes(currentRole || '')) {
        payload = { role: currentRole };
      } else {
        payload = { role: 'collaborator' };
      }
    }
    this.http.patch('/api/users/' + id + '/' + endpoint, payload).subscribe({
      next: () => { this.toast.success(lock ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản'); this.loadUsers(); },
      error: () => this.toast.error(lock ? 'Không thể khóa tài khoản' : 'Không thể mở khóa tài khoản'),
    });
  }

  isSuperAdmin(u: any): boolean {
    return u?.email === 'admin@admin.mocmac.vn';
  }

  startCreate(): void {
    this.editing.set(null);
    this.form = { name: '', email: '', phone: '', password: '', role: 'customer', isActive: true };
  }

  editUser(u: any): void {
    this.editing.set(u);
    this.form = { ...u, password: '' };
    this.showForm.set(true);
  }

  saveUser(): void {
    const f = { ...this.form };
    // isActive: true = hoạt động, false = khóa
    if (this.editing()) {
      this.http.put('/api/users/' + this.editing()._id, f).subscribe({
        next: () => { this.toast.success('Cập nhật tài khoản thành công'); this.loadUsers(); this.showForm.set(false); },
        error: () => this.toast.error('Không thể cập nhật tài khoản'),
      });
    } else {
      this.http.post('/api/users', f).subscribe({
        next: () => { this.toast.success('Thêm tài khoản thành công'); this.loadUsers(); this.showForm.set(false); },
        error: () => this.toast.error('Không thể thêm tài khoản'),
      });
    }
  }
}
