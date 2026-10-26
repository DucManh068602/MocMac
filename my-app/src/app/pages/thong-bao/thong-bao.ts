import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
  readonly loading = signal(true);
  readonly markingAll = signal(false);
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
    this.http.get('/api/notifications?page=1&limit=50')
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
    if (this.markingAll()) return;
    this.markingAll.set(true);
    this.http.patch('/api/notifications/read-all', {})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications.update((n) => n.map((x) => ({ ...x, isRead: true })));
          this.markingAll.set(false);
        },
        error: () => this.markingAll.set(false),
      });
  }

  markRead(id: string): void {
    this.http.patch('/api/notifications/' + id + '/read', {})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications.update((n) =>
            n.map((x) => (x._id === id ? { ...x, isRead: true } : x)),
          );
        },
      });
  }
}
