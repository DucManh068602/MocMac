import { Component, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-admin-reviews',
  standalone: false,
  template: `
    <div class="list-page">
      <header class="list-header">
        <h2>Đánh giá sản phẩm ({{ reviews().length }})</h2>
        <div class="admin-filters">
          <div class="filter-group">
            <input
              class="filter-input"
              placeholder="Tìm sản phẩm/người dùng..."
              [(ngModel)]="searchTerm"
              (input)="onFilterChange()"
              style="width: 200px"
            />
          </div>
          <div class="filter-group">
            <select class="filter-select" [(ngModel)]="ratingFilter" (change)="onFilterChange()" style="width: 100px">
              <option value="">Tất cả sao</option>
              <option value="5">5 sao</option>
              <option value="4">4 sao</option>
              <option value="3">3 sao</option>
              <option value="2">2 sao</option>
              <option value="1">1 sao</option>
            </select>
          </div>
          <button
            type="button"
            class="filter-reset"
            (click)="resetFilters()"
            [disabled]="!searchTerm && !ratingFilter"
          >
            Xóa bộ lọc
          </button>
        </div>
      </header>

      <div class="stats-grid">
        <div class="stat-card stat--moss">
          <span class="stat-value">{{ stats().total }}</span>
          <span class="stat-label">Tổng đánh giá</span>
        </div>
        <div class="stat-card stat--clay">
          <span class="stat-value">{{ stats().avg | number:'1.1-1' }}</span>
          <span class="stat-label">Điểm trung bình</span>
        </div>
      </div>

      <div class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Người dùng</th>
              <th>Điểm</th>
              <th>Nội dung</th>
              <th>Phản hồi admin</th>
              <th>Ngày</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            @for (r of reviews(); track r._id) {
              <tr>
                <td>{{ r.product?.name || '—' }}</td>
                <td>{{ r.user?.name || r.user?.email || '—' }}</td>
                <td>
                  <span class="rating-stars" [ngClass]="'stars-' + r.rating">
                    {{ '★'.repeat(r.rating) }}{{ '☆'.repeat(5 - r.rating) }}
                  </span>
                  <small>({{ r.rating }}/5)</small>
                </td>
                <td>{{ r.comment?.slice(0, 60) || '—' }}</td>
                <td>
                  @if (r.adminReply) {
                    <div class="admin-reply">
                      <span class="reply-badge">Đã phản hồi</span>
                      <span class="reply-text">{{ r.adminReply }}</span>
                      <button type="button" class="btn-small btn-reply" (click)="openReplyModal(r)">Sửa</button>
                    </div>
                  } @else {
                    <button type="button" class="btn-small btn-reply" (click)="openReplyModal(r)">Phản hồi</button>
                  }
                </td>
                <td>{{ r.createdAt | date:'short' }}</td>
                <td>
                  <button type="button" class="btn-small btn-reply" (click)="openReplyModal(r)">
                    {{ r.adminReply ? 'Sửa phản hồi' : 'Phản hồi' }}
                  </button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7">Chưa có đánh giá nào.</td></tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination
        [currentPage]="page()"
        [totalPages]="totalPages()"
        (pageChange)="page.set($event); loadReviews()"
      ></app-pagination>

      @if (replyModalOpen()) {
        <div class="modal-overlay" (click)="closeReplyModal()">
          <div class="modal modal-wide review-reply-modal" (click)="$event.stopPropagation()">
            <header class="modal-header">
              <h3>Phản hồi đánh giá khách hàng</h3>
              <button type="button" class="modal-close" (click)="closeReplyModal()" [disabled]="replyModalSaving()">×</button>
            </header>

            @if (replyModalReview(); as rr) {
              <div class="review-reply-context">
                <div class="context-grid">
                  <div><strong>Sản phẩm:</strong> {{ rr.product?.name || '—' }}</div>
                  <div><strong>Khách hàng:</strong> {{ rr.user?.name || rr.user?.email || '—' }}</div>
                  <div><strong>Điểm:</strong> {{ rr.rating }}/5</div>
                  <div><strong>Ngày:</strong> {{ rr.createdAt | date:'short' }}</div>
                </div>
                <div class="context-comment">
                  <strong>Nội dung đánh giá</strong>
                  <p>{{ rr.comment || '—' }}</p>
                </div>
              </div>
            }

            <div class="reply-form">
              <label for="adminReplyText"><strong>Nội dung phản hồi</strong></label>
              <textarea
                id="adminReplyText"
                rows="6"
                class="reply-textarea"
                [(ngModel)]="replyModalText"
                placeholder="Nhập phản hồi của Mộc Mạc cho đánh giá này..."
              ></textarea>
              <p class="reply-hint">Phản hồi sẽ hiển thị ngay dưới bình luận của khách hàng tại trang sản phẩm.</p>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-cancel" (click)="closeReplyModal()" [disabled]="replyModalSaving()">Đóng</button>
              <button type="button" class="btn-save" (click)="submitReplyModal()" [disabled]="replyModalSaving()">
                {{ replyModalSaving() ? 'Đang gửi...' : 'Gửi phản hồi' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./admin-list.css'],
})
export class AdminReviewsComponent {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  readonly reviews = signal<any[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  searchTerm = '';
  ratingFilter = '';
  readonly replyModalOpen = signal(false);
  readonly replyModalSaving = signal(false);
  readonly replyModalReview = signal<any | null>(null);
  replyModalText = '';

  readonly stats = computed(() => {
    const r = this.reviews();
    const avg = r.length > 0 ? r.reduce((s: number, x: any) => s + x.rating, 0) / r.length : 0;
    return { total: r.length, avg: Number(avg.toFixed(1)) };
  });

  constructor() {
    this.loadReviews();
  }

  openReplyModal(review: any): void {
    this.replyModalReview.set(review);
    this.replyModalText = String(review?.adminReply || '');
    this.replyModalOpen.set(true);
  }

  closeReplyModal(): void {
    if (this.replyModalSaving()) return;
    this.replyModalOpen.set(false);
    this.replyModalReview.set(null);
    this.replyModalText = '';
  }

  submitReplyModal(): void {
    const review = this.replyModalReview();
    const reply = (this.replyModalText || '').trim();
    if (!review?._id) return;
    if (!reply) {
      this.toast.error('Vui lòng nhập nội dung phản hồi.');
      return;
    }
    this.replyModalSaving.set(true);
    this.http.patch('/api/reviews/' + review._id + '/reply', { reply }).subscribe({
      next: () => {
        this.toast.success('Đã phản hồi đánh giá');
        this.replyModalSaving.set(false);
        this.closeReplyModal();
        this.loadReviews();
      },
      error: () => {
        this.toast.error('Không thể phản hồi đánh giá');
        this.replyModalSaving.set(false);
      },
    });
  }

  onFilterChange(): void {
    this.page.set(1);
    this.loadReviews();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.ratingFilter = '';
    this.page.set(1);
    this.loadReviews();
  }

  loadReviews(): void {
    const params = new URLSearchParams({ page: String(this.page()), limit: '20' });
    if (this.searchTerm) params.set('q', this.searchTerm);
    if (this.ratingFilter) params.set('rating', this.ratingFilter);

    this.http.get('/api/reviews?' + params.toString()).subscribe((r: any) => {
      const items = Array.isArray(r) ? r : (r.reviews || []);
      this.reviews.set(items);
      this.totalPages.set(r.totalPages || 1);
    });
  }
}
