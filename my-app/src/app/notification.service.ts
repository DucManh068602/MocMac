import { Injectable, inject, signal, computed } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';

export interface NotificationData {
  title: string;
  content: string;
  type: string;
  link: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private auth = inject(AuthService);

  private _socket: Socket | null = null;
  readonly notifications = signal<NotificationData[]>([]);
  readonly unreadCount = computed(() => this.notifications().length);

  connect(): void {
    const token = localStorage.getItem('mocmac-auth-token') ?? sessionStorage.getItem('mocmac-auth-token');
    if (!token) return;

    if (this._socket) {
      this._socket.disconnect();
    }

    this._socket = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this._socket.on('connect', () => {
      console.log('Socket connected:', this._socket?.id);
    });

    this._socket.on('notification', (data: NotificationData) => {
      this.notifications.update((n) => [...n, data]);
    });

    this._socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  }

  disconnect(): void {
    if (this._socket) {
      this._socket.disconnect();
      this._socket = null;
    }
  }

  markRead(id: number): void {
    this.notifications.update((n) => n.filter((_, i) => i !== id));
  }

  getRemaining(): NotificationData[] {
    return this.notifications();
  }
}
