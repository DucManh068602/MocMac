import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-craft-village',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './craft-village.html',
  styleUrl: './craft-village.css'
})
export class CraftVillageComponent {
    villages = [
    {
      slug: 'bat-trang',
      name: 'Làng gốm Bát Tràng',
      location: 'Gia Lâm, Hà Nội',
      craft: 'Gốm truyền thống',
      image: 'https://media.vneconomy.vn/images/upload/2022/11/23/lang-nghe-2.jpg',
      description:
        'Bát Tràng nổi tiếng với nghề gốm lâu đời, nơi đất, men và lửa kết hợp cùng kinh nghiệm của người thợ để tạo nên những sản phẩm mang dấu ấn Việt.',
      products: 'Bình gốm, chén, đĩa, đồ trang trí'
    },
    {
      slug: 'van-phuc',
      name: 'Làng lụa Vạn Phúc',
      location: 'Hà Đông, Hà Nội',
      craft: 'Dệt lụa',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQGUtZ_5xlnvTei8kNP8A6dQ71akaSKwSKe3F_9aWc3GLIo1nEBihI9QktE&s=10',
      description:
        'Vạn Phúc được biết đến với những tấm lụa mềm mại, hoa văn tinh tế và kỹ thuật dệt được gìn giữ qua nhiều thế hệ.',
      products: 'Lụa, khăn, áo, sản phẩm thời trang'
    },
    {
      slug: 'phu-vinh',
      name: 'Làng mây tre đan Phú Vinh',
      location: 'Chương Mỹ, Hà Nội',
      craft: 'Mây tre đan',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEtNAGEasiLqWfNJS58L7CVT4FK8jDsNtjPgsSPV-Pgg&s=10',
      description:
        'Từ những nguyên liệu mộc mạc như tre và mây, người thợ Phú Vinh tạo nên những sản phẩm vừa hữu dụng vừa mang giá trị thẩm mỹ.',
      products: 'Giỏ, khay, hộp, đồ trang trí'
    },
    {
      slug: 'dong-ho',
      name: 'Làng tranh Đông Hồ',
      location: 'Thuận Thành, Bắc Ninh',
      craft: 'Tranh dân gian',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkUKOogc20W7raVY_eGwPvDpH3cokRAD1VNLXJ_M3D1w&s=10',
      description:
        'Tranh Đông Hồ lưu giữ những hình ảnh gần gũi về đời sống, phong tục và ước vọng của người Việt qua kỹ thuật in khắc gỗ truyền thống.',
      products: 'Tranh dân gian, tranh trang trí, quà lưu niệm'
    }
  ];

  articles = [
    {
      category: 'Câu chuyện làng nghề',
      title: 'Ngọn lửa trong những lò gốm Bát Tràng',
      text:
        'Một sản phẩm gốm không chỉ bắt đầu từ đất sét mà còn đi qua bàn tay người thợ, kinh nghiệm về men và nhiệt độ của lò nung.',
      slug: 'bat-trang'
    },
    {
      category: 'Con người & kỹ thuật',
      title: 'Từ sợi tơ đến tấm lụa Vạn Phúc',
      text:
        'Đằng sau một tấm lụa là nhiều công đoạn đòi hỏi sự chính xác, kiên nhẫn và kinh nghiệm được tích lũy qua nhiều thế hệ.',
      slug: 'van-phuc'
    },
    {
      category: 'Vật liệu bản địa',
      title: 'Khi tre mây trở thành sản phẩm thủ công',
      text:
        'Từ vật liệu tự nhiên đơn giản, người thợ Phú Vinh tạo nên những sản phẩm mang giá trị sử dụng và thẩm mỹ.',
      slug: 'phu-vinh'
    }
  ];

  crafts = [
    {
      icon: 'fa-solid fa-mug-hot',
      title: 'Gốm',
      text: 'Sản phẩm được tạo nên từ đất, men và lửa qua nhiều công đoạn thủ công.'
    },
    {
      icon: 'fa-solid fa-shirt',
      title: 'Dệt',
      text: 'Khám phá lụa, thổ cẩm và những kỹ thuật dệt truyền thống đặc trưng.'
    },
    {
      icon: 'fa-solid fa-basket-shopping',
      title: 'Mây tre đan',
      text: 'Những sản phẩm từ tre, mây và vật liệu tự nhiên gắn với đời sống Việt.'
    },
    {
      icon: 'fa-solid fa-image',
      title: 'Tranh dân gian',
      text: 'Lưu giữ hình ảnh, phong tục và quan niệm dân gian qua nghệ thuật truyền thống.'
    },
    {
      icon: 'fa-solid fa-palette',
      title: 'Sơn mài',
      text: 'Kết hợp nhiều lớp vật liệu và kỹ thuật xử lý để tạo nên bề mặt đặc trưng.'
    },
    {
      icon: 'fa-solid fa-hammer',
      title: 'Điêu khắc',
      text: 'Tạo hình trên gỗ, đá và nhiều vật liệu qua kinh nghiệm của người thợ.'
    }
  ];
}
