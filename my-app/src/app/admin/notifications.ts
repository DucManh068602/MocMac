import { Component, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from './toast.service';

type NotifyTab = 'promo' | 'order' | 'contact' | 'system';

@Component({
  selector: 'app-admin-notifications',
  standalone: false,
  template: `
    <div class="list-page">
      <header class="list-header">
        <div>
          <h2>Thông báo</h2>
          <p class="page-sub">Gửi mã giảm giá theo hạng hội viên, gửi thông báo hệ thống, theo dõi đơn hàng và liên hệ.</p>
        </div>
      </header>

      <div class="notify-tabs">
        <button type="button" class="notify-tab" [class.active]="tab()==='promo'" (click)="setTab('promo')"><span class="tab-icon">%</span> Mã giảm giá</button>
        <button type="button" class="notify-tab" [class.active]="tab()==='system'" (click)="setTab('system')"><span class="tab-icon">HT</span> Hệ thống</button>
        <button type="button" class="notify-tab" [class.active]="tab()==='order'" (click)="setTab('order')"><span class="tab-icon">ĐH</span> Đơn hàng</button>
        <button type="button" class="notify-tab" [class.active]="tab()==='contact'" (click)="setTab('contact')"><span class="tab-icon">LH</span> Liên hệ</button>
      </div>

      @if (tab() === 'promo') {
        <section class="section-card">
          <div class="section-head">
            <h3>Gửi thông báo mã giảm giá</h3>
            <p>Chọn mã, chọn đối tượng (Chung tất cả hoặc Bạc/Vàng/Kim Cương), kiểm tra nội dung rồi gửi.</p>
          </div>
          <div class="form-grid notif-form-grid">
            <label class="field field-wide">Mã giảm giá
              <select class="form-input" [ngModel]="selectedCouponId" (ngModelChange)="selectCoupon($event)">
                <option value="">-- Chọn mã giảm giá --</option>
                @for (c of coupons(); track c._id) { <option [value]="c._id">{{ c.code }} · {{ couponSummary(c) }} · {{ c.status || (c.active ? 'hoạt động' : 'vô hiệu') }}</option> }
              </select>
            </label>

            @if (selectedCoupon(); as c) {
              <div class="coupon-preview-box">
                <div class="coupon-preview-code">{{ c.code }}</div>
                <div class="coupon-preview-meta">
                  <span><strong>Ưu đãi:</strong> {{ couponSummary(c) }}</span>
                  <span><strong>Số lượng:</strong> {{ c.usageLimit ? (c.usageLimit + ' lượt') : 'Không giới hạn' }}</span>
                  <span><strong>Đã dùng:</strong> {{ c.usedCount || 0 }}</span>
                  <span><strong>Hạn dùng:</strong> {{ formatDate(c.expiryDate) }}</span>
                  <span><strong>Đơn tối thiểu:</strong> {{ c.minOrderValue ? formatMoney(c.minOrderValue) : 'Không' }}</span>
                  @if (c.maxDiscount) { <span><strong>Giảm tối đa:</strong> {{ formatMoney(c.maxDiscount) }}</span> }
                </div>
              </div>
            }

            <div class="target-box">
              <div class="field-label">Đối tượng nhận</div>
              <div class="target-options">
                <label class="target-option" [class.active]="recipientType==='all'">
                  <input type="radio" name="recipientType" [checked]="recipientType==='all'" (change)="recipientType='all'; applyCouponTitle()" />
                  <span><strong>Chung (tất cả thành viên)</strong><small>Gửi vào mục thông báo của tất cả tài khoản đang hoạt động</small></span>
                </label>
                <label class="target-option" [class.active]="recipientType==='tiers'">
                  <input type="radio" name="recipientType" [checked]="recipientType==='tiers'" (change)="recipientType='tiers'; applyCouponTitle()" />
                  <span><strong>Hội viên Bạc / Vàng / Kim Cương</strong><small>Gửi riêng cho từng thành viên thuộc hạng đã chọn</small></span>
                </label>
              </div>
              @if (recipientType === 'tiers') {
                <div class="tier-targets">
                  <div class="tier-target-title">Chọn hạng hội viên</div>
                  <label class="tier-check"><input type="checkbox" [checked]="tierOn('bac')" (change)="setTier('bac',$any($event.target).checked)" /> Bạc</label>
                  <label class="tier-check"><input type="checkbox" [checked]="tierOn('vang')" (change)="setTier('vang',$any($event.target).checked)" /> Vàng</label>
                  <label class="tier-check"><input type="checkbox" [checked]="tierOn('kimcuong')" (change)="setTier('kimcuong',$any($event.target).checked)" /> Kim Cương</label>
                </div>
              }
            </div>

            <label class="field field-wide">Tiêu đề thông báo <input class="form-input" [(ngModel)]="formTitle" placeholder="Admin gửi mã giảm giá..." /></label>
            <label class="field field-wide">Nội dung thông báo <textarea class="form-input notif-content" rows="6" [(ngModel)]="formContent" placeholder="Nhập nội dung, ưu đãi, số lượng, hạn dùng..."></textarea></label>
            <label class="field field-wide">Link (tùy chọn) <input class="form-input" [(ngModel)]="formLink" placeholder="/san-pham" /></label>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-save" (click)="sendPromo()" [disabled]="sending()">{{ sending() ? 'Đang gửi...' : 'Gửi thông báo mã giảm giá' }}</button>
          </div>
        </section>

        <section class="section-card">
          <div class="section-head"><h3>Lịch sử thông báo mã giảm giá</h3><p>Mỗi thẻ là một bản ghi gửi đến người nhận. Gửi chung/theo hạng sẽ tạo nhiều bản ghi để từng người xem trong mục thông báo của họ.</p></div>
          <ng-container *ngTemplateOutlet="historyTools"></ng-container>
          <div class="promo-list">
            @for (n of filteredNotifications(); track n._id) {
              <article class="promo-item">
                <div class="promo-item-head">
                  <div class="promo-badges">
                    <span class="badge badge-promo">Mã giảm giá</span>
                    <span class="badge" [class.badge-sent]="n.sent" [class.badge-draft]="!n.sent">{{ n.sent ? 'Đã gửi' : 'Chưa gửi' }}</span>
                    <span class="badge badge-target">{{ targetLabel(n) }}</span>
                  </div>
                  <time class="promo-time">{{ n.createdAt | date:'dd/MM/yyyy HH:mm' }}</time>
                </div>
                <h4 class="promo-title">{{ n.title }}</h4>
                <div class="promo-content">{{ n.content }}</div>
              </article>
            } @empty { <div class="empty-state">Chưa có thông báo mã giảm giá.</div> }
          </div>
          <app-pagination [currentPage]="page()" [totalPages]="totalPages()" (pageChange)="page.set($event); loadNotifications()"></app-pagination>
        </section>
      }

      @if (tab() === 'system') {
        <section class="section-card">
          <div class="section-head"><h3>Gửi thông báo hệ thống</h3><p>Thông báo chung/hệ thống gửi vào mục thông báo của tất cả tài khoản đang hoạt động.</p></div>
          <div class="form-grid notif-form-grid">
            <label class="field field-wide">Tiêu đề <input class="form-input" [(ngModel)]="systemTitle" placeholder="Thông báo từ Mộc Mạc..." /></label>
            <label class="field field-wide">Nội dung <textarea class="form-input notif-content" rows="5" [(ngModel)]="systemContent"></textarea></label>
            <label class="field field-wide">Link (tùy chọn) <input class="form-input" [(ngModel)]="systemLink" placeholder="/thong-bao" /></label>
          </div>
          <div class="form-actions"><button type="button" class="btn-save" (click)="sendSystem()" [disabled]="sending()">{{ sending() ? 'Đang gửi...' : 'Gửi thông báo hệ thống' }}</button></div>
        </section>
        <section class="section-card">
          <div class="section-head"><h3>Lịch sử thông báo hệ thống</h3></div>
          <ng-container *ngTemplateOutlet="historyTools"></ng-container>
          <div class="promo-list">
            @for (n of filteredNotifications(); track n._id) {
              <article class="promo-item">
                <div class="promo-item-head">
                  <div class="promo-badges"><span class="badge badge-system">Hệ thống</span><span class="badge badge-target">{{ targetLabel(n) }}</span></div>
                  <time class="promo-time">{{ n.createdAt | date:'dd/MM/yyyy HH:mm' }}</time>
                </div>
                <h4 class="promo-title">{{ n.title }}</h4>
                <div class="promo-content">{{ n.content }}</div>
              </article>
            } @empty { <div class="empty-state">Chưa có thông báo hệ thống.</div> }
          </div>
          <app-pagination [currentPage]="page()" [totalPages]="totalPages()" (pageChange)="page.set($event); loadNotifications()"></app-pagination>
        </section>
      }

      @if (tab() === 'order' || tab() === 'contact') {
        <section class="section-card">
          <div class="section-head">
            <h3>{{ tab() === 'order' ? 'Thông báo đơn hàng' : 'Thông báo liên hệ' }}</h3>
            <p>Chỉ hiển thị thông báo loại {{ tab() === 'order' ? 'Đơn hàng' : 'Liên hệ' }}.</p>
          </div>
          <ng-container *ngTemplateOutlet="historyTools"></ng-container>
          <div class="table-wrap">
            <table class="admin-table">
              <thead><tr><th>Tiêu đề</th><th>Nội dung</th><th>Đối tượng</th><th>Trạng thái</th><th>Ngày</th></tr></thead>
              <tbody>
                @for (n of filteredNotifications(); track n._id) {
                  <tr><td><strong>{{ n.title }}</strong></td><td class="notif-content-cell">{{ n.content }}</td><td>{{ targetLabel(n) }}</td><td><span class="status-badge" [ngClass]="n.sent ? 'status-visible' : 'status-hidden'">{{ n.sent ? 'Đã gửi' : 'Chưa gửi' }}</span></td><td>{{ n.createdAt | date:'dd/MM/yyyy HH:mm' }}</td></tr>
                } @empty { <tr><td colspan="5">Chưa có thông báo {{ tab() === 'order' ? 'đơn hàng' : 'liên hệ' }}.</td></tr> }
              </tbody>
            </table>
          </div>
          <app-pagination [currentPage]="page()" [totalPages]="totalPages()" (pageChange)="page.set($event); loadNotifications()"></app-pagination>
        </section>
      }

      <ng-template #historyTools>
        <div class="admin-filters top-filters">
          <div class="filter-group"><input class="form-input" placeholder="Tìm tiêu đề/nội dung..." [(ngModel)]="searchTerm" (input)="page.set(1); loadNotifications()" /></div>
          <div class="filter-group"><select class="form-input filter-select" [(ngModel)]="sentFilter" (change)="page.set(1); loadNotifications()"><option value="">Tất cả trạng thái</option><option value="sent">Đã gửi</option><option value="unsent">Chưa gửi</option></select></div>
        </div>
      </ng-template>
    </div>
  `,
  styleUrls: ['./admin-list.css', './notifications.css'],
})
export class AdminNotificationsComponent {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  readonly tab = signal<NotifyTab>('promo');
  readonly notifications = signal<any[]>([]);
  readonly coupons = signal<any[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly sending = signal(false);
  searchTerm = '';
  sentFilter = '';
  selectedCouponId = '';
  recipientType: 'tiers' | 'all' = 'all';
  tiers: string[] = ['bac', 'vang', 'kimcuong'];
  formType = 'promo';
  formTitle = '';
  formContent = '';
  formLink = '';
  systemTitle = '';
  systemContent = '';
  systemLink = '';

  readonly selectedCoupon = computed(() => this.coupons().find((c) => c._id === this.selectedCouponId) || null);
  readonly filteredNotifications = computed(() => {
    const t = this.tab();
    return (this.notifications() || []).filter((n) => {
      if (t === 'order') return n.type === 'order';
      if (t === 'contact') return n.type === 'contact';
      if (t === 'system') return n.type === 'system';
      return n.type === 'promo';
    });
  });

  constructor() {
    const url = new URL(window.location.href);
    const t = String(url.searchParams.get('tab') || 'promo');
    if (t === 'order' || t === 'contact' || t === 'promo' || t === 'system') this.tab.set(t);
    this.loadCoupons();
    this.loadNotifications();
    setTimeout(() => this.consumeCouponPrefill(), 0);
  }

  setTab(t: NotifyTab): void { this.tab.set(t); this.page.set(1); this.searchTerm = ''; this.sentFilter = ''; this.loadNotifications(); }
  tierOn(key: string): boolean { return this.tiers.includes(key); }
  setTier(key: string, on: boolean): void { const s = new Set(this.tiers); on ? s.add(key) : s.delete(key); this.tiers = [...s]; this.applyCouponTitle(); }
  tierNames(keys: string[] = this.tiers): string { const map: any = { bac: 'Bạc', vang: 'Vàng', kimcuong: 'Kim Cương' }; return keys.map((k) => map[k] || k).join(', '); }
  formatMoney(n: any): string { return (Number(n) || 0).toLocaleString('vi-VN') + 'đ'; }
  formatDate(d: any): string { return d ? new Date(d).toLocaleDateString('vi-VN') : '—'; }
  couponSummary(c: any): string { const v = c?.discountType === 'percent' ? `giảm ${c.discountValue}%` : `giảm ${this.formatMoney(c.discountValue)}`; return c?.maxDiscount ? `${v}, tối đa ${this.formatMoney(c.maxDiscount)}` : v; }
  targetLabel(n: any): string { if (n.recipient) return n.recipient.name || n.recipient.email || '1 thành viên'; return 'Chung (tất cả)'; }

  loadCoupons(): void {
    this.http.get<any>('/api/coupons?limit=200').subscribe({ next: (r) => this.coupons.set(r?.coupons || r || []), error: () => this.coupons.set([]) });
  }

  loadNotifications(): void {
    const t = this.tab();
    const params = new URLSearchParams({ page: String(this.page()), limit: '20', sortBy: 'createdAt', sortDir: 'desc' });
    if (t === 'order') params.set('type', 'order');
    else if (t === 'contact') params.set('type', 'contact');
    else if (t === 'system') params.set('type', 'system');
    else params.set('type', 'promo');
    if (this.searchTerm) params.set('q', this.searchTerm);
    if (this.sentFilter) params.set('sent', this.sentFilter === 'sent' ? 'true' : 'false');
    this.http.get<any>('/api/notifications?' + params.toString()).subscribe({
      next: (r) => { this.notifications.set(Array.isArray(r) ? r : (r.notifications || [])); this.totalPages.set(r.totalPages || 1); },
      error: () => this.toast.error('Không tải được thông báo.'),
    });
  }

  selectCoupon(id: string): void { this.selectedCouponId = id; this.applyCouponTemplate(); }
  consumeCouponPrefill(): void {
    try {
      const raw = sessionStorage.getItem('mm_notify_coupon');
      if (!raw) return;
      sessionStorage.removeItem('mm_notify_coupon');
      const c = JSON.parse(raw);
      this.recipientType = 'tiers';
      const found = this.coupons().find((x) => String(x.code || '').toUpperCase() === String(c.code || '').toUpperCase());
      if (found) { this.selectedCouponId = found._id; this.applyCouponTemplate(found); }
      else this.applyCouponTemplate(c);
    } catch {}
  }

  applyCouponTemplate(c: any = this.selectedCoupon()): void {
    if (!c?.code) return;
    const exp = this.formatDate(c.expiryDate);
    const qty = c.usageLimit ? `${c.usageLimit} lượt sử dụng` : 'không giới hạn lượt sử dụng';
    const min = Number(c.minOrderValue || 0) > 0 ? ` Đơn tối thiểu ${this.formatMoney(c.minOrderValue)}.` : '';
    const max = Number(c.maxDiscount || 0) > 0 ? ` Giảm tối đa ${this.formatMoney(c.maxDiscount)}.` : '';
    this.formType = 'promo';
    this.applyCouponTitle(c);
    this.formContent = `Admin gửi mã giảm giá ${c.code} cho ${this.recipientType === 'tiers' ? 'hội viên hạng ' + this.tierNames() : 'tất cả thành viên'}.\n\nƯu đãi: ${this.couponSummary(c)}.${max}\nSố lượng: ${qty}.\nĐã dùng: ${Number(c.usedCount || 0)} lượt.\nHạn sử dụng: ${exp}.${min}\n${c.description ? `Điều kiện: ${c.description}\n` : ''}\nVui lòng kiểm tra và sử dụng mã tại Mộc Mạc trước khi hết hạn.`;
  }

  applyCouponTitle(c: any = this.selectedCoupon()): void {
    if (!c?.code) return;
    const target = this.recipientType === 'tiers' ? `hội viên ${this.tierNames()}` : 'tất cả thành viên';
    this.formTitle = `Admin gửi mã giảm giá ${c.code} cho ${target}`;
  }

  sendPromo(): void {
    if (this.sending()) return;
    if (!String(this.formTitle || '').trim() || !String(this.formContent || '').trim()) { this.toast.error('Vui lòng nhập tiêu đề và nội dung.'); return; }
    const payload: any = { title: this.formTitle.trim(), content: this.formContent.trim(), type: this.formType, link: String(this.formLink || '').trim(), recipientType: this.recipientType };
    if (this.recipientType === 'tiers') {
      if (!this.tiers.length) { this.toast.error('Vui lòng chọn ít nhất một hạng hội viên.'); return; }
      payload.tiers = [...this.tiers];
    }
    this.sending.set(true);
    this.http.post<any>('/api/notifications/send', payload).subscribe({
      next: (r) => { this.toast.success(r?.message || 'Đã gửi thông báo mã giảm giá.'); this.sending.set(false); this.loadNotifications(); },
      error: (e) => { this.toast.error(e?.error?.message || 'Không thể gửi thông báo.'); this.sending.set(false); },
    });
  }

  sendSystem(): void {
    if (this.sending()) return;
    if (!String(this.systemTitle || '').trim() || !String(this.systemContent || '').trim()) { this.toast.error('Vui lòng nhập tiêu đề và nội dung.'); return; }
    this.sending.set(true);
    this.http.post<any>('/api/notifications/send', { title: this.systemTitle.trim(), content: this.systemContent.trim(), type: 'system', link: String(this.systemLink || '').trim(), recipientType: 'all' }).subscribe({
      next: (r) => { this.toast.success(r?.message || 'Đã gửi thông báo hệ thống.'); this.systemTitle = ''; this.systemContent = ''; this.systemLink = ''; this.sending.set(false); this.loadNotifications(); },
      error: (e) => { this.toast.error(e?.error?.message || 'Không thể gửi thông báo hệ thống.'); this.sending.set(false); },
    });
  }
}