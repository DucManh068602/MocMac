import { Component } from '@angular/core';

@Component({
  selector: 'app-support',
  standalone: false,
  styleUrl: './support.css',
  templateUrl: './support.html',
})
export class SupportComponent {
  openFaq: number | null = 0;

  faqs = [
    {
      question: 'Làm thế nào để đặt hàng trên Mộc Mạc?',
      answer:
        'Bạn có thể lựa chọn sản phẩm yêu thích, nhấn "Thêm vào giỏ hàng", kiểm tra lại thông tin sản phẩm trong giỏ và tiến hành thanh toán. Sau khi hoàn tất, đơn hàng sẽ được ghi nhận để xử lý.'
    },
    {
      question: 'Tôi có cần tài khoản để mua hàng không?',
      answer:
        'Khách hàng nên đăng ký tài khoản để thuận tiện trong việc quản lý đơn hàng, theo dõi quá trình giao hàng và lưu lại các sản phẩm yêu thích.'
    },
    {
      question: 'Tôi có thể thanh toán bằng những hình thức nào?',
      answer:
        'Mộc Mạc hỗ trợ thanh toán khi nhận hàng (COD) và các hình thức thanh toán trực tuyến được tích hợp trên hệ thống.'
    },
    {
      question: 'Làm thế nào để kiểm tra tình trạng đơn hàng?',
      answer:
        'Bạn có thể truy cập mục Theo dõi đơn hàng, nhập mã đơn hàng hoặc kiểm tra thông tin trong tài khoản để biết trạng thái hiện tại của đơn hàng.'
    },
    {
      question: 'Thời gian giao hàng mất bao lâu?',
      answer:
        'Thời gian giao hàng phụ thuộc vào địa chỉ nhận hàng, nơi xuất phát của sản phẩm và đơn vị vận chuyển. Một số sản phẩm đặc sản hoặc sản phẩm thủ công có thể cần thêm thời gian chuẩn bị trước khi giao.'
    },
    {
      question: 'Tôi có thể hủy đơn hàng không?',
      answer:
        'Bạn có thể yêu cầu hủy đơn khi đơn hàng chưa được bàn giao cho đơn vị vận chuyển. Khi đơn hàng đã được vận chuyển, việc hủy đơn có thể không còn khả dụng.'
    },
    {
      question: 'Tôi có thể đổi hoặc trả sản phẩm không?',
      answer:
        'Khách hàng có thể gửi yêu cầu đổi hoặc trả sản phẩm nếu sản phẩm bị lỗi, hư hỏng trong quá trình vận chuyển hoặc không đúng với đơn hàng đã đặt.'
    },
    {
      question: 'Heritage Score là gì?',
      answer:
        'Heritage Score là hệ thống giúp thể hiện mức độ gắn kết của sản phẩm với nguồn gốc địa phương, làng nghề, kỹ thuật truyền thống và giá trị văn hoá.'
    },
    {
      question: 'Làm sao để biết nguồn gốc của sản phẩm?',
      answer:
        'Đối với những sản phẩm có hỗ trợ truy xuất nguồn gốc, khách hàng có thể sử dụng mã QR trên trang thông tin sản phẩm để xem nơi sản xuất, vùng nguyên liệu và hành trình của sản phẩm.'
    },
    {
      question: 'Sản phẩm OCOP trên Mộc Mạc là gì?',
      answer:
        'Các sản phẩm có thông tin OCOP sẽ được hiển thị số sao OCOP tương ứng, giúp khách hàng dễ dàng nhận biết sản phẩm thuộc chương trình Mỗi xã một sản phẩm.'
    },
    {
      question: 'Làm thế nào để sử dụng voucher?',
      answer:
        'Tại bước thanh toán, khách hàng có thể nhập hoặc lựa chọn voucher phù hợp. Hệ thống sẽ kiểm tra điều kiện áp dụng và tự động tính lại tổng giá trị đơn hàng.'
    }
  ];

  toggleFaq(index: number): void {
    this.openFaq = this.openFaq === index ? null : index;
  }
}
