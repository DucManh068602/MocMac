import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface RoleRequest {
  _id: string;
  user: { name: string; email: string; phone: string; role: string };
  requestedRole: string;
  reason: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-admin-role-requests',
  standalone: false,
  templateUrl: './admin-role-requests.html',
  styleUrl: './admin-role-requests.css',
})
export class AdminRoleRequestsComponent {
  private readonly http = inject(HttpClient);

  readonly requests = signal<RoleRequest[]>([]);
  readonly loading = signal(false);
  readonly message = signal('');

  readonly roleLabels: Record<string, string> = {
    customer: 'Khách hàng',
    collaborator: 'Cộng tác viên',
    cooperative: 'Hợp tác xã',
    staff: 'Nhân viên',
    admin: 'Quản trị viên',
  };

  constructor() {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading.set(true);
    this.http.get<{ success: boolean; requests: RoleRequest[] }>('/api/role-requests').subscribe({
      next: (res) => {
        this.requests.set(res.requests || []);
        this.loading.set(false);
      },
      error: () => {
        this.requests.set([]);
        this.loading.set(false);
      },
    });
  }

  approveRequest(id: string, role: string): void {
    this.loading.set(true);
    this.http.patch(`/api/role-requests/${id}`, {
      status: 'approved',
      approvedRole: role,
    }).subscribe({
      next: (res: any) => {
        this.message.set(res?.message || 'Đã duyệt yêu cầu.');
        this.loadRequests();
      },
      error: (err) => {
        this.message.set(err?.error?.message || 'Có lỗi xảy ra.');
        this.loading.set(false);
      },
    });
  }

  rejectRequest(id: string): void {
    this.loading.set(true);
    this.http.patch(`/api/role-requests/${id}`, { status: 'rejected' }).subscribe({
      next: (res: any) => {
        this.message.set(res?.message || 'Đã từ chối yêu cầu.');
        this.loadRequests();
      },
      error: (err) => {
        this.message.set(err?.error?.message || 'Có lỗi xảy ra.');
        this.loading.set(false);
      },
    });
  }

  getRoleLabel(role: string): string {
    return this.roleLabels[role] || role;
  }
}
