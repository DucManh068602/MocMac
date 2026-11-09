import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../auth.service';
import { CartService } from '../../cart.service';
import { PaymentService } from '../../payment.service';
import { ProductItem, ProductsService } from '../../products.service';
import { HttpClient } from '@angular/common/http';

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

interface SavedAddress {
  _id: string;
  fullName: string;
  phone: string;
  provinceCode: string | number;
  provinceName: string;
  wardCode: string | number;
  wardName: string;
  streetAddress: string;
  isDefault: boolean;
}

const FREE_SHIPPING_THRESHOLD = 500000;
const SHIPPING_FEE = 30000;

function toCartDisplayItem(product: ProductItem, quantity: number, salePrice?: number): CartDisplayItem {
  return {
    id: product.id,
    name: product.name,
    origin: [product.village, product.province, product.region].filter(Boolean).join(' · '),
    description: [product.type, product.cat].filter(Boolean).join(' · '),
    price: salePrice ?? product.price,
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
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);

  readonly flashSale = signal<any>(null);
  readonly flashSaleLive = computed(() => Boolean(this.flashSale()?.live));
  readonly flashSalePercent = computed(() => Number(this.flashSale()?.discountPercent || 0));

  readonly loginRequiredPopup = signal(false);
  readonly paymentStatus = signal<'success'|'fail'|'error'|null>(null);
  readonly paying = signal(false);
  readonly payError = signal('');

  readonly quickOrderOpen = signal(false);
  readonly quickOrderProduct = signal<string | null>(null);

  readonly receiverInfo = signal<{
    name: string;
    phone: string;
    email: string;
    address: string;
    note: string;
  }>({
    name: '',
    phone: '',
    email: '',
    address: '',
    note: '',
  });

  readonly paymentMethod = signal<'cod' | 'vnpay'>('cod');

  // Address management
  readonly addresses = signal<SavedAddress[]>([]);
  readonly addressesLoading = signal(false);
  readonly selectedAddressId = signal<string | null>(null);

  constructor() {
    const st = this.route.snapshot.queryParamMap.get('status');
    if (st === 'success' || st === 'fail' || st === 'error') {
      this.paymentStatus.set(st);
      if (st === 'success') this.cart.clear();
    }

    // Load saved addresses if user is logged in
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.loadAddresses();
      }
    });

    this.fetchFlashSale();
  }

  private fetchFlashSale(): void {
    this.http.get<any>('/api/flash-sale').subscribe({
      next: r => this.flashSale.set(r.sale),
      error: () => this.flashSale.set(null),
    });
  }

  loadAddresses(): void {
    this.addressesLoading.set(true);
    this.http.get<{ addresses: SavedAddress[] }>('/api/addresses').subscribe({
      next: (res) => {
        const addrs = res.addresses || [];
        this.addresses.set(addrs);
        // Auto-select default address if none selected
        if (!this.selectedAddressId() && addrs.length > 0) {
          const def = addrs.find((a) => a.isDefault) || addrs[0];
          this.selectedAddressId.set(def._id);
          this.syncReceiverInfo(def);
        }
        this.addressesLoading.set(false);
      },
      error: () => {
        this.addresses.set([]);
        this.addressesLoading.set(false);
      },
    });
  }

  selectAddress(id: string): void {
    this.selectedAddressId.set(id);
    const addr = this.addresses().find((a) => a._id === id);
    if (addr) {
      this.syncReceiverInfo(addr);
    }
  }

  private syncReceiverInfo(addr: SavedAddress): void {
    this.receiverInfo.set({
      name: addr.fullName,
      phone: addr.phone,
      email: '',
      address: `${addr.streetAddress}, ${addr.wardName}, ${addr.provinceName}`,
      note: '',
    });
  }

  readonly freeShippingThreshold = FREE_SHIPPING_THRESHOLD;
  couponInput = '';
  readonly couponApplied = signal(false);
  readonly couponError = signal('');
  readonly couponInfo = signal<any>(null);

  readonly items = computed(() => {
    const productsById = new Map(this.catalog.products().map(product => [product.id, product]));
    return this.cart.lines().flatMap(line => {
      const product = productsById.get(line.productId);
      if (!product) return [];
      const price = this.flashSaleLive()
        ? Math.max(0, Math.round(product.price * (100 - this.flashSalePercent()) / 100))
        : product.price;
      return [toCartDisplayItem(product, line.quantity, price)];
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

    this.payError.set('');
    this.paying.set(true);
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
      customerInfo: {
        name: this.receiverInfo().name,
        phone: this.receiverInfo().phone,
        address: this.receiverInfo().address,
      },
      note: this.receiverInfo().note,
    }).subscribe({
      next: (response: any) => {
        if (response?.success && response?.payUrl) {
          window.location.assign(response.payUrl);
          return;
        }
        if (response?.success) {
          this.cart.clear();
          this.paymentStatus.set('success');
        } else {
          this.payError.set(response?.message || 'Thanh toán thất bại.');
        }
        this.paying.set(false);
      },
      error: (error: any) => {
        this.payError.set(error?.error?.message || 'Không thể tạo thanh toán VNPAY. Vui lòng thử lại.');
        this.paying.set(false);
      },
    });
  }

  closeLoginPopup(): void {
    this.loginRequiredPopup.set(false);
  }

  quickOrder(productName: string): void {
    this.quickOrderProduct.set(productName);
    this.quickOrderOpen.set(true);
  }

  closeQuickOrder(): void {
    this.quickOrderOpen.set(false);
    this.quickOrderProduct.set(null);
  }

  submitQuickOrder(): void {
    this.closeQuickOrder();
    this.loginRequiredPopup.set(true);
  }

  vnd(value: number): string {
    return value.toLocaleString('vi-VN') + 'đ';
  }
}
