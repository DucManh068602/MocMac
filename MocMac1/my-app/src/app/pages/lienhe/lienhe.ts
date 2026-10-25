import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

type PopupType = 'success' | 'error';

interface PopupState {
  show: boolean;
  type: PopupType;
  message: string;
}

@Component({
  selector: 'app-lienhe',
  standalone: false,
  styleUrl: './lienhe.css',
  templateUrl: './lienhe.html',
})
export class Lienhe {

  contact = {
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: ''
  };

  submitted = false;
  isLoading = false;
  popup = signal<PopupState>({ show: false, type: 'success', message: '' });

  constructor(private http: HttpClient) {}

  sendContact(): void {
    this.isLoading = true;
    this.submitted = false;
    this.popup.set({ show: false, type: 'success', message: '' });

    console.log('Dữ liệu liên hệ:', this.contact);
    this.http
      .post('/api/contacts', this.contact, {
        observe: 'response'
      })
      .subscribe({

        next: (response) => {
          console.log('Status:', response.status);
          console.log('Phản hồi từ server:', response.body);

          if (response.status === 200 || response.status === 201) {
            this.popup.set({
              show: true,
              type: 'success',
              message: 'Gửi liên hệ thành công! Cảm ơn bạn đã liên hệ với Mộc Mạc. Chúng tôi sẽ phản hồi sớm nhất có thể.',
            });

            this.submitted = true;

            this.contact = {
              name: '',
              phone: '',
              email: '',
              subject: '',
              message: ''
            };
          }

          this.isLoading = false;
        },

        error: (error) => {
          console.error('Lỗi gửi liên hệ:', error);

          this.isLoading = false;

          this.popup.set({
            show: true,
            type: 'error',
            message:
              error.error?.message ||
              'Không thể gửi liên hệ. Vui lòng thử lại.',
          });
        },

      });
  }

  closePopup(): void {
    this.popup.set({ show: false, type: 'success', message: '' });
  }
}
