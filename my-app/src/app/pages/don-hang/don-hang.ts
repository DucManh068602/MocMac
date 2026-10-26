import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth.service';
import { ToastService } from '../../admin/toast.service';
import { PaginationComponent } from '../../admin/pagination';

export interface OrderItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

export interface StatusHistoryEntry {
  status: string;
  paymentStatus?: string;
  note?: string;
  createdAt?: string;
}

export interface OrderData {
  _id?: string;
  orderId?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  customerInfo?: { name: string; phone: string; address: string };
  note?: string;
  statusHistory?: StatusHistoryEntry[];
  createdAt?: string;
  updatedAt?: string;
}

const STATUS_STEPS: { key: string; label: string; desc: string }[] = [
  { key: 'pending', label: 'Chờ xử lý', desc: 'Đơn hàng đã được tiếp nhận' },
  { key: 'processing', label: 'Đang xử lý', desc: 'Đang chuẩn bị hàng' },
  { key: 'shipped', label: 'Đã giao', desc: 'Đơn hàng đã được giao đến bạn' },
  { key: 'delivered', label: 'Đã nhận', desc: 'Bạn đã nhận được hàng' },
];

@Component({
  selector: 'app-don-hang',
  standalone: true,
  imports: [CommonModule, RouterLink, PaginationComponent],
  templateUrl: './don-hang.html',
  styleUrl: './don-hang.scss',
})
export class DonHangComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  readonly orders = signal<OrderData[]>([]);
  readonly selected = signal<OrderData | null>(null);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly loading = signal(false);
  readonly listLoading = signal(false);

  readonly statusSteps = STATUS_STEPS;
  readonly orderIdParam = signal<string | null>(null);

  ngOnInit(): void {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/dang-nhap']);
      return;
    }

    this.route.params.subscribe((p) => {
      const id = p['id'];
      if (id) {
        this.orderIdParam.set(id);
        this.selected.set(null);
        this.loadOrderDetail(id);
      } else {
        this.orderIdParam.set(null);
        this.selected.set(null);
        this.loadOrders();
      }
    });
  }

  loadOrders(): void {
    this.listLoading.set(true);
    this.http.get('/api/orders/mine?page=' + this.page() + '&limit=20').subscribe({
      next: (r: any) => {
        this.listLoading.set(false);
        this.orders.set(Array.isArray(r.orders) ? r.orders : []);
        this.totalPages.set(r.totalPages || 1);
      },
      error: () => {
        this.listLoading.set(false);
        this.orders.set([]);
      },
    });
  }

  loadOrderDetail(id: string): void {
    this.loading.set(true);
    this.http.get('/api/orders/mine/' + id).subscribe({
      next: (r: any) => {
        this.loading.set(false);
        if (r?.order) {
          this.selected.set(r.order);
        }
      },
      error: (e: any) => {
        this.loading.set(false);
        this.toast.error(e?.error?.message || 'Không tải được đơn hàng.');
      },
    });
  }

  viewOrder(o: OrderData): void {
    this.router.navigate(['/don-hang', o._id || '']);
  }

  backToList(): void {
    this.router.navigate(['/don-hang']);
  }

  currentStep(status: string): number {
    return STATUS_STEPS.findIndex((s) => s.key === status);
  }

  // Trả về trạng thái từng bước dựa trên lịch sử thực tế từ admin
  stepStates(order: OrderData): { done: boolean; active: boolean }[] {
    const history = order.statusHistory || [];
    const currentStatus = order.status || 'pending';
    const currentIdx = this.currentStep(currentStatus);

    // Các trạng thái đã từng xuất hiện trong lịch sử
    const visitedStatuses = new Set(history.map(h => h.status));
    visitedStatuses.add(currentStatus); // đảm bảo trạng thái hiện tại cũng tính

    return STATUS_STEPS.map((step, i) => {
      const done = visitedStatuses.has(step.key) && i < currentIdx;
      const active = i === currentIdx;
      return { done, active };
    });
  }

  orderCode(o: OrderData): string {
    return o.orderId || (o._id ? o._id.toString().slice(-8).toUpperCase() : '—');
  }

  vnd(value: number): string {
    return (value || 0).toLocaleString('vi-VN') + 'đ';
  }

  statusLabel(status: string): string {
    const m: Record<string, string> = {
      pending: 'Chờ xử lý',
      processing: 'Đang xử lý',
      shipped: 'Đã giao',
      delivered: 'Đã nhận',
      cancelled: 'Đã hủy',
    };
    return m[status] || 'Chờ xử lý';
  }

  paymentLabel(status: string): string {
    const m: Record<string, string> = {
      pending: 'Chưa thanh toán',
      paid: 'Đã thanh toán',
      failed: 'Thất bại',
      refunded: 'Hoàn tiền',
    };
    return m[status] || 'Chưa thanh toán';
  }

  paymentMethodLabel(method: string): string {
    const m: Record<string, string> = {
      cod: 'Thanh toán khi nhận hàng',
      momo: 'Ví MoMo',
      vnpay: 'VNPay',
      bank_transfer: 'Chuyển khoản',
    };
    return m[method] || method;
  }
}
