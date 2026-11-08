import { Component, inject, signal, computed } from '@angular/core';
import { Router, NavigationEnd, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../auth.service';
import { filter } from 'rxjs/operators';
import { ThemeService } from '../theme.service';

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
  readonly theme = inject(ThemeService);
  private router = inject(Router);

  readonly navItems: NavItem[] = [
    { label: 'Về trang chủ', path: '/', icon: 'fa-solid fa-house' },
    { label: 'Đơn hàng', path: 'orders', icon: 'fa-solid fa-cart-shopping' },
    { label: 'Sản phẩm', path: 'products', icon: 'fa-solid fa-box' },
    { label: 'Vùng miền', path: 'regions', icon: 'fa-solid fa-map-location-dot' },
    { label: 'Câu chuyện vùng miền', path: 'region-stories', icon: 'fa-solid fa-earth-asia' },
    { label: 'Câu chuyện làng nghề', path: 'village-stories', icon: 'fa-solid fa-hands' },
    { label: 'Mã giảm giá', path: 'coupons', icon: 'fa-solid fa-ticket' },
    { label: 'Quản lý Deal', path: 'deals', icon: 'fa-solid fa-tags' },
    { label: 'Tài khoản', path: 'users', icon: 'fa-solid fa-users' },
    { label: 'Yêu cầu vai trò', path: 'role-requests', icon: 'fa-solid fa-user-pen' },
    { label: 'Phân quyền vai trò', path: 'route-permissions', icon: 'fa-solid fa-shield-halved' },
    { label: 'Săn sale', path: 'flash-sale', icon: 'fa-solid fa-bolt' },
    { label: 'Yêu cầu báo giá', path: 'quotation-requests', icon: 'fa-solid fa-file-invoice-dollar' },
    { label: 'Liên hệ', path: 'contacts', icon: 'fa-solid fa-envelope' },
    { label: 'Đánh giá', path: 'reviews', icon: 'fa-solid fa-star' },
    { label: 'Lịch sử hệ thống', path: 'audit', icon: 'fa-solid fa-clock-rotate-left' },
    { label: 'Thông báo', path: 'notifications', icon: 'fa-solid fa-bell' },
  ];

  readonly sidebarOpen = signal(false);
  readonly currentPath = signal('');

  constructor() {
    this.setCurrentPath(this.router.url);
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      this.setCurrentPath(e.urlAfterRedirects);
    });
  }

  private setCurrentPath(url: string): void {
    const parts = url.split('?')[0].split('/').filter(Boolean);
    this.currentPath.set(parts.slice(1).join('/'));
  }

  setActive(path: string) {
    this.router.navigate(['/admin/' + path]);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
