import { Component, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-admin-products',
  standalone: false,
  template: `
    <div class="list-page">
      <header class="list-header">
        <h2>Sản phẩm ({{ products().length }})</h2>
        <button type="button" class="btn-add" (click)="startCreate(); showForm.set(true)">Thêm</button>
      </header>

      <div class="stats-grid">
        <div class="stat-card stat--moss">
          <span class="stat-value">{{ stats().total }}</span>
          <span class="stat-label">Tổng SP</span>
        </div>
        <div class="stat-card stat--earth">
          <span class="stat-value">{{ stats().inStock }}</span>
          <span class="stat-label">Còn hàng</span>
        </div>
        <div class="stat-card stat--clay">
          <span class="stat-value">{{ stats().outOfStock }}</span>
          <span class="stat-label">Hết hàng</span>
        </div>
        <div class="stat-card stat--sage">
          <span class="stat-value">{{ stats().avgRating | number:'1.1-1' }}</span>
          <span class="stat-label">Điểm TB</span>
        </div>
      </div>

      @if (showForm()) {
        <div class="form-card">
          <h3>{{ editing() ? 'Sửa' : 'Thêm' }} sản phẩm</h3>
          <div class="form-grid">
            <input class="form-input" placeholder="Tên sản phẩm" [(ngModel)]="form.name" />
            <input class="form-input" placeholder="Slug" [(ngModel)]="form.slug" />
            <input class="form-input" placeholder="Giá" type="number" [(ngModel)]="form.price" />
            <select class="form-input" [(ngModel)]="form.cat">
              <option value="">Danh mục</option>
              <option value="Đặc sản">Đặc sản</option>
              <option value="Thủ công mỵ nghệ">Thủ công mỵ nghệ</option>
              <option value="Cà phê - Trà">Cà phê - Trà</option>
              <option value="Sản phẩm OCOP">Sản phẩm OCOP</option>
            </select>
            <input class="form-input" placeholder="Vùng miền" [(ngModel)]="form.region" />
            <input class="form-input" placeholder="Tỉnh" [(ngModel)]="form.province" />
            <input class="form-input" placeholder="Làng nghề" [(ngModel)]="form.village" />
            <input class="form-input" placeholder="Ảnh (URL, cách nhau dấu phẩy)" [(ngModel)]="form.images" />
            <textarea class="form-input" placeholder="Mô tả" [(ngModel)]="form.description"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-save" (click)="saveProduct()">Lưu</button>
            <button type="button" class="btn-cancel" (click)="showForm.set(false)">Hủy</button>
          </div>
        </div>
      }

      <div class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Tên</th>
              <th>Ảnh</th>
              <th>Giá</th>
              <th>Danh mục</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            @for (p of products(); track p.id) {
              <tr>
                <td>{{ p.id }}</td>
                <td>{{ p.name }}</td>
                <td>
                  @if (p.images?.length) {
                    <img [src]="p.images[0]" class="thumb-img" />
                  }
                </td>
                <td>{{ p.price }}đ</td>
                <td>{{ p.cat }}</td>
                <td>
                  <button type="button" class="btn-small" (click)="editProduct(p)">Sửa</button>
                  <button type="button" class="btn-small btn-delete" (click)="deleteProduct(p.slug)">Xóa</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6">Chưa có sản phẩm nào.</td></tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination
        [currentPage]="page()"
        [totalPages]="totalPages()"
        (pageChange)="page.set($event); loadProducts()"
      ></app-pagination>
    </div>
  `,
  styleUrls: ['./admin-list.css'],
})
export class AdminProductsComponent {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  readonly products = signal<any[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);
  form: any = {};

  readonly stats = computed(() => {
    const p = this.products();
    const withRating = p.filter((x: any) => x.rate > 0);
    const avgRating = withRating.length > 0
      ? withRating.reduce((s: number, x: any) => s + x.rate, 0) / withRating.length
      : 0;
    return {
      total: p.length,
      inStock: p.filter((x: any) => x.inStock).length,
      outOfStock: p.filter((x: any) => !x.inStock).length,
      avgRating: Number(avgRating.toFixed(1)),
    };
  });

  constructor() {
    this.loadProducts();
  }

  loadProducts(): void {
    this.http.get('/api/products?page=' + this.page() + '&limit=20').subscribe((r: any) => {
      const items = Array.isArray(r) ? r : (r.products || []);
      this.products.set(items);
      this.totalPages.set(r.totalPages || 1);
    });
  }

  startCreate(): void {
    this.editing.set(null);
    this.form = { name: '', slug: '', price: 0, cat: '', region: '', province: '', village: '', images: '', description: '' };
  }

  editProduct(p: any): void {
    this.editing.set(p);
    this.form = { ...p, images: Array.isArray(p.images) ? p.images.join(', ') : p.images };
    this.showForm.set(true);
  }

  saveProduct(): void {
    const f = { ...this.form };
    if (Array.isArray(f.images)) {
      f.images = f.images;
    } else if (typeof f.images === 'string') {
      f.images = f.images.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    if (this.editing()) {
      this.http.put('/api/products/' + f.slug, f).subscribe({
        next: () => { this.toast.success('Cập nhật sản phẩm thành công'); this.loadProducts(); this.showForm.set(false); },
        error: () => this.toast.error('Không thể cập nhật sản phẩm'),
      });
    } else {
      this.http.post('/api/products', f).subscribe({
        next: () => { this.toast.success('Thêm sản phẩm thành công'); this.loadProducts(); this.showForm.set(false); },
        error: () => this.toast.error('Không thể thêm sản phẩm'),
      });
    }
  }

  deleteProduct(slug: string): void {
    if (confirm('Xóa sản phẩm này?')) {
      this.http.delete('/api/products/' + slug).subscribe({
        next: () => { this.toast.success('Xóa sản phẩm thành công'); this.loadProducts(); },
        error: () => this.toast.error('Không thể xóa sản phẩm'),
      });
    }
  }
}
