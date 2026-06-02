import { Component, Inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogClose } from '@angular/material/dialog';
import { ColumnTableInterface } from '../../../models/table/column-table-interface';
import { TableComponent } from "../../../shared/table/table.component";
import { PageableInitializer, PageableInterface } from '../../../models/table/pageable-interface';
import { PrescriptionInventoryTableInterface } from '../../../models/inventory/prescription-inventory-table';
import { MatButtonModule } from '@angular/material/button';
import { PageEvent } from '@angular/material/paginator';
import { RestApiService } from '../../../services/rest-api.service';
import { AlertService } from '../../../services/alerts.service';

@Component({
  selector: 'app-report-dialog',
  imports: [TableComponent, MatDialogActions, MatButtonModule, MatDialogContent, MatDialogClose],
  templateUrl: './report-dialog.component.html',
  styleUrl: './report-dialog.component.css',
})
export class ReportDialogComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { data: any },
    private readonly restService: RestApiService,
    private readonly alertService: AlertService
  ) {
    console.log(data);
    this.getData();
  }
  title = signal('Reporte de inventario');
  dataValue: PageableInterface<PrescriptionInventoryTableInterface> = PageableInitializer;

  inventoryColumns: ColumnTableInterface[] = [
    { key: 'id', label: 'ID', isSortable: true },
    { key: 'product', label: 'Producto', isSortable: true },
    { key: 'batch', label: 'Lote', isSortable: true },
    { key: 'purchasePrice', label: 'P. Compra', isSortable: true },
    { key: 'salePrice', label: 'P. Venta', isSortable: true },
    { key: 'totalUnits', label: 'Unid. Totales', isSortable: true },
    { key: 'availableUnits', label: 'Unid. Disp.', isSortable: true },
    { key: 'expirationDate', label: 'Fecha Venc.', isSortable: true, pipe: 'date' },
    { key: 'isActive', label: 'Estado', isSortable: false, pipe: 'status' }
  ];

  onPrintReport() { }

  getData(page: number = 0, size: number = 10) {
    this.dataValue = PageableInitializer;
    const rawFilters = this.data?.data || {};
    const filters: any = {
      page: page,
      size: size
    };

    if (rawFilters.type) filters.type = rawFilters.type;
    if (rawFilters.category) filters.category = rawFilters.category;
    if (rawFilters.startDate) filters.startDate = this.formatDate(rawFilters.startDate);
    if (rawFilters.endDate) filters.endDate = this.formatDate(rawFilters.endDate);
    if (rawFilters.documentNumber) filters.documentNumber = rawFilters.documentNumber;

    if (rawFilters.product) {
      filters.product = typeof rawFilters.product === 'object' ? rawFilters.product.name : rawFilters.product;
    }
    if (rawFilters.batch) {
      filters.batch = typeof rawFilters.batch === 'object' ? rawFilters.batch.code : rawFilters.batch;
    }

    this.restService.getRequest('/reportes', filters).subscribe({
      next: (res) => {
        if (res && res.pageable) {
          this.dataValue = res.pageable;
        }
      },
      error: (error) => {
        this.alertService.infoMixin.fire({
          icon: 'error',
          title: error.error?.message || 'Error al cargar reporte',
        });
      }
    });
  }

  onPageChange(event: PageEvent) {
    this.getData(event.pageIndex, event.pageSize);
  }

  formatDate(date: any): string {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return '';
    }
  }
}
