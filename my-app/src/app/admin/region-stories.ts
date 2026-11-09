import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from './toast.service';
import { ConfirmService } from './confirm.service';
import { RichTextEditorComponent } from '../shared/rich-text-editor';

@Component({
  selector: 'app-admin-region-stories',
  standalone: true,
  styleUrls: ['./admin-list.css'],
  imports: [CommonModule, FormsModule, RichTextEditorComponent],
  template: `
    <div class="list-page">
      <header class="list-header">
        <h2><i class="fa-solid fa-earth-asia" aria-hidden="true"></i> Câu chuyện vùng miền ({{ stories().length }})</h2>
        <button type="button" class="btn-add" (click)="newStory()"><i class="fa-solid fa-plus" aria-hidden="true"></i> Thêm câu chuyện</button>
      </header>

      @if (editing()) {
        <section class="form-card">
          <h3>{{ form._id ? 'Chỉnh sửa câu chuyện vùng miền' : 'Thêm câu chuyện vùng miền' }}</h3>
          <div class="form-grid">
            <input class="form-input" [(ngModel)]="form.title" placeholder="Tiêu đề *" />
            <select class="form-input" [(ngModel)]="form.region">
              <option value="">-- Chọn vùng miền --</option>
              @for (r of regionOptions(); track r) {
                <option [ngValue]="r">{{ r }}</option>
              }
            </select>
            <input class="form-input" [(ngModel)]="form.imageUrl" placeholder="Ảnh URL" />
            <input class="form-input" type="number" [(ngModel)]="form.order" placeholder="Thứ tự (số lớn hiện trước)" />
            <select class="form-input" [(ngModel)]="form.status">
              <option value="published">Xuất bản</option>
              <option value="draft">Nháp</option>
            </select>
            <input class="form-input" [(ngModel)]="form.excerpt" placeholder="Mô tả ngắn" style="grid-column:1/-1" />
            <app-rich-text-editor [value]="form.content" (valueChange)="form.content = $event" placeholder="Nội dung câu chuyện" style="grid-column:1/-1"></app-rich-text-editor>
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
            <tr><th>Tiêu đề</th><th>Vùng miền</th><th>Trạng thái</th><th>Thứ tự</th><th>Thao tác</th></tr>
          </thead>
          <tbody>
            @for (s of stories(); track s._id) {
              <tr>
                <td>
                  <strong>{{ s.title }}</strong>
                  @if (s.excerpt) { <div style="font-size:12px;color:#6b7280;margin-top:2px">{{ s.excerpt }}</div> }
                </td>
                <td>{{ s.region || '—' }}</td>
                <td><span class="status-badge" [ngClass]="s.status === 'published' ? 'status-visible' : 'status-hidden'">{{ s.status === 'published' ? 'Xuất bản' : 'Nháp' }}</span></td>
                <td>{{ s.order || 0 }}</td>
                <td>
                  <button type="button" class="btn-small" (click)="edit(s)"><i class="fa-solid fa-pen" aria-hidden="true"></i> Sửa</button>
                  <button type="button" class="btn-small btn-delete" (click)="remove(s)"><i class="fa-solid fa-trash" aria-hidden="true"></i> Xóa</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5">Chưa có câu chuyện vùng miền. Bấm “Thêm câu chuyện”.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AdminRegionStoriesComponent {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  readonly stories = signal<any[]>([]);
  readonly editing = signal<any | null>(null);
  readonly saving = signal(false);
  readonly regionOptions = signal<string[]>([
    'Đông Bắc',
    'Tây Bắc',
    'Đồng bằng sông Hồng',
    'Bắc Trung Bộ',
    'Duyên hải Nam Trung Bộ',
    'Tây Nguyên',
    'Đông Nam Bộ',
    'Tây Nam Bộ',
  ]);
  form: any = {};

  constructor() {
    this.load();
    this.loadRegions();
  }

  private loadRegions(): void {
    this.http.get<any>('/api/regions').subscribe({
      next: (r) => {
        const list = Array.isArray(r) ? r : (r?.regions || []);
        const names = list.map((x: any) => String(x?.name || '').trim()).filter(Boolean);
        if (names.length) {
          const merged = Array.from(new Set([...this.regionOptions(), ...names]));
          this.regionOptions.set(merged);
        }
      },
      error: () => {},
    });
  }

  load(): void {
    this.http.get<{ stories: any[] }>('/api/region-stories').subscribe({
      next: (r) => this.stories.set(r.stories || []),
      error: () => this.toast.error('Không tải được câu chuyện vùng miền.'),
    });
  }

  newStory(): void {
    this.form = { title: '', region: '', excerpt: '', content: '', imageUrl: '', status: 'published', order: 0 };
    this.editing.set({});
  }

  edit(s: any): void { this.form = { ...s }; this.editing.set(s); }

  save(): void {
    if (!String(this.form.title || '').trim()) { this.toast.error('Vui lòng nhập tiêu đề.'); return; }
    this.saving.set(true);
    const current = this.editing();
    const req = current?._id
      ? this.http.patch('/api/region-stories/' + current._id, this.form)
      : this.http.post('/api/region-stories', this.form);
    req.subscribe({
      next: () => { this.toast.success('Đã lưu câu chuyện.'); this.saving.set(false); this.editing.set(null); this.load(); },
      error: (e) => { this.toast.error(e?.error?.message || 'Không thể lưu.'); this.saving.set(false); },
    });
  }

  async remove(s: any) {
    const ok = await this.confirm.confirm({ title: 'Xác nhận xóa', message: 'Xóa câu chuyện này?', confirmText: 'Xóa', danger: true });
    if (!ok) return;
    this.http.delete('/api/region-stories/' + s._id).subscribe({
      next: () => { this.toast.success('Đã xóa.'); this.load(); },
      error: () => this.toast.error('Không thể xóa.'),
    });
  }
}
