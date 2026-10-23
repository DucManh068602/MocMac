import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { CartService } from '../../cart.service';
import { ProductItem, ProductsService } from '../../products.service';

@Component({
  selector: 'app-product-detail',
  standalone: false,
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(ProductsService);
  cart = inject(CartService);

  readonly all = this.svc.products;

  readonly slug = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('slug') ?? '')),
    { initialValue: '' }
  );

  readonly product = computed(() => {
    const targetSlug = this.slug();
    if (!targetSlug) {
      return null;
    }
    return this.all().find((p: ProductItem) => p.slug === targetSlug) ?? null;
  });

  readonly currentImg = signal(0);
  readonly qty = signal(1);
  readonly brokenImg = signal<Set<string>>(new Set());

  constructor() {
    effect(() => {
      this.product();
      this.currentImg.set(0);
      this.qty.set(1);
    });
  }

  readonly imgs = computed(() => {
    const p = this.product();
    if (!p) return [];
    return (p.images ?? []).filter(
      (u: string) => u && !this.brokenImg().has(u)
    );
  });

  readonly curImg = computed(() => {
    const arr = this.imgs();
    if (!arr.length) return '';
    return arr[this.currentImg() % arr.length];
  });

  readonly related = computed(() => {
    const p = this.product();
    if (!p) return [];
    return this.all()
      .filter((item: ProductItem) => item.slug !== p.slug && item.cat === p.cat)
      .slice(0, 4);
  });

  readonly desc = computed(() => {
    const p = this.product();
    if (!p) return '';
    const parts: string[] = [
      `${p.name} được làm từ ${p.region}, tỉnh ${p.province}. `,
    ];
    if (p.village) {
      parts.push(`Mỗi sản phẩm đều được chế tác tại ${p.village}. `);
    }
    parts.push(
      `Là ${p.type.toLowerCase()} truyền thống, sản phẩm mang hương vị và tinh xảo của nghệ thượng. `
    );
    if (p.ocop > 0) {
      parts.push(
        `Được chứng nhận OCOP ${p.ocop} sao, đảm bảo tiêu chuẩn chất lượng cao. `
      );
    }
    if (p.heritage) {
      parts.push(
        `Là sản phẩm có huy hiệu Di sản ${p.heritage}, giữ trọn giá trị văn hóa và thổ nhưỡng. `
      );
    }
    if (p.occasion?.length) {
      parts.push(`Phù hợp cho: ${p.occasion.join(', ')}.`);
    }
    return parts.join('');
  });

  stars(n: number): string {
    const m = Math.round(n);
    return '★'.repeat(m) + '☆'.repeat(5 - m);
  }

  fmt(n: number): string {
    return n.toLocaleString('vi-VN') + 'đ';
  }

  imgError(src: string): void {
    if (!src) return;
    this.brokenImg.update((s) => {
      const ns = new Set(s);
      ns.add(src);
      return ns;
    });
  }

  setImg(i: number): void {
    this.currentImg.set(i);
  }

  step(d: number): void {
    const arr = this.imgs();
    if (!arr.length) return;
    const idx = (this.currentImg() + d + arr.length) % arr.length;
    this.currentImg.set(idx);
  }

  changeQty(d: number): void {
    this.qty.update((q) => Math.max(1, q + d));
  }

  addToCart(): void {
    const p = this.product();
    if (!p || !p.inStock) return;
    this.cart.add(p.id, p.name);
    this.qty.set(1);
  }

  buyNow(): void {
    const p = this.product();
    if (!p || !p.inStock) return;
    this.cart.add(p.id, p.name);
    this.qty.set(1);
    this.router.navigate(['/giohang']);
  }
}
