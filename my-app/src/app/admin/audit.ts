import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from './toast.service';
import { ConfirmService } from './confirm.service';

@Component({
  selector: 'app-admin-audit',
  standalone: false,
  template: `
    <div class="list-page">
      <header class="list-header">
        <div>
          <h2>Lịch sử hệ thống</h2>
          <p class="header-sub">Theo dõi hoạt động quản trị, dữ liệu và lỗi hệ thống.</p>
        </div>
        <div class="header-actions">
          <button type="button" class="btn-refresh" (click)="loadLogs()" [disabled]="loading()">{{ loading() ? 'Đang tải...' : 'Làm mới' }}</button>
          @if (logs().length > 0) {
            <button type="button" class="btn-danger" (click)="clearLogs()">Xóa tất cả</button>
          }
        </div>
      </header>

      <div class="stats-grid">
        <div class="stat-card stat--moss"><span class="stat-value">{{ total() }}</span><span class="stat-label">Tổng bản ghi</span></div>
        <div class="stat-card stat--clay"><span class="stat-value">{{ todayCount() }}</span><span class="stat-label">Hôm nay (trang này)</span></div>
        <div class="stat-card stat--earth"><span class="stat-value">{{ successCount() }}</span><span class="stat-label">Thành công</span></div>
        <div class="stat-card stat--sage"><span class="stat-value">{{ failedCount() }}</span><span class="stat-label">Lỗi</span></div>
      </div>

      <div class="table-wrap">
        <table class="admin-table audit-table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Hành động</th>
              <th>Đối tượng</th>
              <th>Người thực hiện</th>
              <th>Trạng thái</th>
              <th>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            @for (l of logs(); track l._id) {
              <tr [class.failed-row]="l.status === 'failed'">
                <td class="time-cell">
                  <strong>{{ l.createdAt | date:'dd/MM/yyyy' }}</strong>
                  <span>{{ l.createdAt | date:'HH:mm:ss' }}</span>
                </td>
                <td>
                  <div class="action-title">{{ actionLabel(l.action) }}</div>
                  <div class="action-code">{{ l.action || '—' }}</div>
                </td>
                <td>
                  <span class="resource-badge">{{ resourceLabel(l.resourceType) }}</span>
                  @if (l.resourceId?._id || l.resourceId) {
                    <div class="resource-id">ID: {{ shortId(l.resourceId?._id || l.resourceId) }}</div>
                  }
                </td>
                <td>
                  <div class="actor-name">{{ actorName(l) }}</div>
                  <div class="actor-meta">{{ l.userRole || '—' }}@if (l.ip) { · {{ l.ip }} }</div>
                </td>
                <td>
                  <span class="status-badge" [class.status-ok]="l.status !== 'failed'" [class.status-fail]="l.status === 'failed'">
                    {{ l.status === 'failed' ? 'Lỗi' : 'Thành công' }}
                  </span>
                </td>
                <td class="details-cell">
                  @if (detailSummary(l.details); as summary) {
                    <div class="detail-summary">{{ summary }}</div>
                  }
                  @if (hasDetails(l.details)) {
                    <details class="detail-more">
                      <summary>Xem dữ liệu</summary>
                      <pre>{{ formatDetails(l.details) }}</pre>
                    </details>
                  } @else {
                    <span class="muted">—</span>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="empty-cell">{{ loading() ? 'Đang tải lịch sử...' : 'Chưa có bản ghi nào.' }}</td></tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination [currentPage]="page()" [totalPages]="totalPages()" (pageChange)="page.set($event); loadLogs()"></app-pagination>
    </div>
  `,
  styleUrls: ['./admin-list.css', './audit.css'],
})
export class AdminAuditComponent {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  readonly logs = signal<any[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly todayCount = signal(0);
  readonly successCount = signal(0);
  readonly failedCount = signal(0);

  constructor() { this.loadLogs(); }

  loadLogs(): void {
    this.loading.set(true);
    this.http.get('/api/audit-logs?page=' + this.page() + '&limit=20').subscribe({
      next: (r: any) => {
        const items = Array.isArray(r) ? r : (r.logs || []);
        this.logs.set(items);
        this.totalPages.set(r.totalPages || 1);
        this.total.set(r.total || items.length);
        const today = new Date().toISOString().slice(0, 10);
        this.todayCount.set(items.filter((l: any) => l.createdAt && new Date(l.createdAt).toISOString().slice(0, 10) === today).length);
        this.successCount.set(items.filter((l: any) => l.status !== 'failed').length);
        this.failedCount.set(items.filter((l: any) => l.status === 'failed').length);
        this.loading.set(false);
      },
      error: () => { this.toast.error('Không tải được lịch sử hệ thống.'); this.loading.set(false); },
    });
  }

  async clearLogs(): Promise<void> {
    const ok = await this.confirm.confirm({ title: 'Xác nhận xóa', message: 'Xóa toàn bộ lịch sử hệ thống? Hành động này không thể hoàn tác.', confirmText: 'Xóa tất cả', danger: true });
    if (!ok) return;
    this.http.delete('/api/audit-logs').subscribe({
      next: (r: any) => { this.toast.success(r?.message || 'Đã xóa lịch sử hệ thống.'); this.page.set(1); this.loadLogs(); },
      error: () => this.toast.error('Không thể xóa lịch sử hệ thống.'),
    });
  }

  actionLabel(action = ''): string {
    const map: Record<string, string> = {
      'coupon.create': 'Tạo mã giảm giá', 'coupon.update': 'Cập nhật mã giảm giá', 'coupon.delete': 'Xóa mã giảm giá', 'coupon.validate_error': 'Lỗi kiểm tra mã giảm giá',
      'product.create': 'Tạo sản phẩm', 'product.update': 'Cập nhật sản phẩm', 'product.delete': 'Xóa sản phẩm',
      'order.create': 'Tạo đơn hàng', 'order.update': 'Cập nhật đơn hàng', 'order.delete': 'Xóa đơn hàng',
      'review.create': 'Tạo đánh giá', 'review.reply': 'Phản hồi đánh giá', 'review.delete': 'Xóa đánh giá',
      'user.create': 'Tạo người dùng', 'user.update': 'Cập nhật người dùng', 'user.delete': 'Xóa người dùng',
      'quotation.create': 'Tạo yêu cầu báo giá', 'quotation.update': 'Cập nhật báo giá', 'quotation.update_quote': 'Gửi/áp mã báo giá', 'quotation.update_status': 'Đổi trạng thái báo giá', 'quotation.accept': 'Khách đồng ý báo giá',
    };
    if (map[action]) return map[action];
    return action ? action.replace(/[._-]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()) : 'Hoạt động hệ thống';
  }

  resourceLabel(type = ''): string {
    const map: Record<string, string> = { Coupon: 'Mã giảm giá', Product: 'Sản phẩm', Order: 'Đơn hàng', Review: 'Đánh giá', User: 'Người dùng', QuotationRequest: 'Báo giá quà tặng', AuditLog: 'Lịch sử hệ thống' };
    return map[type] || type || 'Hệ thống';
  }

  actorName(l: any): string { return l?.userId?.name || l?.userId?.email || l?.userEmail || 'Hệ thống'; }
  shortId(v: any): string { const s = String(v || ''); return s.length > 8 ? s.slice(-8) : s || '—'; }
  hasDetails(d: any): boolean { return !!d && (typeof d !== 'object' || Object.keys(d).length > 0); }
  detailSummary(d: any): string {
    if (!d || typeof d !== 'object') return typeof d === 'string' ? d : '';
    const parts: string[] = [];
    if (d.code) parts.push(`Mã: ${d.code}`);
    if (d.customer) parts.push(`Khách: ${d.customer}`);
    if (d.coupon) parts.push(`Coupon: ${d.coupon}`);
    if (d.quotedTotal != null) parts.push(`Giá báo: ${Number(d.quotedTotal).toLocaleString('vi-VN')}đ`);
    if (d.name) parts.push(`Tên: ${d.name}`);
    if (d.email && !d.customer) parts.push(`Email: ${d.email}`);
    if (d.status) parts.push(`Trạng thái: ${d.status}`);
    if (d.error) parts.push(`Lỗi: ${d.error}`);
    return parts.join(' · ');
  }
  formatDetails(d: any): string { if (!d) return ''; try { return typeof d === 'string' ? d : JSON.stringify(d, null, 2); } catch { return String(d); } }
}