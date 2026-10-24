import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-notifications',
  standalone: false,
  styleUrls: ['./admin-list.css'],
  template: `
    <div class="list-page">
      <header class="list-header">
        <h2>Thông báo ({{ notifications().length }})</h2>
        <button type="button" class="btn-add" (click)="showForm.set(true)">Thêm</button>
      </header>

      @if (showForm()) {
        <div class="form-card">
          <h3>{{ editingNotif() ? 'Sửa' : 'Thêm' }} thông báo</h3>
          <div class="form-grid">
            <input class="form-input" placeholder="Tiêu đề" [(ngModel)]="form.title" />
            <textarea class="form-input" placeholder="Nội dung" [(ngModel)]="form.content"></textarea>
            <select class="form-input" [(ngModel)]="form.type">
              <option value="order">Đơn hàng</option>
              <option value="contact">Liên hệ</option>
              <option value="system">Hệ thống</option>
              <option value="promo">Khuyến mãi</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-save" (click)="saveNotif()">Lưu</button>
            <button type="button" class="btn-cancel" (click)="cancelForm()">Hủy</button>
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
              <th>Đã đọc</th>
              <th>Ngày</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            @for (n of notifications(); track n._id) {
              <tr>
                <td>{{ n.title }}</td>
                <td>{{ n.content }}</td>
                <td>{{ n.type }}</td>
                <td>{{ n.isRead ? 'Có' : 'Chưa' }}</td>
                <td>{{ n.createdAt | date:'short' }}</td>
                <td>
                  <button type="button" class="btn-small" (click)="markRead(n._id)">Đánh dấu đã đọc</button>
                  <button type="button" class="btn-small btn-delete" (click)="deleteNotif(n._id)">Xóa</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6">Chưa có thông báo nào.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AdminNotificationsComponent {
  private http = inject(HttpClient);
  readonly notifications = signal<any[]>([]);
  readonly showForm = signal(false);
  readonly editingNotif = signal<any>(null);
  form: any = { title: '', content: '', type: 'system' };

  constructor() {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.http.get('/api/notifications').subscribe((r: any) => this.notifications.set(r.notifications || []));
  }

  editNotif(n: any): void {
    this.editingNotif.set(n);
    this.form = { title: n.title, content: n.content, type: n.type };
    this.showForm.set(true);
  }

  saveNotif(): void {
    const f = this.form;
    const payload = { title: f.title, content: f.content, type: f.type };

    if (this.editingNotif()) {
      this.http.patch('/api/notifications/' + this.editingNotif()._id + '/read', { isRead: true }).subscribe();
    } else {
      this.http.post('/api/notifications', payload).subscribe(() => {
        this.loadNotifications();
        this.cancelForm();
      });
    }
  }

  markRead(id: string): void {
    this.http.patch('/api/notifications/' + id + '/read', {}).subscribe(() => this.loadNotifications());
  }

  deleteNotif(id: string): void {
    if (confirm('Xóa thông báo này?')) {
      this.http.delete('/api/notifications/' + id).subscribe(() => this.loadNotifications());
    }
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingNotif.set(null);
    this.form = { title: '', content: '', type: 'system' };
  }
}
