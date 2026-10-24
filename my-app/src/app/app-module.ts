import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';

// Layout components
import { HeaderComponent } from './layout/header-component/header-component';
import { FooterComponent } from './layout/footer-component/footer-component';

// Pages
import { HomeComponent } from './pages/home-component/home-component';
import { PageComponent } from './pages/page-component/page-component';
import { GiftPageComponent } from './pages/gift-page/gift-page';
import { ProductsComponent } from './pages/products-component/products-component';
import { ProductDetailComponent } from './pages/product-detail/product-detail';
import { DangnhapComponent } from './pages/dangnhap/dangnhap';
import { GiohangComponent } from './pages/giohang/giohang';
import { ThongbaoComponent } from './pages/thong-bao/thong-bao';
import { RouterModule } from '@angular/router';
import { Lienhe } from './pages/lienhe/lienhe';
import { VungmienComponent } from './pages/vung-mien/vung-mien';

// Admin
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
import { PaginationComponent } from './admin/pagination';
import { ToastComponent } from './admin/toast';
import { NotificationPopupComponent } from './pages/notification-popup/notification-popup';
import { ChatPopupComponent } from './chat-popup/chat-popup';

@NgModule({
  declarations: [
    App,
    HeaderComponent,
    FooterComponent,
    HomeComponent,
    PageComponent,
    GiftPageComponent,
    ProductsComponent,
    ProductDetailComponent,
    VungmienComponent,
    DangnhapComponent,
    Lienhe,
    AdminLayoutComponent,
    AdminDashboardComponent,
    AdminOrdersComponent,
    AdminProductsComponent,
    AdminRegionsComponent,
    AdminCouponsComponent,
    AdminUsersComponent,
    AdminContactsComponent,
     AdminNotificationsComponent,
      AdminReviewsComponent,
     AdminAuditComponent,
     PaginationComponent,
      ToastComponent,
       NotificationPopupComponent,
       ChatPopupComponent,
    ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    RouterModule, // Bắt buộc phải có để chạy <router-outlet> và routerLink

    GiohangComponent,
    ThongbaoComponent,
  ],
  providers: [provideHttpClient(withInterceptors([authInterceptor]))],
  bootstrap: [App],
})
export class AppModule {}
