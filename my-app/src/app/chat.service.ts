import { Injectable, inject, signal, computed } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { I18nService } from './i18n.service';

export interface ChatMessage {
  _id: string;
  from: string;
  to: string;
  message: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private i18n = inject(I18nService);

  private _socket: Socket | null = null;
  readonly currentUserId = signal<string | null>(null);

  readonly messages = signal<ChatMessage[]>([]);
  readonly connected = signal(false);
  readonly conversations = signal<any[]>([]);
  readonly conversationsLoaded = signal(false);
  readonly messageReceived = signal<ChatMessage | null>(null);
  readonly unreadCount = computed(() => {
    const me = this.currentUserId();
    return this.messages().filter((m) => !m.read && m.from !== me).length;
  });

  connect(): void {
    if (this._socket && this._socket.connected) return;

    const token = localStorage.getItem('mocmac-auth-token') ?? sessionStorage.getItem('mocmac-auth-token');
    const user = this.auth.user();

    let query: Record<string, string> = {};
    if (token) {
      query = {};
    } else {
      let guestId = localStorage.getItem('mocmac-guest-id');
      if (!guestId) {
        guestId = crypto.randomUUID();
        localStorage.setItem('mocmac-guest-id', guestId);
      }
      query = { guestId };
    }

    this._socket = io('http://localhost:3000', {
      auth: token ? { token } : {},
      query,
      transports: ['websocket', 'polling'],
    });

    this._socket.on('connect', () => {
      this.connected.set(true);
      this.currentUserId.set(user ? String(user.id) : (query['guestId'] ?? this._socket!.id));
    });

    this._socket.on('chat:message', (data: ChatMessage) => {
      this.messages.update((m) => [...m, data]);
      this.messageReceived.set(data);
    });

    this._socket.on('chat:mark-read', (data: { from: string }) => {
      this.messages.update((m) =>
        m.map((x) => (x.from === data.from ? { ...x, read: true } : x)),
      );
    });

    this._socket.on('disconnect', () => {
      this.connected.set(false);
    });
  }

  disconnect(): void {
    if (this._socket) {
      this._socket.disconnect();
      this._socket = null;
    }
    this.connected.set(false);
  }

  sendMessage(to: string, message: string): void {
    if (!this._socket || !this._socket.connected) return;
    this._socket.emit('chat:send', { to, message });
  }

  markRead(from: string): void {
    if (!this._socket || !this._socket.connected) return;
    this._socket.emit('chat:mark-read', { from });
    this.messages.update((m) =>
      m.map((x) => (x.from === from && !x.read ? { ...x, read: true } : x)),
    );
  }

  clearMessages(): void {
    this.messages.set([]);
  }

  loadHistory(otherUserId: string): void {
    this.http.get(`${this.apiBase}/api/chat/${otherUserId}`).subscribe((r: any) => {
      const msgs: ChatMessage[] = Array.isArray(r) ? r : (r.messages || []);
      this.messages.set(msgs);
    });
  }

  readonly aiMessages = signal<{ from: 'user'|'ai'; text: string; at: string; streaming?: boolean; actions?: any[] }[]>([
    { from: 'ai', text: 'Chào bạn! Mình là Agent Mộc Mạc — mình có thể tư vấn sản phẩm, tra mã giảm giá/đơn hàng, và hỗ trợ mở trang hoặc thêm sản phẩm vào giỏ giúp bạn.', at: new Date().toISOString() }
  ]);
  readonly aiLoading = signal(false);
  readonly agentActions = signal<any[]>([]);
  private streamTimer: any = null;
  private apiBase = 'http://localhost:3000';

  askAi(message: string) {
    const msg = String(message || '').trim();
    if (!msg || this.aiLoading()) return;
    if (this.streamTimer) { clearInterval(this.streamTimer); this.streamTimer = null; }
    this.aiMessages.update(m => [...m, { from: 'user', text: msg, at: new Date().toISOString() }]);
    const aiAt = new Date().toISOString();
    this.aiMessages.update(m => [...m, { from: 'ai', text: '', at: aiAt, streaming: true }]);
    this.aiLoading.set(true);
    this.http.post<any>(`${this.apiBase}/api/ai/chat`, { message: msg, lang: this.i18n.lang() }).subscribe({
      next: (r) => {
        const full = String(r?.answer || r || 'Mình chưa có phản hồi phù hợp.').trim();
        const actions = Array.isArray(r?.actions) ? r.actions : [];
        this.aiLoading.set(false);
        if (actions.length) this.agentActions.set(actions);
        this.aiMessages.update(ms => ms.map(m => (m.from === 'ai' && m.at === aiAt) ? { ...m, actions } : m));
        this.streamText(full, aiAt);
      },
      error: (err) => {
        const msg = err?.error?.answer || 'Xin lỗi, Agent Mộc Mạc đang bận. Vui lòng thử lại sau.';
        this.aiLoading.set(false);
        this.replaceStreaming(String(msg), aiAt);
      }
    });
  }

  private replaceStreaming(text: string, at: string) {
    this.aiMessages.update(ms => ms.map(m => (m.from === 'ai' && m.at === at) ? { ...m, text, streaming: false } : m));
  }

  private streamText(full: string, at: string) {
    if (this.streamTimer) clearInterval(this.streamTimer);
    // reveal in small chunks for a smooth "streamify" effect
    const chars = Array.from(full);
    let i = 0;
    const step = Math.max(1, Math.floor(chars.length / 140)); // ~140 ticks
    this.streamTimer = setInterval(() => {
      i = Math.min(chars.length, i + step);
      const part = chars.slice(0, i).join('');
      this.replaceStreaming(part, at);
      if (i >= chars.length) {
        clearInterval(this.streamTimer);
        this.streamTimer = null;
        this.aiMessages.update(ms => ms.map(m => (m.from === 'ai' && m.at === at) ? { ...m, text: full, streaming: false } : m));
      }
    }, 18);
  }

  loadConversations(): void {
    this.http.get(`${this.apiBase}/api/chat/conversations`).subscribe({
      next: (r: any) => {
        this.conversations.set(Array.isArray(r) ? r : (r.conversations || []));
        this.conversationsLoaded.set(true);
      },
      error: () => this.conversationsLoaded.set(true),
    });
  }
}
