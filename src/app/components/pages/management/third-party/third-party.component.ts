import { Component, inject } from '@angular/core';
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
import { SizemodalInitializer } from '../../../../models/modal/sizemodal-interface';
import { TableHeaderControlsComponentComponent } from "../../../../shared/table-header-controls-component/table-header-controls-component.component";
import { TableComponent } from "../../../../shared/table/table.component";
import { ColumnTableInterface } from '../../../../models/table/column-table-interface';
import { TableOption } from '../../../../models/table/table-options-interface';
import { ThirdPartyInterface } from '../../../../models/inventory/thirdparty-interface';
import { ThirdPartyDialogComponent } from '../../../dialogs/cash-register/third-party-dialog/third-party-dialog.component';

@Component({
  selector: 'app-third-party',
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

  templateUrl: './third-party.component.html',
  styleUrl: './third-party.component.css'
})
export class ThirdPartyComponent {
  readonly dialog = inject(MatDialog);
  pageEvent: PageEvent = new PageEvent;
  dataValue: PageableInterface<ThirdPartyInterface> = PageableInitializer;
  searchValue = "";

  displayedColumns : ColumnTableInterface [] = [
    { key: 'id', label: 'id', isSortable: true },
    { key: 'documentType', label: 'Tipo doc.', isSortable: true },
    { key: 'documentNumber', label: 'Número de documento', isSortable: true },
    { key: 'fullName', label: 'Nombres', isSortable: true },
    { key: 'email', label: 'Correo', isSortable: true},
    { key: 'phoneNumber', label: 'Telefono', isSortable: false },
    { key: 'address', label: 'Dirección', isSortable: false }
  ];

  buttonsList: TableOption[] = [
    { icon: 'person_add', label: 'Crear tercero', identifier: 'thirdParty'}
  ];

  tableOptions: TableOption[] = [
    { icon: 'edit', label: 'Editar', identifier: 'edit' }
  ];

  buttonAction(event: { type: string, row: any }) {
    switch (event.type) {
      case 'thirdParty':
        this.openThirdPartyModal("create");
        break;
    }
  }
  
pageChange(event: PageEvent) {
  this.getData(
    event.pageIndex,
    event.pageSize,
    this.searchValue
  );
}

tableAction(event: { type: string, row: ThirdPartyInterface }) {
  switch (event.type) {
    case 'edit':
      this.openThirdPartyModal("edit", event.row);
        break;
      case 'view':
        this.openThirdPartyModal("view", event.row);
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

  getData(page: number, size: number, searchValue: string) {
    this.dataValue = PageableInitializer;
    this.restService.getRequest("/thirdparty", {page: page, size: size, searchValue: searchValue}).subscribe({
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

  openThirdPartyModal(mode: string, row: ThirdPartyInterface | undefined = undefined) {
    const dialogRef: MatDialogRef<any> = this.dialog.open(ThirdPartyDialogComponent, {... SizemodalInitializer, data: {data: row, mode: mode}});
      dialogRef.afterClosed().subscribe(result => {
        this.getData(
          this.dataValue.pageable.pageNumber,
          this.dataValue.pageable.pageSize,
          this.searchValue
        );
      }); 
  }

}