import { Component, Inject } from '@angular/core';
import { CommonModule, DatePipe, JsonPipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { AuditLogInterface } from '../../../models/audit-log-interface';

@Component({
  selector: 'app-audit-logs-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTabsModule,
    MatChipsModule,
    DatePipe,
    JsonPipe
  ],
  templateUrl: './audit-logs-dialog.component.html',
  styleUrl: './audit-logs-dialog.component.css'
})
export class AuditLogsDialogComponent {
  auditLog: AuditLogInterface;

  constructor(
    private dialogRef: MatDialogRef<AuditLogsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { data: AuditLogInterface }
  ) {
    this.auditLog = data?.data || {
      id: 0,
      tableName: '',
      recordId: '',
      actionType: '',
      actionTimestamp: '',
      performedBy: '',
      oldValues: {},
      newValues: {}
    };
  }

  get keys(): string[] {
    const oldKeys = Object.keys(this.auditLog.oldValues || {});
    const newKeys = Object.keys(this.auditLog.newValues || {});
    return Array.from(new Set([...oldKeys, ...newKeys]));
  }

  getFormattedValue(val: any): string {
    if (val === null || val === undefined) return '---';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  }

  isFieldValueChanged(key: string): boolean {
    const oldVal = this.auditLog.oldValues ? this.auditLog.oldValues[key] : undefined;
    const newVal = this.auditLog.newValues ? this.auditLog.newValues[key] : undefined;
    return JSON.stringify(oldVal) !== JSON.stringify(newVal);
  }

  getActionBadgeClass(actionType: string): string {
    switch (actionType?.toUpperCase()) {
      case 'CREATE':
      case 'INSERT':
        return 'bg-success bg-opacity-10 text-success border border-success border-opacity-25';
      case 'UPDATE':
        return 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25';
      case 'DELETE':
        return 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25';
      default:
        return 'bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25';
    }
  }
}
