import { Component, inject, signal, computed, effect } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface VillageStory {
  _id?: string;
  title: string;
  village?: string;
  province?: string;
  craft?: string;
  excerpt?: string;
  content?: string;
  imageUrl?: string;
  status?: string;
}

interface VillageItem {
  slug: string;
  name: string;
  villageName: string; // short name for DB matching
  location: string;
  craft: string;
  image: string;
  description: string;
  products: string;
}

@Component({
  selector: 'app-craft-village',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './craft-village.html',
  styleUrl: './craft-village.css'
})
export class CraftVillageComponent {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  readonly villages = signal<VillageItem[]>([
    {
      slug: 'bat-trang',
      name: 'Làng gốm Bát Tràng',
      villageName: 'Bát Tràng',
      location: 'Gia Lâm, Hà Nội',
      craft: 'Gốm truyền thống',
      image: 'https://media.vneconomy.vn/images/upload/2022/11/23/lang-nghe-2.jpg',
      description: 'Bát Tràng nổi tiếng với nghề gốm lâu đời, nơi đất, men và lửa kết hợp cùng kinh nghiệm của người thợ để tạo nên những sản phẩm mang dấu ấn Việt.',
      products: 'Bình gốm, chén, đĩa, đồ trang trí'
    },
    {
      slug: 'van-phuc',
      name: 'Làng lụa Vạn Phúc',
      villageName: 'Vạn Phúc',
      location: 'Hà Đông, Hà Nội',
      craft: 'Dệt lụa',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQGUtZ_5xlnvTei8kNP8A6dQ71akaSKwSKe3F_9aWc3GLIo1nEBihI9QktE&s=10',
      description: 'Vạn Phúc được biết đến với những tấm lụa mềm mại, hoa văn tinh tế và kỹ thuật dệt được gìn giữ qua nhiều thế hệ.',
      products: 'Lụa, khăn, áo, sản phẩm thời trang'
    },
    {
      slug: 'phu-vinh',
      name: 'Làng mây tre đan Phú Vinh',
      villageName: 'Phú Vinh',
      location: 'Chương Mỹ, Hà Nội',
      craft: 'Mây tre đan',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEtNAGEasiLqWfNJS58L7CVT4FK8jDsNtjPgsSPV-Pgg&s=10',
      description: 'Từ những nguyên liệu mộc mạc như tre và mây, người thợ Phú Vinh tạo nên những sản phẩm vừa hữu dụng vừa mang giá trị thẩm mỹ.',
      products: 'Giỏ, khay, hộp, đồ trang trí'
    },
    {
      slug: 'dong-ho',
      name: 'Làng tranh Đông Hồ',
      villageName: 'Đông Hồ',
      location: 'Thuận Thành, Bắc Ninh',
      craft: 'Tranh dân gian',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkUKOogc20W7raVY_eGwPvDpH3cokRAD1VNLXJ_M3D1w&s=10',
      description: 'Tranh Đông Hồ lưu giữ những hình ảnh gần gũi về đời sống, phong tục và ước vọng của người Việt qua kỹ thuật in khắc gỗ truyền thống.',
      products: 'Tranh dân gian, tranh trang trí, quà lưu niệm'
    }
  ]);

  readonly allArticles = signal<VillageStory[]>([]);
  readonly loading = signal(false);
  readonly activeSlug = signal<string | null>(null);
  readonly selectedArticle = signal<VillageStory | null>(null);

  readonly crafts = [
    { icon: 'fa-solid fa-mug-hot', title: 'Gốm', text: 'Sản phẩm được tạo nên từ đất, men và lửa qua nhiều công đoạn thủ công.' },
    { icon: 'fa-solid fa-shirt', title: 'Dệt', text: 'Khám phá lụa, thổ cẩm và những kỹ thuật dệt truyền thống đặc trưng.' },
    { icon: 'fa-solid fa-basket-shopping', title: 'Mây tre đan', text: 'Những sản phẩm từ tre, mây và vật liệu tự nhiên gắn với đời sống Việt.' },
    { icon: 'fa-solid fa-image', title: 'Tranh dân gian', text: 'Lưu giữ hình ảnh, phong tục và quan niệm dân gian qua nghệ thuật truyền thống.' },
    { icon: 'fa-solid fa-palette', title: 'Sơn mài', text: 'Kết hợp nhiều lớp vật liệu và kỹ thuật xử lý để tạo nên bề mặt đặc trưng.' },
    { icon: 'fa-solid fa-hammer', title: 'Điêu khắc', text: 'Tạo hình trên gỗ, đá và nhiều vật liệu qua kinh nghiệm của người thợ.' }
  ];

  readonly activeVillage = computed(() => {
    const s = this.activeSlug();
    if (!s) return null;
    return this.villages().find((v) => v.slug === s) || null;
  });

  readonly articles = computed(() => {
    const village = this.activeVillage();
    const all = this.allArticles();
    if (!village) return all;
    const name = village.villageName.toLowerCase();
    return all.filter((a) => String(a.village || '').toLowerCase().includes(name));
  });

  slugify(s: string): string {
    return String(s || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .toLowerCase()
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  constructor() {
    effect(() => {
      const slug = this.route.snapshot.paramMap.get('slug');
      this.activeSlug.set(slug || null);
      this.selectedArticle.set(null);
      this.loadArticles();
    });
  }

  loadArticles(): void {
    this.loading.set(true);
    const village = this.activeVillage();
    let url = '/api/village-stories?status=published';
    if (village) url += '&village=' + encodeURIComponent(village.villageName);
    this.http.get<{ stories: VillageStory[] }>(url).subscribe({
      next: (r) => {
        this.allArticles.set(Array.isArray(r?.stories) ? r.stories : []);
        this.loading.set(false);
      },
      error: () => {
        this.allArticles.set([]);
        this.loading.set(false);
      },
    });
  }

  selectVillage(slug: string): void {
    this.activeSlug.set(slug);
  }

  openArticle(article: VillageStory): void {
    this.selectedArticle.set(article);
  }

  closeArticle(): void {
    this.selectedArticle.set(null);
  }
}
