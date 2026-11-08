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

interface Address {
  _id: string;
  fullName: string;
  phone: string;
  provinceCode: number;
  provinceName: string;
  wardCode: number;
  wardName: string;
  streetAddress: string;
  isDefault: boolean;
  createdAt: string;
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
  readonly addresses = signal<Address[]>([]);
  readonly addressesLoading = signal(false);
  readonly addressForm = signal<{
    fullName: string;
    phone: string;
    provinceCode: number;
    provinceName: string;
    wardCode: number;
    wardName: string;
    streetAddress: string;
    isDefault: boolean;
  }>({
    fullName: '',
    phone: '',
    provinceCode: 0,
    provinceName: '',
    wardCode: 0,
    wardName: '',
    streetAddress: '',
    isDefault: false,
  });
  readonly showAddressForm = signal(false);
  readonly editingAddressId = signal<string | null>(null);

  readonly provinces = signal<any[]>([]);
  readonly wards = signal<any[]>([]);
  readonly provincesLoading = signal(false);
  readonly wardsLoading = signal(false);

  readonly roleOptions = [
    { value: 'collaborator', label: 'Cộng tác viên', desc: 'Phân phát và bán hàng hướệu quả' },
    { value: 'cooperative', label: 'Hợp tác xã', desc: 'Đại diện làng nghề, hợn hợp đồng' },
  ];

  selectedRole = '';
  reasonText = '';

  constructor() {
    this.loadProfile();
    this.loadRequests();
    this.loadAddresses();
    this.loadProvinces();
  }

  loadAddresses(): void {
    this.addressesLoading.set(true);
    this.http.get<{ addresses: Address[] }>('/api/addresses').subscribe({
      next: (res) => {
        this.addresses.set(res.addresses || []);
        this.addressesLoading.set(false);
      },
      error: () => {
        this.addresses.set([]);
        this.addressesLoading.set(false);
      },
    });
  }

  loadProvinces(): void {
    this.provincesLoading.set(true);
    this.http.get<any[]>('/api/locations/provinces').subscribe({
      next: (res) => {
        this.provinces.set(res || []);
        this.provincesLoading.set(false);
      },
      error: () => {
        this.provinces.set([]);
        this.provincesLoading.set(false);
      },
    });
  }

  onProvinceChange(code: string): void {
    const codeNum = Number.parseInt(String(code ?? ''), 10);
    if (!Number.isFinite(codeNum) || codeNum <= 0) {
      this.addressForm.update((f) => ({ ...f, provinceCode: 0, provinceName: '', wardCode: 0, wardName: '' }));
      this.wards.set([]);
      return;
    }
    const p = this.provinces().find((x: any) => Number(x.code) === codeNum);
    this.addressForm.update((f) => ({ ...f, provinceCode: codeNum, provinceName: p ? p.name : '', wardCode: 0, wardName: '' }));
    this.wards.set([]);
    this.loadWards(codeNum);
  }

  onWardChange(code: string): void {
    const codeNum = Number.parseInt(String(code ?? ''), 10);
    if (!Number.isFinite(codeNum) || codeNum <= 0) {
      this.addressForm.update((f) => ({ ...f, wardCode: 0, wardName: '' }));
      return;
    }
    const w = this.wards().find((x: any) => Number(x.code) === codeNum);
    this.addressForm.update((f) => ({ ...f, wardCode: codeNum, wardName: w ? w.name : '' }));
  }

  loadWards(provinceCode: number): void {
    this.wardsLoading.set(true);
    this.addressForm.update((f) => ({ ...f, wardCode: 0, wardName: '' }));
    this.http.get<any[]>(`/api/locations/districts/${provinceCode}/wards`).subscribe({
      next: (res) => {
        this.wards.set(res || []);
        this.wardsLoading.set(false);
      },
      error: () => {
        this.wards.set([]);
        this.wardsLoading.set(false);
      },
    });
  }

  openAddAddressForm(): void {
    this.addressForm.set({
      fullName: '',
      phone: '',
      provinceCode: 0,
      provinceName: '',
      wardCode: 0,
      wardName: '',
      streetAddress: '',
      isDefault: false,
    });
    this.editingAddressId.set(null);
    this.showAddressForm.set(true);
  }

  editAddress(address: Address): void {
    this.addressForm.set({
      fullName: address.fullName,
      phone: address.phone,
      provinceCode: Number(address.provinceCode),
      provinceName: address.provinceName,
      wardCode: Number(address.wardCode),
      wardName: address.wardName,
      streetAddress: address.streetAddress,
      isDefault: address.isDefault,
    });
    this.editingAddressId.set(address._id);
    this.showAddressForm.set(true);
    this.loadWards(Number(address.provinceCode));
  }

  closeAddressForm(): void {
    this.showAddressForm.set(false);
    this.editingAddressId.set(null);
  }

  saveAddress(): void {
    const f = this.addressForm();
    if (!f.fullName || !f.phone || !f.provinceCode || !f.wardCode || !f.streetAddress) {
      this.message.set('Vui lòng điền đầy đủ thông tin địa chỉ.');
      return;
    }

    this.loading.set(true);
    const id = this.editingAddressId();

    if (id) {
      this.http.put(`/api/addresses/${id}`, f).subscribe({
        next: () => {
          this.message.set('Đã cập nhật địa chỉ.');
          this.loading.set(false);
          this.closeAddressForm();
          this.loadAddresses();
        },
        error: () => {
          this.message.set('Không thể cập nhật địa chỉ.');
          this.loading.set(false);
        },
      });
    } else {
      this.http.post('/api/addresses', f).subscribe({
        next: () => {
          this.message.set('Đã thêm địa chỉ.');
          this.loading.set(false);
          this.closeAddressForm();
          this.loadAddresses();
        },
        error: () => {
          this.message.set('Không thể thêm địa chỉ.');
          this.loading.set(false);
        },
      });
    }
  }

  deleteAddress(id: string): void {
    if (!confirm('Bạn chắc chắn muốn xóa địa chỉ này?')) return;
    this.http.delete(`/api/addresses/${id}`).subscribe({
      next: () => {
        this.message.set('Đã xóa địa chỉ.');
        this.loadAddresses();
      },
      error: () => this.message.set('Không thể xóa địa chỉ.'),
    });
  }

  setDefaultAddress(id: string): void {
    this.http.patch(`/api/addresses/${id}/default`, {}).subscribe({
      next: () => {
        this.message.set('Đã đặt địa chỉ mặc định.');
        this.loadAddresses();
      },
      error: () => this.message.set('Không thể đặt địa chỉ mặc định.'),
    });
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
