import { Component, computed, inject, signal } from '@angular/core';
import { ProductsService, ProductItem } from '../../products.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../admin/toast.service';

interface NeedCategory {
  id: string;
  name: string;
  icon: string;
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
  selector: 'app-gift-needs',
  standalone: false,
  templateUrl: './gift-needs.html',
  styleUrl: './gift-needs.css',
})
export class GiftNeedsComponent {
  private readonly productsService = inject(ProductsService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly allProducts = this.productsService.products;
  readonly selectedNeed = signal<string>('all');
  readonly selectedItems = signal<QuoteItem[]>([]);

  // Modal state
  readonly quoteModalOpen = signal(false);
  readonly quoteForm = signal<QuoteForm>({ name: '', phone: '', email: '', company: '', message: '' });
  readonly submitting = signal(false);

  readonly categories: NeedCategory[] = [
    { id: 'all', name: 'Tất cả', icon: 'fa-solid fa-gift' },
    { id: 'wedding', name: 'Quà cưới', icon: 'fa-solid fa-ring-diamond' },
    { id: 'tet', name: 'Quà Tết', icon: 'fa-solid fa-fireworks' },
    { id: 'business', name: 'Quà doanh nghiệp', icon: 'fa-solid fa-building' },
    { id: 'thanks', name: 'Quà tri ân', icon: 'fa-solid fa-hands' },
    { id: 'housewarming', name: 'Quà nhà mới', icon: 'fa-solid fa-house' },
  ];

  readonly tips = signal<{ icon: string; title: string; desc: string }[]>([
    {
      icon: 'fa-solid fa-lightbulb',
      title: 'Hiểu nhu cầu người nhận',
      desc: 'Lắng nghe sở thích, nghề nghiệp và phong cách sống để chọn được món quà ý nghĩa.',
    },
    {
      icon: 'fa-solid fa-palette',
      title: 'Chú trọng chất lượng',
      desc: 'Lựa chọn sản phẩm thủ công, độc đáo mang giá trị văn hoá Việt Nam.',
    },
    {
      icon: 'fa-solid fa-box',
      title: 'Đóng gói đẹp',
      desc: 'Bao bì tinh tế giúp món quà trở nên trọn vẹn và trang trọng hơn.',
    },
    {
      icon: 'fa-solid fa-truck',
      title: 'Giao hàng an toàn',
      desc: 'Chọn dịch vụ giao hàng uy tín, đảm bảo quà đến tay người nhận nguyên vẹn.',
    },
  ]);

  readonly filteredProducts = computed<ProductItem[]>(() => {
    const list = this.allProducts() ?? [];
    const need = this.selectedNeed();
    if (need === 'all') return list.slice(0, 20);

    const occasionMap: Record<string, string> = {
      wedding: 'Quà cưới',
      tet: 'Quà Tết',
      business: 'Quà tặng doanh nghiệp',
      thanks: 'Quà tặng',
      housewarming: 'Quà nhà mới',
    };

    const target = occasionMap[need];
    if (!target) return list.slice(0, 20);

    return list
      .filter((p) => {
        const occasions: string[] = p.occasion ?? [];
        return occasions.some((o: string) => o.includes(target) || target.includes(o));
      })
      .slice(0, 20);
  });

  setCategory(id: string): void { this.selectedNeed.set(id); }

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
      occasion: this.selectedNeed(),
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
