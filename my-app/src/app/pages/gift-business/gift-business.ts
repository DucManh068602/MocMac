import { Component, inject, signal } from '@angular/core';
import { ProductsService } from '../../products.service';

interface BusinessIdea {
  icon: string;
  title: string;
  desc: string;
}

@Component({
  selector: 'app-gift-business',
  standalone: false,
  templateUrl: './gift-business.html',
  styleUrl: './gift-business.css',
})
export class GiftBusinessComponent {
  private readonly productsService = inject(ProductsService);

  readonly businessIdeas = signal<BusinessIdea[]>([
    {
      icon: '🎁',
      title: 'Quà tặng doanh nghiệp',
      desc: 'Thiết kế bộ quà tặng độc đáo với logo doanh nghiệp, phù hợp cho khách hàng, đối tác và nhân viên.',
    },
    {
      icon: '🎨',
      title: 'Tùy biến theo thương hiệu',
      desc: 'Cá nhân hóa sản phẩm với màu sắc, họa tiết và thông điệp thương hiệu của doanh nghiệp bạn.',
    },
    {
      icon: '📦',
      title: 'Đóng gói chuyên nghiệp',
      desc: 'Giấy bìa, hộp quà và thẻ thiệp được thiết kế đẹp mắt, tôn vinh giá trị thương hiệu.',
    },
    {
      icon: '🚚',
      title: 'Giao hàng toàn quốc',
      desc: 'Hỗ trợ giao hàng nhanh tận nơi, kèm dịch vụ lắp ráp và lắp đặt nếu cần.',
    },
  ]);

  readonly allProducts = this.productsService.products;
}
