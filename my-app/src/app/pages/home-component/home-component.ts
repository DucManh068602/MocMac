import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../cart.service';
import { ProductsService } from '../../products.service';
import { ToastService } from '../../admin/toast.service';

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
  private readonly toast = inject(ToastService);
  products = this.svc.products;
  tab = signal('Tất cả');
  readonly flashSale = signal<any>(null);
  private previousFlashSaleLive = false;
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
  readonly bestSellers = computed(() => this.products().filter((p) => (p.sold || 0) > 40).sort((a, b) => (b.sold || 0) - (a.sold || 0) || (b.reviews || 0) - (a.reviews || 0)).slice(0, 6));
  readonly hasBestsellers = computed(() => this.bestSellers().length > 0);
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

  soldPercent(p: { sold?: number; totalStock?: number }): number {
    return Math.max(0, Math.min(100, ((p.sold || 0) / Math.max(1, p.totalStock ?? 100)) * 100));
  }

  private flashSaleTimer?: ReturnType<typeof setInterval>;
  private handleVisibility = () => this.onVisibilityChange();

  constructor() {
    this.fetchFlashSale();
    this.flashSaleTimer = window.setInterval(() => this.fetchFlashSale(), 5000);
    window.addEventListener('visibilitychange', this.handleVisibility);
    window.addEventListener('focus', this.handleVisibility);
  }

  private onVisibilityChange(): void {
    if (!document.hidden) {
      this.fetchFlashSale();
    }
  }

  private fetchFlashSale(): void {
    this.http.get<any>('/api/flash-sale').subscribe({
      next: (r) => {
        const sale = r.sale;
        const isLive = Boolean(sale?.live);
        const wasLive = sessionStorage.getItem('flashSaleWasLive') === 'true';

        if (wasLive && !isLive) {
          this.toast.error('Săn sale đã kết thúc. Giá sản phẩm đã quay lại bình thường.');
        }

        sessionStorage.setItem('flashSaleWasLive', String(isLive));
        this.previousFlashSaleLive = isLive;
        this.flashSale.set(sale);
      },
      error: () => this.flashSale.set(null),
    });
  }

  ngOnDestroy(): void {
    window.clearInterval(this.countdownTimer);
    if (this.flashSaleTimer) window.clearInterval(this.flashSaleTimer);
    window.removeEventListener('visibilitychange', this.handleVisibility);
    window.removeEventListener('focus', this.handleVisibility);
  }
}
