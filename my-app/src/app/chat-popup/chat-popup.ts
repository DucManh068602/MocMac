import { Component, inject, signal, OnInit, OnDestroy, AfterViewChecked, ViewChild, ElementRef, effect } from '@angular/core';
import { ChatService } from '../chat.service';
import { ToastService } from '../admin/toast.service';

@Component({
  selector: 'app-chat-popup',
  standalone: false,
  template: `
    <div class="ai-float">
      @if (!open()) {
        <button type="button" class="ai-fab" (click)="open.set(true); onOpen()" aria-label="Trợ Lý AI Mộc Mạc">
          <span class="ai-fab-ring"></span>
          <i class="fa-solid fa-wand-magic-sparkles"></i>
          <span class="ai-fab-tip">Trợ Lý AI</span>
        </button>
      }

      @if (open()) {
        <div #chatBox class="ai-window" role="dialog" aria-label="Trợ Lý AI Mộc Mạc">
          <header class="ai-head">
            <div class="ai-brand">
              <div class="ai-avatar"><i class="fa-solid fa-robot"></i></div>
              <div class="ai-brand-txt">
                <strong>Trợ Lý AI Mộc Mạc</strong>
                <span class="ai-status"><i class="dot"></i> Luôn sẵn sàng hỗ trợ</span>
              </div>
            </div>
            <div class="ai-head-actions">
              <div class="ai-tabs" role="tablist">
                <button type="button" [class.active]="mode()==='ai'" (click)="mode.set('ai')"><i class="fa-solid fa-sparkles"></i> AI</button>
                <button type="button" [class.active]="mode()==='admin'" (click)="mode.set('admin'); chatService.connect()"><i class="fa-solid fa-headset"></i> Hỗ trợ</button>
              </div>
              <button type="button" class="ai-close" (click)="open.set(false)" aria-label="Đóng"><i class="fa-solid fa-chevron-down"></i></button>
            </div>
          </header>

          <ul #messagesList class="ai-body">
            @if (mode()==='ai') {
              @if (aiMessages().length <= 1 && !aiLoading()) {
                <li class="ai-welcome">
                  <div class="ai-welcome-icon"><i class="fa-solid fa-seedling"></i></div>
                  <p>Mình có thể tra cứu nhanh từ dữ liệu Mộc Mạc (quét DB theo từng chunk) để hỗ trợ bạn.</p>
                </li>
                <li class="ai-suggests">
                  @for (s of suggestions; track s) {
                    <button type="button" (click)="msgText.set(s); send()">{{ s }}</button>
                  }
                </li>
              }
              @for (m of aiMessages(); track $index) {
                <li class="msg" [class.user]="m.from==='user'" [class.ai]="m.from==='ai'">
                  @if (m.from==='ai') { <span class="msg-ava"><i class="fa-solid fa-robot"></i></span> }
                  <div class="bubble">
                    <div class="text">{{ m.text }}</div>
                    <div class="meta">{{ m.at | date:'HH:mm' }}</div>
                  </div>
                </li>
              }
              @if (aiLoading()) {
                <li class="msg ai">
                  <span class="msg-ava"><i class="fa-solid fa-robot"></i></span>
                  <div class="bubble typing"><span></span><span></span><span></span><em>Đang quét dữ liệu...</em></div>
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
              [placeholder]="mode()==='ai' ? 'Hỏi về sản phẩm, giá, mã giảm giá...' : 'Nhắn cho quản trị viên...'"
              [value]="msgText()" (input)="msgText.set($any($event.target).value)" maxlength="1000" autocomplete="off"
            />
            <button type="submit" [disabled]="!msgText().trim() || (mode()==='admin' && !connected()) || aiLoading()" aria-label="Gửi">
              <i class="fa-solid" [class.fa-paper-plane]="!aiLoading()" [class.fa-spinner]="aiLoading()" [class.fa-spin]="aiLoading()"></i>
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
  private toast = inject(ToastService);

  readonly open = signal(false);
  readonly msgText = signal('');
  readonly mode = signal<'ai'|'admin'>('ai');
  readonly suggestions = ['Sản phẩm nổi bật là gì?', 'Có mã giảm giá nào không?', 'Đặc sản vùng nào đang bán?', 'Thanh toán MoMo thế nào?'];

  readonly messages = this.chatService.messages;
  readonly aiMessages = this.chatService.aiMessages;
  readonly aiLoading = this.chatService.aiLoading;
  readonly connected = this.chatService.connected;

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
