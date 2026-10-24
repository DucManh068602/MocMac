import { Component, inject, signal, computed } from '@angular/core';
import { Router, NavigationEnd, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../auth.service';
import { filter } from 'rxjs/operators';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: false,
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayoutComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  readonly navItems: NavItem[] = [
    { label: 'Bảng điều khiển', path: '', icon: '📊' },
    { label: 'Đơn hàng', path: 'orders', icon: '🛒' },
    { label: 'Sản phẩm', path: 'products', icon: '📦' },
    { label: 'Vùng miền', path: 'regions', icon: '🗺️' },
    { label: 'Mã giảm giá', path: 'coupons', icon: '🎫' },
    { label: 'Tài khoản', path: 'users', icon: '👥' },
    { label: 'Liên hệ', path: 'contacts', icon: '📨' },
    { label: 'Đánh giá', path: 'reviews', icon: '⭐' },
    { label: 'Lịch sử hệ thống', path: 'audit', icon: '📋' },
    { label: 'Thông báo', path: 'notifications', icon: '🔔' },
  ];

  readonly sidebarOpen = signal(false);
  readonly currentPath = signal('');

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      const parts = e.urlAfterRedirects.split('/').filter(Boolean);
      this.currentPath.set(parts[1] || '');
    });
  }

  setActive(path: string) {
    this.router.navigate(['/admin/' + path]);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
