import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { RestApiService } from '../../../services/rest-api.service';
import { AlertService } from '../../../services/alerts.service';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { RouterModule } from '@angular/router';
import { MenuInterface } from '../../../models/menu-interface';
import { MenuItemInterface } from '../../../models/menuItem-interface';
import { MenuService } from '../../../services/menu.service';
import { BillEditorComponent } from '../../dialogs/config/bill-editor/bill-editor.component';
import { DocumentTemplate } from '../../../models/config/document-template.interface';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { SizemodalInitializer } from '../../../models/modal/sizemodal-interface';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    FormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatIconModule,
    MatPaginatorModule,
    MatSelectModule,
    RouterModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatMenuModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  readonly dialog = inject(MatDialog);
  private readonly menuService = inject(MenuService);
  private readonly restService = inject(RestApiService);
  private readonly alertService = inject(AlertService);

  menu: MenuItemInterface[] = [];

  constructor() {
    this.getData();
  }

  getData() {
    this.restService.getRequest("/dashboard").subscribe({
      next: (objData) => {
        console.log(objData);
        this.menu = this.menuService.groupByFather(objData.data);
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
}