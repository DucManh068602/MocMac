import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-admin-deals',
  standalone: false,
  template: `
    <div class="list-page">
      <header class="list-header"><h2>Quản lý Deal</h2><button type="button" class="btn-add" (click)="newDeal()">Tạo Deal</button></header>
      @if (editing()) {
        <section class="form-card"><h3>{{ editing()?._id ? 'Chỉnh sửa Deal' : 'Tạo Deal mới' }}</h3>
          <div class="form-grid"><input class="form-input" [(ngModel)]="form.title" placeholder="Tên Deal" /><input class="form-input" [(ngModel)]="form.description" placeholder="Mô tả ngắn" />
          <select class="form-input" [(ngModel)]="form.discountType"><option value="percent">Giảm theo %</option><option value="fixed">Giảm số tiền</option></select><input class="form-input" type="number" [(ngModel)]="form.discountValue" placeholder="Giá trị giảm" />
          <input class="form-input" type="datetime-local" [(ngModel)]="form.startsAt" /><input class="form-input" type="datetime-local" [(ngModel)]="form.endsAt" />
          <label class="checkbox"><input type="checkbox" [(ngModel)]="form.active" /><span>Đang hoạt động</span></label></div>
          <div class="form-actions"><button type="button" class="btn-save" (click)="save()">Lưu Deal</button><button type="button" class="btn-cancel" (click)="editing.set(null)">Hủy</button></div>
        </section>
      }
      <div class="table-wrap"><table class="admin-table"><thead><tr><th>Deal</th><th>Ưu đãi</th><th>Thời gian</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>
        @for (deal of deals(); track deal._id) { <tr><td><strong>{{ deal.title }}</strong><br /><small>{{ deal.description }}</small></td><td>{{ deal.discountType === 'percent' ? deal.discountValue + '%' : (deal.discountValue | number) + 'đ' }}</td><td>{{ deal.startsAt | date:'dd/MM HH:mm' }} – {{ deal.endsAt | date:'dd/MM HH:mm' }}</td><td><span class="status-badge" [ngClass]="deal.active ? 'status-visible' : 'status-hidden'">{{ deal.active ? 'Đang bật' : 'Tạm dừng' }}</span></td><td><button type="button" class="btn-small" (click)="edit(deal)">Sửa</button><button type="button" class="btn-small btn-delete" (click)="remove(deal)">Xóa</button></td></tr> }
        @empty { <tr><td colspan="5">Chưa có Deal nào.</td></tr> }
      </tbody></table></div>
    </div>`,
  styleUrls: ['./admin-list.css'],
})
export class AdminDealsComponent {
  private http = inject(HttpClient); private toast = inject(ToastService);
  readonly deals = signal<any[]>([]); readonly editing = signal<any | null>(null); form: any = {};
  constructor() { this.load(); }
  load(): void { this.http.get<any>('/api/deals').subscribe({ next: r => this.deals.set(r.deals || []), error: () => this.toast.error('Không tải được Deal.') }); }
  newDeal(): void { this.form = { title:'', description:'', discountType:'percent', discountValue:0, startsAt:'', endsAt:'', active:true }; this.editing.set({}); }
  edit(deal: any): void { this.form = { ...deal, startsAt: this.toInput(deal.startsAt), endsAt: this.toInput(deal.endsAt) }; this.editing.set(deal); }
  save(): void { const current = this.editing(); const request = current?._id ? this.http.patch('/api/deals/' + current._id, this.form) : this.http.post('/api/deals', this.form); request.subscribe({ next: () => { this.toast.success('Đã lưu Deal.'); this.editing.set(null); this.load(); }, error: (e: any) => this.toast.error(e.error?.message || 'Không thể lưu Deal.') }); }
  remove(deal: any): void { if (!confirm('Xóa Deal này?')) return; this.http.delete('/api/deals/' + deal._id).subscribe({ next: () => { this.toast.success('Đã xóa Deal.'); this.load(); }, error: () => this.toast.error('Không thể xóa Deal.') }); }
  private toInput(value: string): string { return value ? new Date(value).toISOString().slice(0, 16) : ''; }
}
