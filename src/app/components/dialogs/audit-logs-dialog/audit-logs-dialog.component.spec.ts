import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditLogsDialogComponent } from './audit-logs-dialog.component';

describe('AuditLogsDialogComponent', () => {
  let component: AuditLogsDialogComponent;
  let fixture: ComponentFixture<AuditLogsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditLogsDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuditLogsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
