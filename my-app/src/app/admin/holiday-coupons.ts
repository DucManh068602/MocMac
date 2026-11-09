import { Component, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-admin-holiday-coupons',
  standalone: false,
  template: `
    <div class="list-page holiday-page">
      <header class="list-header holiday-page-header">
        <div>
          <h2>Mã giảm giá ngày lễ</h2>
          <p class="holiday-subtitle">Tự động gợi ý mã ngẫu nhiên cho ngày lễ sắp tới. Có thể chỉnh mã, ngày bắt đầu/hết hạn trước khi tạo.</p>
        </div>
        <div class="header-actions holiday-header-actions">
          <label class="holiday-range">
            <span>Khoảng thời gian</span>
            <select class="filter-select" [(ngModel)]="holidayMonths" (change)="loadHolidays()">
              <option [ngValue]="2">2 tháng tới</option>
              <option [ngValue]="3">3 tháng tới</option>
              <option [ngValue]="6">6 tháng tới</option>
              <option [ngValue]="12">12 tháng tới</option>
            </select>
          </label>
          <a class="btn-ghost" href="/admin/coupons">Quay lại danh sách mã</a>
        </div>
      </header>

      <div class="holiday-summary">
        <div class="holiday-summary-item"><strong>{{ holidays().length }}</strong><span>gợi ý</span></div>
        <div class="holiday-summary-item"><strong>{{ selectedCount() }}</strong><span>đã chọn</span></div>
        <div class="holiday-summary-item holiday-summary-note">Tết/Trung Thu là cửa sổ gợi ý (âm lịch). Mã đã tồn tại sẽ bỏ qua.</div>
      </div>

      <section class="holiday-panel">
        @if (loading()) {
          <div class="holiday-empty">Đang tải gợi ý ngày lễ...</div>
        } @else {
          <div class="table-wrap holiday-table-wrap">
            <table class="admin-table holiday-table">
              <thead>
                <tr>
                  <th class="col-check">Chọn</th>
                  <th>Ngày lễ</th>
                  <th>Thời gian áp dụng</th>
                  <th>Mã gợi ý</th>
                  <th>Ưu đãi</th>
                  <th>Điều kiện</th>
                </tr>
              </thead>
              <tbody>
                @for (h of holidays(); track h.key) {
                  <tr [class.row-disabled]="h.alreadyExists" [class.row-selected]="isSelected(h.key) && !h.alreadyExists">
                    <td class="col-check">
                      <input type="checkbox" class="holiday-check" [checked]="isSelected(h.key)" [disabled]="h.alreadyExists" (change)="toggle(h.key, $any($event.target).checked)" />
                    </td>
                    <td class="col-name">
                      <div class="holiday-name">{{ h.name }}</div>
                      <div class="holiday-meta">Ngày {{ h.date }}</div>
                      <div class="holiday-badges">
                        @if (h.seasonal) { <span class="holiday-badge badge-seasonal">Cửa sổ gợi ý</span> }
                        @if (h.alreadyExists) { <span class="holiday-badge badge-exists">Đã có mã</span> }
                      </div>
                    </td>
<td class="col-dates">
  <div class="date-pair">
    <input class="form-input holiday-date" type="date" [ngModel]="h.startsAt" (ngModelChange)="setField(h.key, 'startsAt', $event)" [disabled]="h.alreadyExists" />
    <input class="form-input holiday-date" type="date" [ngModel]="h.expiresAt" (ngModelChange)="setField(h.key, 'expiresAt', $event)" [disabled]="h.alreadyExists" />
  </div>
</td>
                    <td class="col-code">
                      <input class="form-input holiday-code" [ngModel]="h.suggestedCode" (ngModelChange)="setField(h.key, 'suggestedCode', $event)" [disabled]="h.alreadyExists" maxlength="20" spellcheck="false" />
                    </td>
                    <td class="col-offer">
                      <strong>{{ h.discountType === 'percent' ? ('Giảm ' + h.discountValue + '%') : ('Giảm ' + formatMoney(h.discountValue)) }}</strong>
                      @if (h.maxDiscount) { <div class="holiday-meta">Tối đa {{ formatMoney(h.maxDiscount) }}</div> }
                    </td>
                    <td class="col-min">{{ h.minOrderValue ? ('Đơn từ ' + formatMoney(h.minOrderValue)) : 'Không giới hạn' }}</td>
                  </tr>
                } @empty {
                  <tr><td colspan="6" class="holiday-empty">Không có ngày lễ trong khoảng đã chọn.</td></tr>
                }
              </tbody>
            </table>
          </div>
          <div class="holiday-actions">
            <div class="holiday-actions-note">Sẽ tạo <strong>{{ selectedCount() }}</strong> mã. Mã trùng sẽ tự bỏ qua.</div>
            <button type="button" class="btn-save holiday-create-btn" (click)="generate()" [disabled]="saving() || !selectedCount()">
              {{ saving() ? 'Đang tạo...' : ('Tạo ' + selectedCount() + ' mã đã chọn') }}
            </button>
          </div>
        }
      </section>
    </div>
  `,
  styleUrls: ['./admin-list.css', './coupons.css'],
})
export class AdminHolidayCouponsComponent {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  readonly holidays = signal<any[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly selected = signal<Set<string>>(new Set());
  readonly selectedCount = computed(() => this.selected().size);
  holidayMonths = 3;

  constructor() { this.loadHolidays(); }

  formatMoney(n: any): string { return (Number(n) || 0).toLocaleString('vi-VN') + 'đ'; }
  isSelected(key: string): boolean { return this.selected().has(key); }

  loadHolidays(): void {
    this.loading.set(true);
    this.http.get<any>('/api/coupons/holidays/preview?months=' + this.holidayMonths).subscribe({
      next: (r) => {
        const list = Array.isArray(r?.holidays) ? r.holidays : [];
        this.holidays.set(list);
        this.selected.set(new Set(list.filter((h: any) => !h.alreadyExists).map((h: any) => h.key)));
        this.loading.set(false);
      },
      error: (e) => { this.toast.error(e?.error?.message || 'Không tải được gợi ý ngày lễ.'); this.loading.set(false); },
    });
  }

  toggle(key: string, checked: boolean): void {
    const next = new Set(this.selected());
    if (checked) next.add(key); else next.delete(key);
    this.selected.set(next);
  }

  setField(key: string, field: string, value: string): void {
    this.holidays.set(this.holidays().map((h) => h.key === key ? { ...h, [field]: field === 'suggestedCode' ? String(value || '').toUpperCase() : value } : h));
  }

  generate(): void {
    const selected = new Set(this.selected());
    const items = this.holidays().filter((h) => selected.has(h.key)).map((h) => ({
      ...h,
      code: h.suggestedCode,
      expiryDate: h.expiresAt,
    }));
    if (!items.length) return;
    this.saving.set(true);
    this.http.post<any>('/api/coupons/holidays/generate', { items }).subscribe({
      next: (r) => {
        this.toast.success(r?.message || 'Đã tạo mã ngày lễ.');
        this.saving.set(false);
        this.loadHolidays();
      },
      error: (e) => { this.toast.error(e?.error?.message || 'Không thể tạo mã ngày lễ.'); this.saving.set(false); },
    });
  }
}
