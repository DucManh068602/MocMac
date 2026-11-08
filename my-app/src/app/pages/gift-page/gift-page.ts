import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../admin/toast.service';

export interface OccasionTab {
  id: string;
  name: string;
}

export interface CollectionItem {
  id: number;
  name: string;
  imageUrl: string;
  tag?: string;
}

export interface CategoryTab {
  id: string;
  name: string;
}

export interface SubCategoryItem {
  id: string;
  name: string;
  iconText: string;
}

export interface ProductItem {
  id: number;
  name: string;
  category: string;
  subCategory: string;
  imageUrl: string;
  rating: number;
  reviewsCount: number;
  origin: string;
  region: string;
  occasion?: string[];
  price: number;
  icon?: string;
}

@Component({
  selector: 'app-gift-page',
  standalone: false,
  templateUrl: './gift-page.html',
  styleUrls: ['./gift-page.css']
})
export class GiftPageComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  heroData = {
    badge: 'Hơn 55 năm kiến tạo',
    title: 'GIẢI PHÁP QUÀ TẶNG ',
    subtitle: 'Mỗi set quà từ Mộc Mạc là sự kết tinh giữa tay nghề thủ công tinh xảo của nghệ nhân làng nghề và hơi thở bản địa nguyên bản. Không chỉ tôn vinh gu thẩm mỹ tinh tế cùng vị thế của người trao tặng, từng tặng phẩm mây tre mộc mạc còn là cầu nối gắn kết bền chặt, thay bạn gửi trao lời chúc an khang và sự trân quý dài lâu.',
    imageUrl: ''
  };

  occasions: OccasionTab[] = [
    { id: 'all', name: 'Tất cả dịp' },
    { id: 'doi-tac', name: 'Quà đối tác' },
    { id: 'tet', name: 'Quà Tết' },
    { id: 'suc-khoe', name: 'Quà tặng sức khoẻ' },
    { id: 'luu-niem', name: 'Quà lưu niệm' },
    { id: 'tri-an', name: 'Quà tri ân' }
  ];
  selectedOccasion: string = 'all';

  readonly giftRegions: string[] = [
    'Miền Bắc', 'Miền Trung', 'Tây Nguyên', 'Miền Nam'
  ];
  selectedRegion: string = 'all';

  readonly recommendedProducts = computed(() =>
    this.products.filter((p) => {
      const matchRegion = this.selectedRegion === 'all' || p.region === this.selectedRegion;
      const matchOccasion = this.selectedOccasion === 'all' || !p.occasion?.length || (p.occasion || []).includes(this.selectedOccasion);
      return matchRegion && matchOccasion;
    })
  );

  setRegion(region: string): void { this.selectedRegion = region; }

  featuredCollections: CollectionItem[] = [
    { id: 1, name: 'BỘ TRÀ VĂN LANG', imageUrl: '', tag: 'Gốm Bát Tràng' },
    { id: 2, name: 'BỘ BÀN ĂN CHIM LẠC', imageUrl: '', tag: 'Chu Đậu Men Tro' },
    { id: 3, name: 'BÌNH HOA HỘI TỰU', imageUrl: '', tag: 'Mỹ Nghệ Sơn Mài' }
  ];

  categories: CategoryTab[] = [
    { id: 'bo-tra', name: 'Bộ trà' },
    { id: 'bo-ban-an', name: 'Bộ bàn ăn' },
    { id: 'trang-tri', name: 'Trang trí & Nghệ thuật' },
    { id: 'noi-su', name: 'Nồi sứ & Dưỡng sinh' }
  ];
  selectedCategory: string = 'bo-tra';

  subCategories: SubCategoryItem[] = [
    { id: 'jasmine', name: 'Jasmine', iconText: 'Icon' },
    { id: 'daisy', name: 'Daisy', iconText: 'Icon' },
    { id: 'camellia', name: 'Camellia', iconText: 'Icon' },
    { id: 'mau-don-ifp', name: 'Mẫu Đơn IFP', iconText: 'Icon' },
    { id: 'mau-don', name: 'Mẫu Đơn', iconText: 'Icon' },
    { id: 'anh-vu-ifp', name: 'Anh Vũ IFP', iconText: 'Icon' },
    { id: 'anna-ifp', name: 'Anna IFP', iconText: 'Icon' }
  ];
  selectedSubCategory: string = 'jasmine';

  // --- YÊU CẦU BÁO GIÁ ---
  readonly selectedItems = signal<{ productId: number; name: string; price: number; quantity: number }[]>([]);
  readonly showQuoteModal = signal(false);
  readonly quoteSending = signal(false);
  quoteForm: any = {
    name: '',
    phone: '',
    email: '',
    company: '',
    address: '',
    occasion: '',
    preferredSlot: '',
    message: '',
  };
  readonly quoteSlots = [
    '08:00 - 10:00',
    '10:00 - 12:00',
    '13:00 - 15:00',
    '15:00 - 17:00',
    '19:00 - 21:00',
  ];

  // --- TRẠNG THÁI VÀ ĐIỀU KIỆN BỘ LỌC ---
  isFilterOpen: boolean = false;
  filterRegion: string = 'all';
  filterPriceRange: string = 'all';
  searchKeyword: string = '';


  get availableRegions(): string[] {
    const list = this.products.map(p => p.region);
    return Array.from(new Set(list));
  }

  products: ProductItem[] = [
    {
      id: 1,
      name: 'Cà phê Buôn Ma Thuột rang mộc',
      category: 'bo-tra',
      subCategory: 'jasmine',
      imageUrl: '',
      rating: 5,
      reviewsCount: 30,
      origin: 'Đắk Lắk',
      region: 'Tây Nguyên',
      price: 126000,
      icon: '☕'
    },
    {
      id: 2,
      name: 'Cà phê chồn Đà Lạt',
      category: 'bo-tra',
      subCategory: 'jasmine',
      imageUrl: '',
      rating: 5,
      reviewsCount: 123,
      origin: 'Lâm Đồng',
      region: 'Tây Nguyên',
      price: 428000,
      icon: '☕'
    },
    {
      id: 3,
      name: 'Trà Thái Nguyên đặc sản',
      category: 'bo-tra',
      subCategory: 'jasmine',
      imageUrl: '',
      rating: 5,
      reviewsCount: 43,
      origin: 'Thái Nguyên',
      region: 'Miền Bắc',
      price: 150000,
      icon: '🍵'
    },
    {
      id: 4,
      name: 'Trà shan tuyết Hà Giang',
      category: 'bo-tra',
      subCategory: 'jasmine',
      imageUrl: '',
      rating: 5,
      reviewsCount: 68,
      origin: 'Hà Giang',
      region: 'Miền Bắc',
      price: 304000,
      icon: '🍵'
    },
    {
      id: 5,
      name: 'Trà sen Tây Hồ',
      category: 'bo-tra',
      subCategory: 'jasmine',
      imageUrl: '',
      rating: 5,
      reviewsCount: 42,
      origin: 'Hà Nội',
      region: 'Miền Bắc',
      price: 680000,
      icon: '🪷'
    },
    {
      id: 6,
      name: 'Túi mây tre đan Phú Vinh',
      category: 'bo-tra',
      subCategory: 'jasmine',
      imageUrl: '',
      rating: 5,
      reviewsCount: 28,
      origin: 'Hà Nội',
      region: 'Miền Bắc',
      price: 238000,
      icon: '🧺'
    },
    {
      id: 7,
      name: 'Rổ mây Bát Tràng',
      category: 'bo-tra',
      subCategory: 'jasmine',
      imageUrl: '',
      rating: 5,
      reviewsCount: 131,
      origin: 'Hà Nội',
      region: 'Miền Bắc',
      price: 950000,
      icon: '🧺'
    },
    {
      id: 8,
      name: 'Bộ ấm trà Bát Tràng hoa son',
      category: 'bo-tra',
      subCategory: 'jasmine',
      imageUrl: '',
      rating: 5,
      reviewsCount: 88,
      origin: 'Hà Nội',
      region: 'Miền Bắc',
      price: 724000,
      icon: '🫖'
    },
    {
      id: 9,
      name: 'Bộ tách trà Jasmine Chỉ Xanh Lá',
      category: 'bo-tra',
      subCategory: 'jasmine',
      imageUrl: '',
      rating: 5,
      reviewsCount: 52,
      origin: 'Bát Tràng',
      region: 'Hà Nội',
      price: 685000,
      icon: '🫖'
    },
    {
      id: 10,
      name: 'Bộ chén đĩa gốm mộc Chu Đậu',
      category: 'bo-tra',
      subCategory: 'jasmine',
      imageUrl: '',
      rating: 5,
      reviewsCount: 76,
      origin: 'Nam Sách',
      region: 'Hải Dương',
      price: 840000,
      icon: '🥣'
    },
    {
      id: 11,
      name: 'Hộp quà trà hoa cúc tiến vua',
      category: 'bo-tra',
      subCategory: 'jasmine',
      imageUrl: '',
      rating: 5,
      reviewsCount: 64,
      origin: 'Nghĩa Trai',
      region: 'Hưng Yên',
      price: 320000,
      icon: '🌼'
    },
    {
      id: 12,
      name: 'Bộ ấm chén men hoả biến cung đình',
      category: 'bo-tra',
      subCategory: 'jasmine',
      imageUrl: '',
      rating: 5,
      reviewsCount: 95,
      origin: 'Bát Tràng',
      region: 'Hà Nội',
      price: 1150000,
      icon: '🫖'
    }
  ];

  // --- CÂU CHUYỆN QUÀ TẶNG + LÀNG NGHỀ ---
  readonly craftStories = [
    {
      village: 'Gốm Bát Tràng · Hà Nội',
      title: 'Men lửa giữ hồn đất',
      description: 'Từ bàn xoay của nghệ nhân đến lò nung rực lửa, mỗi bộ ấm chén mang sắc men và câu chuyện của làng gốm trăm năm — món quà gửi lời chúc sum vầy.',
      imageUrl: '/data/images/ấm bát tràg.jpg',
    },
    {
      village: 'Mây tre Phú Vinh · Hà Nội',
      title: 'Đôi tay đan kết tinh tế',
      description: 'Sợi mây, nan tre được chọn kỹ và đan thủ công thành giỏ quà mộc mạc, bền đẹp — đại diện cho sự chăm chút và gắn bó bền lâu khi trao tặng.',
      imageUrl: '/data/images/túi mây tre.jpg',
    },
    {
      village: 'Trà Shan Tuyết · Hà Giang',
      title: 'Hương núi trong ấm trà',
      description: 'Búp trà cổ thụ hái giữa mây ngàn cao nguyên, mang vị chát dịu và hậu ngọt sâu — thức quà biếu trang trọng, chứa đựng phong vị đất trời.',
      imageUrl: '/data/images/trà san tuyết.webp',
    },
  ];
  readonly craftStoryIndex = signal(0);
  readonly activeCraftStory = computed(() => this.craftStories[this.craftStoryIndex()] ?? this.craftStories[0]);

  nextCraftStory(): void {
    this.craftStoryIndex.update((i) => (i + 1) % this.craftStories.length);
  }

  prevCraftStory(): void {
    this.craftStoryIndex.update((i) => (i - 1 + this.craftStories.length) % this.craftStories.length);
  }

  projectStory = {
    partner: 'GỬI GẮM TẤM LÒNG QUA TỪNG MÓN QUÀ TRUYỀN THỐNG',
    title: ' KHI MÓN QUÀ MỘC MẠC CHỞ NẶNG NÉT ĐẸP QUÊ HƯƠNG',
    description: 'Mỗi món quà tại Mộc Mạc không chỉ đơn thuần là một tặng phẩm trao tay, mà là sự chắt chiu tinh hoa thổ nhưỡng và tay nghề tài hoa của những nghệ nhân khắp mọi miền đất nước. Từ nét mộc mạc của mây tre đan lát, vẻ đẹp tao nhã của gốm men cổ truyền cho đến hương vị đượm đà của những thức trà cổ thụ hay hạt cà phê đất đỏ cao nguyên, tất cả đều chứa đựng nhịp thở của thời gian và tình yêu thuần khiết dành cho sản vật Việt Nam. Đó là nơi giá trị văn hóa bản địa được gìn giữ vẹn nguyên, đậm đà mà lắng đọng, vượt lên trên những quy chuẩn công nghiệp vô hồn.   Dù là bộ ấm chén gốm mộc nung lửa thủ công, gói trà sen Tây Hồ ướp hương sương sớm, hay chiếc giỏ mây tre nâng niu đặc sản quê hương, mỗi sự kết hợp đều chở che lời chúc bình an và lòng trân quý chân thành nhất. Trao đi một thức quà từ Mộc Mạc chính là gửi gắm một phong vị an yên trọn vẹn, để người nhận cảm nhận được hơi ấm quê nhà, phong vị đất trời và sự gắn kết bền chặt qua từng tinh túy truyền thống trao tay.  ',
    imageUrl: ''
  };

  ngOnInit(): void {}

  // Bật / tắt khung bộ lọc
  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  // Đặt lại các giá trị lọc về mặc định
  resetFilter(): void {
    this.filterRegion = 'all';
    this.filterPriceRange = 'all';
    this.searchKeyword = '';
  }

  // Danh sách sản phẩm sau khi đã lọc theo điều kiện
  get filteredProducts(): ProductItem[] {
    return this.products.filter(item => {
      // 1. Lọc theo vùng miền
      const matchRegion = this.filterRegion === 'all' || item.region === this.filterRegion;

      // 2. Lọc theo khoảng giá
      let matchPrice = true;
      if (this.filterPriceRange === 'under-300k') {
        matchPrice = item.price < 300000;
      } else if (this.filterPriceRange === '300k-700k') {
        matchPrice = item.price >= 300000 && item.price <= 700000;
      } else if (this.filterPriceRange === '500k-1m') {
        matchPrice = item.price >= 500000 && item.price <= 1000000;
      } else if (this.filterPriceRange === 'above-1m') {
        matchPrice = item.price > 1000000;
      } else if (this.filterPriceRange === 'above-700k') {
        matchPrice = item.price > 700000;
      }

      // 3. Lọc theo từ khoá tìm kiếm
      const matchSearch = !this.searchKeyword.trim() || 
        item.name.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
        item.origin.toLowerCase().includes(this.searchKeyword.toLowerCase());

      return matchRegion && matchPrice && matchSearch;
    });
  }

  setOccasion(id: string): void {
    this.selectedOccasion = id;
  }

  setCategory(id: string): void {
    this.selectedCategory = id;
  }

  setSubCategory(id: string): void {
    this.selectedSubCategory = id;
  }

  formatPrice(price: number): string {
    return price.toLocaleString('vi-VN') + 'đ';
  }

  readonly quoteTotal = computed(() =>
    this.selectedItems().reduce((s, it) => s + it.price * it.quantity, 0),
  );

  inQuote(p: ProductItem): boolean {
    return this.selectedItems().some((it) => it.productId === p.id);
  }

  toggleQuote(p: ProductItem): void {
    const items = [...this.selectedItems()];
    const idx = items.findIndex((it) => it.productId === p.id);
    const before = items.length;
    if (idx >= 0) {
      if (items[idx].quantity > 1) {
        items[idx].quantity -= 1;
      } else {
        items.splice(idx, 1);
      }
    } else {
      items.push({ productId: p.id, name: p.name, price: p.price, quantity: 1 });
      this.showQuoteModal.set(true);
    }
    this.selectedItems.set(items);
  }

  changeQty(it: { productId: number; name: string; price: number; quantity: number }, delta: number): void {
    const items = [...this.selectedItems()];
    const idx = items.findIndex((x) => x.productId === it.productId);
    if (idx >= 0) {
      items[idx].quantity = Math.max(1, items[idx].quantity + delta);
      if (items[idx].quantity < 1) items.splice(idx, 1);
    }
    this.selectedItems.set(items);
  }

  removeFromQuote(productId: number): void {
    this.selectedItems.set(this.selectedItems().filter((x) => x.productId !== productId));
  }

  openQuoteModal(): void {
    if (!this.selectedItems().length) {
      this.toast?.error?.('Vui lòng chọn ít nhất 1 sản phẩm.');
      return;
    }
    this.showQuoteModal.set(true);
  }

  closeQuoteModal(): void { this.showQuoteModal.set(false); }

  submitQuote(): void {
    const f = this.quoteForm;
    if (!f.name || !f.phone) {
      this.toast?.error?.('Vui lòng nhập họ tên và số điện thoại.');
      return;
    }
    if (!f.preferredSlot) {
      this.toast?.error?.('Vui lòng chọn khung giờ chúng tôi sẽ liên hệ.');
      return;
    }
    this.quoteSending.set(true);
    this.http
      .post<any>('/api/quotation-requests', {
        name: f.name,
        phone: f.phone,
        email: f.email || '',
        company: f.company || '',
        address: f.address || '',
        occasion: f.occasion || '',
        items: this.selectedItems().map((it) => ({
          productId: it.productId,
          name: it.name,
          quantity: it.quantity,
          price: it.price,
        })),
        totalEstimate: this.quoteTotal(),
        preferredSlot: f.preferredSlot,
        message: f.message || '',
      })
      .subscribe({
        next: () => {
          this.quoteSending.set(false);
          this.showQuoteModal.set(false);
          this.selectedItems.set([]);
          this.quoteForm = { name: '', phone: '', email: '', company: '', address: '', occasion: '', preferredSlot: '', message: '' };
          this.toast?.success?.('Đã gửi yêu cầu báo giá thành công. Chúng tôi sẽ liên hệ lại trong khung giờ bạn chọn.');
        },
        error: () => {
          this.quoteSending.set(false);
          this.toast?.error?.('Không thể gửi yêu cầu báo giá. Vui lòng thử lại.');
        },
      });
  }
}