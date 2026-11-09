import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from './toast.service';
import { ConfirmService } from './confirm.service';

@Component({
  selector: 'app-admin-village-stories',
  standalone: false,
  styleUrls: ['./admin-list.css'],
  template: `
    <div class="list-page">
      <header class="list-header">
        <h2><i class="fa-solid fa-hands" aria-hidden="true"></i> Câu chuyện làng nghề ({{ stories().length }})</h2>
        <button type="button" class="btn-add" (click)="newStory()"><i class="fa-solid fa-plus" aria-hidden="true"></i> Thêm câu chuyện</button>
      </header>

      @if (editing()) {
        <section class="form-card">
          <h3>{{ form._id ? 'Chỉnh sửa câu chuyện làng nghề' : 'Thêm câu chuyện làng nghề' }}</h3>
          <div class="form-grid">
            <input class="form-input" [(ngModel)]="form.title" placeholder="Tiêu đề *" />
            <input class="form-input" [(ngModel)]="form.village" placeholder="Làng nghề (VD: Bát Tràng)" />
            <input class="form-input" [(ngModel)]="form.province" placeholder="Tỉnh/Thành" />
            <input class="form-input" [(ngModel)]="form.craft" placeholder="Nghề (VD: Gốm, Mây tre đan)" />
            <input class="form-input" [(ngModel)]="form.imageUrl" placeholder="Ảnh URL" />
            <input class="form-input" type="number" [(ngModel)]="form.order" placeholder="Thứ tự" />
            <select class="form-input" [(ngModel)]="form.status">
              <option value="published">Xuất bản</option>
              <option value="draft">Nháp</option>
            </select>
            <input class="form-input" [(ngModel)]="form.excerpt" placeholder="Mô tả ngắn" style="grid-column:1/-1" />
            <textarea class="form-input" [(ngModel)]="form.content" placeholder="Nội dung câu chuyện" rows="5" style="grid-column:1/-1;resize:vertical"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-save" (click)="save()" [disabled]="saving()">{{ saving() ? 'Đang lưu...' : 'Lưu' }}</button>
            <button type="button" class="btn-cancel" (click)="editing.set(null)" [disabled]="saving()">Hủy</button>
          </div>
        </section>
      }

      <div class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr><th>Tiêu đề</th><th>Làng nghề</th><th>Tỉnh/Nghề</th><th>Trạng thái</th><th>Thao tác</th></tr>
          </thead>
          <tbody>
            @for (s of stories(); track s._id) {
              <tr>
                <td>
                  <strong>{{ s.title }}</strong>
                  @if (s.excerpt) { <div style="font-size:12px;color:#6b7280;margin-top:2px">{{ s.excerpt }}</div> }
                </td>
                <td>{{ s.village || '—' }}</td>
                <td>{{ s.province || '—' }}{{ s.craft ? ' · ' + s.craft : '' }}</td>
                <td><span class="status-badge" [ngClass]="s.status === 'published' ? 'status-visible' : 'status-hidden'">{{ s.status === 'published' ? 'Xuất bản' : 'Nháp' }}</span></td>
                <td>
                  <button type="button" class="btn-small" (click)="edit(s)"><i class="fa-solid fa-pen" aria-hidden="true"></i> Sửa</button>
                  <button type="button" class="btn-small btn-delete" (click)="remove(s)"><i class="fa-solid fa-trash" aria-hidden="true"></i> Xóa</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5">Chưa có câu chuyện làng nghề. Bấm “Thêm câu chuyện”.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AdminVillageStoriesComponent {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  readonly stories = signal<any[]>([]);
  readonly editing = signal<any | null>(null);
  readonly saving = signal(false);
  form: any = {};

  constructor() { this.load(); }

  load(): void {
    this.http.get<{ stories: any[] }>('/api/village-stories').subscribe({
      next: (r) => this.stories.set(r.stories || []),
      error: () => this.toast.error('Không tải được câu chuyện làng nghề.'),
    });
  }

  newStory(): void {
    this.form = { title: '', village: '', province: '', craft: '', excerpt: '', content: '', imageUrl: '', status: 'published', order: 0 };
    this.editing.set({});
  }

  edit(s: any): void { this.form = { ...s }; this.editing.set(s); }

  save(): void {
    if (!String(this.form.title || '').trim()) { this.toast.error('Vui lòng nhập tiêu đề.'); return; }
    this.saving.set(true);
    const current = this.editing();
    const req = current?._id
      ? this.http.patch('/api/village-stories/' + current._id, this.form)
      : this.http.post('/api/village-stories', this.form);
    req.subscribe({
      next: () => { this.toast.success('Đã lưu câu chuyện.'); this.saving.set(false); this.editing.set(null); this.load(); },
      error: (e) => { this.toast.error(e?.error?.message || 'Không thể lưu.'); this.saving.set(false); },
    });
  }

  async remove(s: any) {
    const ok = await this.confirm.confirm({ title: 'Xác nhận xóa', message: 'Xóa câu chuyện này?', confirmText: 'Xóa', danger: true });
    if (!ok) return;
    this.http.delete('/api/village-stories/' + s._id).subscribe({
      next: () => { this.toast.success('Đã xóa.'); this.load(); },
      error: () => this.toast.error('Không thể xóa.'),
    });
  }
}
