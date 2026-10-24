import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-thong-bao',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="wrap">
      <div class="notif-header">
        <h1>Thông báo của tôi</h1>
        <button type="button" class="btn-clear" (click)="markAllRead()">Đánh dấu đã đọc</button>
      </div>

      @if (loading()) {
        <p class="loading">Đang tải thông báo...</p>
      }

      @if (notifications().length === 0 && !loading()) {
        <div class="empty">
          <p>Không có thông báo nào.</p>
        </div>
      }

      @if (notifications().length > 0) {
        <div class="notif-list">
          @for (n of notifications(); track n._id) {
            <div class="notif-item" [class.unread]="!n.isRead"
                 (mouseenter)="hovered.set(n)"
                 (mouseleave)="hovered.set(null)">
              <div class="notif-main" [routerLink]="n.link || '/thong-bao'">
                <h3>{{ n.title }}</h3>
                <p class="notif-preview">{{ n.content?.slice(0, 100) }}{{ n.content?.length > 100 ? '...' : '' }}</p>
                <small class="notif-time">{{ n.createdAt | date:'short' }}</small>
              </div>

              @if (hovered() === n && n.content) {
                <div class="notif-popup">
                  <div class="notif-popup__inner">
                    <h4>{{ n.title }}</h4>
                    <p>{{ n.content }}</p>
                    @if (n.link) {
                      <a [routerLink]="n.link" class="notif-popup__link">Xem chi tiết</a>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .wrap {
      max-width: 800px;
      margin: 0 auto;
      padding: 24px 16px;
    }
    .notif-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .notif-header h1 {
      font-size: 20px;
      color: #435731;
    }
    .btn-clear {
      background: #435731;
      color: white;
      border: none;
      padding: 6px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
    }
    .btn-clear:hover { background: #35472A; }
    .loading { color: #6b6a5c; }
    .empty { text-align: center; padding: 40px; color: #999; }
    .notif-list { display: flex; flex-direction: column; gap: 0; }
    .notif-item {
      position: relative;
      padding: 16px;
      border-bottom: 1px solid #e4ddc8;
      transition: background 0.2s;
      cursor: pointer;
    }
    .notif-item:hover { background: #f9f8f4; }
    .notif-item.unread { background: rgba(67, 87, 49, 0.03); border-left: 3px solid #435731; }
    .notif-main { display: flex; flex-direction: column; gap: 4px; }
    .notif-main h3 { margin: 0; font-size: 15px; color: #2b2a22; }
    .notif-preview { margin: 4px 0; color: #6b6a5c; font-size: 13px; line-height: 1.5; }
    .notif-time { font-size: 11px; color: #aaa; }
    .notif-popup {
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      background: white;
      border: 1px solid #e4ddc8;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.12);
      min-width: 260px;
      max-width: 320px;
      z-index: 10;
      pointer-events: none;
      animation: fadeIn 0.2s ease;
    }
    .notif-popup::before {
      content: '';
      position: absolute;
      left: -8px;
      top: 50%;
      transform: translateY(-50%);
      border: 4px solid transparent;
      border-right-color: white;
    }
    .notif-popup__inner h4 { margin: 0 0 8px; font-size: 14px; color: #2b2a22; }
    .notif-popup__inner p { margin: 0 0 8px; font-size: 13px; color: #6b6a5c; line-height: 1.5; }
    .notif-popup__link {
      font-size: 12px;
      color: #435731;
      font-weight: 600;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-50%) scale(0.95); }
      to { opacity: 1; transform: translateY(-50%) scale(1); }
    }
  `],
})
export class ThongbaoComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);

  readonly notifications = signal<any[]>([]);
  readonly loading = signal(true);
  readonly hovered = signal<any>(null);
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotifications(): void {
    this.loading.set(true);
    this.http.get('/api/notifications/mine?page=1&limit=20')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (r: any) => {
          const items = Array.isArray(r) ? r : (r.notifications || []);
          this.notifications.set(items);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  markAllRead(): void {
    this.http.patch('/api/notifications/mine/read-all', {})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.loadNotifications(),
        error: () => {},
      });
  }
}
