import { Component, inject } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { RestApiService } from '../../../services/rest-api.service';
import { AlertService } from '../../../services/alerts.service';
import { PageableInitializer, PageableInterface } from '../../../models/table/pageable-interface';
import { SizemodalInitializer } from '../../../models/modal/sizemodal-interface';
import { TableHeaderControlsComponent } from '../../../shared/table-header-controls-component/table-header-controls-component';
import { TableComponent } from '../../../shared/table/table.component';
import { ColumnTableInterface } from '../../../models/table/column-table-interface';
import { TableOption } from '../../../models/table/table-options-interface';
import { AuditLogInterface } from '../../../models/audit-log-interface';
import { AuditLogsDialogComponent } from '../../dialogs/audit-logs-dialog/audit-logs-dialog.component';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [
    MatDialogModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatPaginatorModule,
    MatCardModule,
    TableHeaderControlsComponent,
    TableComponent
  ],
  templateUrl: './audit-logs.component.html',
  styleUrl: './audit-logs.component.css'
})
export class AuditLogsComponent {
  readonly dialog = inject(MatDialog);
  dataValue: PageableInterface<AuditLogInterface> = PageableInitializer;
  searchValue = '';

  displayedColumns: ColumnTableInterface[] = [
    { key: 'id', label: 'ID', isSortable: true },
    { key: 'tableName', label: 'Tabla / Entidad', isSortable: true },
    { key: 'recordId', label: 'ID Registro', isSortable: true },
    { key: 'actionType', label: 'Acción', isSortable: true },
    { key: 'performedBy', label: 'Usuario', isSortable: true },
    { key: 'actionTimestamp', label: 'Fecha y Hora', isSortable: true, pipe: 'date', pipeArgs: 'dd/MM/yyyy HH:mm:ss' }
  ];

  buttonsList: TableOption[] = [];

  constructor(
    private readonly restService: RestApiService,
    private readonly alertService: AlertService
  ) {
    this.getData(
      this.dataValue.pageable.pageNumber,
      this.dataValue.pageable.pageSize,
      this.searchValue
    );
  }

  buttonAction(event: { type: string; row: any }) {
    if (event.type === 'search') {
      this.search(event.row);
    }
  }

  tableAction(event: { type: string; row: AuditLogInterface }) {
    if (event.type === 'view') {
      this.openModal(event.row);
    }
  }

  pageChange(event: PageEvent) {
    this.getData(event.pageIndex, event.pageSize, this.searchValue);
  }

  openModal(row: AuditLogInterface) {
    this.dialog.open(AuditLogsDialogComponent, {
      ...SizemodalInitializer,
      data: { data: row }
    });
  }

  getData(page: number, size: number, searchValue: string) {
    this.dataValue = PageableInitializer;
    this.restService
      .getRequest('/audit-logs', { page: page, size: size, searchValue: searchValue })
      .subscribe({
        next: (objData) => {
          if (objData && objData.pageable) {
            this.dataValue = objData.pageable;
          }
        },
        error: (error) => {
          this.alertService.infoMixin.fire({
            icon: 'error',
            title: error?.error?.message || 'Error al cargar los logs de auditoría'
          });
        }
      });
  }

  search(searchValue: string) {
    this.searchValue = searchValue;
    this.getData(0, 10, this.searchValue);
  }
}
