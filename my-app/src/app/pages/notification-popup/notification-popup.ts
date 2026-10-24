import { Component, inject, computed } from '@angular/core';
import { NotificationService } from '../../notification.service';

@Component({
  selector: 'app-notification-popup',
  standalone: false,
  template: `
    <div class="notification-popup" role="region" aria-live="polite">
      @for (n of items(); track $index) {
        <div class="notification-toast" [ngClass]="'notification-toast--' + n.type">
          <div class="notification-toast__content">
            <strong class="notification-toast__title">{{ n.title }}</strong>
            <p class="notification-toast__message">{{ n.content }}</p>
          </div>
          <button type="button" class="notification-toast__close" (click)="remove($index)" aria-label="Đóng">x</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .notification-popup {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      z-index: 5000;
    }
    .notification-toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 18px 14px 44px;
      border-radius: 10px;
      background: #fff;
      border: 1px solid #e4ddc8;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
      min-width: 300px;
      max-width: 420px;
      position: relative;
      font-family: 'Segoe UI', 'Be Vietnam Pro', system-ui, sans-serif;
      font-size: 13px;
      line-height: 1.5;
      animation: slideIn 0.3s ease;
    }
    .notification-toast--order { border-left: 4px solid #435731; }
    .notification-toast--contact { border-left: 4px solid #b85b3e; }
    .notification-toast--system { border-left: 4px solid #7c9468; }
    .notification-toast--promo { border-left: 4px solid #aa4d2d; }
    .notification-toast__content { flex: 1; }
    .notification-toast__title {
      display: block;
      font-weight: 600;
      color: #2b2a22;
      font-size: 14px;
      margin-bottom: 4px;
    }
    .notification-toast__message { margin: 0; color: #6b6a5c; }
    .notification-toast__close {
      position: absolute;
      top: 6px;
      right: 10px;
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: #999;
      line-height: 1;
      padding: 0;
      width: 20px;
      height: 20px;
    }
    .notification-toast__close:hover { color: #333; }
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `],
})
export class NotificationPopupComponent {
  private svc = inject(NotificationService);

  readonly items = computed(() => this.svc.notifications());

  remove(index: number): void {
    this.svc.markRead(index);
  }
}
