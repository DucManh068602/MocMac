import { Component, inject, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from './cart.service';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { ChatService } from './chat.service';

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
  private chatService = inject(ChatService);

  isStandaloneAuth(): boolean {
    const path = this.router.url.split(/[?#]/, 1)[0].replace(/\/+$/, '');
    return path === '/dang-nhap';
  }

  isAdminPath(): boolean {
    const path = this.router.url.split(/[?#]/, 1)[0].replace(/\/+$/, '');
    return path.startsWith('/admin');
  }

  private _socketEffect = effect(() => {
    const user = this.auth.user();
    const token = localStorage.getItem('mocmac-auth-token') ?? sessionStorage.getItem('mocmac-auth-token');
    if (user && token) {
      this.notif.connect();
      this.chatService.connect();
    } else {
      this.notif.disconnect();
    }
  });

  logout(): void {
    this.notif.disconnect();
    this.chatService.disconnect();
    this.auth.logout();
  }
}
