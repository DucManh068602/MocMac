import {
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
  ElementRef,
  ViewChild,
  ViewChildren,
  QueryList,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, map, of } from 'rxjs';
import { CartService } from '../../cart.service';
import { ReviewsService, ProductReviewItem } from '../../reviews-service';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ArrayKey,
  Filters,
  PRED,
  ProductItem,
  ProductsService,
  defaultFilters,
  fromParams,
  matchFilters,
  norm,
  toParams,
} from '../../products.service';

interface Opt {
  v: string;
  l: string;
  n: number;
  icon?: string;
}
interface ReviewStats {
  average: number;
  count: number;
  ratedCount: number;
}
const PAGE_SIZE = 12;
const ARR: ArrayKey[] = [
  'cat',
  'type',
  'region',
  'price',
  'ocop',
  'heri',
  'occ',
  'status',
  'months',
];

@Component({
  selector: 'app-products-component',
  standalone: false,
  templateUrl: './products-component.html',
  styleUrl: './products-component.css',
})
export class ProductsComponent implements OnDestroy, AfterViewInit {
  private svc = inject(ProductsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  cart = inject(CartService);
  private readonly reviewsService = inject(ReviewsService);

  all = this.svc.products;

  /** Số sao và số lượt nhận xét được tính từ collection reviews, theo đúng productId. */
  readonly reviewStats = signal<Record<number, ReviewStats>>({});
  private readonly loadedReviewProducts = new Set<number>();
  private readonly reviewRequestsInFlight = new Set<number>();

  /** Không dùng rating/reviews cứng trong product JSON khi hiển thị. */
  readonly displayProducts = computed<ProductItem[]>(() =>
    this.all().map((product: ProductItem) => {
      const stats = this.reviewStats()[product.id];
      return {
        ...product,
        rate: stats?.average ?? 0,
        reviews: stats?.count ?? 0,
      };
    }),
  );
  applied = toSignal(this.route.queryParamMap.pipe(map(fromParams)), {
    initialValue: defaultFilters(),
  });
  draft = signal<Filters>(defaultFilters());
  /** Lưu danh sách ID yêu thích tại trình duyệt để không mất khi tải lại trang. */
  favs = signal<Set<number>>(this.readFavoriteIds());
  /** Khi bật, danh sách chính chỉ hiển thị các sản phẩm đã được thả tim. */
  showFavorites = signal(false);
  favoriteCount = computed(
    () => this.all().filter((product: ProductItem) => this.favs().has(product.id)).length,
  );
  showFilters = signal(false);
  brokenImg = signal<Set<string>>(new Set());
  private imgIdx = signal<Record<number, number>>({});

  private relatedCarouselElement?: HTMLDivElement;
  private relatedTimer?: ReturnType<typeof setInterval>;
  private relatedPaused = false;

  @ViewChildren('discoveryCarousel')
  private discoveryCarousels!: QueryList<ElementRef<HTMLDivElement>>;
  private discoveryTimer?: ReturnType<typeof setInterval>;
  private discoveryPaused = false;

  ngAfterViewInit(): void {
    this.discoveryTimer = setInterval(() => this.advanceDiscoveryCarousels(), 3200);
  }

  // Khu vực sản phẩm liên quan được tạo khi người dùng chọn bộ lọc.
  // ViewChild setter giúp tự khởi động carousel khi phần này xuất hiện.
  @ViewChild('relatedCarousel')
  set relatedCarousel(ref: ElementRef<HTMLDivElement> | undefined) {
    this.relatedCarouselElement = ref?.nativeElement;

    if (this.relatedTimer) {
      clearInterval(this.relatedTimer);
      this.relatedTimer = undefined;
    }

    if (this.relatedCarouselElement) {
      this.relatedTimer = setInterval(() => this.advanceRelatedCarousel(), 3200);
    }
  }

  ngOnDestroy(): void {
    if (this.relatedTimer) clearInterval(this.relatedTimer);
    if (this.discoveryTimer) clearInterval(this.discoveryTimer);
  }

  pauseDiscoveryCarousel(): void {
    this.discoveryPaused = true;
  }

  resumeDiscoveryCarousel(): void {
    this.discoveryPaused = false;
  }

  private advanceDiscoveryCarousels(): void {
    if (this.discoveryPaused || !this.discoveryCarousels) return;

    this.discoveryCarousels.forEach((ref) => {
      const element = ref.nativeElement;
      const track = element.querySelector<HTMLElement>('.discovery-track');
      const card = track?.querySelector<HTMLElement>('.discovery-card');
      const maxScroll = element.scrollWidth - element.clientWidth;
      if (!card || maxScroll <= 4) return;

      const step = card.getBoundingClientRect().width + 12;
      if (element.scrollLeft >= maxScroll - 4) {
        element.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        element.scrollTo({
          left: Math.min(element.scrollLeft + step, maxScroll),
          behavior: 'smooth',
        });
      }
    });
  }

  pauseRelatedCarousel(): void {
    this.relatedPaused = true;
  }

  resumeRelatedCarousel(): void {
    this.relatedPaused = false;
  }

  scrollRelated(direction: -1 | 1): void {
    const element = this.relatedCarouselElement;
    const step = this.relatedStep();
    if (!element || step <= 0) return;

    const maxScroll = Math.max(0, element.scrollWidth - element.clientWidth);
    if (maxScroll <= 4) return;

    if (direction > 0 && element.scrollLeft + step > maxScroll + 4) {
      element.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (direction < 0 && element.scrollLeft - step < -4) {
      element.scrollTo({ left: maxScroll, behavior: 'smooth' });
    } else {
      element.scrollBy({ left: direction * step, behavior: 'smooth' });
    }
  }

  private relatedStep(): number {
    const element = this.relatedCarouselElement;
    const card = element?.querySelector<HTMLElement>('.related-card');
    return card ? card.getBoundingClientRect().width + 14 : 0;
  }

  private advanceRelatedCarousel(): void {
    const element = this.relatedCarouselElement;
    if (!element || this.relatedPaused) return;

    const step = this.relatedStep();
    const maxScroll = element.scrollWidth - element.clientWidth;
    if (step <= 0 || maxScroll <= 4) return;

    if (element.scrollLeft + step > maxScroll + 4) {
      element.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      element.scrollBy({ left: step, behavior: 'smooth' });
    }
  }
  readonly tabs = ['Tất cả', 'Đặc sản', 'Thủ công mỹ nghệ', 'Cà phê - Trà', 'Sản phẩm OCOP'];
  readonly month = new Date().getMonth() + 1;

  readonly quickTags = [
    'Quà Tết',
    'Đặc sản vùng miền',
    'Đồ thủ công',
    'Quà biếu đối tác',
    'Quà cưới',
    'OCOP',
  ];

  topProducts = computed(() =>
    [...this.displayProducts()]
      .sort(
        (a: ProductItem, b: ProductItem) =>
          b.reviews * 2 + b.rate * 10 - (a.reviews * 2 + a.rate * 10),
      )
      .slice(0, 3),
  );

  featuredProducts = computed(() =>
    [...this.displayProducts()]
      .sort((a: ProductItem, b: ProductItem) => b.rate - a.rate || b.reviews - a.reviews)
      .slice(0, 3),
  );

  bestSellers = computed(() =>
    [...this.displayProducts()]
      .sort((a: ProductItem, b: ProductItem) => b.reviews - a.reviews || b.rate - a.rate)
      .slice(0, 4),
  );

  bestPrices = computed(() =>
    [...this.displayProducts()]
      .sort((a: ProductItem, b: ProductItem) => a.price - b.price)
      .slice(0, 4),
  );

  quickSearch(tag: string) {
    const current = this.applied();
    const f = {
      ...defaultFilters(),
      sort: current.sort,
      view: current.view,
      page: 1,
    } as Filters;

    switch (tag) {
      case 'Quà Tết':
        f.occ = ['Quà Tết'];
        break;
      case 'Đặc sản vùng miền':
        f.cat = ['Đặc sản'];
        break;
      case 'Đồ thủ công':
        f.cat = ['Thủ công mỹ nghệ'];
        break;
      case 'Quà biếu đối tác':
        f.occ = ['Quà biếu đối tác'];
        break;
      case 'Quà cưới':
        f.occ = ['Quà cưới'];
        break;
      case 'OCOP':
        f.cat = ['Sản phẩm OCOP'];
        break;
      default:
        f.q = tag;
    }

    this.draft.set({ ...f });
    this.go(f);
  }

  go(filters: Filters) {
    const params = toParams(filters);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: '',
    });
  }

  constructor() {
    effect(() => {
      const a = this.applied();
      untracked(() => this.draft.set({ ...a }));
    });

    // Tự tải review khi danh sách sản phẩm từ ProductsService sẵn sàng.
    effect(() => {
      const products = this.all();
      if (products.length > 0) {
        untracked(() => this.loadReviewStats(products));
      }
    });
  }

  private loadReviewStats(products: ProductItem[]): void {
    const pending = products.filter(
      (product) =>
        !this.loadedReviewProducts.has(product.id) && !this.reviewRequestsInFlight.has(product.id),
    );

    if (pending.length === 0) return;

    pending.forEach((product) => this.reviewRequestsInFlight.add(product.id));

    const requests = pending.map((product) =>
      this.reviewsService.getForProduct(product.id).pipe(
        map((reviews: ProductReviewItem[]) => {
          const rated = reviews.filter((review) => {
            const rating = Number(review.rating);
            return Number.isFinite(rating) && rating >= 1 && rating <= 5;
          });
          const total = rated.reduce((sum, review) => sum + Number(review.rating), 0);
          return {
            id: product.id,
            stats: {
              average: rated.length ? Math.round((total / rated.length) * 10) / 10 : 0,
              count: reviews.length,
              ratedCount: rated.length,
            } satisfies ReviewStats,
          };
        }),
        catchError((error: unknown) => {
          console.error(`Không thể tải review cho sản phẩm ${product.id}:`, error);
          return of({
            id: product.id,
            stats: { average: 0, count: 0, ratedCount: 0 } satisfies ReviewStats,
          });
        }),
      ),
    );

    forkJoin(requests).subscribe((results) => {
      this.reviewStats.update((current) => {
        const next = { ...current };
        results.forEach((result) => {
          next[result.id] = result.stats;
        });
        return next;
      });

      results.forEach((result) => {
        this.loadedReviewProducts.add(result.id);
        this.reviewRequestsInFlight.delete(result.id);
      });
    });
  }

  ratingOf(product: ProductItem): number {
    return this.reviewStats()[product.id]?.average ?? 0;
  }

  reviewCountOf(product: ProductItem): number {
    return this.reviewStats()[product.id]?.count ?? 0;
  }

  private count(k: ArrayKey, v: string) {
    return this.all().filter((p: ProductItem) => PRED[k](p, v)).length;
  }
  private opts(k: ArrayKey, list: [string, string, string?][]): Opt[] {
    return list.map(([v, l, icon]) => ({ v, l, icon, n: this.count(k, v) }));
  }

  catOpts = computed(() =>
    this.opts('cat', [
      ['Đặc sản', 'Đặc sản', '🥭'],
      ['Thủ công mỹ nghệ', 'Thủ công mỹ nghệ', '🧺'],
      ['Cà phê - Trà', 'Cà phê - Trà', '☕'],
      ['Sản phẩm OCOP', 'Sản phẩm OCOP', '⭐'],
    ]),
  );
  typeOpts = computed(() =>
    this.opts(
      'type',
      ['Gốm', 'Mây tre đan', 'Sơn mài', 'Thổ cẩm', 'Đặc sản khô', 'Trà', 'Cà phê', 'Khác'].map(
        (x) => [x, x] as [string, string],
      ),
    ),
  );
  regionOpts = computed(() =>
    this.opts(
      'region',
      ['Miền Bắc', 'Miền Trung', 'Tây Nguyên', 'Miền Nam'].map((x) => [x, x] as [string, string]),
    ),
  );
  priceOpts = computed(() =>
    this.opts('price', [
      ['lt200', 'Dưới 200.000đ'],
      ['200-500', '200.000đ - 500.000đ'],
      ['500-1000', '500.000đ - 1.000.000đ'],
      ['gt1000', 'Trên 1.000.000đ'],
    ]),
  );
  ocopOpts = computed(() =>
    this.opts('ocop', [
      ['3', 'OCOP 3 sao'],
      ['4', 'OCOP 4 sao'],
      ['5', 'OCOP 5 sao'],
    ]),
  );
  heriOpts = computed(() =>
    this.opts('heri', [
      ['Vàng', 'Di sản Vàng'],
      ['Bạc', 'Di sản Bạc'],
    ]),
  );
  occOpts = computed(() =>
    this.opts(
      'occ',
      ['Quà Tết', 'Quà cưới', 'Quà tân gia', 'Quà biếu đối tác'].map(
        (x) => [x, x] as [string, string],
      ),
    ),
  );
  statusOpts = computed(() =>
    this.opts('status', [
      ['in', 'Còn hàng'],
      ['pre', 'Pre-order'],
    ]),
  );
  monthOpts = computed(() =>
    this.opts('months', [
      ['1-3', 'Tháng 1-3'],
      ['4-6', 'Tháng 4-6'],
      ['7-9', 'Tháng 7-9'],
      ['10-12', 'Tháng 10-12'],
    ]),
  );

  provinces = computed(() =>
    [...new Set(this.all().map((p) => p.province || ''))].sort((a: string, b: string) =>
      a.localeCompare(b, 'vi'),
    ),
  );
  villages = computed(() =>
    [
      ...new Set(
        this.all()
          .map((p) => p.village || '')
          .filter(Boolean),
      ),
    ].sort((a: string, b: string) => a.localeCompare(b, 'vi')),
  );

  filtered = computed(() => {
    const f = this.applied(),
      m = this.month;
    const favoritesOnly = this.showFavorites();
    const favoriteIds = this.favs();
    const list = this.displayProducts().filter(
      (p: ProductItem) => (!favoritesOnly || favoriteIds.has(p.id)) && matchFilters(p, f, m),
    );
    const sorters: Record<string, (a: ProductItem, b: ProductItem) => number> = {
      popular: (a, b) => b.reviews - a.reviews,
      'price-asc': (a, b) => a.price - b.price,
      'price-desc': (a, b) => b.price - a.price,
      rating: (a, b) => b.rate - a.rate,
      newest: (a, b) => b.id - a.id,
    };
    return list.sort(sorters[f.sort] ?? sorters['popular']);
  });

  relatedProducts = computed<ProductItem[]>(() => {
    if (this.showFavorites()) return [];
    const f = this.applied();
    const primary = this.filtered();
    const all = this.displayProducts();
    const hasCriteria = Boolean(
      f.q ||
      f.cat.length ||
      f.type.length ||
      f.region.length ||
      f.province ||
      f.village ||
      f.price.length ||
      f.ocop.length ||
      f.heri.length ||
      f.occ.length ||
      f.status.length ||
      f.months.length ||
      f.now ||
      f.rate ||
      f.tab !== 'Tất cả',
    );

    if (!hasCriteria || all.length === 0) return [];

    const primaryIds = new Set(primary.map((p) => p.id));
    const anchor = primary[0];
    const queryTerms = norm(f.q)
      .split(/\s+/)
      .filter((term) => term.length > 1);

    const scoreProduct = (p: ProductItem): number => {
      let score = 0;
      const hasAny = (key: ArrayKey) => f[key].some((v) => PRED[key](p, v));

      if (f.tab !== 'Tất cả' && PRED.cat(p, f.tab)) score += 5;
      if (hasAny('cat')) score += 5;
      if (hasAny('type')) score += 4;
      if (hasAny('region')) score += 3;
      if (f.province && p.province === f.province) score += 3;
      if (f.village && p.village === f.village) score += 4;
      if (hasAny('ocop')) score += 3;
      if (hasAny('heri')) score += 2;
      if (hasAny('occ')) score += 3;
      if (hasAny('price')) score += 1;
      if (hasAny('status')) score += 1;
      if (hasAny('months')) score += 1;
      if (f.now && p.seasons.includes(this.month)) score += 1;
      if (f.rate && p.rate >= f.rate) score += 1;

      const text = norm(
        [
          p.name,
          p.cat,
          p.type,
          p.region,
          p.province,
          p.village,
          ...(p.occasion ?? []),
          ...(p.badges ?? []),
          p.heritage ?? '',
        ].join(' '),
      );
      score += queryTerms.filter((term) => text.includes(term)).length * 2;

      if (anchor) {
        if (p.cat === anchor.cat) score += 3;
        if (p.type === anchor.type) score += 3;
        if (p.village && p.village === anchor.village) score += 4;
        if (p.region === anchor.region) score += 2;
        if (p.province === anchor.province) score += 1;
        if (
          p.occasion &&
          anchor.occasion &&
          p.occasion.some((o: string) => anchor.occasion.includes(o))
        )
          score += 2;
      }

      return score;
    };

    return all
      .filter((p: ProductItem) => !primaryIds.has(p.id))
      .map((p: ProductItem) => ({ product: p, score: scoreProduct(p) }))
      .filter((item: { product: ProductItem; score: number }) => item.score >= 2)
      .sort((a, b) => b.score - a.score || b.product.reviews - a.product.reviews)
      .map((item: { product: ProductItem; score: number }) => item.product);
  });

  stars(n: number): string {
    const value = Math.max(0, Math.min(5, Number(n) || 0));
    const full = Math.round(value);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }
  fmt(n: number): string {
    return n.toLocaleString('vi-VN') + 'đ';
  }

  imgs(p: ProductItem): string[] {
    return (p.images ?? []).filter((u: string) => u && !this.brokenImg().has(u));
  }
  idxOf(p: ProductItem): number {
    const n = this.imgs(p).length;
    return n ? (this.imgIdx()[p.id] ?? 0) % n : 0;
  }
  cur(p: ProductItem): string {
    return this.imgs(p)[this.idxOf(p)] || '';
  }
  setImg(p: ProductItem, i: number, e: Event): void {
    e.stopPropagation();
    this.imgIdx.update((m) => ({ ...m, [p.id]: i }));
  }
  step(p: ProductItem, d: number, e: Event): void {
    e.stopPropagation();
    const arr = this.imgs(p);
    if (!arr.length) return;
    const idx = (this.idxOf(p) + d + arr.length) % arr.length;
    this.imgIdx.update((m) => ({ ...m, [p.id]: idx }));
  }
  imgError(src: string): void {
    if (!src) return;
    this.brokenImg.update((s) => {
      const ns = new Set(s);
      ns.add(src);
      return ns;
    });
  }

  has(k: ArrayKey, v: string): boolean {
    return (this.draft()[k] as string[]).includes(v);
  }
  toggle(k: ArrayKey, v: string): void {
    const cur = this.draft()[k] as string[];
    this.draft.update((d) => ({
      ...d,
      [k]: cur.includes(v) ? cur.filter((x: string) => x !== v) : [...cur, v],
    }));
  }
  setField<K extends keyof Filters>(k: K, v: Filters[K]): void {
    this.draft.update((d) => ({ ...d, [k]: v }));
  }
  toggleNow(): void {
    this.draft.update((d) => ({ ...d, now: !d.now }));
  }

  apply(): void {
    this.go({
      ...this.draft(),
      tab: this.applied().tab,
      sort: this.applied().sort,
      view: this.applied().view,
      page: 1,
    });
    this.showFilters.set(false);
  }
  clear(): void {
    const a = this.applied();
    this.go({ ...defaultFilters(), view: a.view, sort: a.sort });
  }
  search(): void {
    this.go(this.draft());
  }

  setTab(t: string): void {
    this.draft.update((d) => ({ ...d, tab: t, page: 1 }));
    this.go(this.draft());
  }
  setSort(s: string): void {
    this.draft.update((d) => ({ ...d, sort: s, page: 1 }));
    this.go(this.draft());
  }

  showMore(sort: string): void {
    this.setSort(sort);
    setTimeout(() => {
      document
        .querySelector('.content .bar')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
  setView(v: 'grid' | 'list'): void {
    this.draft.update((d) => ({ ...d, view: v, page: 1 }));
    this.go(this.draft());
  }
  setPage(p: number): void {
    this.draft.update((d) => ({ ...d, page: Math.max(1, p) }));
    this.go(this.draft());
  }
  private readFavoriteIds(): Set<number> {
    try {
      if (typeof localStorage === 'undefined') return new Set<number>();
      const raw = localStorage.getItem('mocmac-favorite-product-ids');
      if (!raw) return new Set<number>();
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return new Set<number>();
      return new Set<number>(
        parsed
          .map((value: unknown) => Number(value))
          .filter((id: number) => Number.isSafeInteger(id) && id > 0),
      );
    } catch {
      return new Set<number>();
    }
  }

  private saveFavoriteIds(ids: Set<number>): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('mocmac-favorite-product-ids', JSON.stringify([...ids]));
      }
    } catch (error) {
      console.warn('Không thể lưu danh sách sản phẩm yêu thích:', error);
    }
  }

  toggleFavoritesFilter(): void {
    this.showFavorites.update((active) => !active);
    // Trở về trang 1 để tránh trạng thái trang cũ khiến danh sách yêu thích trống.
    this.go({ ...this.applied(), page: 1 });
  }

  toggleFav(id: number, e?: Event): void {
    e?.stopPropagation();
    const next = new Set(this.favs());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.favs.set(next);
    this.saveFavoriteIds(next);
  }

  viewDetail(slug: string): void {
    const s = (slug ?? '').toString().trim();
    if (!s) return;
    this.router.navigate(['/san-pham', s]).then((navigated) => {
      if (navigated) window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  addToCart(e: Event, productId: number, productName: string): void {
    e.stopPropagation();
    this.cart.add(productId, productName);
  }

  get page() {
    return computed(() => this.applied().page);
  }
  get totalPages() {
    return computed(() => Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)));
  }
  get pages() {
    return computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  }
  paged = computed(() => {
    const start = (this.applied().page - 1) * PAGE_SIZE;
    return this.filtered().slice(start, start + PAGE_SIZE);
  });
  get activeCount() {
    const f = this.applied();
    return (
      ARR.reduce((n, k) => n + (f[k] as string[]).length, 0) +
      (f.province ? 1 : 0) +
      (f.village ? 1 : 0) +
      (f.now ? 1 : 0) +
      (f.rate ? 1 : 0) +
      (f.q ? 1 : 0) +
      (this.showFavorites() ? 1 : 0)
    );
  }
}
