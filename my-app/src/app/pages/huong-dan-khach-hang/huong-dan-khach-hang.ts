import { Component, signal, computed } from '@angular/core';

interface GuideSection {
  id: string;
  label: string;
  title: string;
  steps: { title: string; content: string }[];
}

@Component({
  selector: 'app-huong-dan-khach-hang',
  standalone: false,
  styleUrl: './huong-dan-khach-hang.css',
  templateUrl: './huong-dan-khach-hang.html',
})
export class HuongDanKhachHangComponent {
  readonly openSection = signal<string | null>('tai-khoan');

  readonly sections: GuideSection[] = [
    {
      id: 'tai-khoan',
      label: 'Tài khoản',
      title: 'Đăng ký & kích hoạt tài khoản',
      steps: [
        {
          title: 'Bước 1: Đăng ký',
          content: 'Truy cập trang Đăng ký, nhập họ tên, email, số điện thoại và mật khẩu (tối thiểu 8 ký tự). Sau đó nhấn "Tạo tài khoản".',
        },
        {
          title: 'Bước 2: Kích hoạt qua email',
          content: 'Hệ thống gửi mã OTP đến email của bạn. Nhập mã OTP vào trang kích hoạt để xác thực. Tài khoản sẽ được kích hoạt và bạn có thể đăng nhập.',
        },
        {
          title: 'Bước 3: Đăng nhập',
          content: 'Sau khi kích hoạt, truy cập trang Đăng nhập bằng email và mật khẩu. Bạn sẽ được điều hướng đến trang chủ.',
        },
      ],
    },
    {
      id: 'quà-tang',
      label: 'Báo giá quà tặng',
      title: 'Tạo yêu cầu báo giá quà tặng',
      steps: [
        {
          title: 'Bước 1: Chọn sản phẩm',
          content: 'Vào trang Quà tặng, chọn các sản phẩm bạn quan tâm bằng cách tích vào ô chọn bên cạnh sản phẩm. Bạn có thể chọn nhiều sản phẩm cùng lúc.',
        },
        {
          title: 'Bước 2: Mở modal báo giá',
          content: 'Khi đã chọn ít nhất 1 sản phẩm, nhấn nút "Gửi yêu cầu báo giá" ở đáy trang. Modal yêu cầu báo giá sẽ hiện ra.',
        },
        {
          title: 'Bước 3: Điền thông tin',
          content: 'Nhập họ tên, số điện thoại, email, công ty (nếu có), địa chỉ giao hàng, dịp tặng và khung giờ liên hệ. Nhấn "Gửi yêu cầu báo giá".',
        },
        {
          title: 'Bước 4: Xem báo giá đã gửi',
          content: 'Sau khi gửi, yêu cầu báo giá được lưu trong tài khoản. Truy cập trang "Quà tặng đã mua" từ menu tài khoản để xem danh sách và trạng thái.',
        },
      ],
    },
    {
      id: 'đơn-hàng',
      label: 'Đơn hàng',
      title: 'Đặt hàng & theo dõi đơn hàng',
      steps: [
        {
          title: 'Bước 1: Thêm vào giỏ hàng',
          content: 'Chọn sản phẩm trên trang chi tiết hoặc trang sản phẩm, rồi nhấn "Thêm vào giỏ hàng".',
        },
        {
          title: 'Bước 2: Thanh toán',
          content: 'Vào trang Giỏ hàng, kiểm tra lại sản phẩm, áp dụng mã giảm giá nếu có, chọn phương thức thanh toán (COD hoặc chuyển khoản) và nhấn Thanh toán.',
        },
        {
          title: 'Bước 3: Theo dõi đơn hàng',
          content: 'Truy cập trang "Đơn hàng của tôi" từ menu tài khoản để xem danh sách đơn hàng và trạng thái hiện tại (đang xử lý, đã giao, đã nhận, đã hủy).',
        },
        {
          title: 'Bước 4: Tra cứu công khai',
          content: 'Nếu không đăng nhập, bạn có thể vào trang "Tra cứu đơn hàng" và nhập mã đơn hàng để xem trạng thái.',
        },
      ],
    },
    {
      id: 'hội-viên',
      label: 'Hội viên',
      title: 'Hạng hội viên & ưu đãi',
      steps: [
        {
          title: 'Hạng Đồng (mặc định)',
          content: 'Mọi khách hàng mới bắt đầu từ hạng Đồng. Có thể tích lũy chi tiêu và sử dụng mã giảm giá.',
        },
        {
          title: 'Hạng Bạc (tích lũy 2.000.000đ)',
          content: 'Giảm 5% tự động trên đơn hàng, miễn phí vận chuyển, ưu tiên nhận mã giảm giá và hỗ trợ báo giá.',
        },
        {
          title: 'Hạng Vàng (tích lũy 5.000.000đ)',
          content: 'Giảm 8% tự động, miễn phí vận chuyển, ưu tiên báo giá, mã giảm giá và hỗ trợ mua sỉ.',
        },
        {
          title: 'Hạng Kim Cương (tích lũy 15.000.000đ)',
          content: 'Giảm 12% tự động, miễn phí vận chuyển, hỗ trợ báo giá 1:1 ưu tiên cao nhất và các ưu đãi đặc biệt.',
        },
        {
          title: 'Cách tính chi tiêu',
          content: 'Chi tiêu tính từ đơn hàng đã thanh toán và báo giá quà tặng đã thanh toán (chấp nhận/hoàn tất). Đơn hàng bị hủy hoặc thanh toán thất bại không được tính.',
        },
      ],
    },
    {
      id: 'liên-hệ',
      label: 'Liên hệ',
      title: 'Hỗ trợ & liên hệ với Mộc Mạc',
      steps: [
        {
          title: 'Gửi yêu cầu hỗ trợ',
          content: 'Vào trang Liên hệ hoặc tab Hỗ trợ trong khung chat để nhắn trực tiếp với đội ngũ quản trị viên Mộc Mạc.',
        },
        {
          title: 'Tra cứu đơn hàng',
          content: 'Vào trang Tra cứu đơn hàng, nhập mã đơn hàng để kiểm tra trạng thái nếu bạn không muốn đăng nhập.',
        },
        {
          title: 'Thông báo',
          content: 'Sau khi đăng nhập, thông báo hệ thống, đơn hàng và khuyến mãi sẽ hiện ở trang "Thông báo". Bạn có thể đánh dấu đã đọc từng thông báo.',
        },
      ],
    },
  ];

  toggleSection(id: string): void {
    this.openSection.set(this.openSection() === id ? null : id);
  }

  isOpen(id: string): boolean {
    return this.openSection() === id;
  }
}
