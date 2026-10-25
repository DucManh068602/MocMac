import { Injectable, inject, signal, computed } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

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
    this.http.get('/api/chat/' + otherUserId).subscribe((r: any) => {
      const msgs: ChatMessage[] = Array.isArray(r) ? r : (r.messages || []);
      this.messages.set(msgs);
    });
  }

  loadConversations(): void {
    this.http.get('/api/chat/conversations').subscribe({
      next: (r: any) => {
        this.conversations.set(Array.isArray(r) ? r : (r.conversations || []));
        this.conversationsLoaded.set(true);
      },
      error: () => {
        this.conversationsLoaded.set(true);
      },
    });
  }
}
