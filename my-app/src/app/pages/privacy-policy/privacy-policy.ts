import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Section { heading?: string; body?: string; }
interface ContentDoc { title?: string; sections?: Section[]; updatedAt?: string; }

const FALLBACK: Section[] = [
  { heading: '1. Giới thiệu', body: 'Mộc Mạc cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của bạn khi truy cập mocmac.vn hoặc sử dụng dịch vụ của chúng tôi. Chính sách này giải thích cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ thông tin.' },
  { heading: '2. Thông tin thu thập', body: 'Thông tin bạn cung cấp: họ tên, số điện thoại, email, địa chỉ giao hàng khi đặt hàng hoặc đăng ký tài khoản.\nThông tin giao dịch: lịch sử đơn hàng, phương thức thanh toán (không lưu số thẻ đầy đủ).\nThông tin kỹ thuật: địa chỉ IP, loại trình duyệt, cookie và dữ liệu tương tác để cải thiện trải nghiệm.' },
  { heading: '3. Mục đích sử dụng', body: 'Xử lý và giao đơn hàng, hỗ trợ sau bán hàng.\nGửi thông báo đơn hàng, khuyến mãi (nếu bạn đồng ý).\nCải thiện chất lượng dịch vụ và trải nghiệm người dùng.\nTuân thủ yêu cầu pháp luật khi cần thiết.' },
  { heading: '4. Chia sẻ thông tin', body: 'Mộc Mạc không bán dữ liệu cá nhân. Chúng tôi chỉ chia sẻ thông tin cần thiết với:\nĐối tác vận chuyển để giao hàng.\nNhà cung cấp cổng thanh toán để xử lý giao dịch.\nCơ quan nhà nước khi có yêu cầu pháp lý hợp lệ.' },
  { heading: '5. Bảo mật dữ liệu', body: 'Chúng tôi áp dụng biện pháp kỹ thuật và tổ chức phù hợp (mã hóa kết nối, kiểm soát truy cập, sao lưu) để bảo vệ dữ liệu. Tuy nhiên, không phương thức truyền tải nào qua Internet an toàn tuyệt đối.' },
  { heading: '6. Quyền của bạn', body: 'Bạn có quyền truy cập, chỉnh sửa, xóa dữ liệu cá nhân hoặc rút lại sự đồng ý nhận tin quảng cáo bất kỳ lúc nào bằng cách liên hệ với chúng tôi.\nEmail: privacy@mocmac.vn · Điện thoại: 0901 234 567' },
  { heading: '7. Cập nhật chính sách', body: 'Chính sách này có thể được cập nhật. Ngày cập nhật mới nhất sẽ được hiển thị trên trang. Chúng tôi khuyến khích bạn xem lại định kỳ.' },
];

@Component({
  selector: 'app-privacy-policy',
  standalone: false,
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.css',
})
export class PrivacyPolicyComponent implements OnInit {
  private http = inject(HttpClient);
  readonly title = signal('Chính sách bảo vệ dữ liệu');
  readonly sections = signal<Section[]>(FALLBACK);
  readonly updatedAt = signal('');

  ngOnInit(): void {
    this.http.get<{ content: ContentDoc }>('/api/site-content/privacy').subscribe({
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
