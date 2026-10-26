import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth.service';

interface TourStep {
  title: string;
  text: string;
  selector: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

@Component({
  selector: 'app-meomeo-guide',
  standalone: false,
  templateUrl: './meomeo-guide.html',
  styleUrl: './meomeo-guide.css',
})
export class MeomeoGuideComponent {
  private readonly http = inject(HttpClient);
  readonly auth = inject(AuthService);

  readonly visible = signal(false);
  readonly steps = signal<TourStep[]>([]);
  readonly currentStep = signal(0);
  readonly speechEnabled = signal(true);
  readonly popupStyle = signal<Record<string, string>>({});
  readonly overlayRect = signal<Record<string, string>>({});

  readonly tourSteps: TourStep[] = [
    {
      title: 'Chào mừng bạn đến với Mộc Mạc!',
      text: 'Mình là meomeo, sẽ đồng hành hướng dẫn bạn khám phá cửa hàng.',
      selector: 'body',
      position: 'bottom',
    },
    {
      title: 'Tìm kiếm sản phẩm',
      text: 'Bạn có thể tìm kiếm bất kỳ sản phẩm nào bằng thanh tìm kiếm ở đây.',
      selector: '.search-box',
      position: 'bottom',
    },
    {
      title: 'Giỏ hàng của bạn',
      text: 'Các sản phẩm bạn thêm vào sẽ hiện ở đây. Nhấn để xem giỏ hàng.',
      selector: '.cart-trigger',
      position: 'left',
    },
    {
      title: 'Tài khoản của bạn',
      text: 'Quản lý đơn hàng, địa chỉ và cài đặt tài khoản của bạn ở đây.',
      selector: '.user-trigger',
      position: 'left',
    },
    {
      title: 'Khám phá sản phẩm',
      text: 'Bắt đầu khám phá các sản phẩm đặc sản từ các vùng miền khắp Việt Nam.',
      selector: '.explore-btn',
      position: 'top',
    },
    {
      title: 'Hoàn thành!',
      text: 'Cảm ơn bạn đã hoàn thành hành trình meomeo. Chúc bạn có trải nghiệm vui vẻ!',
      selector: 'body',
      position: 'bottom',
    },
  ];

  constructor() {
    this.steps.set(this.tourSteps);
  }

  ngOnDestroy(): void {
    this.stopSpeech();
  }

  ngOnInit(): void {
    if (!this.auth.isAuthenticated()) return;

    const seen = localStorage.getItem('mocmac-meomeo-seen') === 'true';
    if (seen) return;

    this.http.get<{ showGuide: boolean }>('/api/meomeo').subscribe({
      next: (res) => {
        if (res.showGuide) {
          setTimeout(() => this.startTour(), 800);
        }
      },
    });
  }

  startTour(): void {
    this.currentStep.set(0);
    this.visible.set(true);
    setTimeout(() => this.updatePosition(), 50);
    this.speak(this.steps()[0].text);
  }

  finish(): void {
    this.visible.set(false);
    this.stopSpeech();
    localStorage.setItem('mocmac-meomeo-seen', 'true');
  }

  toggleSpeech(): void {
    this.speechEnabled.update((v) => !v);
    if (!this.speechEnabled()) {
      this.stopSpeech();
    } else {
      this.speak(this.steps()[this.currentStep()].text);
    }
  }

  next(): void {
    const s = this.steps();
    if (this.currentStep() < s.length - 1) {
      this.currentStep.update((v) => v + 1);
      setTimeout(() => this.updatePosition(), 50);
      this.speak(s[this.currentStep()].text);
    } else {
      this.finish();
    }
  }

  prev(): void {
    if (this.currentStep() > 0) {
      this.currentStep.update((v) => v - 1);
      setTimeout(() => this.updatePosition(), 50);
      this.speak(this.steps()[this.currentStep()].text);
    }
  }

  updatePosition(): void {
    const step = this.steps()[this.currentStep()];

    if (step.selector === 'body') {
      this.overlayRect.set({});
      this.popupStyle.set({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '380px',
        width: '90%',
      });
      return;
    }

    const el = document.querySelector<HTMLElement>(step.selector);
    if (!el) {
      this.overlayRect.set({});
      this.popupStyle.set({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '380px',
        width: '90%',
      });
      return;
    }

    const rect = el.getBoundingClientRect();
    const popupWidth = 360;
    const popupHeight = 260;
    const offset = 24;

    let left: number;
    let top: number;

    switch (step.position) {
      case 'top':
        top = rect.top - popupHeight - offset;
        left = Math.max(12, Math.min(rect.left + rect.width / 2 - popupWidth / 2, window.innerWidth - popupWidth - 12));
        break;
      case 'bottom':
        top = rect.bottom + offset;
        left = Math.max(12, Math.min(rect.left + rect.width / 2 - popupWidth / 2, window.innerWidth - popupWidth - 12));
        break;
      case 'left':
        left = rect.left - popupWidth - offset;
        top = Math.max(50, Math.min(rect.top + rect.height / 2 - popupHeight / 2, window.innerHeight - popupHeight - 20));
        break;
      case 'right':
        left = rect.right + offset;
        top = Math.max(50, Math.min(rect.top + rect.height / 2 - popupHeight / 2, window.innerHeight - popupHeight - 20));
        break;
      default:
        left = window.innerWidth / 2 - popupWidth / 2;
        top = window.innerHeight / 2 - popupHeight / 2;
    }

    this.overlayRect.set({
      '--overlay-x': `${rect.left}px`,
      '--overlay-y': `${rect.top}px`,
      '--overlay-w': `${rect.width}px`,
      '--overlay-h': `${rect.height}px`,
    } as Record<string, string>);

    this.popupStyle.set({
      position: 'fixed',
      left: `${Math.round(left)}px`,
      top: `${Math.round(top)}px`,
      maxWidth: `${popupWidth}px`,
      width: '90%',
    });
  }

  getStep(): TourStep {
    return this.steps()[this.currentStep()];
  }

  private speak(text: string): void {
    if (!this.speechEnabled() || !('speechSynthesis' in window)) return;

    this.stopSpeech();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'vi-VN';
    utter.rate = 0.95;
    utter.pitch = 1.1;
    const voices = speechSynthesis.getVoices();
    utter.voice = voices.find((v) => v.lang === 'vi-VN') || voices[0];
    speechSynthesis.speak(utter);
  }

  private stopSpeech(): void {
    if ('speechSynthesis' in window && speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
  }
}
