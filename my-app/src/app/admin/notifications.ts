import { Component, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-admin-notifications',
  standalone: false,
  template: `
    <div class="list-page">
      <header class="list-header">
        <h2>Thông báo ({{ notifications().length }})</h2>
      </header>

      <div class="stats-grid">
        <div class="stat-card stat--moss">
          <span class="stat-value">{{ stats().total }}</span>
          <span class="stat-label">Tổng TB</span>
        </div>
        <div class="stat-card stat--clay">
          <span class="stat-value">{{ stats().unread }}</span>
          <span class="stat-label">Chưa gửi</span>
        </div>
        <div class="stat-card stat--sage">
          <span class="stat-value">{{ stats().sent }}</span>
          <span class="stat-label">Đã gửi</span>
        </div>
      </div>

      <div class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Tiêu đề</th>
              <th>Nội dung</th>
              <th>Đối tượng</th>
              <th>Trạng thái</th>
              <th>Ngày</th>
            </tr>
          </thead>
          <tbody>
            @for (n of notifications(); track n._id) {
              <tr>
                <td>{{ n.title }}</td>
                <td>{{ n.message?.slice(0, 60) }}...</td>
                <td>{{ n.target }}</td>
                <td>{{ n.read ? 'Đã gửi' : 'Chưa gửi' }}</td>
                <td>{{ n.createdAt | date:'short' }}</td>
              </tr>
            } @empty {
              <tr><td colspan="5">Chưa có thông báo nào.</td></tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination
        [currentPage]="page()"
        [totalPages]="totalPages()"
        (pageChange)="page.set($event); loadNotifications()"
      ></app-pagination>
    </div>
  `,
  styleUrls: ['./admin-list.css'],
})
export class AdminNotificationsComponent {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  readonly notifications = signal<any[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(1);

  readonly stats = computed(() => {
    const n = this.notifications();
    return {
      total: n.length,
      unread: n.filter((x: any) => !x.read).length,
      sent: n.filter((x: any) => x.read).length,
    };
  });

  constructor() {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.http.get('/api/notifications?page=' + this.page() + '&limit=20').subscribe((r: any) => {
      const items = Array.isArray(r) ? r : (r.notifications || []);
      this.notifications.set(items);
      this.totalPages.set(r.totalPages || 1);
    });
  }
}
