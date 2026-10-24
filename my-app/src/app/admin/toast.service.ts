import { Injectable, signal, computed } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toasts = signal<Toast[]>([]);
  private nextId = 0;

  readonly visible = computed(() => this.toasts().length > 0);
  readonly items = this.toasts.asReadonly();

  show(message: string, type: ToastType = 'info'): void {
    const id = ++this.nextId;
    this.toasts.update((t) => [...t, { id, message, type }]);
    setTimeout(() => this.remove(id), 4000);
  }

  success(message: string): void { this.show(message, 'success'); }
  error(message: string): void { this.show(message, 'error'); }
  info(message: string): void { this.show(message, 'info'); }

  remove(id: number): void {
    this.toasts.update((t) => t.filter((toast) => toast.id !== id));
  }
}
