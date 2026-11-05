import { Component, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-admin-notifications',
  standalone: false,
  template: `
    <div class="list-page">
      <header class="list-header">
        <h2>Thông báo ({{ notifications().length }})</h2>
        <div class="admin-filters">
          <div class="filter-group">
            <input
              class="filter-input"
              placeholder="Tìm tiêu đề/nội dung..."
              [(ngModel)]="searchTerm"
              (input)="onFilterChange()"
              style="width: 200px"
            />
          </div>
          <div class="filter-group">
            <select class="filter-select" [(ngModel)]="typeFilter" (change)="onFilterChange()" style="width: 140px">
              <option value="">Tất cả loại</option>
              <option value="order">Đơn hàng</option>
              <option value="contact">Liên hệ</option>
              <option value="system">Hệ thống</option>
              <option value="promo">Khuyến mãi</option>
            </select>
          </div>
          <div class="filter-group">
            <select class="filter-select" [(ngModel)]="sentFilter" (change)="onFilterChange()" style="width: 120px">
              <option value="">Tất cả trạng thái</option>
              <option value="sent">Đã gửi</option>
              <option value="unsent">Chưa gửi</option>
            </select>
          </div>
          <button
            type="button"
            class="filter-reset"
            (click)="resetFilters()"
            [disabled]="!searchTerm && !typeFilter && !sentFilter"
          >
            Xóa bộ lọc
          </button>
        </div>
        <button type="button" class="btn-add" (click)="showForm.set(true); resetForm()">Gửi thông báo</button>
      </header>

      <div class="stats-grid">
        <div class="stat-card stat--moss">
          <span class="stat-value">{{ stats().total }}</span>
          <span class="stat-label">Tổng TB</span>
        </div>
        <div class="stat-card stat--clay">
          <span class="stat-value">{{ stats().unsent }}</span>
          <span class="stat-label">Chưa gửi</span>
        </div>
        <div class="stat-card stat--sage">
          <span class="stat-value">{{ stats().sent }}</span>
          <span class="stat-label">Đã gửi</span>
        </div>
      </div>

      @if (showForm()) {
        <div class="form-card">
          <h3>Gửi thông báo</h3>
          <div class="form-grid">
            <input class="form-input" placeholder="Tiêu đề" [(ngModel)]="form.title" />
            <textarea class="form-input" placeholder="Nội dung" [(ngModel)]="form.content"></textarea>
            <select class="form-input" [(ngModel)]="form.type">
              <option value="order">Đơn hàng</option>
              <option value="contact">Liên hệ</option>
              <option value="system">Hệ thống</option>
              <option value="promo">Khuyến mãi</option>
            </select>
            <select class="form-input" [(ngModel)]="form.recipientType">
              <option value="all">Tất cả khách hàng</option>
              <option value="user">Theo tài khoản</option>
            </select>
            @if (form.recipientType === 'user') {
              <input class="form-input" placeholder="User ID" [(ngModel)]="form.recipient" />
            }
            <input class="form-input" placeholder="Link (tùy chọn)" [(ngModel)]="form.link" />
          </div>
          <div class="form-actions">
            <button type="button" class="btn-save" (click)="sendNotification()">Gửi ngay</button>
            <button type="button" class="btn-cancel" (click)="showForm.set(false)">Hủy</button>
          </div>
        </div>
      }

      <div class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Tiêu đề</th>
              <th>Nội dung</th>
              <th>Loại</th>
              <th>Đối tượng</th>
              <th>Trạng thái</th>
              <th>Ngày</th>
            </tr>
          </thead>
          <tbody>
            @for (n of notifications(); track n._id) {
              <tr [class.unread-row]="!n.sent">
                <td>{{ n.title }}</td>
                <td>{{ n.content?.slice(0, 60) }}...</td>
                <td>{{ n.type }}</td>
                <td>{{ n.recipient ? (n.recipient.name || '—') : 'Tất cả' }}</td>
                <td>
                  <span class="status-badge" [ngClass]="n.sent ? 'status-visible' : 'status-hidden'">
                    {{ n.sent ? 'Đã gửi' : 'Chưa gửi' }}
                  </span>
                </td>
                <td>{{ n.createdAt | date:'short' }}</td>
              </tr>
            } @empty {
              <tr><td colspan="6">Chưa có thông báo nào.</td></tr>
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
  readonly showForm = signal(false);
  readonly users = signal<any[]>([]);
  searchTerm = '';
  typeFilter = '';
  sentFilter = '';

  form: any = {
    title: '',
    content: '',
    type: 'system',
    recipientType: 'all',
    recipient: '',
    link: '',
  };

  readonly stats = computed(() => {
    const n = this.notifications();
    return {
      total: n.length,
      unsent: n.filter((x: any) => !x.sent).length,
      sent: n.filter((x: any) => x.sent).length,
    };
  });

  constructor() {
    this.loadNotifications();
  }

  onFilterChange(): void {
    this.page.set(1);
    this.loadNotifications();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.typeFilter = '';
    this.sentFilter = '';
    this.page.set(1);
    this.loadNotifications();
  }

  loadNotifications(): void {
    const params = new URLSearchParams({
      page: String(this.page()),
      limit: '20',
    });
    if (this.searchTerm) params.set('q', this.searchTerm);
    if (this.typeFilter) params.set('type', this.typeFilter);
    if (this.sentFilter) params.set('sent', this.sentFilter === 'sent' ? 'true' : 'false');

    this.http.get('/api/notifications?' + params.toString()).subscribe((r: any) => {
      const items = Array.isArray(r) ? r : (r.notifications || []);
      this.notifications.set(items);
      this.totalPages.set(r.totalPages || 1);
    });
  }

  resetForm(): void {
    this.form = { title: '', content: '', type: 'system', recipientType: 'all', recipient: '', link: '' };
  }

  sendNotification(): void {
    if (!this.form.title || !this.form.content) {
      this.toast.error('Vui lòng nhập tiêu đề và nội dung.');
      return;
    }

    const payload: any = {
      title: this.form.title,
      content: this.form.content,
      type: this.form.type,
      link: this.form.link,
    };

    if (this.form.recipientType === 'user' && this.form.recipient) {
      payload.recipient = this.form.recipient;
    }

    this.http.post('/api/notifications/send', payload).subscribe({
      next: () => {
        this.toast.success('Gửi thông báo thành công');
        this.loadNotifications();
        this.showForm.set(false);
        this.resetForm();
      },
      error: () => this.toast.error('Không thể gửi thông báo'),
    });
  }
}
