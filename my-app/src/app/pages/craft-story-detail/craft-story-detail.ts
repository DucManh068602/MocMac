import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface VillageStory {
  _id?: string;
  title: string;
  village?: string;
  province?: string;
  craft?: string;
  excerpt?: string;
  content?: string;
  imageUrl?: string;
  status?: string;
  order?: number;
  createdAt?: string;
}

@Component({
  selector: 'app-craft-story-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="story-page">
      <div class="wrap">
        <a routerLink="/lang-nghe" class="back-link"><i class="fa-solid fa-arrow-left"></i> Về làng nghề</a>

        @if (loading()) {
          <div class="story-loading">Đang tải bài viết...</div>
        } @else if (!story()) {
          <div class="story-empty">Không tìm thấy bài viết.</div>
        } @else {
          <article class="story-article">
            <header class="story-header">
              <div class="story-meta">
                @if (story()?.village) { <span class="meta-pill"><i class="fa-solid fa-location-dot"></i> {{ story()?.village }}</span> }
                @if (story()?.province) { <span class="meta-pill">{{ story()?.province }}</span> }
                @if (story()?.craft) { <span class="meta-pill craft">{{ story()?.craft }}</span> }
              </div>
              <h1>{{ story()?.title }}</h1>
              @if (story()?.excerpt) { <p class="story-excerpt">{{ story()?.excerpt }}</p> }
            </header>

            @if (story()?.imageUrl) {
              <figure class="story-hero-img">
                <img [src]="story()?.imageUrl" [alt]="story()?.title" />
              </figure>
            }

            <div class="story-body" [innerHTML]="story()?.content || ''"></div>
          </article>
        }
      </div>
    </section>
  `,
  styles: [`
    .story-page { padding: 32px 0 60px; font-family: 'Be Vietnam Pro','Segoe UI',Arial,sans-serif; color: #2f2a24; }
    .wrap { width: min(860px, 92%); margin: 0 auto; }
    .back-link { display: inline-flex; align-items: center; gap: 8px; color: #6b7f52; font-weight: 600; text-decoration: none; margin-bottom: 18px; }
    .back-link:hover { text-decoration: underline; }
    .story-loading, .story-empty { text-align: center; padding: 40px; color: #6f685f; }
    .story-article { background: #fff; border: 1px solid #e7dfd2; border-radius: 16px; padding: 28px; box-shadow: 0 8px 24px rgba(63,52,38,.05); }
    .story-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
    .meta-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; background: #f3f1ec; color: #5e554b; font-size: .78rem; font-weight: 600; }
    .meta-pill.craft { background: #eef3ec; color: #35543a; }
    .story-header h1 { margin: 0 0 10px; font-size: clamp(1.6rem, 3vw, 2.2rem); line-height: 1.25; color: #35543a; }
    .story-excerpt { margin: 0 0 14px; color: #5e554b; font-size: 1rem; line-height: 1.7; }
    .story-hero-img { margin: 16px 0 20px; border-radius: 12px; overflow: hidden; }
    .story-hero-img img { width: 100%; max-height: 420px; object-fit: cover; display: block; }
    .story-body { color: #3f3a34; font-size: 1rem; line-height: 1.85; }
    .story-body :is(p, ul, ol, h2, h3) { margin: 0 0 14px; }
    .story-body img { max-width: 100%; height: auto; border-radius: 10px; margin: 12px 0; }
  `]
})
export class CraftStoryDetailComponent {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  readonly story = signal<VillageStory | null>(null);
  readonly loading = signal(true);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id); else this.loading.set(false);
  }

  load(id: string): void {
    this.http.get<{ story: VillageStory }>(`/api/village-stories/${id}`).subscribe({
      next: (r) => { this.story.set(r?.story || null); this.loading.set(false); },
      error: () => { this.story.set(null); this.loading.set(false); },
    });
  }
}
