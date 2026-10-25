import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { ActivatedRoute, provideRouter, convertToParamMap } from '@angular/router';

import { ProductDetailComponent } from './product-detail';
import { ProductItem, ProductsService } from '../../products.service';
import { CartService } from '../../cart.service';
import { ReviewsService } from '../../reviews-service';

describe('ProductDetailComponent', () => {
  let component: ProductDetailComponent;
  let fixture: ComponentFixture<ProductDetailComponent>;

  const mockProduct: ProductItem = {
    id: 1,
    slug: 'test-product',
    name: 'Sản phẩm thử nghiệm',
    cat: 'Đặc sản',
    type: 'Gốm',
    region: 'Miền Bắc',
    province: 'Hà Nội',
    village: 'Bát Tràng',
    price: 100000,
    rate: 4.5,
    reviews: 10,
    ocop: 4,
    heritage: 'Vàng',
    seasons: [1, 2],
    occasion: [],
    inStock: true,
    preorder: false,
    icon: '🏺',
    badges: [],
    images: ['https://example.com/1.png'],
    description: 'Mô tả thử nghiệm',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProductDetailComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ slug: 'test-product' })),
          },
        },
        {
          provide: ProductsService,
          useValue: {
            products: signal<ProductItem[]>([mockProduct]),
            getProductBySlug: () => of(mockProduct),
          },
        },
        { provide: CartService, useValue: { notification: signal(''), add: () => {} } },
        {
          provide: ReviewsService,
          useValue: {
            getForProduct: () => of([]),
            createForProduct: () => of({} as never),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('fetches the product by slug from the backend', async () => {
    await fixture.whenStable();
    expect(component.product()).toEqual(mockProduct);
    expect(component.productLoading()).toBe(false);
  });
});
