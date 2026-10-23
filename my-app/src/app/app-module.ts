import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';

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
import { RouterModule } from '@angular/router';
import { Lienhe } from './pages/lienhe/lienhe';
import { VungmienComponent } from './pages/vung-mien/vung-mien';

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
  ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    RouterModule, // Bắt buộc phải có để chạy <router-outlet> và routerLink

    GiohangComponent,
  ],
  providers: [provideHttpClient()],
  bootstrap: [App],
})
export class AppModule {}
