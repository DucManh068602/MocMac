import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from './toast.service';
import { ChatService } from '../chat.service';
import { AuthService } from '../auth.service';

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

      <div class="chat-section">
        <div class="chat-sidebar">
          <div class="chat-sidebar-header">
            <h3>Trò chuyện</h3>
            <button type="button" class="btn btn-small" (click)="chatService.loadConversations()">Làm mới</button>
          </div>
          <ul class="chat-conversations">
            @for (conv of conversations(); track conv.from) {
              <li
                class="chat-conv"
                [class.active]="selectedConv() === conv.from"
                (click)="selectConv(conv.from)"
              >
                <div class="chat-conv-name">{{ conv.fromName || conv.from }}</div>
                <div class="chat-conv-last">{{ conv.lastMessage }}</div>
                @if (conv.unread > 0) {
                  <span class="chat-conv-badge">{{ conv.unread }}</span>
                }
              </li>
            } @empty {
              <li class="chat-conv-empty">Chưa có tin nhắn nào.</li>
            }
          </ul>
        </div>

        @if (selectedConv()) {
          <div class="chat-main">
            <div class="chat-main-header">
              <span>Chat với {{ selectedConv() }}</span>
              <button type="button" class="chat-close-btn" (click)="selectedConv.set(null)">✕</button>
            </div>

            <ul #chatMsgList class="chat-messages-admin">
              @for (m of chatMessages(); track m._id || $index) {
                <li class="chat-msg" [class.mine]="m.from === adminUserId()">
                  <div class="chat-msg__text">{{ m.message }}</div>
                  <div class="chat-msg__time">{{ m.createdAt | date:'shortTime' }}</div>
                </li>
              }
            </ul>

            <form class="chat-input-form" (ngSubmit)="$event.preventDefault(); sendMsg()">
              <input
                #msgInput
                type="text"
                placeholder="Nhập tin nhắn..."
                [value]="msgText()"
                (input)="msgText.set($event.target.value)"
                maxlength="500"
              />
              <button type="submit" [disabled]="!msgText().trim() || !chatService.connected()">Gửi</button>
            </form>
          </div>
        } @else {
          <div class="chat-main-placeholder">
            <p>Chọn một cuộc trò chuyện để bắt đầu.</p>
          </div>
        }
      </div>
    </div>
  `,
  styleUrls: ['./admin-list.css', './contacts.css'],
})
export class AdminContactsComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  protected chatService = inject(ChatService);
  private auth = inject(AuthService);

  readonly contacts = signal<any[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(1);

  readonly stats = computed(() => ({
    total: this.contacts().length,
    unread: this.contacts().filter((c: any) => !c.read).length,
    replied: this.contacts().filter((c: any) => c.read).length,
  }));

  readonly conversations = computed(() => this.chatService.conversations());
  readonly selectedConv = signal<string | null>(null);
  readonly msgText = signal('');
  readonly adminUserId = computed(() => this.auth.user()?.id || null);
  private _notifyEffect = effect(() => {
    const msg = this.chatService.messageReceived();
    if (msg && msg.from !== this.adminUserId() && this.selectedConv() !== msg.from) {
      this.toast.info('Tin nhắn mới từ khách hàng');
    }
  });

  readonly chatMessages = computed(() => {
    const all = this.chatService.messages();
    const conv = this.selectedConv();
    if (!conv) return [];
    return all.filter((m) => m.from === conv || m.to === conv);
  });

  constructor() {
    this.loadContacts();
  }

  ngOnInit(): void {
    this.chatService.connect();
    this.chatService.loadConversations();
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

  selectConv(convId: string): void {
    this.selectedConv.set(convId);
    this.chatService.loadHistory(convId);
    this.chatService.markRead(convId);
    setTimeout(() => {
      const el = document.querySelector('.chat-messages-admin') as HTMLElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }

  sendMsg(): void {
    const text = this.msgText().trim();
    const conv = this.selectedConv();
    if (!text || !conv || !this.chatService.connected()) return;
    this.chatService.sendMessage(conv, text);
    this.msgText.set('');
    setTimeout(() => {
      const el = document.querySelector('.chat-messages-admin') as HTMLElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }
}
