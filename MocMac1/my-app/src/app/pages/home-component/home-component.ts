import { Component, computed, inject, signal } from '@angular/core';
import { CartService } from '../../cart.service';
import { ProductsService } from '../../products.service';

@Component({
  selector: 'app-home-component',
  standalone: false,
  templateUrl: './home-component.html',
  styleUrl: './home-component.css',
})
export class HomeComponent {
  cart = inject(CartService);
  private svc = inject(ProductsService);
  products = this.svc.products;
  tab = signal('Tất cả');
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
}
