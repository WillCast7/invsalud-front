import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { AlertService } from '../../../../services/alerts.service';
import { RestApiService } from '../../../../services/rest-api.service';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PageableInitializer, PageableInterface } from '../../../../models/table/pageable-interface';
import { ConfigparamsInitializer, ConfigparamsInterface } from '../../../../models/configparams-interface';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ColumnTableInterface } from '../../../../models/table/column-table-interface';
import { TableOption } from '../../../../models/table/table-options-interface';
import { TableComponent } from '../../../../shared/table/table.component';
import { TableHeaderControlsComponentComponent } from '../../../../shared/table-header-controls-component/table-header-controls-component.component';
import { SizemodalInitializer } from '../../../../models/modal/sizemodal-interface';
import { ConfigParamsDialogComponent } from '../../../dialogs/management/config-params-dialog/config-params-dialog.component';

@Component({
  selector: 'app-config-params',
  imports: [
    MatDialogModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    FormsModule,
    MatButtonToggleModule,
    ReactiveFormsModule,
    MatPaginatorModule,
    TableHeaderControlsComponentComponent,
    TableComponent
  ],
  templateUrl: './config-params.component.html',
  styleUrl: './config-params.component.css'
})
export class ConfigParamsComponent {
  readonly dialog = inject(MatDialog);
  configParamSelected: { shortname: string, parent: string } = { shortname: '', parent: '' };
  originalRow: ConfigparamsInterface = ConfigparamsInitializer;
  dataValue: PageableInterface<ConfigparamsInterface> = PageableInitializer;
  dataConfigFiltered: ConfigparamsInterface[] = [];
  headerDataConfigParams: { shortname: string, parent: string }[] = [];
  configParamType: string = "";
  orderFilter: string = '';
  title: string = "Parametros de Configuración";
  searchValue: string = '';
  pageSizeOptions = [5, 10, 25];
  pageEvent: PageEvent = new PageEvent;
  shornameList: string[] = [];
  displayedColumns: ColumnTableInterface[] = [
    { key: 'id', label: 'id.', isSortable: true },
    { key: 'name', label: 'Nombre', isSortable: true },
    { key: 'parent', label: 'Padre', isSortable: true },
    { key: 'shortname', label: 'Nombre corto', isSortable: true },
    { key: 'definition', label: 'Definición', isSortable: false },
    { key: 'active', label: 'Estado', isSortable: false, pipe: 'status' },
    { key: 'order', label: 'Orden', isSortable: false }
  ];

  tableOptions: TableOption[] = [
    { icon: 'edit', label: '', identifier: 'edit', title: 'Editar' }
  ];

  buttonsList: TableOption[] = [
    { icon: 'add', label: '', identifier: 'create', title: 'Crear Parámetro' }
  ];

  // this.getData(this.pageable.pageIndex, this.pageable.pageSize, this.searchValue);



  buttonAction(event: { type: string, row: any }) {
    switch (event.type) {
      case 'create':
        this.openModal("create", event.row);
        break;
      case 'search':
        this.search(event.row);
        break;
    }
  }

  tableAction(event: { type: string, row: ConfigparamsInterface }) {
    switch (event.type) {
      case 'edit':
        this.openModal("edit", event.row);
        break;
      case 'view':
        this.openModal("view", event.row);
        break;
    }
  }

  search(searchValue: string) {
    this.searchValue = searchValue;
    this.getData(0, 10, this.searchValue);
  }


  openModal(mode: string, row: ConfigparamsInterface) {
    row.isActive = row.active ? true : false;
    const dialogRef: MatDialogRef<any> = this.dialog.open(ConfigParamsDialogComponent,
      { ...SizemodalInitializer, data: { data: row, mode: mode } });

    dialogRef.afterClosed().subscribe(result => {
      this.getData(
        this.dataValue.pageable.pageNumber,
        this.dataValue.pageable.pageSize,
        this.searchValue
      );
    });
  }

  getData(page: number, size: number, searchValue: string) {

    const orderFilter = this.orderFilter;
    const configParamType = this.configParamType;

    this.restService.getRequest("/configparams", {
      page: page,
      row: size,
      searchValue: searchValue,
      orderFilter: orderFilter,
      configParamType: configParamType
    }).subscribe({
      next: (objData) => {
        this.dataValue = objData.pageable;
      },
      error: (error) => {
        this.alertService.infoMixin.fire({
          icon: 'error',
          title: error.error.message
        });
      },
      complete: () => console.info('transaction complete'),
    });
  }

  sendData(configParam: ConfigparamsInterface) {
    this.restService.putRequest("/configparams", configParam).subscribe({
      next: (objData) => {
        this.alertService.infoMixin.fire({
          icon: 'success',
          title: objData.message
        });
      },
      error: (error) => {
        this.alertService.infoMixin.fire({
          icon: 'error',
          title: error.error.message
        });
      },
      complete: () => console.info('transaction complete'),
    });
  }

  sendCreateData(configParam: ConfigparamsInterface) {
    this.restService.postRequest("/configparams", configParam).subscribe({
      next: (objData) => {
        this.alertService.infoMixin.fire({
          icon: 'success',
          title: objData.message
        });
      },
      error: (error) => {
        this.alertService.infoMixin.fire({
          icon: 'error',
          title: error.error.message
        });
      },
      complete: () => console.info('transaction complete'),
    });
  }

  handlePageEvent(e: PageEvent): void {
    this.getData(
      e.pageIndex,
      e.pageSize,
      this.searchValue
    );
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

  activateConfigParam(element: ConfigparamsInterface) {
    this.alertService.modal.fire({
      title: element.isActive == false ? '¿Está seguro de activar el parametro?' : '¿Está seguro de desactivar el parametro?',
      showCancelButton: true,
      confirmButtonText: element.isActive == true ? 'Activar' : 'Desactivar',
      cancelButtonText: 'Cancelar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        element.isActive = element.isActive == true ? false : true;
        this.sendData(element);
      }
    });
  }
}
