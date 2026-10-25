import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, map, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { ProductItem, ProductsService } from '../../products.service';
import { CartService } from '../../cart.service';
import { ReviewsService, ProductReviewItem } from '../../reviews-service';
import { AuthService } from '../../auth.service';

type DetailTab = 'description' | 'information' | 'reviews';

@Component({
  selector: 'app-product-detail-component',
  standalone: false,
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);
  private readonly cartService = inject(CartService);
  private readonly reviewsService = inject(ReviewsService);
  private readonly http = inject(HttpClient);
  readonly auth = inject(AuthService);

  readonly allProducts = this.productsService.products;
  readonly shareMessage = signal('');

  // The route is /san-pham/:slug. The product is fetched from the backend by
  // slug because the shared catalog signal only holds the first page of
  // products (the backend paginates /api/products). The MongoDB review API
  // still uses the numeric Product.id stored in each review's productId.
  readonly productSlug = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('slug') ?? '')),
    { initialValue: '' },
  );

  readonly product = signal<ProductItem | null>(null);
  readonly productLoading = signal(false);
  readonly productError = signal<string | null>(null);

  readonly productImages = computed<string[]>(() => {
    const images = this.product()?.images;
    return Array.isArray(images)
      ? images.filter(
          (image): image is string => typeof image === 'string' && image.trim().length > 0,
        )
      : [];
  });

  readonly selectedImageIndex = signal(0);
  readonly imageBroken = signal(false);
  readonly selectedImage = computed(() => this.productImages()[this.selectedImageIndex()] ?? '');
  readonly quantity = signal(1);
  readonly activeTab = signal<DetailTab>('description');
  readonly cartMessage = this.cartService.notification;

  readonly relatedProducts = computed<ProductItem[]>(() => {
    const current = this.product();
    if (!current) return [];

    const products = (this.allProducts() ?? []).filter((item) => item.id !== current.id);

    return products
      .map((product: ProductItem) => {
        let score = 0;
        if (product.cat === current.cat) score += 4;
        if (product.type === current.type) score += 3;
        if (product.region === current.region) score += 2;
        if (product.province === current.province) score += 1;
        if (product.village && product.village === current.village) score += 3;
        if (
          (product.occasion ?? []).some((occasion) => (current.occasion ?? []).includes(occasion))
        )
          score += 2;
        return { product, score };
      })
      .sort(
        (a, b) =>
          b.score - a.score ||
          b.product.rate - a.product.rate ||
          b.product.reviews - a.product.reviews,
      )
      .slice(0, 4)
      .map((item) => item.product);
  });

  // Rating của các sản phẩm liên quan cũng lấy từ collection reviews.
  readonly relatedReviewStats = signal<Record<number, { average: number; count: number }>>({});
  private readonly loadedRelatedReviewIds = new Set<number>();
  private readonly inFlightRelatedReviewIds = new Set<number>();

  private loadRelatedReviewStats(products: ProductItem[]): void {
    const pending = products.filter(
      (product) =>
        !this.loadedRelatedReviewIds.has(product.id) &&
        !this.inFlightRelatedReviewIds.has(product.id),
    );
    if (pending.length === 0) return;

    pending.forEach((product) => this.inFlightRelatedReviewIds.add(product.id));

    const requests = pending.map((product) =>
      this.reviewsService.getForProduct(product.id).pipe(
        map((rows: ProductReviewItem[]) => {
          const rated = rows.filter((row) => {
            const rating = Number(row.rating);
            return Number.isFinite(rating) && rating >= 1 && rating <= 5;
          });
          const total = rated.reduce((sum, row) => sum + Number(row.rating), 0);
          return {
            id: product.id,
            stats: {
              average: rated.length ? Math.round((total / rated.length) * 10) / 10 : 0,
              count: rows.length,
            },
          };
        }),
        catchError((error: unknown) => {
          console.error(`Không thể tải review cho sản phẩm liên quan ${product.id}:`, error);
          return of({ id: product.id, stats: { average: 0, count: 0 } });
        }),
      ),
    );

    forkJoin(requests).subscribe((results) => {
      this.relatedReviewStats.update((current) => {
        const next = { ...current };
        results.forEach((result) => {
          next[result.id] = result.stats;
        });
        return next;
      });
      results.forEach((result) => {
        this.loadedRelatedReviewIds.add(result.id);
        this.inFlightRelatedReviewIds.delete(result.id);
      });
    });
  }

  relatedRating(product: ProductItem): number {
    return this.relatedReviewStats()[product.id]?.average ?? 0;
  }

  relatedReviewCount(product: ProductItem): number {
    return this.relatedReviewStats()[product.id]?.count ?? 0;
  }

  // Aliases used by the supplied product-detail HTML.
  relatedReviewRatingOf(product: ProductItem): number {
    return this.relatedRating(product);
  }

  relatedReviewCountOf(product: ProductItem): number {
    return this.relatedReviewCount(product);
  }

  // Review data is loaded from MongoDB through the backend API.
  reviewName = '';
  reviewContent = '';
  reviewRating = 5;
  readonly reviews = signal<ProductReviewItem[]>([]);
  readonly reviewMessage = signal('');
  readonly reviewLoading = signal(false);
  readonly reviewSubmitting = signal(false);
  readonly canReview = signal(false);

  readonly reviewRatedCount = computed<number>(
    () =>
      this.reviews().filter((review) => {
        const rating = Number(review.rating);
        return Number.isFinite(rating) && rating >= 1 && rating <= 5;
      }).length,
  );

  readonly reviewAverage = computed<number>(() => {
    const rated = this.reviews().filter((review) => {
      const rating = Number(review.rating);
      return Number.isFinite(rating) && rating >= 1 && rating <= 5;
    });
    if (rated.length === 0) return 0;
    const total = rated.reduce((sum, review) => sum + Number(review.rating), 0);
    return Math.round((total / rated.length) * 10) / 10;
  });

  // Tổng số review gồm cả review chỉ có nội dung, không có số sao.
  readonly reviewCount = computed<number>(() => this.reviews().length);

  constructor() {
    effect(() => {
      this.loadProduct(this.productSlug());
    });

    effect(() => {
      const related = this.relatedProducts();
      if (related.length > 0) {
        untracked(() => this.loadRelatedReviewStats(related));
      }
    });
  }

  private resetDetailState(): void {
    this.reviews.set([]);
    this.reviewMessage.set('');
    this.productError.set(null);
    this.reviewLoading.set(false);
    this.reviewSubmitting.set(false);
    this.reviewName = '';
    this.reviewContent = '';
    this.reviewRating = 5;
    this.selectedImageIndex.set(0);
    this.imageBroken.set(false);
    this.quantity.set(1);
    this.activeTab.set('description');
  }

  private loadProduct(slug: string): void {
    this.resetDetailState();

    if (!slug) {
      this.product.set(null);
      this.productLoading.set(false);
      return;
    }

    // Legacy numeric-id URLs (/san-pham/1): resolve from the cached catalog.
    const maybeId = Number(slug);
    if (Number.isSafeInteger(maybeId) && maybeId > 0) {
      const byId = untracked(
        () => (this.allProducts() ?? []).find((item) => Number(item.id) === maybeId) ?? null,
      );
      this.product.set(byId);
      this.productLoading.set(false);
      const id = Number(byId?.id);
      if (byId && Number.isSafeInteger(id) && id > 0) {
        this.loadReviews(id);
        this.checkCanReview(id);
      }
      return;
    }

    // Slug-based URL: fetch the single product from the backend by slug.
    this.product.set(null);
    this.productLoading.set(true);
    this.productsService.getProductBySlug(slug).subscribe({
      next: (product) => {
        this.product.set(product);
        this.productLoading.set(false);
        const id = Number(product?.id);
        if (product && Number.isSafeInteger(id) && id > 0) {
          this.loadReviews(id);
          this.checkCanReview(id);
        }
      },
      error: (error: unknown) => {
        this.productLoading.set(false);
        this.product.set(null);
        // A 404 just means "no such product" -> the not-found view handles it.
        if ((error as { status?: number })?.status !== 404) {
          this.productError.set('Không thể tải thông tin sản phẩm. Vui lòng thử lại.');
        }
      },
    });
  }

  private loadReviews(productId: number): void {
    this.reviewLoading.set(true);
    this.reviewsService.getForProduct(productId).subscribe({
      next: (rows: ProductReviewItem[]) => {
        this.reviews.set(rows);
        this.reviewLoading.set(false);
        this.reviewMessage.set('');
      },
      error: (error: unknown) => {
        console.error('Không thể tải review từ MongoDB:', error);
        this.reviews.set([]);
        this.reviewLoading.set(false);
        this.reviewMessage.set('Không thể tải đánh giá. Vui lòng kiểm tra kết nối máy chủ.');
      },
    });
  }

  private checkCanReview(productId: number): void {
    this.http.get<{ delivered: boolean }>('/api/orders/can-review/' + productId).subscribe({
      next: (res: any) => {
        this.canReview.set(!!res?.delivered);
      },
      error: () => {
        this.canReview.set(false);
      },
    });
  }

  stars(rate: number): string {
    const count = Math.max(0, Math.min(5, Math.round(Number(rate) || 0)));
    return '★'.repeat(count) + '☆'.repeat(5 - count);
  }

  fmt(price: number): string {
    return (Number(price) || 0).toLocaleString('vi-VN') + 'đ';
  }

  selectImage(index: number): void {
    const max = this.productImages().length - 1;
    if (max < 0) return;
    this.selectedImageIndex.set(Math.min(max, Math.max(0, index)));
    this.imageBroken.set(false);
  }

  previousImage(): void {
    const count = this.productImages().length;
    if (count > 1) this.selectImage((this.selectedImageIndex() - 1 + count) % count);
  }

  nextImage(): void {
    const count = this.productImages().length;
    if (count > 1) this.selectImage((this.selectedImageIndex() + 1) % count);
  }

  onImageError(): void {
    this.imageBroken.set(true);
  }

  decreaseQuantity(): void {
    this.quantity.update((value) => Math.max(1, value - 1));
  }

  increaseQuantity(): void {
    this.quantity.update((value) => Math.min(99, value + 1));
  }

  addToCart(): void {
    const product = this.product();
    if (!product || (!product.inStock && !product.preorder)) return;
    for (let i = 0; i < this.quantity(); i++) {
      this.cartService.add(product.id, product.name);
    }
  }

  /** Adds the selected quantity and opens the cart page. */
  buyNow(): void {
    const product = this.product();
    if (!product || (!product.inStock && !product.preorder)) return;
    for (let i = 0; i < this.quantity(); i++) {
      this.cartService.add(product.id, product.name);
    }
    void this.router.navigate(['/giohang']);
  }

  shareFacebook(): void {
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      '_blank',
      'noopener,noreferrer,width=700,height=550',
    );
  }

  shareZalo(): void {
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://zalo.me/share?url=${url}`,
      '_blank',
      'noopener,noreferrer,width=700,height=600',
    );
  }

  copyProductLink(): void {
    const url = window.location.href;
    if (!navigator.clipboard?.writeText) {
      this.shareMessage.set('Hãy sao chép liên kết trên thanh địa chỉ trình duyệt.');
      return;
    }
    navigator.clipboard
      .writeText(url)
      .then(() => {
        this.shareMessage.set('Đã sao chép liên kết sản phẩm.');
      })
      .catch(() => {
        this.shareMessage.set('Không thể sao chép tự động. Hãy sao chép URL trên thanh địa chỉ.');
      });
  }

  goBack(): void {
    this.router.navigate(['/san-pham']);
  }

  // Match the current route /san-pham/:slug and the related-products HTML.
  openProduct(item: ProductItem): void {
    const slug = item?.slug;
    if (!slug) return;
    this.router.navigate(['/san-pham', slug]).then((navigated) => {
      if (navigated) window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  showReviews(): void {
    this.setTab('reviews');
    setTimeout(() => {
      document
        .getElementById('product-details-tabs')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  setTab(tab: DetailTab): void {
    this.activeTab.set(tab);
  }

  submitReview(): void {
    const product = this.product();
    const userName = this.reviewName.trim();
    const content = this.reviewContent.trim();
    const rating = Number(this.reviewRating);

    if (!product) {
      this.reviewMessage.set('Không tìm thấy sản phẩm.');
      return;
    }
    if (!userName || !content) {
      this.reviewMessage.set('Vui lòng nhập tên và nội dung đánh giá.');
      return;
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      this.reviewMessage.set('Số sao phải từ 1 đến 5.');
      return;
    }
    if (userName.length > 80 || content.length > 1500) {
      this.reviewMessage.set('Tên tối đa 80 ký tự, nội dung tối đa 1500 ký tự.');
      return;
    }

    this.reviewSubmitting.set(true);
    this.reviewMessage.set('Đang gửi đánh giá...');

    this.reviewsService.createForProduct(product.id, { userName, rating, content }).subscribe({
      next: (savedReview: ProductReviewItem) => {
        this.reviews.update((current) => [savedReview, ...current]);
        this.reviewName = '';
        this.reviewContent = '';
        this.reviewRating = 5;
        this.reviewSubmitting.set(false);
        this.reviewMessage.set('Đánh giá đã được lưu thành công.');
      },
      error: (error: unknown) => {
        console.error('Không thể lưu review:', error);
        this.reviewSubmitting.set(false);
        let message = 'Không thể gửi đánh giá. Vui lòng thử lại.';
        if (typeof error === 'object' && error !== null && 'error' in error) {
          const response = (error as { error?: { message?: unknown } }).error;
          if (typeof response?.message === 'string') message = response.message;
        }
        this.reviewMessage.set(message);
      },
    });
  }
}
