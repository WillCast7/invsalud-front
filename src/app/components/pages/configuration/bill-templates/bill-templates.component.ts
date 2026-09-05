import { Component, inject, signal } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { AlertService } from '../../../../services/alerts.service';
import { PageableInitializer, PageableInterface } from '../../../../models/table/pageable-interface';
import { ColumnTableInterface } from '../../../../models/table/column-table-interface';
import { TableOption } from '../../../../models/table/table-options-interface';
import { TableComponent } from "../../../../shared/table/table.component";
import { SizemodalInitializer } from '../../../../models/modal/sizemodal-interface';
import { BillEditorComponent } from '../../../dialogs/config/bill-editor/bill-editor.component';
import { CommonModule } from '@angular/common';
import { RestApiService } from '../../../../services/rest-api.service';
import { TableHeaderControlsComponent } from '../../../../shared/table-header-controls-component/table-header-controls-component';

@Component({
  selector: 'app-bill-templates',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    TableHeaderControlsComponent,
    TableComponent
  ],
  templateUrl: './bill-templates.component.html',
  styleUrl: './bill-templates.component.css'
})
export class BillTemplatesComponent {
  readonly dialog = inject(MatDialog);
  private readonly restService = inject(RestApiService);
  private readonly alertService = inject(AlertService);

  pageEvent: PageEvent = new PageEvent;
  dataValue: PageableInterface<any> = PageableInitializer;
  searchValue = "";
  url = '/document-templates';

  tableColumns: ColumnTableInterface[] = [
    { key: 'name', label: 'Nombre Plantilla', isSortable: true },
    { key: 'category', label: 'Categoría', isSortable: true },
    { key: 'documentType', label: 'Tipo Doc.', isSortable: true },
    { key: 'isDefault', label: '¿Predeterminada?', isSortable: true, pipe: 'status' },
    { key: 'createdAt', label: 'Fecha Creación', isSortable: true, pipe: 'date' }
  ];

  tableOptions: TableOption[] = [
    { icon: 'check_circle', label: 'Marcar como predeterminada', identifier: 'select_default' }
  ];

  buttonsList = signal<TableOption[]>([
    { icon: 'add', label: 'Crear Plantilla A4', identifier: 'createTemplate', color: 'primary' }
  ]);

  constructor() {
    this.getData(
      this.dataValue.pageable.pageNumber,
      this.dataValue.pageable.pageSize,
      this.searchValue
    );
  }

  buttonAction(event: { type: string, row: any }) {
    switch (event.type) {
      case 'createTemplate':
        this.openModalTemplate('create');
        break;
      case 'search':
        this.search(event.row);
        break;
    }
  }

  tableAction(event: { type: string, row: any }) {
    switch (event.type) {
      case 'edit':
        this.openModalTemplate('edit', event.row);
        break;
      case 'view':
        this.openModalTemplate('view', event.row);
        break;
      case 'select_default':
        this.setDefaultTemplate(event.row);
        break;
    }
  }

  handlePageEvent(e: PageEvent): void {
    this.getData(
      e.pageIndex,
      e.pageSize,
      this.searchValue
    );
  }

  getData(page: number, size: number, searchValue: string) {
    this.restService.getRequest(this.url, { page: page + 1, size: size, searchValue: searchValue }).subscribe({
      next: (objData: any) => {
        const apiData = objData.content !== undefined ? objData : objData.pageable;
        if (apiData) {
          this.dataValue = {
            empty: objData.empty || false,
            first: objData.first || false,
            last: objData.last || false,
            number: objData.number || page,
            numberOfElements: objData.numberOfElements || 0,
            pageable: objData.pageable || {
              offset: 0,
              pageNumber: page,
              pageSize: size,
              paged: true,
              sort: { empty: true, sorted: false, unsorted: true },
              unsorted: true
            },
            size: objData.size || size,
            sort: objData.sort || { empty: true, sorted: false, unsorted: true },
            totalElements: objData.totalElements || 0,
            totalPages: objData.totalPages || 0,
            content: objData.content || []
          };
        }
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

  setDefaultTemplate(row: any) {
    this.alertService.modal.fire({
      icon: "question",
      title: 'Establecer Predeterminada',
      text: `¿Seguro deseas que '${row.name}' sea la plantilla oficial para ${row.documentType} de ${row.category}?`,
      showCancelButton: true,
      confirmButtonText: 'Sí, establecer',
      confirmButtonColor: '#3d5a80',
      cancelButtonColor: '#ac0505',
      cancelButtonText: 'Cancelar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.restService.putRequest(`${this.url}/${row.id}/set-default`, {}).subscribe({
          next: () => {
            this.alertService.infoMixin.fire({
              icon: 'success',
              title: "Plantilla establecida por defecto correctamente",
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
              title: error.error?.message || 'Error al actualizar',
            });
          }
        });
      }
    });
  }

  openModalTemplate(type: string, row: any | undefined = undefined) {
    if (type === 'edit' || type === 'view') {
      // Necesitamos cargar los datos completos (HTML, JSON) antes de abrir el modal porque la tabla no los trae
      this.restService.getRequest(`${this.url}/${row.id}`).subscribe({
        next: (fullTemplate) => {
          this.launchModal(type, fullTemplate);
        },
        error: () => this.alertService.infoMixin.fire({ icon: 'error', title: 'Error cargando plantilla' })
      });
    } else {
      this.launchModal(type, null);
    }
  }

  private launchModal(type: string, fullData: any) {
    const dialogRef = this.dialog.open(BillEditorComponent, {
      ...SizemodalInitializer,
      panelClass: 'full-screen-dialog',
      width: '100vw',
      maxWidth: '100vw',
      height: '100vh',
      maxHeight: '100vh',
      data: { mode: type, type: fullData?.category || 'RECETARIOS', data: fullData }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.alertService.infoMixin.fire({
          icon: 'success',
          title: result.message
        });
        this.getData(
          this.dataValue.pageable.pageNumber,
          this.dataValue.pageable.pageSize,
          this.searchValue
        );
      }
    });
  }
}
