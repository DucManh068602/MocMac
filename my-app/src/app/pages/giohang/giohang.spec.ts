import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { CartService } from '../../cart.service';
import { ProductItem, ProductsService } from '../../products.service';
import { GiohangComponent } from './giohang';

describe('GiohangComponent', () => {
  let component: GiohangComponent;
  let fixture: ComponentFixture<GiohangComponent>;
  const product: ProductItem = {
    id: 42,
    name: 'Trà làng nghề',
    cat: 'Đặc sản',
    type: 'Trà',
    region: 'Miền Bắc',
    province: 'Hà Giang',
    village: '',
    price: 100000,
    rate: 5,
    reviews: 10,
    ocop: 0,
    heritage: null,
    seasons: [],
    occasion: [],
    inStock: true,
    preorder: false,
    icon: '🍵',
    badges: [],
    images: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GiohangComponent],
      providers: [
        provideRouter([]),
        {
          provide: ProductsService,
          useValue: { products: signal([product]) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GiohangComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows cart items and updates the amount when quantities change', () => {
    const cart = TestBed.inject(CartService);
    cart.add(product.id, product.name);
    cart.add(product.id, product.name);

    expect(cart.notification()).toBe(`Đã thêm "${product.name}" vào giỏ hàng.`);
    expect(component.totalQuantity()).toBe(2);
    expect(component.subtotal()).toBe(200000);
    expect(component.total()).toBe(230000);

    component.decrease(product.id);
    expect(component.totalQuantity()).toBe(1);
    expect(component.total()).toBe(130000);
  });

  it('removes products from the cart', () => {
    const cart = TestBed.inject(CartService);
    cart.add(product.id, product.name);

    component.remove(product.id);

    expect(component.items()).toEqual([]);
    expect(component.isEmpty()).toBe(true);
  });
});
