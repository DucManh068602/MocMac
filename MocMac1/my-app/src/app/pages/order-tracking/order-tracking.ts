import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface StatusHistoryEntry {
  status: string;
  paymentStatus?: string;
  note?: string;
  createdAt?: string;
}

export interface OrderTrackingData {
  orderId: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  statusHistory: StatusHistoryEntry[];
  createdAt?: string;
  updatedAt?: string;
  customerInfo?: { name: string; phone: string; address: string };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
}

const STATUS_STEPS: { key: string; label: string; desc: string }[] = [
  { key: 'pending', label: 'Chờ xử lý', desc: 'Đơn hàng đã được tiếp nhận' },
  { key: 'processing', label: 'Đang xử lý', desc: 'Đang chuẩn bị hàng' },
  { key: 'shipped', label: 'Đang giao', desc: 'Đơn hàng đang trên đường giao' },
  { key: 'delivered', label: 'Đã giao', desc: 'Đơn hàng đã giao thành công' },
];

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-tracking.html',
  styleUrl: './order-tracking.scss',
})
export class OrderTrackingComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly order = signal<OrderTrackingData | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly orderIdInput = signal('');
  readonly statusSteps = STATUS_STEPS;

  ngOnInit(): void {
    this.route.params.subscribe((p) => {
      const id = p['id'];
      if (id) {
        this.orderIdInput.set(id);
        this.trackOrder(id);
      }
    });
  }

  trackOrder(orderId?: string): void {
    const id = (orderId || this.orderIdInput()).trim().toUpperCase();
    if (!id) {
      this.error.set('Vui lòng nhập mã đơn hàng.');
      return;
    }
    this.error.set(null);
    this.order.set(null);
    this.loading.set(true);
    this.http.get('/api/orders/track/' + id).subscribe({
      next: (r: any) => {
        this.loading.set(false);
        if (r?.order) {
          this.order.set(r.order);
        } else {
          this.error.set('Không tìm thấy đơn hàng.');
        }
      },
      error: (e: any) => {
        this.loading.set(false);
        this.error.set(e?.error?.message || 'Không tìm thấy đơn hàng.');
      },
    });
  }

  onSubmit(): void {
    this.trackOrder();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  orderCode(o: OrderTrackingData): string {
    return o.orderId;
  }

  vnd(value: number): string {
    return (value || 0).toLocaleString('vi-VN') + 'đ';
  }

  statusLabel(status: string): string {
    const m: Record<string, string> = {
      pending: 'Chờ xử lý',
      processing: 'Đang xử lý',
      shipped: 'Đang giao',
      delivered: 'Đã giao',
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

  currentStep(status: string): number {
    return STATUS_STEPS.findIndex((s) => s.key === status);
  }
}