import { Component, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class AdminDashboardComponent {
  private http = inject(HttpClient);
  auth = inject(AuthService);

  readonly orders = signal<any[]>([]);
  readonly products = signal<any[]>([]);
  readonly coupons = signal<any[]>([]);
  readonly payments = signal<any[]>([]);
  readonly contacts = signal<any[]>([]);
  readonly users = signal<any[]>([]);
  readonly notifications = signal<any[]>([]);
  readonly loading = signal(false);

  readonly summary = computed(() => ({
    orders: this.orders().length,
    products: this.products().length,
    coupons: this.coupons().length,
    payments: this.payments().length,
    contacts: this.contacts().length,
    users: this.users().length,
    notifications: this.notifications().length,
  }));

  constructor() {
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);
    const http = this.http;

    http.get('/api/orders').subscribe((r: any) => this.orders.set(r.orders || r));
    http.get('/api/products').subscribe((r: any) => this.products.set(Array.isArray(r) ? r : r.products || []));
    http.get('/api/coupons').subscribe((r: any) => this.coupons.set(r.coupons || r));
    http.get('/api/payments/my-payments').subscribe((r: any) => this.payments.set(r.payments || r));
    http.get('/api/contacts').subscribe((r: any) => this.contacts.set(r.contacts || r));
    http.get('/api/users').subscribe((r: any) => this.users.set(r.users || r));
    http.get('/api/notifications').subscribe((r: any) => this.notifications.set(r.notifications || r));

    this.loading.set(false);
  }
}
