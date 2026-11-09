import { Injectable, signal } from '@angular/core';

export interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  danger: boolean;
  resolve?: (ok: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly state = signal<ConfirmState>({
    open: false,
    title: '',
    message: '',
    confirmText: 'Xóa',
    cancelText: 'Hủy',
    danger: false,
  });

  confirm(options: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
  }): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.state.set({
        open: true,
        title: options.title || 'Xác nhận',
        message: options.message,
        confirmText: options.confirmText || 'Xác nhận',
        cancelText: options.cancelText || 'Hủy',
        danger: options.danger ?? false,
        resolve,
      });
    });
  }

  accept(): void {
    const s = this.state();
    s.resolve?.(true);
    this.state.update((v) => ({ ...v, open: false, resolve: undefined }));
  }

  cancel(): void {
    const s = this.state();
    s.resolve?.(false);
    this.state.update((v) => ({ ...v, open: false, resolve: undefined }));
  }
}
