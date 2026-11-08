import { Component, HostListener, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth.service';
import { CartService } from '../../cart.service';
import { I18nService } from '../../i18n.service';
import { ThemeService } from '../../theme.service';

@Component({
  selector: 'app-header-component',
  standalone: false,
  templateUrl: './header-component.html',
  styleUrl: './header-component.css',
})
export class HeaderComponent {
  cartService = inject(CartService);
  readonly auth = inject(AuthService);
  readonly i18n = inject(I18nService);
  readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  private http = inject(HttpClient);

  readonly loginPopup = signal(false);
  readonly accountDropdown = signal(false);
  readonly searchResults = signal<any[]>([]);
  searchQuery = signal('');
  readonly placeholder = 'placeholder';

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

  onSearch(event: Event): void {
    event.preventDefault();
    if (this.searchQuery().trim()) {
      this.router.navigate(['/san-pham'], { queryParams: { q: this.searchQuery().trim() } });
      this.searchResults.set([]);
      this.searchQuery.set('');
    }
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    if (value.trim().length >= 2) {
      this.http.get('/api/products?q=' + encodeURIComponent(value.trim()) + '&limit=5').subscribe({
        next: (r: any) => {
          const products = Array.isArray(r) ? r : (r.products || []);
          this.searchResults.set(products);
        },
        error: (err) => {
          console.error('Search error:', err);
          this.searchResults.set([]);
        }
      });
    } else {
      this.searchResults.set([]);
    }
  }

  clearSearch(): void {
    this.searchResults.set([]);
    this.searchQuery.set('');
  }

  @HostListener('document.click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.accountDropdown()) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.user-account') && !target.closest('.account-dropdown')) {
      this.accountDropdown.set(false);
    }
  }
}
