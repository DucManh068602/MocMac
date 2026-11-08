import { Component, inject, signal, computed } from '@angular/core';
import { ProductsService } from '../../products.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../admin/toast.service';

interface BusinessIdea {
  icon: string;
  title: string;
  desc: string;
}

interface QuoteItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface QuoteForm {
  name: string;
  phone: string;
  email: string;
  company: string;
  message: string;
}

@Component({
  selector: 'app-gift-business',
  standalone: false,
  templateUrl: './gift-business.html',
  styleUrl: './gift-business.css',
})
export class GiftBusinessComponent {
  private readonly productsService = inject(ProductsService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly businessIdeas = signal<BusinessIdea[]>([
    {
      icon: 'fa-solid fa-gift',
      title: 'Quà tặng doanh nghiệp',
      desc: 'Thiết kế bộ quà tặng độc đáo với logo doanh nghiệp, phù hợp cho khách hàng, đối tác và nhân viên.',
    },
    {
      icon: 'fa-solid fa-palette',
      title: 'Tùy biến theo thương hiệu',
      desc: 'Cá nhân hóa sản phẩm với màu sắc, họa tiết và thông điệp thương hiệu của doanh nghiệp bạn.',
    },
    {
      icon: 'fa-solid fa-box',
      title: 'Đóng gói chuyên nghiệp',
      desc: 'Giấy bìa, hộp quà và thẻ thiệp được thiết kế đẹp mắt, tôn vinh giá trị thương hiệu.',
    },
    {
      icon: 'fa-solid fa-truck',
      title: 'Giao hàng toàn quốc',
      desc: 'Hỗ trợ giao hàng nhanh tận nơi, kèm dịch vụ lắp ráp và lắp đặt nếu cần.',
    },
  ]);

  readonly allProducts = this.productsService.products;
  readonly selectedItems = signal<QuoteItem[]>([]);

  // Modal state
  readonly quoteModalOpen = signal(false);
  readonly quoteForm = signal<QuoteForm>({ name: '', phone: '', email: '', company: '', message: '' });
  readonly submitting = signal(false);

  inQuote(id: number): boolean {
    return this.selectedItems().some((it) => it.id === id);
  }

  toggleQuote(p: { id: number; name: string; price: number }, event?: Event): void {
    if (event) event.stopPropagation();
    const items = [...this.selectedItems()];
    const idx = items.findIndex((it) => it.id === p.id);
    if (idx >= 0) {
      if (items[idx].quantity > 1) items[idx].quantity -= 1;
      else items.splice(idx, 1);
    } else {
      items.push({ id: p.id, name: p.name, price: p.price, quantity: 1 });
      this.toast?.success?.('Đã thêm vào yêu cầu báo giá');
    }
    this.selectedItems.set(items);
  }

  openQuoteModal(): void {
    if (!this.selectedItems().length) {
      this.toast?.error?.('Vui lòng chọn ít nhất 1 sản phẩm.');
      return;
    }
    this.quoteModalOpen.set(true);
  }

  closeQuoteModal(): void {
    this.quoteModalOpen.set(false);
  }

  readonly quoteTotal = computed(() =>
    this.selectedItems().reduce((s, it) => s + it.price * it.quantity, 0)
  );

  updateField<K extends keyof QuoteForm>(k: K, value: string): void {
    this.quoteForm.update((f) => ({ ...f, [k]: value }));
  }

  submitQuote(): void {
    const f = this.quoteForm();
    if (!f.name || !f.phone) {
      this.toast?.error?.('Vui lòng nhập họ tên và số điện thoại.');
      return;
    }

    this.submitting.set(true);
    const payload = {
      name: f.name,
      phone: f.phone,
      email: f.email,
      company: f.company || '',
      occasion: 'doanh-nghiep',
      items: this.selectedItems().map((it) => ({
        productId: it.id,
        name: it.name,
        quantity: it.quantity,
        price: it.price,
      })),
      totalEstimate: this.quoteTotal(),
      message: f.message || '',
    };

    this.http.post('/api/quotation-requests', payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toast?.success?.('Đã gửi yêu cầu báo giá. Chúng tôi sẽ liên hệ sớm nhất.');
        this.selectedItems.set([]);
        this.quoteForm.set({ name: '', phone: '', email: '', company: '', message: '' });
        this.closeQuoteModal();
      },
      error: () => {
        this.submitting.set(false);
        this.toast?.error?.('Gửi yêu cầu không thành công. Vui lòng thử lại.');
      },
    });
  }
}
