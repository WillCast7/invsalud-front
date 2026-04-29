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
import { SaleDialogComponent } from '../../../dialogs/inventory/sale/sale-dialog.component';
import { SaleRecipeDialogComponent } from '../../../dialogs/inventory/sale-recipe/sale-recipe-dialog.component';
import { SizemodalInitializer } from '../../../../models/modal/sizemodal-interface';

@Component({
  selector: 'app-sales',
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
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.css'
})
export class SalesComponent {
  readonly dialog = inject(MatDialog);
  pageEvent: PageEvent = new PageEvent;
  dataValue: PageableInterface<OrderInterface> = PageableInitializer;
  searchValue = "";
  url = '/sales/special';

  pageMode = signal<string>('special');

  orderColumns: ColumnTableInterface[] = [
    { key: 'orderCode', label: 'Cod. Venta', isSortable: true },
    { key: 'thirdParty', label: 'Tercero', isSortable: true },
    { key: 'total', label: 'Total', isSortable: true },
    { key: 'createdAt', label: 'F. Creación', isSortable: true, pipe: 'date' }
  ];

  toggleList = signal<TableOption[]>([
    { icon: 'inventory', label: 'Control Especial', identifier: 'special', color: 'primary', title: 'Medicamentos de control especial y monopolio del estado' },
    { icon: 'inventory', label: 'Salud Publica', identifier: 'public', color: 'primary', title: 'Medicamentos de salud publica' },
    { icon: 'inventory', label: 'Recetarios', identifier: 'recipe', color: 'primary', title: 'Recetarios' }
  ]);

  buttonsList = signal<TableOption[]>([]);

  buttonAction(event: { type: string, row: any }) {
    switch (event.type) {
      case 'special':
        this.pageMode.set('special');
        this.url = '/sales/special';
        this.buttonsList.set([]);
        this.getData(0, this.dataValue.pageable.pageSize, this.searchValue);
        break;
      case 'public':
        this.pageMode.set('public');
        this.url = '/sales/public';
        this.buttonsList.set([{ icon: 'add', label: 'Crear Salida', identifier: 'createSale', color: 'primary' }]);
        this.getData(0, this.dataValue.pageable.pageSize, this.searchValue);
        break;
      case 'recipe':
        this.pageMode.set('recipe');
        this.url = '/sales/recipe';
        this.buttonsList.set([]);
        this.getData(0, this.dataValue.pageable.pageSize, this.searchValue);
        break;
      case 'createSale':
        this.openModalSale('create', undefined);
        break;
      case 'search':
        this.search(event.row);
        break;
    }
  }

  tableAction(event: { type: string, row: OrderInterface }) {
    switch (event.type) {
      case 'view':
        if (this.pageMode() === 'recipe') {
          this.openModalSaleRecipe(event.row);
        } else {
          this.openModalSale('view', event.row);
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

  openModalSale(mode: string, row: OrderInterface | undefined) {
    this.dialog.open(SaleDialogComponent, {
      ...SizemodalInitializer,
      data: { mode: mode, type: this.pageMode(), data: row }
    }).afterClosed().subscribe(result => {
      if (result) {
        if (result.message) {
          this.alertService.infoMixin.fire({ icon: 'success', title: result.message });
        }
        this.getData(this.dataValue.pageable.pageNumber, this.dataValue.pageable.pageSize, this.searchValue);
      }
    });
  }

  openModalSaleRecipe(row: OrderInterface) {
    this.dialog.open(SaleRecipeDialogComponent, {
      ...SizemodalInitializer,
      data: { mode: 'view', type: 'recipe', data: row }
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
