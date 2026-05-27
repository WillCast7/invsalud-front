import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillTemplatesComponent } from './bill-templates.component';

describe('BillTemplatesComponent', () => {
  let component: BillTemplatesComponent;
  let fixture: ComponentFixture<BillTemplatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillTemplatesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillTemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
