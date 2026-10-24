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
  readonly orders = signal<any[]>([]);
  readonly ordersTotal = signal(0);
  readonly counts = signal({ products: 0, coupons: 0, contacts: 0, users: 0, notifications: 0 });
  readonly loading = signal(true);
  readonly failed = signal(false);

  readonly valid = computed(() => this.orders().filter((o) => o.status !== 'cancelled'));

  readonly revenue = computed(() =>
    this.orders()
      .filter((o) => o.paymentStatus === 'paid' || o.status === 'delivered')
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
      const day = days.find((d) => d.key === new Date(o.createdAt).toLocaleDateString('en-CA'));
      if (day) day.value += o.total || 0;
    }
    const max = Math.max(...days.map((d) => d.value), 1);
    return days.map((d) => ({ ...d, h: Math.max((d.value / max) * 100, d.value ? 4 : 0) }));
  });

  readonly recent = computed(() => this.orders().slice(0, 5));

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
      });
      this.loading.set(false);
    });
  }
}
