import { Component, computed, inject, signal } from '@angular/core';
import { ProductsService, ProductItem } from '../../products.service';

interface NeedCategory {
  id: string;
  name: string;
  icon: string;
}

@Component({
  selector: 'app-gift-needs',
  standalone: false,
  templateUrl: './gift-needs.html',
  styleUrl: './gift-needs.css',
})
export class GiftNeedsComponent {
  private readonly productsService = inject(ProductsService);

  readonly allProducts = this.productsService.products;
  readonly selectedNeed = signal<string>('all');

  readonly categories: NeedCategory[] = [
    { id: 'all', name: 'Tất cả', icon: '🎁' },
    { id: 'wedding', name: 'Quà cưới', icon: '💍' },
    { id: 'tet', name: 'Quà Tết', icon: '🧧' },
    { id: 'business', name: 'Quà doanh nghiệp', icon: '📊' },
    { id: 'thanks', name: 'Quà tri ân', icon: '🙏' },
    { id: 'housewarming', name: 'Quà nhà mới', icon: '🏠' },
  ];

  readonly filteredProducts = computed<ProductItem[]>(() => {
    const list = this.allProducts() ?? [];
    const need = this.selectedNeed();
    if (need === 'all') return list.slice(0, 20);

    const occasionMap: Record<string, string> = {
      wedding: 'Quà cưới',
      tet: 'Quà Tết',
      business: 'Quà tặng doanh nghiệp',
      thanks: 'Quà tặng',
      housewarming: 'Quà nhà mới',
    };

    const target = occasionMap[need];
    if (!target) return list.slice(0, 20);

    return list
      .filter((p) => {
        const occasions: string[] = p.occasion ?? [];
        return occasions.some((o: string) => o.includes(target) || target.includes(o));
      })
      .slice(0, 20);
  });

  setCategory(id: string): void {
    this.selectedNeed.set(id);
  }
}
