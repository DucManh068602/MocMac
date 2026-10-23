import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GiftPage } from './gift-page';

describe('GiftPage', () => {
  let component: GiftPage;
  let fixture: ComponentFixture<GiftPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GiftPage],
    }).compileComponents();

    fixture = TestBed.createComponent(GiftPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
