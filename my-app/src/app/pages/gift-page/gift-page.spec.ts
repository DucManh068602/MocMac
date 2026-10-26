import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GiftPageComponent } from './gift-page';

describe('GiftPage', () => {
  let component: GiftPageComponent;
  let fixture: ComponentFixture<GiftPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GiftPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GiftPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
