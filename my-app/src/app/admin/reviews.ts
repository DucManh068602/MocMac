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
        <div class="stat-card stat--earth">
          <span class="stat-value">{{ stats().hidden }}</span>
          <span class="stat-label">Đã ẩn</span>
        </div>
        <div class="stat-card stat--sage">
          <span class="stat-value">{{ stats().visible }}</span>
          <span class="stat-label">Hiển thị</span>
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
              <th>Trạng thái</th>
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
                  <span class="status-badge" [ngClass]="r.status === 'visible' ? 'status-visible' : 'status-hidden'">
                    {{ r.status === 'visible' ? 'Hiện' : 'Ẩn' }}
                  </span>
                  <button type="button" class="btn-small btn-toggle" (click)="toggleStatus(r)">
                    {{ r.status === 'visible' ? 'Ẩn' : 'Hiện' }}
                  </button>
                </td>
                <td>{{ r.createdAt | date:'short' }}</td>
                <td>
                  <button type="button" class="btn-small btn-delete" (click)="deleteReview(r._id)">Xóa</button>
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

  readonly stats = computed(() => {
    const r = this.reviews();
    const visible = r.filter((x: any) => x.status === 'visible');
    const avg = visible.length > 0
      ? visible.reduce((s: number, x: any) => s + x.rating, 0) / visible.length
      : 0;
    return {
      total: r.length,
      avg: Number(avg.toFixed(1)),
      visible: visible.length,
      hidden: r.filter((x: any) => x.status === 'hidden').length,
    };
  });

  constructor() {
    this.loadReviews();
  }

  loadReviews(): void {
    this.http.get('/api/reviews?page=' + this.page() + '&limit=20').subscribe((r: any) => {
      const items = Array.isArray(r) ? r : (r.reviews || []);
      this.reviews.set(items);
      this.totalPages.set(r.totalPages || 1);
    });
  }

  updateStatus(id: string, event: Event): void {
    const status = (event.target as HTMLSelectElement).value;
    this.http.patch('/api/reviews/' + id + '/status', { status }).subscribe({
      next: () => { this.toast.success('Cập nhật trạng thái đánh giá'); this.loadReviews(); },
      error: () => this.toast.error('Không thể cập nhật trạng thái'),
    });
  }

  toggleStatus(r: any): void {
    const newStatus = r.status === 'visible' ? 'hidden' : 'visible';
    this.http.patch('/api/reviews/' + r._id + '/status', { status: newStatus }).subscribe({
      next: () => { this.toast.success('Cập nhật trạng thái'); this.loadReviews(); },
      error: () => this.toast.error('Không thể cập nhật'),
    });
  }

  deleteReview(id: string): void {
    if (confirm('Xóa đánh giá này?')) {
      this.http.delete('/api/reviews/' + id).subscribe({
        next: () => { this.toast.success('Xóa đánh giá thành công'); this.loadReviews(); },
        error: () => this.toast.error('Không thể xóa đánh giá'),
      });
    }
  }
}
