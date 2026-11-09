import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ToastService } from './toast.service';
import { ConfirmService } from './confirm.service';
import { Subscription } from 'rxjs';

interface Section { heading: string; body: string; }
interface ContentDoc { key: string; title: string; sections: Section[]; updatedAt?: string; }

const DEFAULTS: Record<'terms' | 'privacy', { title: string; sections: Section[] }> = {
  terms: {
    title: 'Điều khoản dịch vụ',
    sections: [
      { heading: '1. Giới thiệu', body: 'Chào mừng bạn đến với Mộc Mạc — nền tảng thương mại điện tử chuyên về sản phẩm thủ công, làng nghề và đặc sản Việt Nam. Việc truy cập và sử dụng trang web mocmac.vn có nghĩa là bạn đồng ý với các điều khoản dịch vụ sau đây.' },
      { heading: '2. Điều kiện sử dụng', body: 'Bạn phải từ 18 tuổi trở lên hoặc có sự đồng ý của người giám hộ để sử dụng dịch vụ. Bạn cam kết cung cấp thông tin chính xác, đầy đủ và cập nhật khi đăng ký tài khoản hoặc đặt hàng trên trang web.' },
      { heading: '3. Đơn hàng và thanh toán', body: 'Mọi đơn hàng đặt trên trang web là cam kết mua hàng. Giá sản phẩm được hiển thị bằng đồng Việt Nam (đ) và có thể thay đổi. Mộc Mạc hỗ trợ COD, VNPay, MoMo và chuyển khoản ngân hàng.' },
      { heading: '4. Giao hàng và đổi trả', body: 'Mộc Mạc giao hàng toàn quốc qua đối tác vận chuyển. Khách hàng có quyền đổi trả trong vòng 14 ngày nếu sản phẩm lỗi kỹ thuật hoặc không đúng mô tả, còn nguyên tem/đóng gói ban đầu.' },
      { heading: '5. Bản quyền và sở hữu trí tuệ', body: 'Toàn bộ nội dung trên trang web thuộc sở hữu của Mộc Mạc hoặc đơn vị cấp phép. Không sao chép, phân phối khi chưa có phép bằng văn bản.' },
      { heading: '6. Liên hệ', body: 'Email: support@mocmac.vn\nĐiện thoại: 0901 234 567\nĐịa chỉ: Mộc Mạc – Sản phẩm thủ công làng nghề Việt Nam' },
    ],
  },
  privacy: {
    title: 'Chính sách bảo vệ dữ liệu',
    sections: [
      { heading: '1. Giới thiệu', body: 'Mộc Mạc cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của bạn khi truy cập mocmac.vn hoặc sử dụng dịch vụ.' },
      { heading: '2. Thông tin thu thập', body: 'Họ tên, số điện thoại, email, địa chỉ giao hàng, thông tin giao dịch (không lưu số thẻ), và dữ liệu kỹ thuật (IP, trình duyệt, cookie) để xử lý đơn và cải thiện trải nghiệm.' },
      { heading: '3. Mục đích sử dụng', body: 'Xử lý đơn hàng, hỗ trợ sau bán hàng, gửi thông báo (nếu bạn đồng ý), cải thiện dịch vụ và tuân thủ yêu cầu pháp luật.' },
      { heading: '4. Chia sẻ thông tin', body: 'Mộc Mạc không bán dữ liệu cá nhân. Chỉ chia sẻ cần thiết với đối tác vận chuyển, nhà cung cấp thanh toán hoặc cơ quan nhà nước khi có yêu cầu pháp lý.' },
      { heading: '5. Quyền của bạn', body: 'Bạn có quyền truy cập, sửa đổi, xóa dữ liệu hoặc rút đồng ý nhận tin quảng cáo.\nEmail: privacy@mocmac.vn · Điện thoại: 0901 234 567' },
    ],
  },
};

@Component({
  selector: 'app-admin-legal-content',
  standalone: true,
  imports: [RouterModule],
  styleUrls: ['./admin-list.css'],
  template: `
    <div class="list-page legal-admin">
      <header class="list-header legal-admin-head">
        <div>
          <h2><i [class]="key() === 'terms' ? 'fa-solid fa-file-contract' : 'fa-solid fa-shield-halved'" aria-hidden="true"></i> Chỉnh sửa: {{ title() }}</h2>
          <p class="legal-admin-sub">Sửa tiêu đề/nội dung từng mục, thêm hoặc xóa mục, rồi bấm <strong>Lưu nội dung</strong>. Trang public sẽ hiển thị nội dung đã lưu.</p>
        </div>
        <div class="legal-admin-actions">
          <a class="btn-small" [routerLink]="['/admin/legal/terms']" [class.active-link]="key() === 'terms'"><i class="fa-solid fa-file-contract" aria-hidden="true"></i> Điều khoản</a>
          <a class="btn-small" [routerLink]="['/admin/legal/privacy']" [class.active-link]="key() === 'privacy'"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i> Chính sách</a>
          <a class="btn-small" [routerLink]="previewPath()" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> Xem trang</a>
          <button type="button" class="btn-small" (click)="loadDefaults()"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i> Nạp mẫu đầy đủ</button>
          <button type="button" class="btn-add" (click)="addSection()"><i class="fa-solid fa-plus" aria-hidden="true"></i> Thêm mục</button>
        </div>
      </header>

      @if (loading()) {
        <p style="padding:12px;color:#6b7280"><i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Đang tải nội dung...</p>
      } @else {
        <section class="form-card legal-admin-card">
          <div class="form-grid" style="margin-bottom:14px">
            <label style="grid-column:1/-1;display:flex;flex-direction:column;gap:6px;font-size:13px;color:#374151">
              <strong>Tiêu đề trang</strong>
              <input class="form-input" [value]="title()" (input)="title.set($any($event.target).value)" placeholder="Tiêu đề" />
            </label>
          </div>

          @for (s of sections(); track $index; let i = $index) {
            <div class="legal-section-editor">
              <div class="legal-section-head">
                <strong>Mục {{ i + 1 }} / {{ sections().length }}</strong>
                <div class="legal-section-tools">
                  <button type="button" class="btn-small" (click)="move(i, -1)" [disabled]="i === 0" title="Lên"><i class="fa-solid fa-arrow-up" aria-hidden="true"></i></button>
                  <button type="button" class="btn-small" (click)="move(i, 1)" [disabled]="i === sections().length - 1" title="Xuống"><i class="fa-solid fa-arrow-down" aria-hidden="true"></i></button>
                  <button type="button" class="btn-small btn-delete" (click)="removeSection(i)"><i class="fa-solid fa-trash" aria-hidden="true"></i> Xóa mục</button>
                </div>
              </div>
              <div style="display:flex;flex-direction:column;gap:8px">
                <input class="form-input" [value]="s.heading" (input)="updateHeading(i, $any($event.target).value)" placeholder="Tiêu đề mục (VD: 1. Giới thiệu)" />
                <textarea class="form-input" rows="6" [value]="s.body" (input)="updateBody(i, $any($event.target).value)" placeholder="Nội dung mục... (mỗi dòng xuống hàng sẽ là một đoạn)" style="resize:vertical;min-height:110px"></textarea>
              </div>
            </div>
          } @empty {
            <p style="color:#6b7280;font-size:13px;margin:0 0 10px">Chưa có mục nào (đang dùng nội dung mẫu mặc định trên trang public). Bấm <strong>Nạp mẫu đầy đủ</strong> để chỉnh sửa, hoặc <strong>Thêm mục</strong>.</p>
          }

          <div class="form-actions legal-admin-footer">
            <button type="button" class="btn-save" (click)="save()" [disabled]="saving()"><i class="fa-solid fa-floppy-disk" aria-hidden="true"></i> {{ saving() ? 'Đang lưu...' : 'Lưu nội dung' }}</button>
            <button type="button" class="btn-cancel" (click)="load()" [disabled]="saving()">Tải lại từ server</button>
            @if (updatedAt()) { <span class="legal-updated">Cập nhật DB: {{ updatedAt() }}</span> }
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .legal-admin-head{align-items:flex-start;gap:12px;flex-wrap:wrap}
    .legal-admin-sub{margin:6px 0 0;color:#6b7280;font-size:13px;line-height:1.5}
    .legal-admin-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
    .legal-admin-actions .active-link{background:#eef5f0;border-color:#2f4538;color:#2f4538}
    .legal-admin-card{width:100%;max-width:none}
    .legal-section-editor{border:1px solid #e6ddcf;border-radius:12px;padding:12px;margin-bottom:10px;background:#fff}
    .legal-section-head{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap}
    .legal-section-head strong{color:#2f4538;font-size:13px}
    .legal-section-tools{display:flex;gap:6px;align-items:center}
    .legal-admin-footer{align-items:center;flex-wrap:wrap}
    .legal-updated{color:#6b7280;font-size:12px}
  `],
})
export class AdminLegalContentComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private sub?: Subscription;

  readonly key = signal<'terms' | 'privacy'>('terms');
  readonly title = signal('');
  readonly sections = signal<Section[]>([]);
  readonly saving = signal(false);
  readonly loading = signal(false);
  readonly updatedAt = signal('');

  ngOnInit(): void {
    this.sub = this.route.data.subscribe((d) => {
      const k = d['legalKey'] === 'privacy' ? 'privacy' : 'terms';
      this.key.set(k);
      this.load();
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  previewPath(): string {
    return this.key() === 'terms' ? '/dieu-khoan-dich-vu' : '/chinh-sach-bao-ve-du-lieu';
  }

  load(): void {
    this.loading.set(true);
    this.http.get<{ content: ContentDoc }>(`/api/site-content/${this.key()}`).subscribe({
      next: (r) => {
        const c = r?.content;
        const def = DEFAULTS[this.key()];
        this.title.set(String(c?.title || def.title));
        const saved = Array.isArray(c?.sections) ? c!.sections : [];
        this.sections.set(saved.length
          ? saved.map((s) => ({ heading: String(s?.heading || ''), body: String(s?.body || '') }))
          : def.sections.map((s) => ({ ...s })));
        this.updatedAt.set(c?.updatedAt ? new Date(c.updatedAt).toLocaleString('vi-VN') : '');
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Không tải được nội dung. Đang hiển thị mẫu mặc định.');
        this.loadDefaults();
        this.loading.set(false);
      },
    });
  }

  loadDefaults(): void {
    const def = DEFAULTS[this.key()];
    this.title.set(def.title);
    this.sections.set(def.sections.map((s) => ({ ...s })));
  }

  addSection(): void {
    this.sections.update((list) => [...list, { heading: '', body: '' }]);
  }

  removeSection(i: number): void {
    this.sections.update((list) => list.filter((_, idx) => idx !== i));
  }

  move(i: number, dir: -1 | 1): void {
    this.sections.update((list) => {
      const j = i + dir;
      if (j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  updateHeading(i: number, value: string): void {
    this.sections.update((list) => list.map((s, idx) => (idx === i ? { ...s, heading: value } : s)));
  }

  updateBody(i: number, value: string): void {
    this.sections.update((list) => list.map((s, idx) => (idx === i ? { ...s, body: value } : s)));
  }

  save(): void {
    const payload = {
      title: this.title().trim(),
      sections: this.sections().map((s) => ({ heading: s.heading.trim(), body: s.body.trim() })).filter((s) => s.heading || s.body),
    };
    if (!payload.title) { this.toast.error('Vui lòng nhập tiêu đề.'); return; }
    this.saving.set(true);
    this.http.put<{ content: ContentDoc }>(`/api/site-content/${this.key()}`, payload).subscribe({
      next: (r) => {
        this.saving.set(false);
        this.toast.success('Đã lưu nội dung. Trang public sẽ cập nhật khi tải lại.');
        const c = r?.content;
        if (c?.updatedAt) this.updatedAt.set(new Date(c.updatedAt).toLocaleString('vi-VN'));
      },
      error: (e) => { this.saving.set(false); this.toast.error(e?.error?.message || 'Không thể lưu (kiểm tra đăng nhập admin/staff và API).'); },
    });
  }
}
