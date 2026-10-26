import { Component, inject, computed } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: false,
  template: `
    <div class="toast-container" role="region" aria-live="polite">
      @for (toast of items(); track toast.id) {
        <div class="toast toast--{{ toast.type }}">
          <span class="toast-icon">
            @if (toast.type === 'success') { ✓ } @else if (toast.type === 'error') { ✕ } @else { ℹ }
          </span>
          <span class="toast-message">{{ toast.message }}</span>
          <button type="button" class="toast-close" (click)="toasts.remove(toast.id)">×</button>
        </div>
      }
    </div>
  `,
  styleUrls: ['./toast.css'],
})
export class ToastComponent {
  protected toasts = inject(ToastService);
  readonly items = computed(() => this.toasts.items());
}
