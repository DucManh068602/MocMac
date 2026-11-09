import { Component, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from './toast.service';
import { ProductsService } from '../products.service';

@Component({
  selector: 'app-admin-products',
  standalone: false,
  template: `
    <div class="list-page">
      <header class="list-header">
        <h2>Sản phẩm ({{ products().length }})</h2>
        <div class="admin-filters">
          <div class="filter-group">
            <input
              class="filter-input"
              placeholder="Tìm tên sản phẩm..."
              [(ngModel)]="searchTerm"
              (input)="onFilterChange()"
              style="width: 200px"
            />
          </div>
          <div class="filter-group">
            <select class="filter-select" [(ngModel)]="categoryFilter" (change)="onFilterChange()" style="width: 160px">
              <option value="">Tất cả danh mục</option>
              <option value="Đặc sản">Đặc sản</option>
              <option value="Thủ công mỵ nghệ">Thủ công mỵ nghệ</option>
              <option value="Cà phê - Trà">Cà phê - Trà</option>
              <option value="Sản phẩm OCOP">Sản phẩm OCOP</option>
            </select>
          </div>
          <div class="filter-group">
            <select class="filter-select" [(ngModel)]="stockFilter" (change)="onStockFilterChange()" style="width: 160px">
              <option value="">Tất cả tồn kho</option>
              <option value="in">Còn hàng</option>
              <option value="out">Hết hàng</option>
            </select>
          </div>
          <button
            type="button"
            class="filter-reset"
            (click)="resetFilters()"
            [disabled]="!searchTerm && !categoryFilter"
          >
            Xóa bộ lọc
          </button>
        </div>
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
            <input class="form-input" placeholder="Tên sản phẩm" [(ngModel)]="form.name" (input)="genSlug()" />
            <input class="form-input" placeholder="Slug" [(ngModel)]="form.slug" />
            <input class="form-input" placeholder="Giá" type="number" [(ngModel)]="form.price" />
            <input class="form-input" placeholder="Tồn kho (mặc định 100)" type="number" [(ngModel)]="form.stock" />
            <select class="form-input form-select-sm" [(ngModel)]="form.deal">
              <option [ngValue]="null">Không áp dụng Deal</option>
              @for (deal of deals(); track deal._id) { <option [ngValue]="deal._id">{{ deal.title }} · {{ deal.discountType === 'percent' ? '-' + deal.discountValue + '%' : '-' + deal.discountValue + 'đ' }}</option> }
            </select>
            <select class="form-input form-select-sm" [(ngModel)]="form.cat">
              <option value="">Danh mục</option>
              <option value="Đặc sản">Đặc sản</option>
              <option value="Thủ công mỵ nghệ">Thủ công mỵ nghệ</option>
              <option value="Cà phê - Trà">Cà phê - Trà</option>
              <option value="Sản phẩm OCOP">Sản phẩm OCOP</option>
            </select>
            <select class="form-input form-select-sm" [(ngModel)]="form.region" placeholder="Vùng miền">
              <option value="">Chọn vùng miền</option>
              @for (r of regions(); track r.slug) {
                <option [ngValue]="r.name">{{ r.name }}</option>
              }
            </select>
            <select class="form-input form-select-sm" [(ngModel)]="form.province" placeholder="Tỉnh">
              <option value="">Chọn tỉnh</option>
              @for (p of provinces(); track p.code) {
                <option [ngValue]="p.name">{{ p.name }}</option>
              }
            </select>
            <select class="form-input form-select-sm" [(ngModel)]="form.village" placeholder="Làng nghề">
              <option value="">Chọn làng nghề</option>
              @for (v of villages(); track v) {
                <option [ngValue]="v">{{ v }}</option>
              }
            </select>
            <div class="upload-area-sm" (click)="fileInput.click()" (dragover)="onDragOver($event)" (drop)="onDrop($event)">
              <input type="file" #fileInput multiple accept="image/*" (change)="onFileSelect($event)" style="display:none" />
              <div class="upload-placeholder-sm">
                <span>📁 Ảnh</span>
                <small>JPG, PNG (5MB)</small>
              </div>
              @if (previewImages().length > 0) {
                <div class="preview-grid-sm">
                  @for (img of previewImages(); track img; let i = $index) {
                    <div class="preview-item-sm">
                      <img [src]="img" alt="Preview" />
                      <button type="button" class="remove-btn-sm" (click)="removePreview(i)" title="Xóa">×</button>
                    </div>
                  }
                </div>
              }
            </div>
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
              <th>Tồn kho</th>
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
                <td>{{ p.stock ?? p.totalStock ?? 0 }}</td>
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
  private ps = inject(ProductsService);
  readonly products = signal<any[]>([]);
  readonly provinces = signal<any[]>([]);
  readonly villages = signal<string[]>([]);
  readonly regions = computed(() => this.ps.regions());
  readonly deals = signal<any[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);
  readonly previewImages = signal<string[]>([]);
  form: any = {};
  searchTerm = '';
  categoryFilter = '';
  stockFilter = '';

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
    this.loadProvinces();
    this.loadVillages();
    this.loadDeals();
  }

  onFilterChange(): void {
    this.page.set(1);
    this.loadProducts();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.categoryFilter = '';
    this.stockFilter = '';
    this.page.set(1);
    this.loadProducts();
  }

  onStockFilterChange(): void {
    this.page.set(1);
    this.loadProducts();
  }

  loadProducts(): void {
    const params = new URLSearchParams({
      page: String(this.page()),
      limit: '12',
    });
    if (this.searchTerm) params.set('q', this.searchTerm);
    if (this.categoryFilter) params.set('cat', this.categoryFilter);
    if (this.stockFilter) params.set('stock', this.stockFilter);

    this.http.get('/api/products?' + params.toString()).subscribe((r: any) => {
      const items = Array.isArray(r) ? r : (r.products || []);
      this.products.set(items);
      this.totalPages.set(r.totalPages || 1);
    });
  }

  genSlug(): void {
    if (this.editing()) return;
    const name: string = this.form.name || '';
    this.form.slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  loadProvinces(): void {
    this.http.get('/api/provinces').subscribe((r: any) => {
      this.provinces.set(Array.isArray(r) ? r : []);
    });
  }

  loadVillages(): void {
    this.http.get('/api/villages').subscribe((r: any) => {
      this.villages.set(Array.isArray(r) ? r : []);
    });
  }

  loadDeals(): void { this.http.get<any>('/api/deals?active=true&limit=100').subscribe(r => this.deals.set(r.deals || [])); }

  startCreate(): void {
    this.editing.set(null);
    this.form = { name: '', slug: '', price: 0, stock: 100, deal: null, cat: '', region: '', province: '', village: '', images: [], description: '' };
    this.previewImages.set([]);
  }

  editProduct(p: any): void {
    this.editing.set(p);
    this.form = { ...p, deal: p.deal?._id || p.deal || null, images: p.images || [] };
    this.previewImages.set(p.images || []);
    this.showForm.set(true);
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.uploadFiles(Array.from(input.files));
    }
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    (event.target as HTMLElement).classList.add('drag-over');
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    (event.target as HTMLElement).classList.remove('drag-over');
    if (event.dataTransfer?.files) {
      this.uploadFiles(Array.from(event.dataTransfer.files));
    }
  }

  uploadFiles(files: File[]): void {
    const validFiles = files.filter(f => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024);
    if (validFiles.length === 0) {
      this.toast.error('File không hợp lệ. Chỉ chấp nhận ảnh (JPG, PNG, WebP, GIF) dưới 5MB.');
      return;
    }

    const formData = new FormData();
    validFiles.forEach(f => formData.append('images', f));

    this.http.post('/api/uploads/image', formData).subscribe({
      next: (res: any) => {
        if (res.success && res.urls) {
          const newImages = [...this.previewImages(), ...res.urls];
          this.previewImages.set(newImages);
          this.form.images = newImages;
          this.toast.success(`Đã tải lên ${res.urls.length} ảnh`);
        }
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Tải lên ảnh thất bại');
      },
    });
  }

  removePreview(index: number): void {
    const images = [...this.previewImages()];
    images.splice(index, 1);
    this.previewImages.set(images);
    this.form.images = images;
  }

  saveProduct(): void {
    const f = { ...this.form };
    f.images = this.previewImages();

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
