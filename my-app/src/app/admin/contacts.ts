import { Component, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-admin-contacts',
  standalone: false,
  template: `
    <div class="list-page">
      <header class="list-header">
        <h2>Tin nhắn liên hệ ({{ contacts().length }})</h2>
      </header>

      <div class="stats-grid">
        <div class="stat-card stat--moss">
          <span class="stat-value">{{ stats().total }}</span>
          <span class="stat-label">Tổng tin</span>
        </div>
        <div class="stat-card stat--clay">
          <span class="stat-value">{{ stats().unread }}</span>
          <span class="stat-label">Chưa đọc</span>
        </div>
        <div class="stat-card stat--sage">
          <span class="stat-value">{{ stats().replied }}</span>
          <span class="stat-label">Đã trả lời</span>
        </div>
      </div>

      <div class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Nội dung</th>
              <th>Trạng thái</th>
              <th>Ngày</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            @for (c of contacts(); track c._id) {
              <tr [class.unread-row]="!c.read">
                <td>{{ c.name }}</td>
                <td>{{ c.email }}</td>
                <td>{{ c.message?.slice(0, 60) }}...</td>
                <td>{{ c.read ? 'Đã đọc' : 'Mới' }}</td>
                <td>{{ c.createdAt | date:'short' }}</td>
                <td>
                  <button type="button" class="btn-small btn-delete" (click)="markRead(c._id)">Đánh dấu đã đọc</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6">Chưa có tin nhắn.</td></tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination
        [currentPage]="page()"
        [totalPages]="totalPages()"
        (pageChange)="page.set($event); loadContacts()"
      ></app-pagination>
    </div>
  `,
  styleUrls: ['./admin-list.css'],
})
export class AdminContactsComponent {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  readonly contacts = signal<any[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(1);

  readonly stats = computed(() => ({
    total: this.contacts().length,
    unread: this.contacts().filter((c: any) => !c.read).length,
    replied: this.contacts().filter((c: any) => c.read).length,
  }));

  constructor() {
    this.loadContacts();
  }

  loadContacts(): void {
    this.http.get('/api/contacts?page=' + this.page() + '&limit=20').subscribe((r: any) => {
      const items = Array.isArray(r) ? r : (r.contacts || []);
      this.contacts.set(items);
      this.totalPages.set(r.totalPages || 1);
    });
  }

  markRead(id: string): void {
    this.http.patch('/api/contacts/' + id + '/read', {}).subscribe({
      next: () => { this.toast.success('Đã đánh dấu tin nhắn'); this.loadContacts(); },
      error: () => this.toast.error('Không thể cập nhật trạng thái'),
    });
  }
}
