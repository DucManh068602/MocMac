import { computed, effect, Injectable, signal } from '@angular/core';

export interface CartLine {
  productId: number;
  quantity: number;
}

const STORAGE_KEY = 'mocmac-cart';

function loadCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    return Array.isArray(parsed) ? parsed.filter((l) => l && typeof l.productId === 'number' && typeof l.quantity === 'number') : [];
  } catch {
    return [];
  }
}

function saveCart(lines: CartLine[]): void {
  try {
    if (lines.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // storage unavailable, ignore
  }
}

@Injectable({ providedIn: 'root' })
export class CartService {
  readonly lines = signal<CartLine[]>(loadCart());
  readonly notification = signal('');
  readonly count = computed(() =>
    this.lines().reduce((total, line) => total + line.quantity, 0)
  );
  private notificationTimeout?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      saveCart(this.lines());
    });
  }

  add(productId: number, productName: string, quantity: number | string = 1): void {
    const qty = Math.max(1, Number(quantity || 1));
    this.lines.update(lines => {
      const existing = lines.find(line => line.productId === productId);
      return existing
        ? lines.map(line =>
            line.productId === productId
              ? { ...line, quantity: line.quantity + qty }
              : line
          )
        : [...lines, { productId, quantity: qty }];
    });

    this.notification.set(`Đã thêm "${productName}" x${qty} vào giỏ hàng.`);
    clearTimeout(this.notificationTimeout);
    this.notificationTimeout = setTimeout(() => this.notification.set(''), 3000);
  }

  increase(productId: number): void {
    this.lines.update(lines =>
      lines.map(line =>
        line.productId === productId
          ? { ...line, quantity: line.quantity + 1 }
          : line
      )
    );
  }

  decrease(productId: number): void {
    this.lines.update(lines =>
      lines.map(line =>
        line.productId === productId && line.quantity > 1
          ? { ...line, quantity: line.quantity - 1 }
          : line
      )
    );
  }

  remove(productId: number): void {
    this.lines.update(lines => lines.filter(line => line.productId !== productId));
  }

  clear(): void {
    this.lines.set([]);
  }
}
