import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  standalone: false,
  styleUrl: './about.css',
  templateUrl: './about.html',
})
export class AboutComponent {
  missions = [
    {
      icon: 'fa-solid fa-seedling',
      title: 'Tôn vinh giá trị Việt',
      description:
        'Giới thiệu những sản phẩm mang đậm bản sắc vùng miền và giá trị văn hoá truyền thống.',
    },
    {
      icon: 'fa-solid fa-handshake-angle',
      title: 'Kết nối làng nghề',
      description:
        'Tạo cầu nối giữa người tiêu dùng với nghệ nhân, người sản xuất và các làng nghề địa phương.',
    },
    {
      icon: 'fa-solid fa-location-dot',
      title: 'Minh bạch nguồn gốc',
      description:
        'Giúp khách hàng hiểu rõ hơn về nơi sản xuất, nguồn gốc và hành trình của từng sản phẩm.',
    },
    {
      icon: 'fa-solid fa-sparkles',
      title: 'Lan tỏa bản sắc',
      description:
        'Đưa những sản phẩm truyền thống Việt Nam đến gần hơn với người tiêu dùng trong thời đại số.',
    },
  ];

  features = [
    {
      icon: 'fa-solid fa-map-location-dot',
      title: 'Khám phá theo vùng miền',
      description:
        'Tìm kiếm sản phẩm theo miền Bắc, Trung, Nam, tỉnh thành và câu chuyện bản địa trên khắp Việt Nam.',
      image:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSArfH4FeJkXOBn-o3uE14z2yUG2O_LxLbFNYcsIl3TgQ&s=10',
    },
    {
      icon: 'fa-solid fa-award',
      title: 'Heritage Score',
      description:
        'Hệ thống đánh giá mức độ gắn kết của sản phẩm với nguồn gốc, kỹ thuật truyền thống và giá trị văn hoá.',
      image:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRSjGKMoB-e1Zor1xNwLHutn8fQBfMIpc6IUrgoxNg8kg&s=10',
    },
    {
      icon: 'fa-solid fa-qrcode',
      title: 'QR truy xuất nguồn gốc',
      description:
        'Thông qua mã QR, khách hàng có thể khám phá thông tin về nguồn gốc, nơi sản xuất và hành trình tạo nên sản phẩm.',
      image:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAeGTusx3F7yxy5i5ehO5FNq2_DHJgsaasffoTo0o3RQ&s=10',
    },
    {
      icon: 'fa-solid fa-gift',
      title: 'Quà tặng mang bản sắc Việt',
      description:
        'Gợi ý những món quà phù hợp theo dịp, nhu cầu và vùng miền như Tết, cưới hỏi, tân gia hay quà tặng đối tác.',
      image:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyiOtT15mXI1pkr79tFjFkn65GkWmClxS0BgnxIhJY4A&s=10',
    },
  ];

  values = [
    {
      icon: 'fa-solid fa-circle-check',
      title: 'Chân thật',
      description:
        'Tôn trọng nguồn gốc, câu chuyện và giá trị thực của từng sản phẩm.',
    },
    {
      icon: 'fa-solid fa-compass',
      title: 'Bản sắc',
      description:
        'Ưu tiên những sản phẩm mang đặc trưng văn hoá và vùng miền Việt Nam.',
    },
    {
      icon: 'fa-solid fa-people-arrows',
      title: 'Kết nối',
      description:
        'Kết nối người tiêu dùng, người sản xuất, nghệ nhân và làng nghề.',
    },
    {
      icon: 'fa-solid fa-recycle',
      title: 'Bền vững',
      description:
        'Góp phần duy trì nghệ truyền thống và hỗ trợ phát triển kinh tế địa phương.',
    },
  ];

  journey = [
    {
      icon: 'fa-solid fa-mountain-sun',
      title: 'Vùng nguyên liệu',
      description:
        'Nguồn nguyên liệu đặc trưng được lựa chọn từ từng địa phương.',
    },
    {
      icon: 'fa-solid fa-hands',
      title: 'Người nghệ nhân',
      description:
        'Sản phẩm được tạo nên từ kinh nghiệm và kỹ thuật truyền thống.',
    },
    {
      icon: 'fa-solid fa-box-open',
      title: 'Hoàn thiện sản phẩm',
      description:
        'Sản phẩm được kiểm tra, hoàn thiện và chuẩn bị trước khi phân phối.',
    },
    {
      icon: 'fa-solid fa-house-chimney',
      title: 'Đến tay khách hàng',
      description:
        'Giá trị văn hoá được kết nối với người tiêu dùng thông qua Mộc Mạc.',
    },
  ];
}
