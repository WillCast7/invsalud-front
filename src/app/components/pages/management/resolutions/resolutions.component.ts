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
import { ResolutionInterface } from '../../../../models/inventory/resolution-interface';
import { ResolutionDialogComponent } from '../../../dialogs/resolutions/resolution-dialog.component';
import { SizemodalInitializer } from '../../../../models/modal/sizemodal-interface';

@Component({
  selector: 'app-resolutions',
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
  templateUrl: './resolutions.component.html',
  styleUrl: './resolutions.component.css'
})
export class ResolutionsComponent {
  readonly dialog = inject(MatDialog);
  pageEvent: PageEvent = new PageEvent;
  dataValue: PageableInterface<ResolutionInterface> = PageableInitializer;
  searchValue = "";
  url = '/resolutions';

  resolutionColumns: ColumnTableInterface[] = [
    { key: 'id', label: 'ID', isSortable: true },
    { key: 'code', label: 'Código', isSortable: true },
    { key: 'thirdParty', label: 'Tercero', isSortable: true },
    { key: 'startDate', label: 'F. Inicio', isSortable: true, pipe: 'date' },
    { key: 'expirationDate', label: 'F. Expiración', isSortable: true, pipe: 'date' },
    { key: 'description', label: 'Descripción', isSortable: false },
    { key: 'createdBy', label: 'Creado por', isSortable: true },
    { key: 'createdAt', label: 'F. Creación', isSortable: true, pipe: 'date' },
    { key: 'isActive', label: 'Estado', isSortable: false, pipe: 'status' }
  ];

  tableOptions: TableOption[] = [
    { icon: 'edit', label: 'Editar resolución', identifier: 'edit', color: 'primary' },
    { icon: 'autorenew', label: 'Cambiar estado', identifier: 'changeStatus', color: 'accent' }
  ];

  buttonAction(event: { type: string, row: any }) {
    switch (event.type) {
      case 'createResolution':
        this.openModalResolution('create');
        break;
      case 'search':
        this.search(event.row);
        break;
    }
  }

  tableAction(event: { type: string, row: ResolutionInterface }) {
    switch (event.type) {
      case 'edit':
        this.openModalResolution(event.type, event.row);
        break;
      case 'view':
        this.openModalResolution(event.type, event.row);
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

  changeStatus(row: ResolutionInterface) {
    this.alertService.modal.fire({
      icon: "warning",
      title: 'Cambiar el estado',
      text: "¿Seguro desea cambiar el estado de la resolución?",
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

  openModalResolution(type: string, row: ResolutionInterface | undefined = undefined) {
    const dialogRef: MatDialogRef<any> = this.dialog.open(ResolutionDialogComponent,
      { ...SizemodalInitializer, data: { mode: type, data: row } });

    dialogRef.afterClosed().subscribe((result: any) => {
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
