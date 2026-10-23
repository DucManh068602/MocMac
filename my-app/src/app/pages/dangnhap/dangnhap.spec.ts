import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DangnhapComponent } from './dangnhap';
import { AppModule } from '../../app-module';

describe('DangnhapComponent', () => {
  let component: DangnhapComponent;
  let fixture: ComponentFixture<DangnhapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DangnhapComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
