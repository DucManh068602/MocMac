import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-reviews',
  standalone: false,
  template: `
    <div class="list-page">
      <header class="list-header">
        <h2>Đánh giá sản phẩm ({{ reviews().length }})</h2>
      </header>
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
                <td>{{ r.user?.name || '—' }}</td>
                <td>
                  <span class="rating">{{ r.rating }}/5</span>
                </td>
                <td>{{ r.comment?.slice(0, 50) || '—' }}</td>
                <td>
                  <select (change)="updateStatus(r._id, $event)">
                    <option value="visible" [selected]="r.status === 'visible'">Hiện</option>
                    <option value="hidden" [selected]="r.status === 'hidden'">Ẩn</option>
                  </select>
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
})
export class AdminReviewsComponent {
  private http = inject(HttpClient);
  readonly reviews = signal<any[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(1);

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
    this.http.patch('/api/reviews/' + id + '/status', { status }).subscribe(() => this.loadReviews());
  }

  deleteReview(id: string): void {
    if (confirm('Xóa đánh giá này?')) {
      this.http.delete('/api/reviews/' + id).subscribe(() => this.loadReviews());
    }
  }
}
