import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogClose, MatDialogTitle } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ColumnTableInterface } from '../../../models/table/column-table-interface';
import { TableComponent } from "../../../shared/table/table.component";
import { PageableInitializer, PageableInterface } from '../../../models/table/pageable-interface';
import { PrescriptionInventoryTableInterface } from '../../../models/inventory/prescription-inventory-table';
import { MatButtonModule } from '@angular/material/button';
import { PageEvent } from '@angular/material/paginator';
import { RestApiService } from '../../../services/rest-api.service';
import { AlertService } from '../../../services/alerts.service';

export interface AppliedFilter {
  label: string;
  value: string;
  icon: string;
}

@Component({
  selector: 'app-report-dialog',
  imports: [
    CommonModule,
    TableComponent,
    MatDialogActions,
    MatButtonModule,
    MatDialogContent,
    MatDialogClose,
    MatDialogTitle,
    MatIconModule
  ],
  templateUrl: './report-dialog.component.html',
  styleUrl: './report-dialog.component.css',
})
export class ReportDialogComponent {

  title = signal('Reporte de inventario');
  appliedFilters: AppliedFilter[] = [];
  dataValue: PageableInterface<PrescriptionInventoryTableInterface> = PageableInitializer;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { data: any },
    private readonly restService: RestApiService,
    private readonly alertService: AlertService
  ) {
    console.log(data);
    this.extractAppliedFilters();
    this.getData();
  }

  private extractAppliedFilters(): void {
    const rawFilters = this.data?.data || {};
    const filters: AppliedFilter[] = [];

    // Tipo de reporte
    if (rawFilters.type) {
      const typeLabels: Record<string, string> = {
        order: 'Cotización',
        purchasing: 'Ingresos',
        sold: 'Salidas',
        inventory: 'Inventario'
      };
      const labelValue = typeLabels[rawFilters.type] || rawFilters.type;
      filters.push({
        label: 'Tipo',
        value: labelValue,
        icon: 'analytics'
      });
      this.title.set(`Reporte de ${labelValue}`);
    }

    // Categoría
    if (rawFilters.category) {
      const categoryLabels: Record<string, string> = {
        special: 'Medicamentos',
        public: 'Salud pública',
        recipe: 'Recetarios'
      };
      filters.push({
        label: 'Categoría',
        value: categoryLabels[rawFilters.category] || rawFilters.category,
        icon: 'category'
      });
    }

    // Fechas
    const start = this.formatDate(rawFilters.startDate);
    const end = this.formatDate(rawFilters.endDate);
    if (start && end) {
      filters.push({
        label: 'Período',
        value: `${start} a ${end}`,
        icon: 'date_range'
      });
    } else if (start) {
      filters.push({
        label: 'Desde',
        value: start,
        icon: 'event'
      });
    } else if (end) {
      filters.push({
        label: 'Hasta',
        value: end,
        icon: 'event'
      });
    }

    // Tercero / Documento
    if (rawFilters.documentNumber) {
      filters.push({
        label: 'Tercero (Doc)',
        value: String(rawFilters.documentNumber),
        icon: 'badge'
      });
    }

    // Producto
    if (rawFilters.product) {
      const prodName = typeof rawFilters.product === 'object'
        ? (rawFilters.product.name || rawFilters.product.code)
        : rawFilters.product;
      if (prodName) {
        filters.push({
          label: 'Producto',
          value: prodName,
          icon: 'medication'
        });
      }
    }

    // Lote
    if (rawFilters.batch) {
      const batchCode = typeof rawFilters.batch === 'object'
        ? (rawFilters.batch.code || rawFilters.batch.details)
        : rawFilters.batch;
      if (batchCode) {
        filters.push({
          label: 'Lote',
          value: batchCode,
          icon: 'layers'
        });
      }
    }

    // Estado
    if (rawFilters.status) {
      const statusLabels: Record<string, string> = {
        vigente: 'Vigente',
        vencido: 'Vencido',
        retirado: 'Retirado'
      };
      filters.push({
        label: 'Estado',
        value: statusLabels[rawFilters.status] || rawFilters.status,
        icon: 'verified'
      });
    }

    // Unidades
    if (rawFilters.units && rawFilters.units !== 'all') {
      const unitLabels: Record<string, string> = {
        available: 'Con unid. disp.',
        unavailable: 'Sin unid. disp.',
        some_but_not_available: 'Con unid. no disp.'
      };
      filters.push({
        label: 'Unidades',
        value: unitLabels[rawFilters.units] || rawFilters.units,
        icon: 'inventory_2'
      });
    }

    this.appliedFilters = filters;
  }

  inventoryColumns: ColumnTableInterface[] = [
    { key: 'batch', label: 'LOTE', isSortable: true },
    { key: 'product', label: 'MEDICAMENTOS', isSortable: true },
    { key: 'presentation', label: 'PRESENTACION', isSortable: true },
    { key: 'pharmaceuticalForm', label: 'FORMA', isSortable: true },
    { key: 'totalUnits', label: 'UNIDADES FISICAS', isSortable: true },
    { key: 'availableUnits', label: 'UNIDADES DISPONIBLES', isSortable: true },
    { key: 'purchasePrice', label: 'PRECIO COMPRA', isSortable: true, pipe: 'currency' },
    { key: 'salePrice', label: 'PRECIO VENTA', isSortable: true, pipe: 'currency' },
    { key: 'expirationDate', label: 'FECHA DE VENCIMIENTO', isSortable: true, pipe: 'date' }
  ];

  soldColumns: ColumnTableInterface[] = [
    { key: 'code', label: 'ORDEN DE SALIDA', isSortable: true },
    { key: 'batch', label: 'LOTE', isSortable: true },
    { key: 'product', label: 'MEDICAMENTO', isSortable: true },
    { key: 'expirationDate', label: 'FECHA VENCIMIENTO', isSortable: true, pipe: 'date' },
    { key: 'totalUnits', label: 'CANTIDAD', isSortable: true },
    { key: 'client', label: 'CLIENTE', isSortable: true },
    { key: 'date', label: 'FECHA VENTA', isSortable: true, pipe: 'date' },
    { key: 'totalPrice', label: 'PRECIO', isSortable: true, pipe: 'currency' }
  ];

  orderColumns: ColumnTableInterface[] = [
    { key: 'code', label: 'COTIZACION', isSortable: true },
    { key: 'batch', label: 'LOTE', isSortable: true },
    { key: 'product', label: 'MEDICAMENTO', isSortable: true },
    { key: 'expirationDate', label: 'FECHA VENCIMIENTO', isSortable: true, pipe: 'date' },
    { key: 'totalUnits', label: 'CANTIDAD', isSortable: true },
    { key: 'client', label: 'CLIENTE', isSortable: true },
    { key: 'date', label: 'FECHA COTIZACION', isSortable: true, pipe: 'date' },
    { key: 'totalPrice', label: 'PRECIO', isSortable: true, pipe: 'currency' }
  ];

  purchasingColumns: ColumnTableInterface[] = [
    { key: 'code', label: 'ORDEN DE COMPRA', isSortable: true },
    { key: 'batch', label: 'LOTE', isSortable: true },
    { key: 'product', label: 'MEDICAMENTO', isSortable: true },
    { key: 'expirationDate', label: 'FECHA VENCIMIENTO', isSortable: true, pipe: 'date' },
    { key: 'totalUnits', label: 'CANTIDAD', isSortable: true },
    { key: 'client', label: 'PROVEEDOR', isSortable: true },
    { key: 'date', label: 'FECHA COMPRA', isSortable: true, pipe: 'date' },
    { key: 'purchasePrice', label: 'PRECIO COMPRA', isSortable: true, pipe: 'currency' },
    { key: 'salePrice', label: 'PRECIO VENTA', isSortable: true, pipe: 'currency' }
  ];

  get currentColumns(): ColumnTableInterface[] {
    const type = this.data?.data?.type;
    if (type === 'sold') {
      return this.soldColumns;
    }
    if (type === 'order') {
      return this.orderColumns;
    }
    if (type === 'purchasing') {
      return this.purchasingColumns;
    }
    return this.inventoryColumns;
  }

  onPrintReport() {
    const rawFilters = this.data?.data || {};
    const filters: any = {};

    if (rawFilters.type) filters.type = rawFilters.type;
    if (rawFilters.category) filters.category = rawFilters.category;
    if (rawFilters.startDate) filters.startDate = this.formatDate(rawFilters.startDate);
    if (rawFilters.endDate) filters.endDate = this.formatDate(rawFilters.endDate);
    if (rawFilters.documentNumber) filters.documentNumber = rawFilters.documentNumber;
    if (rawFilters.status) filters.status = rawFilters.status;
    if (rawFilters.units) filters.units = rawFilters.units;

    if (rawFilters.product) {
      filters.product = typeof rawFilters.product === 'object' ? rawFilters.product.name : rawFilters.product;
    }
    if (rawFilters.batch) {
      filters.batch = typeof rawFilters.batch === 'object' ? rawFilters.batch.code : rawFilters.batch;
    }

    this.restService.fileGetRequest("/report", filters).subscribe({
      next: (blob) => {
        const fileURL = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = fileURL;
        let filename = 'reporte_inventario.xlsx';
        if (filters.type === 'sold') {
          filename = 'reporte_salidas.xlsx';
        } else if (filters.type === 'order') {
          filename = 'reporte_cotizaciones.xlsx';
        } else if (filters.type === 'purchasing') {
          filename = 'reporte_ingresos.xlsx';
        } else if (filters.type) {
          filename = `reporte_${filters.type}.xlsx`;
        }
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(fileURL);
      },
      error: (error) => {
        this.alertService.infoMixin.fire({
          icon: 'error',
          title: error.error?.message || 'Error al descargar el reporte en Excel',
        });
      }
    });
  }

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
    if (rawFilters.status) filters.status = rawFilters.status;
    if (rawFilters.units) filters.units = rawFilters.units;

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
