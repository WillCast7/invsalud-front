import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigParamsDialogComponent } from './config-params-dialog.component';

describe('ConfigParamsDialogComponent', () => {
  let component: ConfigParamsDialogComponent;
  let fixture: ComponentFixture<ConfigParamsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigParamsDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfigParamsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
