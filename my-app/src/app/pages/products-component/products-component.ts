import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { CartService } from '../../cart.service';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ArrayKey, Filters, PRED, ProductItem, ProductsService, defaultFilters, fromParams, matchFilters, norm, toParams,
} from '../../products.service';

interface Opt { v: string; l: string; n: number; icon?: string; }
const PAGE_SIZE = 12;
const ARR: ArrayKey[] = ['cat', 'type', 'region', 'price', 'ocop', 'heri', 'occ', 'status', 'months'];

@Component({
  selector: 'app-products-component',
  standalone: false,
  templateUrl: './products-component.html',
  styleUrl: './products-component.css',
})
export class ProductsComponent {
  private svc = inject(ProductsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  cart = inject(CartService);

  all = this.svc.products;
  applied = toSignal(this.route.queryParamMap.pipe(map(fromParams)), { initialValue: defaultFilters() });
  draft = signal<Filters>(defaultFilters());
  favs = signal<Set<number>>(new Set());
  showFilters = signal(false);
  brokenImg = signal<Set<string>>(new Set());
  private imgIdx = signal<Record<number, number>>({});
  readonly tabs = ['Tất cả', 'Đặc sản', 'Thủ công mỹ nghệ', 'Cà phê - Trà', 'Sản phẩm OCOP'];
  readonly month = new Date().getMonth() + 1;

  readonly quickTags = [
    'Quà Tết',
    'Đặc sản vùng miền',
    'Đồ thủ công',
    'Quà biếu đối tác',
    'Quà cưới',
    'OCOP'
  ];

  topProducts = computed(() =>
    [...this.all()]
      .sort((a: ProductItem, b: ProductItem) => (b.reviews * 2 + b.rate * 10) - (a.reviews * 2 + a.rate * 10))
      .slice(0, 3)
  );

  featuredProducts = computed(() =>
    [...this.all()]
      .sort((a: ProductItem, b: ProductItem) => b.rate - a.rate || b.reviews - a.reviews)
      .slice(0, 3)
  );

  bestSellers = computed(() =>
    [...this.all()].sort((a: ProductItem, b: ProductItem) => b.reviews - a.reviews).slice(0, 4)
  );

  bestPrices = computed(() =>
    [...this.all()].sort((a: ProductItem, b: ProductItem) => a.price - b.price).slice(0, 4)
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
      queryParamsHandling: 'merge'
    });
  }

  constructor() {
    effect(() => { const a = this.applied(); untracked(() => this.draft.set({ ...a })); });
  }

  private count(k: ArrayKey, v: string) { return this.all().filter((p: ProductItem) => PRED[k](p, v)).length; }
  private opts(k: ArrayKey, list: [string, string, string?][]): Opt[] {
    return list.map(([v, l, icon]) => ({ v, l, icon, n: this.count(k, v) }));
  }

  catOpts = computed(() => this.opts('cat', [['Đặc sản', 'Đặc sản', '🥭'], ['Thủ công mỹ nghệ', 'Thủ công mỹ nghệ', '🧺'], ['Cà phê - Trà', 'Cà phê - Trà', '☕'], ['Sản phẩm OCOP', 'Sản phẩm OCOP', '⭐']]));
  typeOpts = computed(() => this.opts('type', ['Gốm', 'Mây tre đan', 'Sơn mài', 'Thổ cẩm', 'Đặc sản khô', 'Trà', 'Cà phê', 'Khác'].map(x => [x, x] as [string, string])));
  regionOpts = computed(() => this.opts('region', ['Miền Bắc', 'Miền Trung', 'Tây Nguyên', 'Miền Nam'].map(x => [x, x] as [string, string])));
  priceOpts = computed(() => this.opts('price', [['lt200', 'Dưới 200.000đ'], ['200-500', '200.000đ - 500.000đ'], ['500-1000', '500.000đ - 1.000.000đ'], ['gt1000', 'Trên 1.000.000đ']]));
  ocopOpts = computed(() => this.opts('ocop', [['3', 'OCOP 3 sao'], ['4', 'OCOP 4 sao'], ['5', 'OCOP 5 sao']]));
  heriOpts = computed(() => this.opts('heri', [['Vàng', 'Di sản Vàng'], ['Bạc', 'Di sản Bạc']]));
  occOpts = computed(() => this.opts('occ', ['Quà Tết', 'Quà cưới', 'Quà tân gia', 'Quà biếu đối tác'].map(x => [x, x] as [string, string])));
  statusOpts = computed(() => this.opts('status', [['in', 'Còn hàng'], ['pre', 'Pre-order']]));
  monthOpts = computed(() => this.opts('months', [['1-3', 'Tháng 1-3'], ['4-6', 'Tháng 4-6'], ['7-9', 'Tháng 7-9'], ['10-12', 'Tháng 10-12']]));

  provinces = computed(() => [...new Set(this.all().map(p => p.province || ''))].sort((a: string, b: string) => a.localeCompare(b, 'vi')));
  villages = computed(() => [...new Set(this.all().map(p => p.village || '').filter(Boolean))].sort((a: string, b: string) => a.localeCompare(b, 'vi')));

  filtered = computed(() => {
    const f = this.applied(), m = this.month;
    const list = this.all().filter((p: ProductItem) => matchFilters(p, f, m));
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
    const f = this.applied();
    const primary = this.filtered();
    const all = this.all();
    const hasCriteria = Boolean(
      f.q || f.cat.length || f.type.length || f.region.length || f.province ||
      f.village || f.price.length || f.ocop.length || f.heri.length || f.occ.length ||
      f.status.length || f.months.length || f.now || f.rate || f.tab !== 'Tất cả'
    );

    if (!hasCriteria || all.length === 0) return [];

    const primaryIds = new Set(primary.map(p => p.id));
    const anchor = primary[0];
    const queryTerms = norm(f.q).split(/\s+/).filter(term => term.length > 1);

    const scoreProduct = (p: ProductItem): number => {
      let score = 0;
      const hasAny = (key: ArrayKey) => f[key].some(v => PRED[key](p, v));

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

      const text = norm([
        p.name, p.cat, p.type, p.region, p.province, p.village,
        ...(p.occasion ?? []), ...(p.badges ?? []), p.heritage ?? ''
      ].join(' '));
      score += queryTerms.filter(term => text.includes(term)).length * 2;

      if (anchor) {
        if (p.cat === anchor.cat) score += 3;
        if (p.type === anchor.type) score += 3;
        if (p.village && p.village === anchor.village) score += 4;
        if (p.region === anchor.region) score += 2;
        if (p.province === anchor.province) score += 1;
        if (p.occasion && anchor.occasion && p.occasion.some((o: string) => anchor.occasion.includes(o))) score += 2;
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

  stars(n: number): string { const m = Math.round(n); return '★'.repeat(m) + '☆'.repeat(5 - m); }
  fmt(n: number): string { return n.toLocaleString('vi-VN') + 'đ'; }

  imgs(p: ProductItem): string[] { return (p.images ?? []).filter((u: string) => u && !this.brokenImg().has(u)); }
  idxOf(p: ProductItem): number { const n = this.imgs(p).length; return n ? (this.imgIdx()[p.id] ?? 0) % n : 0; }
  cur(p: ProductItem): string { return this.imgs(p)[this.idxOf(p)] || ''; }
  setImg(p: ProductItem, i: number, e: Event): void { e.stopPropagation(); this.imgIdx.update(m => ({ ...m, [p.id]: i })); }
  step(p: ProductItem, d: number, e: Event): void {
    e.stopPropagation();
    const arr = this.imgs(p);
    if (!arr.length) return;
    const idx = (this.idxOf(p) + d + arr.length) % arr.length;
    this.imgIdx.update(m => ({ ...m, [p.id]: idx }));
  }
  imgError(src: string): void { if (!src) return; this.brokenImg.update(s => { const ns = new Set(s); ns.add(src); return ns; }); }

  has(k: ArrayKey, v: string): boolean { return (this.draft()[k] as string[]).includes(v); }
  toggle(k: ArrayKey, v: string): void {
    const cur = this.draft()[k] as string[];
    this.draft.update(d => ({ ...d, [k]: cur.includes(v) ? cur.filter((x: string) => x !== v) : [...cur, v] }));
  }
  setField<K extends keyof Filters>(k: K, v: Filters[K]): void { this.draft.update(d => ({ ...d, [k]: v })); }
  toggleNow(): void { this.draft.update(d => ({ ...d, now: !d.now })); }

  apply(): void { this.go({ ...this.draft(), tab: this.applied().tab, sort: this.applied().sort, view: this.applied().view, page: 1 }); this.showFilters.set(false); }
  clear(): void { const a = this.applied(); this.go({ ...defaultFilters(), view: a.view, sort: a.sort }); }
  search(): void { this.go(this.draft()); }

  setTab(t: string): void { this.draft.update(d => ({ ...d, tab: t, page: 1 })); this.go(this.draft()); }
  setSort(s: string): void { this.draft.update(d => ({ ...d, sort: s, page: 1 })); this.go(this.draft()); }
  setView(v: 'grid' | 'list'): void { this.draft.update(d => ({ ...d, view: v, page: 1 })); this.go(this.draft()); }
  setPage(p: number): void { this.draft.update(d => ({ ...d, page: Math.max(1, p) })); this.go(this.draft()); }
  toggleFav(id: number): void { this.favs.update(s => { const t = new Set(s); t.has(id) ? t.delete(id) : t.add(id); return t; }); }
  addToCart(e: Event, productId: number, productName: string): void { e.stopPropagation(); this.cart.add(productId, productName); }

  get page() { return computed(() => this.applied().page); }
  get totalPages() { return computed(() => Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE))); }
  get pages() { return computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1)); }
  paged = computed(() => {
    const start = (this.applied().page - 1) * PAGE_SIZE;
    return this.filtered().slice(start, start + PAGE_SIZE);
  });
  get activeCount() {
    const f = this.applied();
    return ARR.reduce((n, k) => n + (f[k] as string[]).length, 0) + (f.province ? 1 : 0) + (f.village ? 1 : 0) + (f.now ? 1 : 0) + (f.rate ? 1 : 0) + (f.q ? 1 : 0);
  }
}
