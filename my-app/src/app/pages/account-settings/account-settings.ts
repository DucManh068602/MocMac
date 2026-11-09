import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';

interface RoleRequest { _id: string; requestedRole: string; reason: string; status: string; createdAt: string; updatedAt: string; }
interface ProfileData { name: string; email: string; phone: string; role: string; }
interface Address { _id: string; fullName: string; phone: string; provinceCode: number; provinceName: string; wardCode: number; wardName: string; streetAddress: string; isDefault: boolean; createdAt: string; }

@Component({
  selector: 'app-account-settings',
  standalone: false,
  templateUrl: './account-settings.html',
  styleUrl: './account-settings.css',
})
export class AccountSettingsComponent {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly profile = signal<ProfileData | null>(null);
  readonly profilePhone = signal('');
  readonly loading = signal(false);
  readonly savingProfile = signal(false);
  readonly requests = signal<RoleRequest[]>([]);
  readonly requestsLoading = signal(false);
  readonly message = signal('');
  readonly addresses = signal<Address[]>([]);
  readonly addressesLoading = signal(false);
  readonly membership = signal<any | null>(null);
  readonly membershipLoading = signal(false);
  readonly addressForm = signal<{ fullName: string; phone: string; provinceCode: number; provinceName: string; wardCode: number; wardName: string; streetAddress: string; isDefault: boolean; }>({ fullName: '', phone: '', provinceCode: 0, provinceName: '', wardCode: 0, wardName: '', streetAddress: '', isDefault: false });
  readonly showAddressForm = signal(false);
  readonly editingAddressId = signal<string | null>(null);
  readonly provinces = signal<any[]>([]);
  readonly wards = signal<any[]>([]);
  readonly provincesLoading = signal(false);
  readonly wardsLoading = signal(false);
  readonly roleOptions = [
    { value: 'collaborator', label: 'Cộng tác viên', desc: 'Phân phối và bán hàng hiệu quả' },
    { value: 'cooperative', label: 'Hợp tác xã', desc: 'Đại diện làng nghề, hợp tác đồng hành' },
  ];
  selectedRole = '';
  reasonText = '';

  constructor() {
    this.loadProfile();
    this.loadRequests();
    this.loadAddresses();
    this.loadMembership();
    this.loadProvinces();
  }

  updateProfile(): void {
    const p = this.profile();
    if (!p) return;
    this.savingProfile.set(true);
    this.http.patch<any>('/api/users/me', { name: p.name, phone: this.profilePhone() }).subscribe({
      next: (r) => {
        if (r?.success) {
          this.message.set('Đã cập nhật số điện thoại và tên.');
          const u = r.user || p;
          this.profile.set({ name: u.name, email: u.email, phone: u.phone || '', role: u.role || p.role });
          this.profilePhone.set(u.phone || '');
        } else {
          this.message.set(r?.message || 'Cập nhật thất bại.');
        }
        this.savingProfile.set(false);
      },
      error: () => { this.message.set('Không thể cập nhật hồ sơ. Vui lòng thử lại.'); this.savingProfile.set(false); },
    });
  }

  loadMembership(): void {
    this.membershipLoading.set(true);
    this.http.get<any>('/api/users/me/membership').subscribe({
      next: (r) => { this.membership.set(r?.membership || null); this.membershipLoading.set(false); },
      error: () => { this.membership.set(null); this.membershipLoading.set(false); },
    });
  }

  loadAddresses(): void {
    this.addressesLoading.set(true);
    this.http.get<{ addresses: Address[] }>('/api/addresses').subscribe({
      next: (res) => { this.addresses.set(res.addresses || []); this.addressesLoading.set(false); },
      error: () => { this.addresses.set([]); this.addressesLoading.set(false); },
    });
  }

  loadProvinces(): void {
    this.provincesLoading.set(true);
    this.http.get<any[]>('/api/locations/provinces').subscribe({
      next: (res) => { this.provinces.set(res || []); this.provincesLoading.set(false); },
      error: () => { this.provinces.set([]); this.provincesLoading.set(false); },
    });
  }

  onProvinceChange(code: string): void {
    const codeNum = Number.parseInt(String(code ?? ''), 10);
    if (!Number.isFinite(codeNum) || codeNum <= 0) {
      this.addressForm.update((f) => ({ ...f, provinceCode: 0, provinceName: '', wardCode: 0, wardName: '' }));
      this.wards.set([]); return;
    }
    const p = this.provinces().find((x: any) => Number(x.code) === codeNum);
    this.addressForm.update((f) => ({ ...f, provinceCode: codeNum, provinceName: p ? p.name : '', wardCode: 0, wardName: '' }));
    this.wards.set([]); this.loadWards(codeNum);
  }

  onWardChange(code: string): void {
    const codeNum = Number.parseInt(String(code ?? ''), 10);
    if (!Number.isFinite(codeNum) || codeNum <= 0) { this.addressForm.update((f) => ({ ...f, wardCode: 0, wardName: '' })); return; }
    const w = this.wards().find((x: any) => Number(x.code) === codeNum);
    this.addressForm.update((f) => ({ ...f, wardCode: codeNum, wardName: w ? w.name : '' }));
  }

  loadWards(provinceCode: number): void {
    this.wardsLoading.set(true);
    this.addressForm.update((f) => ({ ...f, wardCode: 0, wardName: '' }));
    this.http.get<any[]>(`/api/locations/districts/${provinceCode}/wards`).subscribe({
      next: (res) => { this.wards.set(res || []); this.wardsLoading.set(false); },
      error: () => { this.wards.set([]); this.wardsLoading.set(false); },
    });
  }

  openAddAddressForm(): void {
    this.addressForm.set({ fullName: '', phone: '', provinceCode: 0, provinceName: '', wardCode: 0, wardName: '', streetAddress: '', isDefault: false });
    this.editingAddressId.set(null); this.showAddressForm.set(true);
  }

  editAddress(address: Address): void {
    this.addressForm.set({ fullName: address.fullName, phone: address.phone, provinceCode: Number(address.provinceCode), provinceName: address.provinceName, wardCode: Number(address.wardCode), wardName: address.wardName, streetAddress: address.streetAddress, isDefault: address.isDefault });
    this.editingAddressId.set(address._id); this.showAddressForm.set(true); this.loadWards(Number(address.provinceCode));
  }

  closeAddressForm(): void { this.showAddressForm.set(false); this.editingAddressId.set(null); }

  saveAddress(): void {
    const f = this.addressForm();
    if (!f.fullName || !f.phone || !f.provinceCode || !f.wardCode || !f.streetAddress) { this.message.set('Vui lòng điền đầy đủ thông tin địa chỉ.'); return; }
    this.loading.set(true);
    const id = this.editingAddressId();
    const req = id ? this.http.put(`/api/addresses/${id}`, f) : this.http.post('/api/addresses', f);
    req.subscribe({
      next: () => { this.message.set(id ? 'Đã cập nhật địa chỉ.' : 'Đã thêm địa chỉ.'); this.loading.set(false); this.closeAddressForm(); this.loadAddresses(); },
      error: () => { this.message.set(id ? 'Không thể cập nhật địa chỉ.' : 'Không thể thêm địa chỉ.'); this.loading.set(false); },
    });
  }

  deleteAddress(id: string): void {
    if (!confirm('Bạn chắc chắn muốn xóa địa chỉ này?')) return;
    this.http.delete(`/api/addresses/${id}`).subscribe({
      next: () => { this.message.set('Đã xóa địa chỉ.'); this.loadAddresses(); },
      error: () => this.message.set('Không thể xóa địa chỉ.'),
    });
  }

  setDefaultAddress(id: string): void {
    this.http.patch(`/api/addresses/${id}/default`, {}).subscribe({
      next: () => { this.message.set('Đã đặt địa chỉ mặc định.'); this.loadAddresses(); },
      error: () => this.message.set('Không thể đặt địa chỉ mặc định.'),
    });
  }

  loadProfile(): void {
    const user = this.auth.user();
    if (!user) return;
    this.profile.set({ name: user.name, email: user.email, phone: '', role: user.role });
    this.profilePhone.set('');
    this.http.get<any>('/api/users/me').subscribe({
      next: (r) => {
        if (r?.success && r.user) {
          const u = r.user;
          this.profile.set({ name: u.name, email: u.email, phone: u.phone || '', role: u.role });
          this.profilePhone.set(u.phone || '');
        }
      },
      error: () => {},
    });
  }

  loadRequests(): void {
    this.requestsLoading.set(true);
    this.http.get<{ success: boolean; requests: RoleRequest[] }>('/api/role-requests/mine').subscribe({
      next: (res) => { this.requests.set(res.requests || []); this.requestsLoading.set(false); },
      error: () => { this.requests.set([]); this.requestsLoading.set(false); },
    });
  }

  submitRequest(): void {
    if (!this.selectedRole) { this.message.set('Vui lòng chọn vai trò cần nâng cấp.'); return; }
    this.loading.set(true); this.message.set('');
    this.http.post('/api/role-requests', { requestedRole: this.selectedRole, reason: this.reasonText }).subscribe({
      next: (res: any) => {
        if (res?.success) { this.message.set('Yêu cầu của bạn đã được gửi thành công!'); this.selectedRole = ''; this.reasonText = ''; this.loadRequests(); }
        else this.message.set(res?.message || 'Có lỗi xảy ra.');
        this.loading.set(false);
      },
      error: (err) => { this.message.set(err?.error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.'); this.loading.set(false); },
    });
  }

  formatMoney(n: number): string { return (Number(n) || 0).toLocaleString('vi-VN') + 'đ'; }
  roleLabel(r: string): string { return ({ customer: 'Khách hàng', admin: 'Quản trị viên', staff: 'Nhân viên', collaborator: 'Cộng tác viên', cooperative: 'Hợp tác xã' } as any)[r] || r; }
}
