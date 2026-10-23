import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './pages/home-component/home-component';
import { PageComponent } from './pages/page-component/page-component';
import { ProductsComponent } from './pages/products-component/products-component';
import { ProductDetailComponent } from './pages/product-detail/product-detail';
import { GiftPageComponent } from './pages/gift-page/gift-page';
import { DangnhapComponent } from './pages/dangnhap/dangnhap';
import { Lienhe } from './pages/lienhe/lienhe';
import { VungmienComponent } from './pages/vung-mien/vung-mien';
import { GiohangComponent } from './pages/giohang/giohang';

const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'san-pham',
    component: ProductsComponent,
    data: { title: 'Sản phẩm | Mộc Mạc' }
  },
  {
    path: 'san-pham/:slug',
    component: ProductDetailComponent,
    data: { title: 'Chi tiết sản phẩm | Mộc Mạc' }
  },
  {
    path: 'qua-tang',
    component: GiftPageComponent,
    data: { title: 'Quà tặng | Mộc Mạc' }
  },
  {
    path: 'dang-nhap',
    component: DangnhapComponent,
    data: { title: 'Đăng nhập | Mộc Mạc' }
  },
  { path: 'vung-mien', component: VungmienComponent, data: { title: 'Vùng miền & Làng nghề | Mộc Mạc' } },
  { path: 'lang-nghe', redirectTo: 'vung-mien' },
  { path: 'lien-he', component:Lienhe, data: { title: 'Liên hệ' } },
  { path: 'gioi-thieu', component: PageComponent, data: { title: 'Giới thiệu' } },
  { path: 'qua-tang-theo-nhu-cau', component: PageComponent, data: { title: 'Quà tặng theo nhu cầu' } },
  { path: 'qua-tang-doanh-nghiep', component: PageComponent, data: { title: 'Quà tặng doanh nghiệp' } },
  { path: 'thong-bao', component: PageComponent, data: { title: 'Thông báo' } },
  { path: 'ho-tro', component: PageComponent, data: { title: 'Hỗ trợ' } },
  { path: 'dang-ky', component: DangnhapComponent, data: { title: 'Đăng ký' } },
  { path: 'gio-hang', component: GiohangComponent, data: { title: 'Giỏ hàng | Mộc Mạc' } },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }