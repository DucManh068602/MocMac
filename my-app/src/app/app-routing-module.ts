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
import { CraftVillageComponent } from './pages/craft-village/craft-village';
import { GiohangComponent } from './pages/giohang/giohang';
import { ThongbaoComponent } from './pages/thong-bao/thong-bao';
import { DonHangComponent } from './pages/don-hang/don-hang';
import { OrderTrackingComponent } from './pages/order-tracking/order-tracking';
import { AboutComponent } from './pages/about/about';
import { GiftBusinessComponent } from './pages/gift-business/gift-business';
import { GiftNeedsComponent } from './pages/gift-needs/gift-needs';
import { SupportComponent } from './pages/support/support';
import { AccountSettingsComponent } from './pages/account-settings/account-settings';
import { adminGuard } from './admin/auth.guard';
import { AdminLayoutComponent } from './admin/admin-layout';
import { AdminDashboardComponent } from './admin/dashboard';
import { AdminOrdersComponent } from './admin/orders';
import { AdminProductsComponent } from './admin/products';
import { AdminRegionsComponent } from './admin/regions';
import { AdminCouponsComponent } from './admin/coupons';
import { AdminUsersComponent } from './admin/users';
import { AdminContactsComponent } from './admin/contacts';
import { AdminNotificationsComponent } from './admin/notifications';
import { AdminReviewsComponent } from './admin/reviews';
import { AdminAuditComponent } from './admin/audit';
import { AdminRoleRequestsComponent } from './admin/admin-role-requests';
import { AdminRoutePermissionsComponent } from './admin/route-permissions';

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
  { path: 'lang-nghe', component: CraftVillageComponent, data: { title: 'Làng nghề | Mộc Mạc' } },
  { path: 'lang-nghe/:slug', component: CraftVillageComponent, data: { title: 'Làng nghề | Mộc Mạc' } },
  { path: 'lien-he', component: Lienhe, data: { title: 'Liên hệ' } },
  { path: 'gioi-thieu', component: AboutComponent, data: { title: 'Giới thiệu' } },
  { path: 'qua-tang-theo-nhu-cau', component: GiftNeedsComponent, data: { title: 'Quà tặng theo nhu cầu' } },
  { path: 'qua-tang-doanh-nghiep', component: GiftBusinessComponent, data: { title: 'Quà tặng doanh nghiệp' } },
  { path: 'thong-bao', component: ThongbaoComponent, data: { title: 'Thông báo' } },
  { path: 'don-hang', component: DonHangComponent, data: { title: 'Đơn hàng của tôi | Mộc Mạc' } },
  { path: 'don-hang/:id', component: DonHangComponent, data: { title: 'Chi tiết đơn hàng | Mộc Mạc' } },
  {
    path: 'tra-cuu-don-hang/:id',
    component: OrderTrackingComponent,
    data: { title: 'Tra cứu đơn hàng | Mộc Mạc' }
  },
  { path: 'ho-tro', component: SupportComponent, data: { title: 'Hỗ trợ' } },
  { path: 'tai-khoan', component: AccountSettingsComponent, data: { title: 'Cài đặt tài khoản' } },
  { path: 'dang-ky', component: DangnhapComponent, data: { title: 'Đăng ký' } },
  { path: 'gio-hang', component: GiohangComponent, data: { title: 'Giỏ hàng | Mộc Mạc' } },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'orders', component: AdminOrdersComponent },
      { path: 'products', component: AdminProductsComponent },
      { path: 'regions', component: AdminRegionsComponent },
      { path: 'coupons', component: AdminCouponsComponent },
       { path: 'users', component: AdminUsersComponent },
      { path: 'role-requests', component: AdminRoleRequestsComponent },
      { path: 'route-permissions', component: AdminRoutePermissionsComponent },
      { path: 'contacts', component: AdminContactsComponent },
      { path: 'notifications', component: AdminNotificationsComponent },
      { path: 'reviews', component: AdminReviewsComponent },
      { path: 'audit', component: AdminAuditComponent },
    ]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }