import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-support',
  standalone: false,
  templateUrl: './support.html',
  styleUrl: './support.css',
})
export class SupportComponent {
  contactForm = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  };

  submitted = false;
  isSubmitting = false;
  submitMessage = signal<string>('');
  activeFaq = signal<number | null>(null);

  faqs = [
    {
      question: 'Tôi muốn đổi trả hàng, quy trình thế nào?',
      answer: 'Bạn có thể đổi trả trong vòng 7 ngày kể từ ngày nhận hàng. Liên hệ bộ phận chăm sóc khách hàng với mã đơn hàng và hình ảnh sản phẩm để được hướng dẫn chi tiết.',
    },
    {
      question: 'Thời gian giao hàng là bao lâu?',
      answer: 'Chúng tôi hỗ trợ giao hàng toàn quốc trong vòng 3-7 ngày làm việc, tùy thuộc vào khu vực địa lý.',
    },
    {
      question: 'Tôi có thể thanh toán bằng phương thức nào?',
      answer: 'Chúng tôi hỗ trợ thanh toán khi nhận hàng (COD), chuyển khoển ngân hàng, và các ví điện tử như Momo, ZaloPay, VNPay.',
    },
    {
      question: 'Sản phẩm có được bảo hành không?',
      answer: 'Tất cả sản phẩm đều được bảo hành 30 ngày đầu tiên cho lỗi do nhà sản xuất. Bạn có thể liên hệ trực tiếp để được hỗ trợ.',
    },
  ];

  constructor(
    private http: HttpClient,
    private auth: AuthService,
  ) {}

  submitContact(): void {
    if (!this.contactForm.name || !this.contactForm.email || !this.contactForm.message) {
      this.submitMessage.set('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }

    this.isSubmitting = true;
    this.submitMessage.set('');

    this.http.post('/api/contacts', this.contactForm).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.submitted = true;
        this.submitMessage.set('Cảm ơn! Tin nhắn của bạn đã được gửi thành công.');
      },
      error: () => {
        this.isSubmitting = false;
        this.submitMessage.set('Có lỗi xảy ra, vui lòng thử lại sau.');
      },
    });
  }

  toggleFaq(index: number): void {
    this.activeFaq.set(this.activeFaq() === index ? null : index);
  }
}
