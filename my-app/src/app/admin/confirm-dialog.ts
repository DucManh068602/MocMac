import { Component, inject } from '@angular/core';
import { ConfirmService } from './confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: false,
  template: `
    @if (confirm.state(); as s) {
      @if (s.open) {
        <div class="confirm-overlay" (click)="confirm.cancel()" role="presentation">
          <div class="confirm-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" [attr.aria-label]="s.title">
            <h3 class="confirm-title">{{ s.title }}</h3>
            <p class="confirm-message">{{ s.message }}</p>
            <div class="confirm-actions">
              <button type="button" class="btn-cancel" (click)="confirm.cancel()">{{ s.cancelText }}</button>
              <button type="button" [class]="s.danger ? 'btn-danger-confirm' : 'btn-save'" (click)="confirm.accept()">{{ s.confirmText }}</button>
            </div>
          </div>
        </div>
      }
    }
  `,
  styles: [`
    .confirm-overlay { position: fixed; inset: 0; background: rgba(22,35,31,.45); display: flex; align-items: center; justify-content: center; padding: 24px; z-index: 6000; }
    .confirm-modal { width: 100%; max-width: 420px; background: var(--surface, #fff); border: 1px solid var(--line, #e8eef0); border-radius: 14px; box-shadow: 0 20px 50px rgba(22,35,31,.18); padding: 20px; }
    .confirm-title { margin: 0 0 8px; font-size: 17px; font-weight: 700; color: var(--ink, #16231f); }
    .confirm-message { margin: 0; font-size: 14px; line-height: 1.55; color: var(--ink2, #5c6b64); white-space: pre-wrap; }
    .confirm-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px; }
    .btn-danger-confirm { display: inline-flex; align-items: center; padding: 8px 16px; border: 0; border-radius: 10px; background: #c0392b; color: #fff; font: 600 13px inherit; cursor: pointer; }
    .btn-danger-confirm:hover { background: #a32e22; }
  `],
})
export class ConfirmDialogComponent {
  readonly confirm = inject(ConfirmService);
}
