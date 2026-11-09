import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface RegionStory {
  _id?: string;
  title: string;
  region?: string;
  excerpt?: string;
  content?: string;
  imageUrl?: string;
}

interface VillageStory {
  _id?: string;
  title: string;
  village?: string;
  province?: string;
  craft?: string;
  excerpt?: string;
  content?: string;
  imageUrl?: string;
}

interface RegionItem {
  _id?: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  productCount?: number;
}

@Component({
  selector: 'app-vung-mien-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './vung-mien-detail.html',
  styleUrl: './vung-mien-detail.css',
})
export class VungMienDetailComponent {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  readonly region = signal<RegionItem | null>(null);
  readonly regionStories = signal<RegionStory[]>([]);
  readonly villageStories = signal<VillageStory[]>([]);
  readonly loading = signal(true);

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (slug) this.loadRegion(slug);
    });
  }

  private loadRegion(slug: string): void {
    this.loading.set(true);
    this.http.get<RegionItem>(`/api/regions/${slug}`).subscribe({
      next: (r) => {
        this.region.set(r);
        this.loadRegionStories(r.name);
        this.loadVillageStories(r.name);
      },
      error: () => { this.loading.set(false); },
    });
  }

  private loadRegionStories(regionName: string): void {
    this.http.get<{ stories: RegionStory[] }>(`/api/region-stories?status=published&region=${encodeURIComponent(regionName)}`).subscribe({
      next: (r) => this.regionStories.set(Array.isArray(r?.stories) ? r.stories : []),
      error: () => this.regionStories.set([]),
    });
  }

  private loadVillageStories(regionName: string): void {
    this.http.get<any[]>(`/api/provinces?region=${encodeURIComponent(regionName)}`).subscribe({
      next: (provinces) => {
        const provinceNames = provinces.map((p) => p.name);
        this.http.get<{ stories: VillageStory[] }>('/api/village-stories?status=published').subscribe({
          next: (r) => {
            const all = Array.isArray(r?.stories) ? r.stories : [];
            this.villageStories.set(all.filter((s) => provinceNames.includes(String(s.province || ''))));
            this.loading.set(false);
          },
          error: () => { this.villageStories.set([]); this.loading.set(false); },
        });
      },
      error: () => { this.villageStories.set([]); this.loading.set(false); },
    });
  }

  readonly hasVillageStories = computed(() => this.villageStories().length > 0);
}
