import { Component, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from './toast.service';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xử lý',
  processing: 'Đang xử lý',
  shipped: 'Đã giao',
  delivered: 'Đã nhận',
  cancelled: 'Đã hủy',
};
const PAYMENT_LABELS: Record<string, string> = {
  pending: 'Chưa thanh toán',
  paid: 'Đã thanh toán',
  failed: 'Thất bại',
  refunded: 'Hoàn tiền',
};
const STATUS_COLORS: Record<string, string> = {
  pending: '#e0a43a', processing: '#4a7c59', shipped: '#2e5a3c', delivered: '#1e3a2a', cancelled: '#c0392b',
};
const PAYMENT_COLORS: Record<string, string> = {
  pending: '#e0a43a', paid: '#2e5a3c', failed: '#c0392b', refunded: '#6b7280',
};

@Component({
  selector: 'app-admin-orders',
  standalone: false,
  templateUrl: './orders.html',
  styleUrls: ['./orders.css'],
})
export class AdminOrdersComponent {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  readonly orders = signal<any[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly loading = signal(false);
  searchTerm = '';
  statusFilter = '';
  paymentFilter = '';
  readonly detailOpen = signal(false);
  readonly detailLoading = signal(false);
  readonly detail = signal<any>(null);

  readonly stats = computed(() => {
    const o = this.orders();
    return {
      total: o.length,
      pending: o.filter((x: any) => x.status === 'pending').length,
      processing: o.filter((x: any) => ['processing', 'shipped'].includes(x.status)).length,
      delivered: o.filter((x: any) => x.status === 'delivered').length,
      cancelled: o.filter((x: any) => x.status === 'cancelled').length,
      revenue: o.filter((x: any) => x.paymentStatus === 'paid').reduce((s, x) => s + (x.total || 0), 0),
    };
  });

  constructor() { this.loadOrders(); }

  onFilterChange(): void { this.page.set(1); this.loadOrders(); }
  resetFilters(): void { this.searchTerm = ''; this.statusFilter = ''; this.paymentFilter = ''; this.page.set(1); this.loadOrders(); }

  loadOrders(): void {
    this.loading.set(true);
    const params = new URLSearchParams({ page: String(this.page()), limit: '20' });
    if (this.searchTerm) params.set('q', this.searchTerm);
    if (this.statusFilter) params.set('status', this.statusFilter);
    if (this.paymentFilter) params.set('paymentStatus', this.paymentFilter);
    this.http.get('/api/orders?' + params.toString()).subscribe({
      next: (r: any) => {
        const items = Array.isArray(r.orders) ? r.orders : (r.orders?.orders || []);
        this.orders.set(items);
        this.totalPages.set(r.totalPages || 1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  statusLabel(status: string): string { return STATUS_LABELS[status] || 'Chờ xử lý'; }
  statusColor(status: string): string { return STATUS_COLORS[status] || '#e0a43a'; }
  paymentLabel(status: string): string { return PAYMENT_LABELS[status] || 'Chưa thanh toán'; }
  paymentColor(status: string): string { return PAYMENT_COLORS[status] || '#e0a43a'; }

  updateStatus(id: string, status: string): void {
    this.http.patch('/api/orders/' + id + '/status', { status }).subscribe({
      next: () => { this.toast.success('Đã cập nhật trạng thái đơn hàng và gửi thông báo cho khách.'); this.loadOrders(); },
      error: () => this.toast.error('Không thể cập nhật trạng thái'),
    });
  }

  updatePayment(id: string, paymentStatus: string): void {
    this.http.patch('/api/orders/' + id + '/payment', { paymentStatus }).subscribe({
      next: () => { this.toast.success('Đã cập nhật thanh toán và gửi thông báo cho khách.'); this.loadOrders(); },
      error: () => this.toast.error('Không thể cập nhật thanh toán'),
    });
  }

  formatCurrency(n: number): string { return (n || 0).toLocaleString('vi-VN') + 'đ'; }

  viewOrder(order: any): void {
    if (!order?._id) return;
    this.detailOpen.set(true); this.detailLoading.set(true); this.detail.set(order);
    this.http.get<any>('/api/orders/' + order._id).subscribe({
      next: (r) => { this.detail.set(r?.order || order); this.detailLoading.set(false); },
      error: () => { this.detail.set(order); this.detailLoading.set(false); this.toast.error('Không thể tải chi tiết đơn hàng'); },
    });
  }
  closeDetail(): void { this.detailOpen.set(false); this.detail.set(null); }
}