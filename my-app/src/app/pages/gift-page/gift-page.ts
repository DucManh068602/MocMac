import { Component, OnInit } from '@angular/core';

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
  heroData = {
    badge: 'Hơn 55 năm kiến tạo',
    title: 'GIẢI PHÁP QUÀ TẶNG ',
    subtitle: 'Mỗi set quà từ Mộc Mạc là sự kết tinh giữa tay nghề thủ công tinh xảo của nghệ nhân làng nghề và hơi thở bản địa nguyên bản. Không chỉ tôn vinh gu thẩm mỹ tinh tế cùng vị thế của người trao tặng, từng tặng phẩm mây tre mộc mạc còn là cầu nối gắn kết bền chặt, thay bạn gửi trao lời chúc an khang và sự trân quý dài lâu.',
    imageUrl: ''
  };

  occasions: OccasionTab[] = [
    { id: 'doi-tac', name: 'Quà đối tác' },
    { id: 'tet', name: 'Quà Tết' },
    { id: 'suc-khoe', name: 'Quà tặng sức khoẻ' },
    { id: 'luu-niem', name: 'Quà lưu niệm' },
    { id: 'tri-an', name: 'Quà tri ân' }
  ];
  selectedOccasion: string = 'doi-tac';

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
}