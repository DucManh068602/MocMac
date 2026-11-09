import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from './toast.service';
import { ConfirmService } from './confirm.service';

@Component({
  selector: 'app-admin-audit',
  standalone: false,
  template: `
    <div class="list-page">
      <header class="list-header">
        <h2>Lá»‹ch sá»­ há»‡ thá»‘ng ({{ logs().length }})</h2>
        @if (logs().length > 0) {
          <button type="button" class="btn-add" (click)="clearLogs()">XÃ³a táº¥t cáº£</button>
        }
      </header>

      <div class="stats-grid">
        <div class="stat-card stat--moss">
          <span class="stat-value">{{ stats().total }}</span>
          <span class="stat-label">Tá»•ng báº£n ghi</span>
        </div>
        <div class="stat-card stat--clay">
          <span class="stat-value">{{ stats().today }}</span>
          <span class="stat-label">HÃ´m nay</span>
        </div>
        <div class="stat-card stat--earth">
          <span class="stat-value">{{ stats().success }}</span>
          <span class="stat-label">ThÃ nh cÃ´ng</span>
        </div>
        <div class="stat-card stat--sage">
          <span class="stat-value">{{ stats().failed }}</span>
          <span class="stat-label">Lá»—i</span>
        </div>
      </div>

      <div class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Thá»i gian</th>
              <th>HÃ nh Ä‘á»™ng</th>
              <th>PhÃ¢n loáº¡i</th>
              <th>NgÆ°á»i dÃ¹ng</th>
              <th>Tráº¡ng thÃ¡i</th>
              <th>Chi tiáº¿t</th>
            </tr>
          </thead>
          <tbody>
            @for (l of logs(); track l._id) {
              <tr>
                <td>{{ l.createdAt | date:'short' }}</td>
                <td>{{ l.action }}</td>
                <td>{{ l.resourceType }}</td>
                <td>{{ l.userEmail || 'há»‡ thá»‘ng' }}</td>
                <td>
                  <span class="status-badge" [ngClass]="l.status === 'success' ? 'status-visible' : 'status-hidden'">
                    {{ l.status === 'success' ? 'ThÃ nh cÃ´ng' : 'Lá»—i' }}
                  </span>
                </td>
                <td>
                  @if (l.details && typeof l.details === 'object') {
                    <pre class="log-details">{{ l.details | json }}</pre>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6">ChÆ°a cÃ³ log nÃ o.</td></tr>
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
  private confirm = inject(ConfirmService);
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

  async clearLogs(): Promise<void> {
    const ok = await this.confirm.confirm({ title: 'Xác nhận xóa', message: 'Xóa toàn bộ lịch sử hệ thống?', confirmText: 'Xóa', danger: true });
    if (!ok) return;
    this.http.delete('/api/audit-logs').subscribe({
      next: () => { this.toast.success('ÄÃ£ xÃ³a lá»‹ch sá»­'); this.loadLogs(); },
      error: () => this.toast.error('KhÃ´ng thá»ƒ xÃ³a'),
    });
  }
}

