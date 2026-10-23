import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Lienhe } from './lienhe';

describe('Lienhe', () => {
  let component: Lienhe;
  let fixture: ComponentFixture<Lienhe>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Lienhe],
    }).compileComponents();

    fixture = TestBed.createComponent(Lienhe);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
