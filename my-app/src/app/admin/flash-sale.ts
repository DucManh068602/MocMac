import { Component, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-admin-flash-sale',
  standalone: false,
  templateUrl: './flash-sale.html',
  styleUrl: './flash-sale.css',
})
export class AdminFlashSaleComponent {
  private http = inject(HttpClient); private toast = inject(ToastService);

  readonly sale = signal<any>(null);
  readonly saving = signal(false);
  form: any = { active: false, discountPercent: 10, startsAt: '', endsAt: '' };

  constructor() { this.load(); }

  load(): void {
    this.http.get<any>('/api/flash-sale').subscribe({
      next: r => {
        this.sale.set(r.sale || null);
        const s = r.sale || {};
        this.form = { active: Boolean(s.active), discountPercent: s.discountPercent || 10, startsAt: this.toInput(s.startsAt), endsAt: this.toInput(s.endsAt) };
      },
      error: () => this.toast.error('Không tải được Săn sale.'),
    });
  }

  save(): void {
    if (!this.form.active && (!this.form.startsAt || !this.form.endsAt)) {
      this.toast.error('Vui lòng nhập thời gian bắt đầu và kết thúc.');
      return;
    }
    if (this.form.startsAt && this.form.endsAt && new Date(this.form.endsAt) <= new Date(this.form.startsAt)) {
      this.toast.error('Thời gian kết thúc phải sau thời gian bắt đầu.');
      return;
    }
    if (this.form.discountPercent < 1 || this.form.discountPercent > 90) {
      this.toast.error('Mức giảm phải từ 1% đến 90%.');
      return;
    }
    this.saving.set(true);
    this.http.put<any>('/api/flash-sale', this.form).subscribe({
      next: r => { this.sale.set(r.sale); this.saving.set(false); this.toast.success('Đã lưu Săn sale.'); },
      error: () => { this.saving.set(false); this.toast.error('Không thể lưu Săn sale.'); },
    });
  }

  remove(): void {
    if (!confirm('Xóa chế độ Săn sale này? Toàn bộ sản phẩm sẽ bỏ nhãn giảm.')) return;
    this.saving.set(true);
    this.http.delete<any>('/api/flash-sale').subscribe({
      next: r => { this.sale.set(r.sale); this.saving.set(false); this.form = { active: false, discountPercent: 10, startsAt: '', endsAt: '' }; this.toast.success('Đã xóa Săn sale.'); },
      error: () => { this.saving.set(false); this.toast.error('Không thể xóa Săn sale.'); },
    });
  }

  readonly live = computed(() => {
    const s = this.sale();
    return Boolean(s?.live) ? 'Đang diễn ra' : (this.form.active ? 'Đã lên lịch' : 'Đang tắt');
  });

  private toInput(value: string | null): string { return value ? new Date(value).toISOString().slice(0, 16) : ''; }
}
