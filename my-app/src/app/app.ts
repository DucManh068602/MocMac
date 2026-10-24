import { Component, inject, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from './cart.service';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

@Component({
  selector: 'app-root',
  standalone: false,
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);
  readonly cart = inject(CartService);
  protected readonly title = signal('my-app');
  private auth = inject(AuthService);
  private notif = inject(NotificationService);

  isStandaloneAuth(): boolean {
    const path = this.router.url.split(/[?#]/, 1)[0].replace(/\/+$/, '');
    return path === '/dang-nhap';
  }

  private _socketEffect = effect(() => {
    const user = this.auth.user();
    const token = localStorage.getItem('mocmac-auth-token') ?? sessionStorage.getItem('mocmac-auth-token');
    if (user && token) {
      this.notif.connect();
    } else {
      this.notif.disconnect();
    }
  });

  logout(): void {
    this.notif.disconnect();
    this.auth.logout();
  }
}
