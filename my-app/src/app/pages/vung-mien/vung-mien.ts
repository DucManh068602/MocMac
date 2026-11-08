import { Component, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ProductsService } from '../../products.service';

interface RegionStory {
  _id?: string;
  title: string;
  region?: string;
  excerpt?: string;
  content?: string;
  imageUrl?: string;
}

@Component({
  selector: 'app-vung-mien',
  standalone: false,
  templateUrl: './vung-mien.html',
  styleUrl: './vung-mien.css',
})
export class VungmienComponent {
  private svc = inject(ProductsService);
  private http = inject(HttpClient);

  readonly regions = this.svc.regions;
  readonly products = this.svc.products;
  readonly regionStories = signal<RegionStory[]>([]);

  constructor() {
    this.http.get<{ stories: RegionStory[] }>('/api/region-stories?status=published').subscribe({
      next: (r) => this.regionStories.set(Array.isArray(r?.stories) ? r.stories : []),
      error: () => this.regionStories.set([]),
    });
  }

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
}
