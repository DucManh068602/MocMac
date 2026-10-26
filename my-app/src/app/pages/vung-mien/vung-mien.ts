import { Component, computed, inject, signal } from '@angular/core';
import { ProductItem, ProductsService, RegionItem } from '../../products.service';

interface VillageGroup {
  name: string;
  province: string;
  region: string;
  count: number;
  products: ProductItem[];
  icon: string;
}

const VILLAGE_ICONS: Record<string, string> = {
  'Bát Tràng': '🏺',
  'Hạ Thái': '🎨',
  'Phú Vinh': '🧺',
  'Chu Đậu': '🔔',
  'Vạn Phúc': '🧵',
  'Đông Hồ': '🖼️',
  'Đồng Kỵ': '🪵',
  'Quất Động': '🧵',
  'Xuân La': '🧣',
  'Làng Chuồng': '👒',
  'Đọi Tam': '🧵',
  'Lái Thiêu': '🍃',
  'Trảng Bàng': '🏺',
  'Đồ Sơn': '🏮',
  'Bàu Trúc': '🏺',
};

@Component({
  selector: 'app-vung-mien',
  standalone: false,
  templateUrl: './vung-mien.html',
  styleUrl: './vung-mien.css',
})
export class VungmienComponent {
  private svc = inject(ProductsService);

  readonly regions = this.svc.regions;
  readonly products = this.svc.products;

  readonly activeTab = signal<'regions' | 'villages'>('regions');

  readonly villages = computed(() => {
    const grouped = new Map<string, ProductItem[]>();
    for (const p of this.products()) {
      const v = p.village;
      if (!v) continue;
      if (!grouped.has(v)) grouped.set(v, []);
      grouped.get(v)!.push(p);
    }
    return Array.from(grouped.entries())
      .map(([name, products]) => ({
        name,
        province: products[0]?.province || '',
        region: products[0]?.region || '',
        count: products.length,
        products,
        icon: VILLAGE_ICONS[name] ?? '🛠️',
      }))
      .sort((a, b) => b.count - a.count);
  });

  readonly productsByRegion = computed(() => {
    const list = this.products();
    const result = new Map<string, { name: string; count: number }>();
    for (const p of list) {
      const r = p.region || 'Khác';
      if (!result.has(r)) result.set(r, { name: r, count: 0 });
      result.get(r)!.count++;
    }
    return Array.from(result.values()).sort((a, b) => b.count - a.count);
  });

  fmt(n: number): string {
    return n.toLocaleString('vi-VN') + 'đ';
  }
}
