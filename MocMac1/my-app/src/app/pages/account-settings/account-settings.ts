import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth.service';

interface RoleRequest {
  _id: string;
  requestedRole: string;
  reason: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  role: string;
}

@Component({
  selector: 'app-account-settings',
  standalone: false,
  templateUrl: './account-settings.html',
  styleUrl: './account-settings.css',
})
export class AccountSettingsComponent {
  private readonly http = inject(HttpClient);
  readonly auth = inject(AuthService);

  readonly profile = signal<ProfileData | null>(null);
  readonly loading = signal(false);
  readonly requests = signal<RoleRequest[]>([]);
  readonly requestsLoading = signal(false);
  readonly message = signal('');

  readonly roleOptions = [
    { value: 'collaborator', label: 'Cộng tác viên', desc: 'Phân phát và bán hàng hướệu quả' },
    { value: 'cooperative', label: 'Hợp tác xã', desc: 'Đại diện làng nghề, hợn hợp đồng' },
  ];

  selectedRole = '';
  reasonText = '';

  constructor() {
    this.loadProfile();
    this.loadRequests();
  }

  loadProfile(): void {
    const user = this.auth.user();
    if (user) {
      this.profile.set({
        name: user.name,
        email: user.email,
        phone: '',
        role: user.role,
      });
    }
  }

  loadRequests(): void {
    this.requestsLoading.set(true);
    this.http.get<{ success: boolean; requests: RoleRequest[] }>('/api/role-requests/mine').subscribe({
      next: (res) => {
        this.requests.set(res.requests || []);
        this.requestsLoading.set(false);
      },
      error: () => {
        this.requests.set([]);
        this.requestsLoading.set(false);
      },
    });
  }

  submitRequest(): void {
    if (!this.selectedRole) {
      this.message.set('Vui lòng chọn vai trò cần nâng cấp.');
      return;
    }

    this.loading.set(true);
    this.message.set('');

    const roleLabel = this.roleOptions.find((r) => r.value === this.selectedRole)?.label || this.selectedRole;

    this.http.post('/api/role-requests', {
      requestedRole: this.selectedRole,
      reason: this.reasonText,
    }).subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.message.set('Yêu cầu của bạn đã được gửi thành công!');
          this.selectedRole = '';
          this.reasonText = '';
          this.loadRequests();
        } else {
          this.message.set(res?.message || 'Có lỗi xảy ra.');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.message.set(err?.error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
        this.loading.set(false);
      },
    });
  }
}
