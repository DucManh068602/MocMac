import { Component, HostListener, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { CartService } from '../../cart.service';

@Component({
  selector: 'app-header-component',
  standalone: false,
  templateUrl: './header-component.html',
  styleUrl: './header-component.css',
})
export class HeaderComponent {
  cartService = inject(CartService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loginPopup = signal(false);
  readonly accountDropdown = signal(false);

  isFilterOpen: boolean = false;
  filterRegion: string = 'all';
  filterPriceRange: string = 'all';

  onFilterClick(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  onCartClick(): void {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/gio-hang']);
    } else {
      this.loginPopup.set(true);
    }
  }

  onLogout(): void {
    this.auth.logout();
    this.accountDropdown.set(false);
    this.router.navigate(['/']);
  }

  toggleAccountDropdown(): void {
    this.accountDropdown.update((v) => !v);
  }

  closeLoginPopup(): void {
    this.loginPopup.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.accountDropdown()) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.user-account') && !target.closest('.account-dropdown')) {
      this.accountDropdown.set(false);
    }
  }
}