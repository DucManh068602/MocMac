import { Component, inject, signal } from '@angular/core';
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
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loginPopup = signal(false);

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

  closeLoginPopup(): void {
    this.loginPopup.set(false);
  }
}