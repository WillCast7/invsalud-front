import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { AlertService } from '../../../../services/alerts.service';
import { PageableInitializer, PageableInterface } from '../../../../models/table/pageable-interface';
import { CommonModule, formatDate } from '@angular/common';
import { RestApiService } from '../../../../services/rest-api.service';
import { NotificationInterface } from '../../../../models/notifications/notification-interface';
import { Router } from '@angular/router';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { provideNativeDateAdapter } from '@angular/material/core';
import { NotificationStoreService } from '../../../../services/notification-store.service';

@Component({
  selector: 'app-notifications',
  imports: [
    MatTableModule,
    MatInputModule,
    MatDatepickerModule,
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export class NotificationsComponent implements OnInit {
  title: string = "Listado de notificaciones";
  startDate: Date | null = null;
  endDate: Date | null = null;
  dataValue: PageableInterface<NotificationInterface> = PageableInitializer;
  dataSource: NotificationInterface[] = [];
  pageEvent: PageEvent = new PageEvent;
  pageSizeOptions = [5, 10, 25];
  searchValue: string = '';

  displayedNames = {
    "title":'Nombre',
    "id": 'Id',
    "message": 'Notificacion',
    "date": 'Fecha',
    "status" : 'Estado',
    'seen_at': 'Visto'
  };

  displayedColumns: string[] = [
    'id',
    'title',
    'message',
    'date',
    'status',
    'seen_at'
  ];


  searchData(){
    if ( this.startDate && this.endDate && this.startDate > this.endDate) {
      this.alertService.infoMixin.fire({
        icon: 'error',
        title: 'La fecha de inicio no puede ser mayor que la fecha de fin',
      });
      return;
    }


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

  askToUser(notification: NotificationInterface){

    this.alertService.modal.fire({
      title: 'ir a llamar al cliente?',
      showCancelButton: true,
      confirmButtonText: 'Si',
      confirmButtonColor: '#3d5a80',
      cancelButtonColor: '#ac0505',
      cancelButtonText: 'No, Quedarme aqui'
    }).then((result: any) => {
      if (result.isConfirmed) {
        if(notification.recipient.status === "ENVIADA"){
          if (notification.id !== undefined) {
            this.notificationStoreService.markAsRead(notification.id);
          }
          this.restService.putRequest("/configuracion/notificaciones/updatenotification", notification ).subscribe({});
        }
        this.router.navigate([notification.route]);
      }
    });
  }

  getData(page: number, size: number, searchValue: string) {
      
      const startDate = this.startDate ? formatDate(this.startDate, 'yyyy-MM-dd', 'en-US') : null;
      const endDate = this.endDate ? formatDate(this.endDate, 'yyyy-MM-dd', 'en-US') : null;
      
      this.restService.getRequest(this.router.url + "/table", {page: page, row: size, searchValue: searchValue, startDate: startDate, endDate: endDate})
      .subscribe({
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

  constructor(
    private readonly alertService: AlertService,
    private readonly restService: RestApiService,
    private readonly router: Router,
    private readonly notificationStoreService: NotificationStoreService
  ){}

  ngOnInit(): void {
    this.getData(
      this.dataValue.pageable.pageNumber,
      this.dataValue.pageable.pageSize,
      this.searchValue
    );
  }

}
