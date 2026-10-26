import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../auth.service';
import { CartService } from '../../cart.service';
import { PaymentService } from '../../payment.service';
import { ProductItem, ProductsService } from '../../products.service';

interface CartDisplayItem {
  id: number;
  name: string;
  origin: string;
  description: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  badge: string;
  badgeTone: 'brown' | 'green';
}

const FREE_SHIPPING_THRESHOLD = 500000;
const SHIPPING_FEE = 30000;

function toCartDisplayItem(product: ProductItem, quantity: number): CartDisplayItem {
  return {
    id: product.id,
    name: product.name,
    origin: [product.village, product.province, product.region].filter(Boolean).join(' · '),
    description: [product.type, product.cat].filter(Boolean).join(' · '),
    price: product.price,
    quantity,
    imageUrl: product.images?.find(Boolean) ?? null,
    badge: product.badges[0] ?? (product.ocop ? `OCOP ${product.ocop} sao` : product.cat),
    badgeTone: product.heritage === 'Vàng' ? 'brown' : 'green',
  };
}

@Component({
  selector: 'app-giohang',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './giohang.html',
  styleUrl: './giohang.scss',
})
export class GiohangComponent {
  private readonly catalog = inject(ProductsService);
  private readonly cart = inject(CartService);
  private readonly auth = inject(AuthService);
  private readonly paymentService = inject(PaymentService);

  readonly loginRequiredPopup = signal(false);

  readonly paymentMethod = signal<'cod' | 'momo'>('cod');

  readonly freeShippingThreshold = FREE_SHIPPING_THRESHOLD;
  couponInput = '';
  readonly couponApplied = signal(false);
  readonly couponError = signal('');
  readonly couponInfo = signal<any>(null);

  readonly items = computed(() => {
    const productsById = new Map(this.catalog.products().map(product => [product.id, product]));
    return this.cart.lines().flatMap(line => {
      const product = productsById.get(line.productId);
      return product ? [toCartDisplayItem(product, line.quantity)] : [];
    });
  });

  readonly totalQuantity = computed(() =>
    this.items().reduce((sum, item) => sum + item.quantity, 0)
  );
  readonly subtotal = computed(() =>
    this.items().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );
  readonly discount = computed(() => {
    if (!this.couponApplied()) return 0;
    return this.couponInfo()?.discountAmount ?? 0;
  });
  readonly shipping = computed(() => {
    const subtotal = this.subtotal();
    return subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  });
  readonly total = computed(() => this.subtotal() - this.discount() + this.shipping());
  readonly isFreeShipping = computed(() => this.subtotal() > 0 && this.shipping() === 0);
  readonly remainingForFreeShipping = computed(() =>
    Math.max(FREE_SHIPPING_THRESHOLD - this.subtotal(), 0)
  );
  readonly shippingProgress = computed(() =>
    Math.min((this.subtotal() / FREE_SHIPPING_THRESHOLD) * 100, 100)
  );
  readonly isEmpty = computed(() => this.items().length === 0);

  increase(id: number): void {
    this.cart.increase(id);
  }

  decrease(id: number): void {
    this.cart.decrease(id);
  }

  remove(id: number): void {
    this.cart.remove(id);
  }

  clearAll(): void {
    this.cart.clear();
  }

  applyCoupon(): void {
    const code = this.couponInput.trim().toUpperCase();
    if (!code) {
      this.couponError.set('Vui lòng nhập mã giảm giá.');
      return;
    }

    this.paymentService.validateCoupon(code, this.subtotal()).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.couponApplied.set(true);
          this.couponError.set('');
          this.couponInfo.set(res);
        } else {
          this.couponApplied.set(false);
          this.couponInfo.set(null);
          this.couponError.set(res.message || 'Mã giảm giá không hợp lệ.');
        }
      },
      error: (err: any) => {
        this.couponApplied.set(false);
        this.couponInfo.set(null);
        this.couponError.set(err.error?.message || 'Mã giảm giá không hợp lệ.');
      },
    });
  }

  checkout(): void {
    if (!this.auth.isAuthenticated()) {
      this.loginRequiredPopup.set(true);
      return;
    }

    const items = this.items().map(item => ({
      productId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    this.paymentService.checkout({
      items,
      subtotal: this.subtotal(),
      discount: this.discount(),
      shipping: this.shipping(),
      total: this.total(),
      paymentMethod: this.paymentMethod(),
      couponCode: this.couponApplied() ? this.couponInput.trim().toUpperCase() : '',
    }).subscribe({
      next: (response: any) => {
        if (response.success && response.payUrl) {
          window.location.href = response.payUrl;
        } else {
          this.cart.clear();
        }
      },
      error: (error: any) => {
        console.error('Lỗi thanh toán:', error);
      },
    });
  }

  closeLoginPopup(): void {
    this.loginRequiredPopup.set(false);
  }

  vnd(value: number): string {
    return value.toLocaleString('vi-VN') + 'đ';
  }
}
