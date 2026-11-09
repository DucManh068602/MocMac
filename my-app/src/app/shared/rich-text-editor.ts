import { Component, inject, input, output, signal, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  template: `
    <div class="rte-toolbar">
      <button type="button" class="rte-btn" [class.active]="active('bold')" (click)="format('bold')" title="In đậm"><i class="fa-solid fa-bold"></i></button>
      <button type="button" class="rte-btn" [class.active]="active('italic')" (click)="format('italic')" title="In nghiêng"><i class="fa-solid fa-italic"></i></button>
      <button type="button" class="rte-btn" [class.active]="active('underline')" (click)="format('underline')" title="Gạch dưới"><i class="fa-solid fa-underline"></i></button>
      <div class="rte-sep"></div>
      <button type="button" class="rte-btn" [class.active]="active('insertUnorderedList')" (click)="format('insertUnorderedList')" title="Danh sách không đánh số"><i class="fa-solid fa-list-ul"></i></button>
      <button type="button" class="rte-btn" [class.active]="active('insertOrderedList')" (click)="format('insertOrderedList')" title="Danh sách đánh số"><i class="fa-solid fa-list-ol"></i></button>
      <div class="rte-sep"></div>
      <select class="rte-select" [(ngModel)]="align" (change)="setAlign()" title="Căn lề">
        <option value="left">Trái</option><option value="center">Giữa</option><option value="right">Phải</option>
      </select>
      <div class="rte-sep"></div>
      <button type="button" class="rte-btn rte-img" (click)="openImageDialog()" title="Chèn ảnh"><i class="fa-solid fa-image"></i></button>
      <button type="button" class="rte-btn" (click)="insertLink()" title="Liên kết"><i class="fa-solid fa-link"></i></button>
      <button type="button" class="rte-btn rte-clear" (click)="format('removeFormat')" title="Xóa định dạng"><i class="fa-solid fa-eraser"></i></button>
    </div>

    <!-- Image insert dialog -->
    <div class="rte-img-dialog" *ngIf="showImgDialog">
      <div class="rte-img-dialog-overlay" (click)="closeImgDialog()"></div>
      <div class="rte-img-dialog-box" (click)="$event.stopPropagation()">
        <h4>Chèn ảnh vào bài viết</h4>
        <div class="rte-img-tabs">
          <button class="rte-img-tab" [class.active]="imgTab === 'url'" (click)="imgTab = 'url'">Từ URL</button>
          <button class="rte-img-tab" [class.active]="imgTab === 'upload'" (click)="imgTab = 'upload'">Tải lên</button>
        </div>

        @if (imgTab === 'url') {
          <div class="rte-img-field">
            <label>Đường dẫn ảnh</label>
            <input class="rte-img-input" [(ngModel)]="imgUrl" placeholder="https://..." />
            <button class="rte-img-btn" (click)="insertImgByUrl()">Chèn</button>
          </div>
        } @else {
          <div class="rte-img-field">
            <label>Chọn file ảnh</label>
            <input type="file" class="rte-img-file" accept="image/*" (change)="onImgFileSelected($event)" />
            @if (imgFile) {
              <div class="rte-img-preview"><img [src]="imgFilePreview" alt="preview" /></div>
              <button class="rte-img-btn rte-img-upload-btn" (click)="uploadImgFile()">Tải lên và chèn</button>
            }
          </div>
        }

        @if (imgError) {
          <div class="rte-img-error">{{ imgError }}</div>
        }
        @if (imgUploading) {
          <div class="rte-img-error" style="color:#6b7f52">Đang tải lên...</div>
        }

        <div class="rte-img-actions">
          <button class="rte-img-btn rte-img-cancel" (click)="closeImgDialog()">Hủy</button>
        </div>
      </div>
    </div>

    <div class="rte-wrapper">
      <div #editor contenteditable="true" class="rte-editor" [attr.placeholder]="placeholder()" (input)="onInput()" (blur)="onBlur()" (paste)="onPaste($event)"></div>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: 'Be Vietnam Pro','Segoe UI',Arial,sans-serif; }
    .rte-toolbar { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; padding: 8px 10px; border: 1px solid #d6ceb9; border-bottom: none; border-radius: 10px 10px 0 0; background: #fcfaf7; }
    .rte-btn { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border: 1px solid #c9bda8; border-radius: 6px; background: #fff; color: #5e554b; font-size: 13px; cursor: pointer; }
    .rte-btn:hover { border-color: #6b7f52; color: #2f2a24; background: #f7fbf6; }
    .rte-btn.active { border-color: #6b7f52; background: #eef3ec; color: #2f2a24; }
    .rte-img { position: relative; }
    .rte-clear { color: #c0392b; }
    .rte-sep { width: 1px; height: 24px; background: #d6ceb9; margin: 0 4px; }
    .rte-select { width: 90px; height: 34px; border: 1px solid #c9bda8; border-radius: 6px; background: #fff; color: #5e554b; font: 500 12px inherit; padding: 0 8px; cursor: pointer; }
    .rte-wrapper { border: 1px solid #d6ceb9; border-top: none; border-radius: 0 0 10px 10px; min-height: 220px; }
    .rte-editor { padding: 12px; min-height: 200px; outline: none; white-space: pre-wrap; word-break: break-word; color: #2f2a24; line-height: 1.7; font-size: 13.5px; }
    .rte-editor:empty:before { content: attr(placeholder); color: #9a9388; }

    /* Image dialog */
    .rte-img-dialog { position: fixed; inset: 0; z-index: 2000; display: flex; align-items: center; justify-content: center; }
    .rte-img-dialog-overlay { position: absolute; inset: 0; background: rgba(0,0,0,.45); backdrop-filter: blur(2px); }
    .rte-img-dialog-box { position: relative; background: #fff; border: 1px solid #d6ceb9; border-radius: 14px; width: min(480px, 92vw); max-height: 85vh; overflow-y: auto; padding: 22px; box-shadow: 0 20px 60px rgba(0,0,0,.18); }
    .rte-img-dialog-box h4 { margin: 0 0 16px; font-size: 1.15rem; font-weight: 800; color: #2f2a24; }
    .rte-img-tabs { display: flex; gap: 8px; margin-bottom: 16px; border-bottom: 1px solid #ece6dd; padding-bottom: 10px; }
    .rte-img-tab { border: 0; background: transparent; color: #6f685f; font: 600 .88rem inherit; padding: 6px 12px; border-radius: 6px; cursor: pointer; border-bottom: 2px solid transparent; }
    .rte-img-tab.active { color: #6b7f52; border-bottom-color: #6b7f52; background: #f7fbf6; }
    .rte-img-field { margin-bottom: 16px; }
    .rte-img-field label { display: block; font-size: .82rem; font-weight: 600; color: #5e554b; margin-bottom: 6px; }
    .rte-img-input { width: 100%; padding: 8px 12px; border: 1px solid #d6ceb9; border-radius: 8px; background: #fff; color: #2f2a24; font: 500 13px inherit; box-sizing: border-box; }
    .rte-img-input:focus { outline: none; border-color: #6b7f52; }
    .rte-img-file { width: 100%; padding: 8px; border: 1px dashed #c9bda8; border-radius: 8px; background: #fcfaf7; color: #5e554b; cursor: pointer; }
    .rte-img-preview { margin-top: 10px; border: 1px solid #ece6dd; border-radius: 8px; overflow: hidden; background: #f7fbf6; }
    .rte-img-preview img { width: 100%; height: 160px; object-fit: cover; display: block; }
    .rte-img-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border: 1px solid #6b7f52; border-radius: 8px; background: #6b7f52; color: #fff; font: 600 13px inherit; cursor: pointer; white-space: nowrap; }
    .rte-img-btn:hover { background: #5a6e48; }
    .rte-img-upload-btn { background: #2f2a24; border-color: #2f2a24; }
    .rte-img-upload-btn:hover { background: #1f1d19; }
    .rte-img-cancel { background: #fff; border-color: #d6ceb9; color: #5e554b; }
    .rte-img-cancel:hover { background: #f4f3ec; }
    .rte-img-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 18px; }
    .rte-img-error { margin-top: 8px; font-size: .82rem; color: #c0392b; background: #fdecea; border: 1px solid #f5c6c0; border-radius: 6px; padding: 8px 12px; }
  `],
  imports: [CommonModule, FormsModule],
})
export class RichTextEditorComponent implements AfterViewInit, OnChanges {
  private el = inject(ElementRef);
  readonly value = input<string>('');
  readonly placeholder = input<string>('Nhập nội dung...');
  readonly valueChange = output<string>();

  @ViewChild('editor') editor!: ElementRef<HTMLElement>;
  private isUserTyping = false;
  align = 'left';

  // Image dialog state
  showImgDialog = false;
  imgTab: 'url' | 'upload' = 'url';
  imgUrl = '';
  imgFile: File | null = null;
  imgFilePreview = '';
  imgUploading = false;
  imgError = '';

  ngAfterViewInit(): void {
    const root = this.editor.nativeElement;
    if (this.value()) root.innerHTML = this.value();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const vChange = changes['value'];
    if (vChange && !this.isUserTyping) {
      const root = this.editor?.nativeElement;
      if (root && root.innerHTML !== vChange.currentValue) {
        root.innerHTML = vChange.currentValue || '';
      }
    }
  }

  format(cmd: string): void {
    this.isUserTyping = true;
    const root = this.editor.nativeElement;
    root.focus();
    document.execCommand(cmd, false, undefined);
    this.sync();
    setTimeout(() => this.isUserTyping = false, 50);
  }

  setAlign(): void {
    this.isUserTyping = true;
    const root = this.editor.nativeElement;
    root.focus();
    document.execCommand('justify' + this.align.charAt(0).toUpperCase() + this.align.slice(1), false, undefined);
    this.sync();
    setTimeout(() => this.isUserTyping = false, 50);
  }

  openImageDialog(): void {
    const root = this.editor.nativeElement;
    root.focus();
    this.showImgDialog = true;
    this.imgTab = 'url';
    this.imgUrl = '';
    this.imgFile = null;
    this.imgFilePreview = '';
    this.imgError = '';
  }

  closeImgDialog(): void {
    this.showImgDialog = false;
    this.imgError = '';
    this.imgUploading = false;
  }

  insertImgByUrl(): void {
    const url = String(this.imgUrl || '').trim();
    if (!url) { this.imgError = 'Vui lòng nhập đường dẫn ảnh.'; return; }
    const root = this.editor.nativeElement;
    root.focus();
    document.execCommand('insertImage', false, url);
    this.sync();
    this.closeImgDialog();
  }

  onImgFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.imgError = 'Chỉ chấp nhận file ảnh.'; return; }
    this.imgFile = file;
    this.imgError = '';
    const reader = new FileReader();
    reader.onload = (e) => { this.imgFilePreview = String(e.target?.result); };
    reader.readAsDataURL(file);
  }

  async uploadImgFile(): Promise<void> {
    if (!this.imgFile) return;
    this.imgUploading = true;
    this.imgError = '';
    try {
      const token = localStorage.getItem('mocmac-auth-token') || sessionStorage.getItem('mocmac-auth-token');
      const formData = new FormData();
      formData.append('images', this.imgFile);
      const res = await fetch('/api/uploads/image', {
        method: 'POST',
        headers: token ? { Authorization: 'Bearer ' + token } : {},
        body: formData,
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.message || 'Tải lên ảnh thất bại.');
      const url = Array.isArray(json.urls) ? json.urls[0] : json.url;
      const root = this.editor.nativeElement;
      root.focus();
      document.execCommand('insertImage', false, url);
      this.sync();
      this.closeImgDialog();
    } catch (e: any) {
      this.imgError = e?.message || 'Tải lên ảnh thất bại.';
    } finally {
      this.imgUploading = false;
    }
  }

  insertLink(): void {
    const url = prompt('Nhập URL liên kết:');
    if (url) {
      const root = this.editor.nativeElement;
      root.focus();
      document.execCommand('createLink', false, url);
      this.sync();
    }
  }

  onInput(): void {
    if (this.isUserTyping) {
      this.sync();
    }
  }

  onBlur(): void {
    this.sync();
  }

  onPaste(event: ClipboardEvent): void {
    // Allow plain text paste; images handled via dialog
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') || '';
    document.execCommand('insertText', false, text);
    this.sync();
  }

  private sync(): void {
    const root = this.editor?.nativeElement;
    if (!root) return;
    this.valueChange.emit(root.innerHTML);
  }

  active(cmd: string): boolean {
    try { return document.queryCommandState(cmd); } catch { return false; }
  }
}
