import { computed, Injectable, signal } from '@angular/core';

export interface CartLine {
  productId: number;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  readonly lines = signal<CartLine[]>([]);
  readonly notification = signal('');
  readonly count = computed(() =>
    this.lines().reduce((total, line) => total + line.quantity, 0)
  );
  private notificationTimeout?: ReturnType<typeof setTimeout>;

  add(productId: number, productName: string): void {
    this.lines.update(lines => {
      const existing = lines.find(line => line.productId === productId);
      return existing
        ? lines.map(line =>
            line.productId === productId
              ? { ...line, quantity: line.quantity + 1 }
              : line
          )
        : [...lines, { productId, quantity: 1 }];
    });

    this.notification.set(`Đã thêm "${productName}" vào giỏ hàng.`);
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
