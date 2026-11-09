import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="not-found-page">
      <div class="not-found-content">
        <div class="not-found-icon">404</div>
        <h1>Trang không tồn tại</h1>
        <p>Trang bạn đang tìm kiếm không có sẵn hoặc đường dẫn đã thay đổi.</p>
        <div class="not-found-actions">
          <a routerLink="/" class="btn btn-primary">Về trang chủ</a>
          <a routerLink="/san-pham" class="btn btn-outline">Xem sản phẩm</a>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./not-found.component.css'],
})
export class NotFoundComponent {
  constructor(private router: Router) {}
}
