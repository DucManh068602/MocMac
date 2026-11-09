import { Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

type NotifyType = '' | 'promo' | 'system' | 'order';

@Component({
  selector: 'app-thong-bao',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './thong-bao.html',
  styleUrls: ['./thong-bao.css'],
})
export class ThongbaoComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);

  readonly notifications = signal<any[]>([]);
  readonly unread = signal(0);
  readonly loading = signal(true);
  readonly markingAll = signal(false);
  readonly typeFilter = signal<NotifyType>('');
  readonly filtered = computed(() => {
    const t = this.typeFilter();
    const items = this.notifications() || [];
    return t ? items.filter((n) => n.type === t) : items;
  });
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void { this.loadNotifications(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  setFilter(t: NotifyType): void { this.typeFilter.set(t); }

  loadNotifications(): void {
    this.loading.set(true);
    this.http.get<any>('/api/notifications/mine?page=1&limit=100').pipe(takeUntil(this.destroy$)).subscribe({
      next: (r) => {
        const items = Array.isArray(r) ? r : (r.notifications || []);
        this.notifications.set(items);
        this.unread.set(Number(r?.unread ?? items.filter((x: any) => !x.isRead).length));
        this.loading.set(false);
      },
      error: () => { this.notifications.set([]); this.unread.set(0); this.loading.set(false); },
    });
  }

  markAllRead(): void {
    if (this.markingAll() || this.unread() === 0) return;
    this.markingAll.set(true);
    this.http.patch('/api/notifications/mine/read-all', {}).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.notifications.update((n) => n.map((x) => ({ ...x, isRead: true }))); this.unread.set(0); this.markingAll.set(false); },
      error: () => this.markingAll.set(false),
    });
  }

  markRead(id: string): void {
    this.http.patch('/api/notifications/mine/' + id + '/read', {}).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.notifications.update((n) => n.map((x) => (x._id === id ? { ...x, isRead: true } : x)));
        this.unread.set(this.notifications().filter((x) => !x.isRead).length);
      },
    });
  }

  typeLabel(t: string): string {
    return ({ promo: 'Mã giảm giá', order: 'Đơn hàng', contact: 'Liên hệ', system: 'Hệ thống' } as any)[t] || 'Thông báo';
  }
}