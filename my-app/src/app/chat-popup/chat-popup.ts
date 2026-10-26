import { Component, inject, signal, OnInit, OnDestroy, AfterViewChecked, ViewChild, ElementRef, effect } from '@angular/core';
import { ChatService } from '../chat.service';
import { ToastService } from '../admin/toast.service';

@Component({
  selector: 'app-chat-popup',
  standalone: false,
  template: `
    <div class="chat-float">
      @if (!open()) {
        <button type="button" class="chat-toggle" (click)="open.set(true); onOpen()">
          <span class="chat-icon">💬</span>
          @if (unreadCount() > 0) {
            <span class="chat-badge">{{ unreadCount() }}</span>
          }
        </button>
      }

      @if (open()) {
        <div #chatBox class="chat-window">
          <div class="chat-header">
            <span>Chat với quản trị viên</span>
            <button type="button" class="chat-close" (click)="open.set(false)">✕</button>
          </div>

          <ul #messagesList class="chat-messages">
            @for (m of messages(); track m._id || $index) {
              <li class="chat-msg" [class.mine]="isMine(m)">
                <div class="chat-msg__text">{{ m.message }}</div>
                <div class="chat-msg__time">{{ m.createdAt | date:'shortTime' }}</div>
              </li>
            }
          </ul>

          <form class="chat-input" (ngSubmit)="$event.preventDefault(); send()">
            <input
              #msgInput
              type="text"
              placeholder="Nhập tin nhắn..."
              [value]="msgText()"
              (input)="msgText.set($event.target.value)"
              maxlength="500"
            />
            <button type="submit" [disabled]="!msgText().trim() || !connected()">Gửi</button>
          </form>
        </div>
      }
    </div>
  `,
  styleUrls: ['./chat-popup.css'],
})
export class ChatPopupComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('messagesList', { static: false }) messagesList!: ElementRef;

  private chatService = inject(ChatService);
  private toast = inject(ToastService);

  readonly open = signal(false);
  readonly msgText = signal('');

  readonly messages = this.chatService.messages;
  readonly connected = this.chatService.connected;
  readonly unreadCount = this.chatService.unreadCount;

  private _notifyEffect = effect(() => {
    const msg = this.chatService.messageReceived();
    if (msg && !this.open() && msg.to !== 'admin') {
      this.toast.info('Tin nhắn mới từ quản trị viên');
    }
  });

  ngOnInit(): void {
    this.chatService.connect();
  }

  isMine(m: any): boolean {
    return m.from === this.chatService.currentUserId();
  }

  onOpen(): void {
    this.chatService.markRead('admin');
  }

  send(): void {
    const text = this.msgText().trim();
    if (!text || !this.chatService.connected()) return;
    this.chatService.sendMessage('admin', text);
    this.msgText.set('');
  }

  ngAfterViewChecked(): void {
    this.scrollBottom();
  }

  ngOnDestroy(): void {
    this.chatService.disconnect();
  }

  private scrollBottom(): void {
    const el = this.messagesList?.nativeElement as HTMLElement | undefined;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }
}
