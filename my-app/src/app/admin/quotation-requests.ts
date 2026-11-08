import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-admin-quotation-requests',
  standalone: false,
  templateUrl: './quotation-requests.html',
  styleUrl: './quotation-requests.css',
})
export class AdminQuotationRequestsComponent {
  private http = inject(HttpClient); private toast = inject(ToastService);

  readonly requests = signal<any[]>([]);
  readonly loading = signal(true);
  readonly viewing = signal<any | null>(null);

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true);
    this.http.get<any>('/api/quotation-requests').subscribe({
      next: r => { this.requests.set(r.requests || r || []); this.loading.set(false); },
      error: () => { this.toast.error('Không tải được yêu cầu báo giá.'); this.loading.set(false); },
    });
  }

  open(req: any): void { this.viewing.set(req); }
  close(): void { this.viewing.set(null); }

  updateStatus(id: string, status: string): void {
    this.http.patch(`/api/quotation-requests/${id}`, { status }).subscribe({
      next: () => { this.toast.success('Đã cập nhật trạng thái.'); this.load(); this.close(); },
      error: () => this.toast.error('Không thể cập nhật trạng thái.'),
    });
  }

  formatMoney(n: number): string { return (n || 0).toLocaleString('vi-VN') + 'đ'; }
}
