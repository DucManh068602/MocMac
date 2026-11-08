import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../cart.service';
import { ProductsService } from '../../products.service';

@Component({
  selector: 'app-home-component',
  standalone: false,
  templateUrl: './home-component.html',
  styleUrl: './home-component.css',
})
export class HomeComponent implements OnDestroy {
  cart = inject(CartService);
  private svc = inject(ProductsService);
  private http = inject(HttpClient);
  products = this.svc.products;
  tab = signal('Tất cả');
  readonly flashSale = signal<any>(null);
  readonly now = signal(Date.now());
  private readonly countdownTimer = window.setInterval(() => this.now.set(Date.now()), 1000);
  readonly flashSaleLive = computed(() => Boolean(this.flashSale()?.live));
  readonly flashSalePercent = computed(() => Number(this.flashSale()?.discountPercent || 0));
  readonly saleProgress = computed(() => {
    const sale = this.flashSale();
    const start = new Date(sale?.startsAt || 0).getTime();
    const end = new Date(sale?.endsAt || 0).getTime();
    const total = Math.max(1, end - start);
    return Math.max(0, Math.min(100, ((this.now() - start) / total) * 100));
  });
  readonly saleRemaining = computed(() => {
    const end = new Date(this.flashSale()?.endsAt || 0).getTime();
    let seconds = Math.max(0, Math.floor((end - this.now()) / 1000));
    const days = Math.floor(seconds / 86400); seconds %= 86400;
    const hours = Math.floor(seconds / 3600); seconds %= 3600;
    const minutes = Math.floor(seconds / 60); const secs = seconds % 60;
    return { days, hours, minutes, secs };
  });
  readonly bestSellers = computed(() => [...this.products()].sort((a, b) => (b.reviews || 0) - (a.reviews || 0)).slice(0, 6));
  readonly brokenImages = signal(new Set<string>());
  shown = computed(() => {
    const list = this.products();
    if (this.tab() === 'Tất cả') {
      return list.slice(0, 12);
    }
    if (this.tab() === 'Sản phẩm OCOP') {
      return list.filter(p => p.ocop > 0).slice(0, 12);
    }
    return list.filter(p => p.cat === this.tab()).slice(0, 12);
  });

  imageOf(product: { images?: string[]; slug: string }): string | null {
    const image = product.images?.find((url) => typeof url === 'string' && url.trim());
    return image && !this.brokenImages().has(product.slug) ? image : null;
  }

  onProductImageError(slug: string): void {
    this.brokenImages.update((current) => new Set(current).add(slug));
  }

  flashSalePrice(p: { price: number }): number {
    if (!this.flashSaleLive()) return p.price;
    return Math.max(0, Math.round(p.price * (100 - this.flashSalePercent()) / 100));
  }

  constructor() { this.http.get<any>('/api/flash-sale').subscribe({ next: r => this.flashSale.set(r.sale), error: () => this.flashSale.set(null) }); }
  ngOnDestroy(): void { window.clearInterval(this.countdownTimer); }
}
