import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VungmienComponent } from './vung-mien';

describe('VungmienComponent', () => {
  let component: VungmienComponent;
  let fixture: ComponentFixture<VungmienComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VungmienComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VungmienComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
