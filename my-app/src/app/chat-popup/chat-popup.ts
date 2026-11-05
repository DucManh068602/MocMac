import { Component, inject, signal, OnInit, OnDestroy, AfterViewChecked, ViewChild, ElementRef, effect } from '@angular/core';
import { Router } from '@angular/router';
import { ChatService } from '../chat.service';
import { CartService } from '../cart.service';
import { ToastService } from '../admin/toast.service';
import { I18nService } from '../i18n.service';

@Component({
  selector: 'app-chat-popup',
  standalone: false,
  template: `
    <div class="ai-float">
      @if (!open()) {
        <button type="button" class="ai-fab" (click)="open.set(true); onOpen()" [attr.aria-label]="'agent.title' | t">
          <span class="ai-fab-ring"></span>
          <i class="fa-solid fa-wand-magic-sparkles"></i>
          <span class="ai-fab-tip">{{ 'agent.tip' | t }}</span>
        </button>
      }

      @if (open()) {
        <div #chatBox class="ai-window" role="dialog" [attr.aria-label]="'agent.title' | t">
          <header class="ai-head">
            <div class="ai-brand">
              <div class="ai-avatar"><i class="fa-solid fa-robot"></i></div>
              <div class="ai-brand-txt">
                <strong>{{ 'agent.title' | t }}</strong>
                <span class="ai-status"><i class="dot"></i> {{ 'agent.status' | t }}</span>
              </div>
            </div>
            <div class="ai-head-actions">
              <div class="ai-tabs" role="tablist">
                <button type="button" [class.active]="mode()==='ai'" (click)="mode.set('ai')"><i class="fa-solid fa-sparkles"></i> {{ 'agent.tab' | t }}</button>
                <button type="button" [class.active]="mode()==='admin'" (click)="mode.set('admin'); chatService.connect()"><i class="fa-solid fa-headset"></i> {{ 'agent.supportTab' | t }}</button>
              </div>
              <button type="button" class="ai-close" (click)="open.set(false)" aria-label="Đóng"><i class="fa-solid fa-chevron-down"></i></button>
            </div>
          </header>

          <ul #messagesList class="ai-body">
            @if (mode()==='ai') {
              @if (aiMessages().length <= 1 && !aiLoading()) {
                <li class="ai-welcome">
                  <div class="ai-welcome-icon"><i class="fa-solid fa-seedling"></i></div>
                  <p>{{ 'agent.welcome' | t }}</p>
                </li>
                <li class="ai-suggests">
                  @for (s of suggestions(); track s) {
                    <button type="button" (click)="askSuggestion(s)">{{ s }}</button>
                  }
                </li>
              }
              @for (m of aiMessages(); track $index) {
                <li class="msg" [class.user]="m.from==='user'" [class.ai]="m.from==='ai'">
                  @if (m.from==='ai') { <span class="msg-ava"><i class="fa-solid fa-robot"></i></span> }
                  <div class="bubble">
                    @if (m.from==='ai' && m.streaming && !m.text) {
                      <div class="typing"><span></span><span></span><span></span></div>
                    } @else {
                      <div class="text" [class.streaming]="m.streaming">{{ m.text }}@if (m.streaming) {<span class="cursor">▍</span>}</div>
                    }
                    @if (!m.streaming && m.actions?.length) {
                      <div class="agent-actions">
                        @for (a of m.actions; track $index) {
                          <button type="button" class="agent-action" (click)="runAction(a)"><i class="fa-solid fa-bolt"></i> {{ actionLabel(a) }}</button>
                        }
                      </div>
                    }
                    @if (!m.streaming || m.text) { <div class="meta">{{ m.at | date:'HH:mm' }}</div> }
                  </div>
                </li>
              }
            } @else {
              @for (m of messages(); track m._id || $index) {
                <li class="msg" [class.user]="isMine(m)" [class.ai]="!isMine(m)">
                  @if (!isMine(m)) { <span class="msg-ava"><i class="fa-solid fa-headset"></i></span> }
                  <div class="bubble">
                    <div class="text">{{ m.message }}</div>
                    <div class="meta">{{ m.createdAt | date:'HH:mm' }}</div>
                  </div>
                </li>
              } @empty {
                <li class="ai-welcome"><p>Nhắn tin để được quản trị viên hỗ trợ trực tiếp.</p></li>
              }
            }
          </ul>

          <form class="ai-input" (ngSubmit)="$event.preventDefault(); send()">
            <input
              #msgInput type="text"
              [attr.placeholder]="(mode()==='ai' ? 'agent.placeholder' : 'agent.supportPlaceholder') | t"
              [value]="msgText()" (input)="msgText.set($any($event.target).value)" maxlength="1000" autocomplete="off"
            />
            <button type="submit" [disabled]="!msgText().trim() || (mode()==='admin' && !connected()) || aiBusy()" aria-label="Gửi">
              <i class="fa-solid" [class.fa-paper-plane]="!aiBusy()" [class.fa-spinner]="aiBusy()" [class.fa-spin]="aiBusy()"></i>
            </button>
          </form>
        </div>
      }
    </div>
  `,
  styleUrls: ['./chat-popup.css'],
})
export class ChatPopupComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('messagesList', { static: false }) messagesList!: ElementRef;

  public chatService = inject(ChatService);
  private cart = inject(CartService);
  private router = inject(Router);
  private toast = inject(ToastService);
  readonly i18n = inject(I18nService);

  readonly open = signal(false);
  readonly msgText = signal('');
  readonly mode = signal<'ai'|'admin'>('ai');
  readonly suggestions = () => this.i18n.lang() === 'en'
    ? ['Find standout teas and add to cart', 'Any active coupons?', 'Open my cart', 'How do COD/VNPAY payments work?', 'Track my order', 'Suggest specialties by region']
    : ['Tìm cho mình trà nổi bật và thêm vào giỏ', 'Có mã giảm giá nào đang dùng được?', 'Mở giỏ hàng giúp mình', 'Thanh toán VNPAY/COD thế nào?', 'Tra cứu đơn hàng của tôi', 'Gợi ý đặc sản theo vùng miền'];

  readonly messages = this.chatService.messages;
  readonly aiMessages = this.chatService.aiMessages;
  readonly aiLoading = this.chatService.aiLoading;
  readonly connected = this.chatService.connected;

  aiBusy(): boolean {
    return this.aiLoading() || this.aiMessages().some(m => m.from === 'ai' && m.streaming);
  }

  actionLabel(a: any): string {
    switch (a?.type) {
      case 'open_product': return 'Xem sản phẩm';
      case 'add_to_cart': return `Thêm vào giỏ${a?.name ? ': '+a.name : ''}`;
      case 'open_cart': return 'Mở giỏ hàng';
      case 'navigate': return a?.path === '/don-hang' ? 'Xem đơn hàng' : a?.path === '/lien-he' ? 'Mở liên hệ' : 'Mở trang';
      case 'contact_support': return 'Liên hệ hỗ trợ';
      case 'my_orders': return 'Đơn hàng của tôi';
      default: return 'Thực hiện';
    }
  }

  askSuggestion(text: string): void {
    if (this.aiBusy()) return;
    this.msgText.set(text);
    this.send();
  }

  runAction(a: any): void {
    if (!a?.type) return;
    if (a.type === 'add_to_cart' && a.productId) {
      const qty = Math.max(1, Number(a.quantity)||1);
      for (let i=0;i<qty;i++) this.cart.add(Number(a.productId), a.name || 'Sản phẩm');
      this.toast.success(`Đã thêm "${a.name || 'sản phẩm'}" vào giỏ.`);
      return;
    }
    if (a.type === 'open_product' && a.slug) { this.router.navigate(['/san-pham', a.slug]); return; }
    if (a.type === 'open_cart') { this.router.navigate(['/gio-hang']); return; }
    if (a.type === 'contact_support') { this.router.navigate(['/lien-he']); return; }
    if (a.type === 'my_orders') { this.router.navigate(['/don-hang']); return; }
    if (a.type === 'navigate' && a.path) { this.router.navigateByUrl(a.path); }
  }

  private _notifyEffect = effect(() => {
    const msg = this.chatService.messageReceived();
    if (msg && !this.open() && msg.to !== 'admin') {
      this.toast.info('Tin nhắn mới từ quản trị viên');
    }
  });

  ngOnInit(): void {}

  isMine(m: any): boolean {
    return m.from === this.chatService.currentUserId();
  }

  onOpen(): void {
    if (this.mode() === 'admin') {
      this.chatService.connect();
      this.chatService.markRead('admin');
    }
  }

  send(): void {
    const text = this.msgText().trim();
    if (!text) return;
    if (this.mode() === 'ai') {
      this.chatService.askAi(text);
      this.msgText.set('');
      return;
    }
    if (!this.chatService.connected()) return;
    this.chatService.sendMessage('admin', text);
    this.msgText.set('');
  }

  ngAfterViewChecked(): void { this.scrollBottom(); }
  ngOnDestroy(): void {}

  private scrollBottom(): void {
    const el = this.messagesList?.nativeElement as HTMLElement | undefined;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
