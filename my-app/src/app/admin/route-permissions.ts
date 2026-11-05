import { Component, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from './toast.service';

interface RoutePerm {
  _id: string;
  role: string;
  path: string;
  method: string;
  allowed: boolean;
  description: string;
}

interface RouteTemplate {
  key: string;
  path: string;
  method: string;
  desc: string;
}

@Component({
  selector: 'app-admin-route-permissions',
  standalone: false,
  templateUrl: './route-permissions.html',
  styleUrls: ['./admin-list.css'],
})
export class AdminRoutePermissionsComponent {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  readonly perms = signal<RoutePerm[]>([]);
  readonly loading = signal(false);

  role = 'staff';

  readonly roles = [
    { value: 'admin', label: 'Quản trị viên' },
    { value: 'staff', label: 'Nhân viên' },
    { value: 'collaborator', label: 'Cộng tác viên' },
    { value: 'cooperative', label: 'Hợp tác xã' },
    { value: 'customer', label: 'Khách hàng' },
  ];

  readonly routeTemplates: RouteTemplate[] = [
    { key: 'users.list', path: '/api/users', method: 'GET', desc: 'Xem danh sách người dùng' },
    { key: 'users.create', path: '/api/users', method: 'POST', desc: 'Tạo người dùng' },
    { key: 'users.update', path: '/api/users', method: 'PATCH', desc: 'Kích hoạt/vô hiệu hóa người dùng' },
    { key: 'products.create', path: '/api/products', method: 'POST', desc: 'Tạo sản phẩm' },
    { key: 'products.update', path: '/api/products', method: 'PUT', desc: 'Sửa sản phẩm' },
    { key: 'products.delete', path: '/api/products', method: 'DELETE', desc: 'Xóa sản phẩm' },
    { key: 'orders.list', path: '/api/orders', method: 'GET', desc: 'Xem danh sách đơn hàng' },
    { key: 'orders.update', path: '/api/orders', method: 'PATCH', desc: 'Cập nhật đơn hàng' },
    { key: 'contacts.list', path: '/api/contacts', method: 'GET', desc: 'Xem danh sách liên hệ' },
    { key: 'contacts.update', path: '/api/contacts', method: 'PATCH', desc: 'Xử lý liên hệ' },
    { key: 'reviews.list', path: '/api/reviews', method: 'GET', desc: 'Xem đánh giá' },
    { key: 'reviews.update', path: '/api/reviews', method: 'PATCH', desc: 'Duyệt/ẩn đánh giá' },
    { key: 'coupons.create', path: '/api/coupons', method: 'POST', desc: 'Tạo mã giảm giá' },
    { key: 'coupons.update', path: '/api/coupons', method: 'PATCH', desc: 'Sửa mã giảm giá' },
    { key: 'coupons.delete', path: '/api/coupons', method: 'DELETE', desc: 'Xóa mã giảm giá' },
    { key: 'role-requests.list', path: '/api/role-requests', method: 'GET', desc: 'Xem yêu cầu vai trò' },
    { key: 'role-requests.update', path: '/api/role-requests', method: 'PATCH', desc: 'Duyệt/từ chối yêu cầu' },
    { key: 'notifications.send', path: '/api/notifications', method: 'POST', desc: 'Gửi thông báo' },
    { key: 'audit.view', path: '/api/audit-logs', method: 'GET', desc: 'Xem lịch sử hệ thống' },
    { key: 'permissions.manage', path: '/api/permissions', method: '*', desc: 'Quản lý phân quyền' },
    { key: 'route-permissions.manage', path: '/api/route-permissions', method: '*', desc: 'Quản lý phân quyền route' },
  ];

  readonly currentRolePerms = computed(() => {
    const r = this.role;
    const map = new Map<string, RoutePerm>();
    for (const p of this.perms()) {
      if (p.role === r) {
        map.set(p.path + '|' + p.method, p);
      }
    }
    return map;
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.http.get<{ success: boolean; permissions: RoutePerm[] }>('/api/route-permissions').subscribe({
      next: (res) => {
        this.perms.set(res.permissions || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Không thể tải danh sách phân quyền route');
      },
    });
  }

  isChecked(tpl: RouteTemplate): boolean {
    return this.currentRolePerms().has(tpl.path + '|' + tpl.method);
  }

  toggle(tpl: RouteTemplate, checked: boolean): void {
    if (checked) {
      this.http
        .post('/api/route-permissions', {
          role: this.role,
          path: tpl.path,
          method: tpl.method,
          allowed: true,
          description: tpl.desc,
        })
        .subscribe({
          next: () => {
            this.toast.success('Đã cấp quyền');
            this.load();
          },
          error: (err) => {
            this.toast.error(err?.error?.message || 'Không thể cấp quyền');
          },
        });
    } else {
      const existing = this.currentRolePerms().get(tpl.path + '|' + tpl.method);
      if (existing) {
        this.http.delete('/api/route-permissions/' + existing._id).subscribe({
          next: () => {
            this.toast.success('Đã thu hồi quyền');
            this.load();
          },
          error: () => {
            this.toast.error('Không thể thu hồi quyền');
          },
        });
      }
    }
  }

  getRoleLabel(role: string): string {
    return this.roles.find((r) => r.value === role)?.label || role;
  }
}
