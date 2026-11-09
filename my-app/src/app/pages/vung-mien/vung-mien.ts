import { Component, computed, inject, signal } from '@angular/core';
import { ProductsService } from '../../products.service';
import { HttpClient } from '@angular/common/http';

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
  readonly regionStories = signal<RegionStory[]>([]);
  readonly featuredStories = computed(() => this.regionStories().slice(0, 3));

  constructor() {
    this.http.get<{ stories: RegionStory[] }>('/api/region-stories?status=published').subscribe({
      next: (r) => this.regionStories.set(Array.isArray(r?.stories) ? r.stories : []),
      error: () => this.regionStories.set([]),
    });
  }
}
