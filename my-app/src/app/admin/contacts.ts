import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-contacts',
  standalone: false,
  styleUrls: ['./admin-list.css'],
  template: `
    <div class="list-page">
      <header class="list-header">
        <h2>Liên hệ ({{ contacts().length }})</h2>
      </header>
      <div class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Tên</th>
              <th>Email</th>
              <th>Điện thoại</th>
              <th>Chủ đề</th>
              <th>Trạng thái</th>
              <th>Ngày</th>
            </tr>
          </thead>
          <tbody>
            @for (c of contacts(); track c._id) {
              <tr>
                <td>{{ c.name }}</td>
                <td>{{ c.email }}</td>
                <td>{{ c.phone || '—' }}</td>
                <td>{{ c.subject || '—' }}</td>
                <td>
                  <select (change)="updateStatus(c._id, $event)">
                    <option value="new" [selected]="c.status === 'new'">Mới</option>
                    <option value="processing" [selected]="c.status === 'processing'">Đang xử lý</option>
                    <option value="done" [selected]="c.status === 'done'">Hoàn thành</option>
                  </select>
                </td>
                <td>{{ c.createdAt | date:'short' }}</td>
              </tr>
            } @empty {
              <tr><td colspan="6">Chưa có liên hệ nào.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AdminContactsComponent {
  private http = inject(HttpClient);
  readonly contacts = signal<any[]>([]);

  constructor() {
    this.http.get('/api/contacts').subscribe((r: any) => this.contacts.set(r.contacts || []));
  }

  updateStatus(id: string, event: Event): void {
    const status = (event.target as HTMLSelectElement).value;
    this.http.patch('/api/contacts/' + id + '/status', { status }).subscribe(() => {
      this.contacts.update(list => list.map(c => c._id === id ? { ...c, status } : c));
    });
  }
}
