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
import { OrderInterface } from '../../../../models/inventory/order-interface';
import { SizemodalInitializer } from '../../../../models/modal/sizemodal-interface';
import { OrderDialogComponent } from '../../../dialogs/inventory/order/order-dialog.component';
import { OrderRecipeDialogComponent } from '../../../dialogs/inventory/order-recipe/order-recipe-dialog.component';

@Component({
  selector: 'app-orders',
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
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent {
  readonly dialog = inject(MatDialog);
  pageEvent: PageEvent = new PageEvent;
  dataValue: PageableInterface<OrderInterface> = PageableInitializer;
  searchValue = "";
  url = '/orders';
  pageMode = signal<string>('special');

  orderColumns: ColumnTableInterface[] = [
    { key: 'id', label: 'ID', isSortable: true },
    { key: 'orderCode', label: 'Cod. Cotización', isSortable: true },
    { key: 'thirdParty', label: 'Tercero', isSortable: true },
    { key: 'total', label: 'Total', isSortable: true },
    { key: 'status', label: 'Estado', isSortable: true },
    { key: 'createdAt', label: 'F. Creación', isSortable: true, pipe: 'date' },
    { key: 'expirateAt', label: 'F. Expiración', isSortable: true, pipe: 'date' },
    { key: 'observations', label: 'Observaciones', isSortable: false }
  ];

  tableOptions: TableOption[] = [
    { icon: 'visibility', label: 'Ver cotización', identifier: 'view', color: 'primary' },
    { icon: 'edit', label: 'Editar cotización', identifier: 'edit', color: 'primary' },
    { icon: 'autorenew', label: 'Cambiar estado', identifier: 'changeStatus', color: 'accent' }
  ];

  buttonsList = signal<TableOption[]>([
    { icon: 'add', label: 'Crear Cotización', identifier: 'createOrder', color: 'primary' }
  ]);

  toggleList = signal<TableOption[]>([
    { icon: 'inventory', label: 'Control Especial', identifier: 'special', color: 'primary', title: 'Medicamentos de control especial y monopolio del estado' },
    { icon: 'inventory', label: 'Salud Publica', identifier: 'public', color: 'primary', title: 'Medicamentos de salud publica' },
    { icon: 'inventory', label: 'Recetarios', identifier: 'recipe', color: 'primary', title: 'Recetarios' }
  ]);

  buttonAction(event: { type: string, row: any }) {
    switch (event.type) {
      case 'special':
        this.pageMode.set(event.type);
        break;
      case 'public':
        this.pageMode.set(event.type);
        break;
      case 'recipe':
        this.pageMode.set(event.type);
        break;
      case 'createOrder':
        if (this.pageMode() !== 'recipe') {
          this.openModalOrder('create');
        } else {
          this.openModalOrderRecetario('create');
        }
        break;
      case 'search':
        this.search(event.row);
        break;

    }
  }

  tableAction(event: { type: string, row: OrderInterface }) {
    switch (event.type) {
      case 'edit':
        this.openModalOrder(event.type, event.row);
        break;
      case 'view':
        this.openModalOrder(event.type, event.row);
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

  changeStatus(row: OrderInterface) {
    this.alertService.modal.fire({
      icon: "warning",
      title: 'Cambiar el estado',
      text: "¿Seguro desea cambiar el estado de la cotización?",
      showCancelButton: true,
      confirmButtonText: 'Si',
      confirmButtonColor: '#3d5a80',
      cancelButtonColor: '#ac0505',
      cancelButtonText: 'No'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.restService.putRequest(this.url + "/changestatus/" + row.id, String(row.status)).subscribe({
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

  openModalOrder(type: string, row: OrderInterface | undefined = undefined) {
    const dialogRef = this.dialog.open(OrderDialogComponent, {
      ...SizemodalInitializer,
      data: { mode: type, type: this.pageMode(), data: row }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.getData(
          this.dataValue.pageable.pageNumber,
          this.dataValue.pageable.pageSize,
          this.searchValue
        );
      }
    });
  }

  openModalOrderRecetario(type: string, row: OrderInterface | undefined = undefined) {
    const dialogRef = this.dialog.open(OrderRecipeDialogComponent, {
      ...SizemodalInitializer,
      width: '500px',
      data: { mode: type, type: this.pageMode(), data: row }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.getData(
          this.dataValue.pageable.pageNumber,
          this.dataValue.pageable.pageSize,
          this.searchValue
        );
      }
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
          title: error.error?.message || 'Error al obtener datos',
        });
      }
    });
  }

  search(searchValue: string) {
    this.searchValue = searchValue;
    this.getData(0, 10, this.searchValue);
  }
}
