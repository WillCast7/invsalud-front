import { Component, computed, inject, signal } from '@angular/core';
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
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { RestApiService } from '../../../../services/rest-api.service';
import { AlertService } from '../../../../services/alerts.service';
import { PageableInitializer, PageableInterface } from '../../../../models/table/pageable-interface';
import { A11yModule } from "@angular/cdk/a11y";
import { MatCardModule } from '@angular/material/card';
import { TableHeaderControlsComponentComponent } from "../../../../shared/table-header-controls-component/table-header-controls-component.component";
import { TableComponent } from "../../../../shared/table/table.component";
import { ColumnTableInterface } from '../../../../models/table/column-table-interface';
import { TableOption } from '../../../../models/table/table-options-interface';
import { ProductInterface } from '../../../../models/inventory/product-interface';
import { ProductDialogComponent } from '../../../dialogs/management/product-dialog/product-dialog.component';
import { BatchInterface } from '../../../../models/inventory/batch-interface';
import { BatchDialogComponent } from '../../../dialogs/management/batch-dialog/batch-dialog.component';
import { SizemodalInitializer } from '../../../../models/modal/sizemodal-interface';

@Component({
  selector: 'app-product',
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
    MatButtonToggleModule,
    MatDatepickerModule,
    A11yModule,
    MatCardModule,
    TableHeaderControlsComponentComponent,
    TableComponent
  ],

  templateUrl: './primary.component.html',
  styleUrl: './primary.component.css'
})
export class PrimaryComponent {
  readonly dialog = inject(MatDialog);
  pageEvent: PageEvent = new PageEvent;
  dataValue: PageableInterface<ProductInterface | BatchInterface> = PageableInitializer;
  searchValue = "";
  pageMode = signal<string>("medications");
  url = computed(() => {
    if (this.pageMode() === 'medications') {
      return '/products';
    }
    return '/batches';
  });
  redirectionButtonLabel = computed(() => {
    if (this.pageMode() === 'medications') {
      return 'Lotes';
    }
    return 'Medicamentos';
  });

  productColumns: ColumnTableInterface[] = [
    { key: 'id', label: 'id', isSortable: true },
    { key: 'code', label: 'Codigo', isSortable: true },
    { key: 'concentration', label: 'Concentracion', isSortable: true },
    { key: 'presentation', label: 'Presentacion', isSortable: true },
    { key: 'pharmaceuticalForm', label: 'F. farmaceutica', isSortable: true },
    { key: 'isActive', label: 'Estado', isSortable: false, pipe: 'status' }
  ];

  batchColumns: ColumnTableInterface[] = [
    { key: 'id', label: 'id', isSortable: true },
    { key: 'code', label: 'codigo', isSortable: true },
    { key: 'isActive', label: 'Estado', isSortable: false, pipe: 'status' }
  ];

  tableOptions: TableOption[] = [
    { icon: 'edit', label: 'Editar producto', identifier: 'edit', color: 'primary' },
    { icon: 'autorenew', label: 'Cambiar estado', identifier: 'changeStatus', color: 'accent' }
  ];

  buttonsList = computed<TableOption[]>(() => [
    this.pageMode() === 'medications' ? { icon: 'add', label: 'Crear Medicamento', identifier: 'createProduct', color: 'primary', title: 'Crear Medicamento' } :
      { icon: 'add', label: 'Crear Lote', identifier: 'createBatch', color: 'primary', title: 'Crear Lote' },
  ]);

  toggleList = computed<TableOption[]>(() => [
    { icon: 'inventory', label: 'Medicamentos', identifier: 'medications', color: 'primary' },
    { icon: 'inventory', label: 'Lotes', identifier: 'batches', color: 'primary' }
  ]);

  buttonAction(event: { type: string, row: any }) {
    switch (event.type) {
      case 'createProduct':
        this.openModalProduct("create");
        break;
      case 'createBatch':
        this.openModalBatch("create");
        break;
      case 'search':
        this.search(event.row);
        break;
      case 'medications':
        this.pageMode.set('medications');
        this.getData(0, 10, this.searchValue);
        break;
      case 'batches':
        this.pageMode.set('batches');
        this.getData(0, 10, this.searchValue);
        break;
    }
  }

  tableAction(event: { type: string, row: ProductInterface }) {
    switch (event.type) {
      case 'edit':
        if (this.pageMode() === 'medications') {
          this.openModalProduct(event.type, event.row);
        } else {
          this.openModalBatch(event.type);
        }
        break;
      case 'changeStatus':
        this.changeStatus(event.row);
        break;
      case 'view':
        if (this.pageMode() === 'medications') {
          this.openModalProduct(event.type, event.row);
        } else {
          this.openModalBatch(event.type);
        }
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

  changeStatus(row: ProductInterface | BatchInterface) {
    this.alertService.modal.fire({
      icon: "warning",
      title: 'Cambiar el estado',
      text: "Seguro desea cambiar el estado del producto?",
      showCancelButton: true,
      confirmButtonText: 'Si',
      confirmButtonColor: '#3d5a80',
      cancelButtonColor: '#ac0505',
      cancelButtonText: 'No'
    }).then((result: any) => {
      if (result.isConfirmed) {
        const url = this.pageMode() === 'medications' ? '/products/changestatus/' : '/batches/changestatus/';
        this.restService.putRequest(url + row.id, String(row.isActive)).subscribe({
          next: (objData) => {
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
          },
          complete: () => console.info('transaction complete'),
        });
      }
    });
  }

  openModalProduct(type: string, row: ProductInterface | undefined = undefined) {
    const dialogRef: MatDialogRef<any> = this.dialog.open(ProductDialogComponent,
      { ...SizemodalInitializer, data: { mode: type, data: row } });

    dialogRef.afterClosed().subscribe(result => {
      this.getData(
        this.dataValue.pageable.pageNumber,
        this.dataValue.pageable.pageSize,
        this.searchValue
      );
    });
  }

  openModalBatch(type: string, row: BatchInterface | undefined = undefined) {
    const dialogRef: MatDialogRef<any> = this.dialog.open(BatchDialogComponent,
      { data: { mode: type, data: row } });

    dialogRef.afterClosed().subscribe(result => {
      this.getData(
        this.dataValue.pageable.pageNumber,
        this.dataValue.pageable.pageSize,
        this.searchValue
      );
    });
  }

  getData(page: number, size: number, searchValue: string) {

    this.restService.getRequest(this.url(), { page: page, size: size, searchValue: searchValue }).subscribe({
      next: (objData) => {
        this.dataValue = objData.pageable;

      },
      error: (error) => {
        this.alertService.infoMixin.fire({
          icon: 'error',
          title: error.error.message,
        });
      },
      complete: () => console.info('transaction complete'),
    });
  }

  search(searchValue: string) {
    this.searchValue = searchValue;
    this.getData(0, 10, this.searchValue);
  }

}