import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from './cart.service';

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

  isStandaloneAuth(): boolean {
    const path = this.router.url.split(/[?#]/, 1)[0].replace(/\/+$/, '');
    return path === '/dang-nhap';
  }
}
