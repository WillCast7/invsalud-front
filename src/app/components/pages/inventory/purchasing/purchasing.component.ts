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
import { PurchaseTableInterface } from '../../../../models/inventory/purchase-interface';
import { PurchasingDialogComponent } from '../../../dialogs/inventory/purchasing-dialog/purchasing-dialog.component';
import { SizemodalInitializer } from '../../../../models/modal/sizemodal-interface';
import { PurchasingRecipeDialogComponent } from '../../../dialogs/inventory/purchasing-recipe-dialog/purchasing-recipe-dialog.component';

@Component({
  selector: 'app-purchasing',
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
  templateUrl: './purchasing.component.html',
  styleUrl: './purchasing.component.css'
})
export class PurchasingComponent {
  readonly dialog = inject(MatDialog);
  pageEvent: PageEvent = new PageEvent;
  dataValue: PageableInterface<PurchaseTableInterface> = PageableInitializer;
  searchValue = "";
  url = '/purchasing';
  pageMode = signal<string>('special');

  purchaseColumns: ColumnTableInterface[] = [
    { key: 'id', label: 'ID', isSortable: true },
    { key: 'purchasedCode', label: 'Cod. Entrada', isSortable: true },
    { key: 'thirdParty', label: 'Tercero', isSortable: true },
    { key: 'total', label: 'Total', isSortable: true },
    { key: 'isActive', label: 'Estado', isSortable: false, pipe: 'status' }
  ];

  purchaseColumnsRecipe: ColumnTableInterface[] = [
    { key: 'id', label: 'ID', isSortable: true },
    { key: 'purchasedCode', label: 'Cod. Entrada', isSortable: true },
    { key: 'thirdParty', label: 'Tercero', isSortable: true },
    { key: 'total', label: 'Total', isSortable: true },
    { key: 'createdAt', label: 'Fecha', isSortable: true, pipe: 'date' },
    { key: 'isActive', label: 'Estado', isSortable: false, pipe: 'status' }
  ];

  tableOptions: TableOption[] = [
    { icon: 'do_not_disturb', label: 'Desactivar', identifier: 'changeStatus', color: 'accent' }
  ];

  buttonsList = signal<TableOption[]>([
    { icon: 'add', label: '', identifier: 'createPurchase', color: 'primary' }
  ]);

  toggleList = signal<TableOption[]>([
    { icon: 'inventory', label: 'Control Especial', identifier: 'special', color: 'primary', title: 'Medicamentos de control especial y monopolio del estado' },
    { icon: 'inventory', label: 'Salud Publica', identifier: 'public', color: 'primary', title: 'Medicamentos de salud publica' },
    { icon: 'inventory', label: 'Recetarios', identifier: 'recipe', color: 'primary', title: 'Recetarios' }
  ]);

  buttonAction(event: { type: string, row: any }) {
    console.log(event);
    switch (event.type) {
      case 'special':
        this.pageMode.set('special');
        this.getData(0, 10, this.searchValue);
        break;
      case 'public':
        this.pageMode.set('public');
        this.getData(0, 10, this.searchValue);
        break;
      case 'recipe':
        this.pageMode.set('recipe');
        this.getData(0, 10, this.searchValue);
        break;
      case 'createPurchase':
        if (this.pageMode() !== 'recipe') {
          this.openModalPurchase('create');
        } else {
          this.openModalPurchaseRecetario('create');
        }
        break;
      case 'search':
        this.search(event.row);
        break;
    }
  }

  tableAction(event: { type: string, row: PurchaseTableInterface }) {
    switch (event.type) {
      case 'edit':
        this.openModalPurchase(event.type, event.row);
        break;
      case 'view':
        this.openModalPurchase(event.type, event.row);
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

  changeStatus(row: PurchaseTableInterface) {
    if (row.isActive) {
      this.alertService.modal.fire({
        icon: "warning",
        title: 'Cancelar el ingreso?',
        text: "solo un usuario administrador puede hacer esto",
        showCancelButton: true,
        confirmButtonText: 'Cancelar ingreso',
        confirmButtonColor: '#3d5a80',
        cancelButtonColor: '#ac0505',
        cancelButtonText: 'Volver'
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
    } else {
      this.alertService.modal.fire({
        icon: "warning",
        title: 'Cambiar el estado',
        text: "la compra ya fue anulada",
        showCancelButton: true,
        confirmButtonText: 'Si',
        confirmButtonColor: '#3d5a80',
        cancelButtonColor: '#ac0505',
        cancelButtonText: 'No'
      });
    }
  }

  openModalPurchase(type: string, row: PurchaseTableInterface | undefined = undefined) {
    if (this.pageMode() === 'recipe') {
      this.openModalPurchaseRecetario(type, row);
    };

    const dialogRef = this.dialog.open(PurchasingDialogComponent, {
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

  openModalPurchaseRecetario(type: string, row: PurchaseTableInterface | undefined = undefined) {
    const dialogRef = this.dialog.open(PurchasingRecipeDialogComponent, {
      ...SizemodalInitializer,
      data: { mode: type, data: row }
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
    this.restService.getRequest(this.url + "/search/" + this.pageMode(), { page: page, size: size, searchValue: searchValue }).subscribe({
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
