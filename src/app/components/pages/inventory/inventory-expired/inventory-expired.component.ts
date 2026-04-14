import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { RestApiService } from '../../../../services/rest-api.service';
import { AlertService } from '../../../../services/alerts.service';
import { PageableInitializer, PageableInterface } from '../../../../models/table/pageable-interface';
import { A11yModule } from "@angular/cdk/a11y";
import { MatCardModule } from '@angular/material/card';
import { TableHeaderControlsComponentComponent } from "../../../../shared/table-header-controls-component/table-header-controls-component.component";
import { TableComponent } from "../../../../shared/table/table.component";
import { ColumnTableInterface } from '../../../../models/table/column-table-interface';
import { TableOption } from '../../../../models/table/table-options-interface';
import { PrescriptionInventoryTableInterface } from '../../../../models/inventory/prescription-inventory-table';
import { InventoryDialogComponent } from '../../../dialogs/inventory/inventory/inventory-dialog.component';

@Component({
  selector: 'app-inventory-expired-page',
  imports: [
    MatDialogModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    MatAutocompleteModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatPaginatorModule,
    A11yModule,
    MatCardModule,
    TableHeaderControlsComponentComponent,
    TableComponent
  ],
  templateUrl: './inventory-expired.component.html',
  styleUrl: './inventory-expired.component.css'
})
export class InventoryExpiredComponent {
  readonly dialog = inject(MatDialog);
  pageEvent: PageEvent = new PageEvent;
  dataValue: PageableInterface<PrescriptionInventoryTableInterface> = PageableInitializer;
  searchValue = "";
  url = '/prescription-inventory/expired';

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

  tableOptions: TableOption[] = [
    { icon: 'visibility', label: 'Ver inventario', identifier: 'view', color: 'primary' },
    { icon: 'edit', label: 'Editar inventario', identifier: 'edit', color: 'primary' },
    { icon: 'autorenew', label: 'Cambiar estado', identifier: 'changeStatus', color: 'accent' }
  ];

  toggleList = signal<TableOption[]>([
    { icon: 'inventory', label: 'Control Especial', identifier: 'special', color: 'primary', title: 'Medicamentos de control especial y monopolio del estado' },
    { icon: 'inventory', label: 'Salud Publica', identifier: 'public', color: 'primary', title: 'Medicamentos de salud publica' }
  ]);

  buttonAction(event: { type: string, row: any }) {
    switch (event.type) {
      case 'createInventory':
        this.openModalInventory('create');
        break;
      case 'search':
        this.search(event.row);
        break;
    }
  }

  tableAction(event: { type: string, row: PrescriptionInventoryTableInterface }) {
    switch (event.type) {
      case 'edit':
        this.openModalInventory(event.type, event.row);
        break;
      case 'view':
        this.openModalInventory(event.type, event.row);
        break;
      case 'changeStatus':
        this.changeStatus(event.row);
        break;
    }
  }

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

  handlePageEvent(e: PageEvent): void {
    this.getData(
      e.pageIndex,
      e.pageSize,
      this.searchValue
    );
  }

  changeStatus(row: PrescriptionInventoryTableInterface) {
    this.alertService.modal.fire({
      icon: "warning",
      title: 'Cambiar el estado',
      text: "¿Seguro desea cambiar el estado del inventario?",
      showCancelButton: true,
      confirmButtonText: 'Si',
      confirmButtonColor: '#3d5a80',
      cancelButtonColor: '#ac0505',
      cancelButtonText: 'No'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.restService.putRequest(this.url + "/changestatus/" + row.id, String(row.isActive)).subscribe({
          next: () => {
            this.alertService.infoMixin.fire({
              icon: 'success',
              title: "Actualizado correctamente",
            });
            this.getData(
              this.dataValue.pageable.pageNumber,
              this.dataValue.pageable.pageSize,
              this.searchValue
            );
          },
          error: (error) => {
            this.alertService.infoMixin.fire({
              icon: 'error',
              title: error.error.message,
            });
          }
        });
      }
    });
  }

  openModalInventory(type: string, row: PrescriptionInventoryTableInterface | undefined = undefined) {
    const dialogRef: MatDialogRef<any> = this.dialog.open(InventoryDialogComponent,
      { data: { mode: type, data: row } });

    dialogRef.afterClosed().subscribe(() => {
      this.getData(
        this.dataValue.pageable.pageNumber,
        this.dataValue.pageable.pageSize,
        this.searchValue
      );
    });
  }

  getData(page: number, size: number, searchValue: string) {
    this.restService.getRequest(this.url, { page: page, size: size, searchValue: searchValue }).subscribe({
      next: (objData) => {
        this.dataValue = objData.pageable;
      },
      error: (error) => {
        this.alertService.infoMixin.fire({
          icon: 'error',
          title: error.error.message,
        });
      }
    });
  }

  search(searchValue: string) {
    this.searchValue = searchValue;
    this.getData(0, 10, this.searchValue);
  }
}
