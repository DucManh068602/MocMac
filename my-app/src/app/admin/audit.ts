import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-admin-audit',
  standalone: false,
  template: `
    <div class="list-page">
      <header class="list-header">
        <h2>Lịch sử hệ thống ({{ logs().length }})</h2>
        @if (logs().length > 0) {
          <button type="button" class="btn-add" (click)="clearLogs()">Xóa tất cả</button>
        }
      </header>

      <div class="stats-grid">
        <div class="stat-card stat--moss">
          <span class="stat-value">{{ stats().total }}</span>
          <span class="stat-label">Tổng bản ghi</span>
        </div>
        <div class="stat-card stat--clay">
          <span class="stat-value">{{ stats().today }}</span>
          <span class="stat-label">Hôm nay</span>
        </div>
        <div class="stat-card stat--earth">
          <span class="stat-value">{{ stats().success }}</span>
          <span class="stat-label">Thành công</span>
        </div>
        <div class="stat-card stat--sage">
          <span class="stat-value">{{ stats().failed }}</span>
          <span class="stat-label">Lỗi</span>
        </div>
      </div>

      <div class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Hành động</th>
              <th>Phân loại</th>
              <th>Người dùng</th>
              <th>Trạng thái</th>
              <th>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            @for (l of logs(); track l._id) {
              <tr>
                <td>{{ l.createdAt | date:'short' }}</td>
                <td>{{ l.action }}</td>
                <td>{{ l.resourceType }}</td>
                <td>{{ l.userEmail || 'hệ thống' }}</td>
                <td>
                  <span class="status-badge" [ngClass]="l.status === 'success' ? 'status-visible' : 'status-hidden'">
                    {{ l.status === 'success' ? 'Thành công' : 'Lỗi' }}
                  </span>
                </td>
                <td>
                  @if (l.details && typeof l.details === 'object') {
                    <pre class="log-details">{{ l.details | json }}</pre>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6">Chưa có log nào.</td></tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination
        [currentPage]="page()"
        [totalPages]="totalPages()"
        (pageChange)="page.set($event); loadLogs()"
      ></app-pagination>
    </div>
  `,
  styleUrls: ['./admin-list.css'],
})
export class AdminAuditComponent {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  readonly logs = signal<any[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(1);

  readonly stats = signal({ total: 0, today: 0, success: 0, failed: 0 });

  constructor() {
    this.loadLogs();
  }

  loadLogs(): void {
    this.http.get('/api/audit-logs?page=' + this.page() + '&limit=20').subscribe((r: any) => {
      const items = Array.isArray(r) ? r : (r.logs || []);
      this.logs.set(items);
      this.totalPages.set(r.totalPages || 1);

      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);

      this.stats.set({
        total: r.total || 0,
        today: items.filter((l: any) => l.createdAt && new Date(l.createdAt).toISOString().slice(0, 10) === todayStr).length,
        success: items.filter((l: any) => l.status === 'success').length,
        failed: items.filter((l: any) => l.status === 'failed').length,
      });
    });
  }

  clearLogs(): void {
    if (!confirm('Xóa toàn bộ lịch sử hệ thống?')) return;
    this.http.delete('/api/audit-logs').subscribe({
      next: () => { this.toast.success('Đã xóa lịch sử'); this.loadLogs(); },
      error: () => this.toast.error('Không thể xóa'),
    });
  }
}
