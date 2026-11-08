import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Section { heading?: string; body?: string; }
interface ContentDoc { title?: string; sections?: Section[]; updatedAt?: string; }

const FALLBACK: Section[] = [
  { heading: '1. Giới thiệu', body: 'Chào mừng bạn đến với Mộc Mạc — nền tảng thương mại điện tử chuyên về sản phẩm thủ công, làng nghề và đặc sản Việt Nam. Việc truy cập và sử dụng trang web mocmac.vn có nghĩa là bạn đồng ý với các điều khoản dịch vụ sau đây.' },
  { heading: '2. Điều kiện sử dụng', body: 'Bạn phải từ 18 tuổi trở lên hoặc có sự đồng ý của người giám hộ để sử dụng dịch vụ. Bạn cam kết cung cấp thông tin chính xác, đầy đủ và cập nhật khi đăng ký tài khoản hoặc đặt hàng trên trang web.' },
  { heading: '3. Đơn hàng và thanh toán', body: 'Mọi đơn hàng đặt trên trang web là cam kết mua hàng. Giá sản phẩm được hiển thị bằng đồng Việt Nam (đ) và có thể thay đổi. Mộc Mạc hỗ trợ COD, VNPay, MoMo và chuyển khoản ngân hàng. Đơn hàng chỉ được xác nhận sau khi thanh toán thành công hoặc xác nhận COD.' },
  { heading: '4. Giao hàng và đổi trả', body: 'Mộc Mạc giao hàng toàn quốc qua đối tác vận chuyển. Thời gian giao hàng phụ thuộc địa chỉ và phương thức vận chuyển. Khách hàng có quyền đổi trả trong vòng 14 ngày nếu sản phẩm lỗi kỹ thuật hoặc không đúng mô tả, còn nguyên tem/đóng gói ban đầu.' },
  { heading: '5. Bản quyền và sở hữu trí tuệ', body: 'Toàn bộ nội dung trên trang web (văn bản, hình ảnh, logo, thiết kế) thuộc sở hữu của Mộc Mạc hoặc các đơn vị cấp phép. Không được sao chép, phân phối hoặc sử dụng cho mục đích thương mại khi chưa có sự cho phép bằng văn bản.' },
  { heading: '6. Giới hạn trách nhiệm', body: 'Mộc Mạc nỗ lực đảm bảo thông tin chính xác nhưng không chịu trách nhiệm với thiệt hại phát sinh từ việc sử dụng sai mục đích, gián đoạn dịch vụ ngoài tầm kiểm soát, hoặc hành vi của bên thứ ba.' },
  { heading: '7. Thay đổi điều khoản', body: 'Mộc Mạc có quyền cập nhật điều khoản dịch vụ bất kỳ lúc nào. Phiên bản mới có hiệu lực ngay khi được đăng tải. Việc tiếp tục sử dụng trang web đồng nghĩa với việc bạn chấp nhận điều khoản đã cập nhật.' },
  { heading: '8. Liên hệ', body: 'Email: support@mocmac.vn\nĐiện thoại: 0901 234 567\nĐịa chỉ: Mộc Mạc – Sản phẩm thủ công làng nghề Việt Nam' },
];

@Component({
  selector: 'app-terms-of-service',
  standalone: false,
  templateUrl: './terms-of-service.html',
  styleUrl: './terms-of-service.css',
})
export class TermsOfServiceComponent implements OnInit {
  private http = inject(HttpClient);
  readonly title = signal('Điều khoản dịch vụ');
  readonly sections = signal<Section[]>(FALLBACK);
  readonly updatedAt = signal('');

  ngOnInit(): void {
    this.http.get<{ content: ContentDoc }>('/api/site-content/terms').subscribe({
      next: (r) => {
        const c = r?.content;
        if (c?.title) this.title.set(c.title);
        this.sections.set(Array.isArray(c?.sections) && c!.sections.length ? c!.sections : FALLBACK);
        this.updatedAt.set(c?.updatedAt ? new Date(c.updatedAt).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' }));
      },
      error: () => {
        this.sections.set(FALLBACK);
        this.updatedAt.set(new Date().toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' }));
      },
    });
  }

  paragraphs(body?: string): string[] {
    return String(body || '').split(/\n+/).map((s) => s.trim()).filter(Boolean);
  }
}
