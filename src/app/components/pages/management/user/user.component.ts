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
import { UserTableInterface } from '../../../../models/user-interface';
import { UserDialogComponent } from '../../../dialogs/user-dialog/user-dialog.component';

@Component({
  selector: 'app-user',
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

  templateUrl: './user.component.html',
  styleUrl: './user.component.css'
})
export class UserComponent {
  readonly dialog = inject(MatDialog);
  pageEvent: PageEvent = new PageEvent;
  dataValue: PageableInterface<UserTableInterface> = PageableInitializer;
  searchValue = "";

  displayedColumns : ColumnTableInterface [] = [
    { key: 'id', label: 'id.', isSortable: true },
    { key: 'documentType', label: 'Tipo', isSortable: true },
    { key: 'documentNumber', label: 'Número', isSortable: true },
    { key: 'fullName', label: 'Nombres', isSortable: true },
    { key: 'phoneNumber', label: 'Teléfono', isSortable: false },
    { key: 'address', label: 'Dirección', isSortable: false },
    { key: 'birthDate', label: 'Fecha de nacimiento', isSortable: false }
  ];

  tableOptions: TableOption[] = [
    { icon: 'edit', label: 'Editar', identifier: 'edit' }
  ];

  buttonsList: TableOption[] = [
    { icon: 'person_add', label: 'Crear Usuario', identifier: 'user'}
  ];

  buttonAction(event: { type: string, row: any }) {
    console.log(event);
    switch (event.type) {
      case 'user':
        this.openModal("create", event.row);
        break;
      case 'search':
        this.search(event.row);
        break;
    }
  }

  tableAction(event: { type: string, row: UserTableInterface }) {
    switch (event.type) {
      case 'edit':
        this.openModal("edit", event.row);
        break;
      case 'view':
        this.openModal("view", event.row);
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



  openModal(mode: string, row: UserTableInterface) {
     const dialogRef: MatDialogRef<any> = this.dialog.open(UserDialogComponent,
      {... SizemodalInitializer, data: {data: row, mode: mode}});
      
    dialogRef.afterClosed().subscribe(result => {
      this.getData(
        this.dataValue.pageable.pageNumber,
        this.dataValue.pageable.pageSize,
        this.searchValue
      );
    }); 
  }

  getData(page: number, size: number, searchValue: string) {
    this.dataValue = PageableInitializer;
    this.restService.getRequest("/administration/users", {page: page, size: size, searchValue: searchValue}).subscribe({
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

  newUser() {

  }



}