import { Component, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../auth.service';

const STATUSES = [
  { key: 'pending', label: 'Chờ xử lý', color: '#e0a43a' },
  { key: 'processing', label: 'Đang xử lý', color: '#4a7c59' },
  { key: 'shipped', label: 'Đã giao', color: '#2e5a3c' },
  { key: 'delivered', label: 'Đã nhận', color: '#1e3a2a' },
  { key: 'cancelled', label: 'Đã hủy', color: '#c0392b' },
];

const PAY_STATUSES = [
  { key: 'pending', label: 'Chờ thanh toán', color: '#e0a43a' },
  { key: 'paid', label: 'Đã thanh toán', color: '#2e5a3c' },
  { key: 'failed', label: 'Thất bại', color: '#c0392b' },
  { key: 'refunded', label: 'Hoàn tiền', color: '#6b7280' },
];

const PAY_METHODS = [
  { key: 'cod', label: 'COD', color: '#4a7c59' },
  { key: 'momo', label: 'MoMo', color: '#a50064' },
  { key: 'vnpay', label: 'VNPay', color: '#005baa' },
  { key: 'bank_transfer', label: 'Chuyển khoản', color: '#1e3a2a' },
];

const pick = (r: any, k: string): any[] => (Array.isArray(r) ? r : r?.[k] ?? []);

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class AdminDashboardComponent {
  private http = inject(HttpClient);
  auth = inject(AuthService);

  readonly statuses = STATUSES;
  readonly payStatuses = PAY_STATUSES;
  readonly payMethods = PAY_METHODS;
  readonly orders = signal<any[]>([]);
  readonly ordersTotal = signal(0);
  readonly counts = signal({ products: 0, coupons: 0, contacts: 0, users: 0, notifications: 0, routePerms: 0 });
  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly flashSale = signal<any>(null);
  readonly routePermCount = signal(0);
  saleForm: any = { active: false, discountPercent: 10, startsAt: '', endsAt: '' };

  readonly greeting = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  });

  readonly todayLabel = computed(() => new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' }));

  readonly valid = computed(() => this.orders().filter((o) => o.status !== 'cancelled'));

  readonly revenue = computed(() =>
    this.orders()
      .filter((o) => o.paymentStatus === 'paid')
      .reduce((s, o) => s + (o.total || 0), 0),
  );

  readonly pending = computed(() => this.orders().filter((o) => o.status === 'pending').length);

  readonly byStatus = computed(() => {
    const all = this.orders();
    return STATUSES.map((s) => {
      const n = all.filter((o) => o.status === s.key).length;
      return { ...s, n, pct: all.length ? (n / all.length) * 100 : 0 };
    });
  });

  readonly chart = computed(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { key: d.toLocaleDateString('en-CA'), label: `${d.getDate()}/${d.getMonth() + 1}`, value: 0 };
    });
    for (const o of this.valid()) {
      if (o.paymentStatus !== 'paid') continue;
      const day = days.find((d) => d.key === new Date(o.createdAt).toLocaleDateString('en-CA'));
      if (day) day.value += o.total || 0;
    }
    const max = Math.max(...days.map((d) => d.value), 1);
    return days.map((d) => ({ ...d, h: Math.max((d.value / max) * 100, d.value ? 4 : 0) }));
  });

  readonly recent = computed(() => this.orders().slice(0, 5));

  readonly ordersCountChart = computed(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { key: d.toLocaleDateString('en-CA'), label: `${d.getDate()}/${d.getMonth() + 1}`, value: 0 };
    });
    for (const o of this.orders()) {
      if (o.status === 'cancelled') continue;
      const day = days.find((d) => d.key === new Date(o.createdAt).toLocaleDateString('en-CA'));
      if (day) day.value += 1;
    }
    const max = Math.max(...days.map((d) => d.value), 1);
    return days.map((d) => ({ ...d, h: Math.max((d.value / max) * 100, d.value ? 4 : 0) }));
  });

  readonly byPaymentStatus = computed(() => {
    const all = this.orders();
    return PAY_STATUSES.map((s) => {
      const n = all.filter((o) => (o.paymentStatus || 'pending') === s.key).length;
      return { ...s, n, pct: all.length ? (n / all.length) * 100 : 0 };
    });
  });

  readonly byPaymentMethod = computed(() => {
    const all = this.orders();
    return PAY_METHODS.map((s) => {
      const n = all.filter((o) => (o.paymentMethod || 'cod') === s.key).length;
      return { ...s, n, pct: all.length ? (n / all.length) * 100 : 0 };
    });
  });

  readonly topProducts = computed(() => {
    const map = new Map<string, number>();
    for (const o of this.orders()) {
      if (o.status === 'cancelled') continue;
      for (const it of o.items || []) {
        const name = String(it.name || 'Khác');
        map.set(name, (map.get(name) || 0) + (Number(it.quantity) || 0));
      }
    }
    const rows = [...map.entries()].map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value).slice(0, 5);
    const max = Math.max(...rows.map((r) => r.value), 1);
    return rows.map((r) => ({ ...r, w: Math.max((r.value / max) * 100, r.value ? 4 : 0) }));
  });

  readonly aovChart = computed(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { key: d.toLocaleDateString('en-CA'), label: `${d.getDate()}/${d.getMonth() + 1}`, total: 0, count: 0 };
    });
    for (const o of this.orders()) {
      if (o.status === 'cancelled') continue;
      const day = days.find((d) => d.key === new Date(o.createdAt).toLocaleDateString('en-CA'));
      if (day) { day.total += Number(o.total) || 0; day.count += 1; }
    }
    const vals = days.map((d) => ({ ...d, value: d.count ? Math.round(d.total / d.count) : 0 }));
    const max = Math.max(...vals.map((d) => d.value), 1);
    return vals.map((d) => ({ ...d, h: Math.max((d.value / max) * 100, d.value ? 4 : 0) }));
  });

  constructor() {
    this.load();
  }

  statusOf(key: string) {
    return STATUSES.find((s) => s.key === key);
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    const get = (url: string) =>
      this.http.get<any>(url).pipe(
        catchError(() => {
          this.failed.set(true);
          return of(null);
        }),
      );

    forkJoin({
      orders: get('/api/orders?limit=100'),
      products: get('/api/products'),
      coupons: get('/api/coupons'),
      contacts: get('/api/contacts'),
      users: get('/api/users'),
      notifications: get('/api/notifications'),
      flashSale: get('/api/flash-sale'),
      routePerms: get('/api/route-permissions'),
    }).subscribe((r) => {
      const orders = pick(r.orders, 'orders');
      this.orders.set(orders);
      this.ordersTotal.set(r.orders?.total ?? orders.length);
      this.counts.set({
        products: pick(r.products, 'products').length,
        coupons: pick(r.coupons, 'coupons').length,
        contacts: pick(r.contacts, 'contacts').length,
        users: pick(r.users, 'users').length,
        notifications: pick(r.notifications, 'notifications').length,
        routePerms: pick(r.routePerms, 'permissions').length,
      });
      this.routePermCount.set(pick(r.routePerms, 'permissions').length);
      this.flashSale.set(r.flashSale?.sale || null);
      const sale = r.flashSale?.sale;
      if (sale) this.saleForm = { active: Boolean(sale.active), discountPercent: sale.discountPercent || 10, startsAt: this.toInputDate(sale.startsAt), endsAt: this.toInputDate(sale.endsAt) };
      this.loading.set(false);
    });
  }

  saveFlashSale(): void { this.http.put<any>('/api/flash-sale', this.saleForm).subscribe({ next: r => { this.flashSale.set(r.sale); this.saleForm = { ...this.saleForm, active: r.sale.active }; }, error: () => this.failed.set(true) }); }
  deleteFlashSale(): void { if (!confirm('Xóa chế độ săn sale này?')) return; this.http.delete<any>('/api/flash-sale').subscribe({ next: r => { this.flashSale.set(r.sale); this.saleForm = { active: false, discountPercent: 10, startsAt: '', endsAt: '' }; }, error: () => this.failed.set(true) }); }
  private toInputDate(value: string | null): string { return value ? new Date(value).toISOString().slice(0, 16) : ''; }
}
