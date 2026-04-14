import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { RestApiService } from '../../../../services/rest-api.service';
import { AlertService } from '../../../../services/alerts.service';
import { UserInitializer, UserInterface } from '../../../../models/user-interface';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ChangePasswordComponent } from '../../../dialogs/config/change-password/change-password.component';
import { SizemodalInitializer } from '../../../../models/modal/sizemodal-interface';
import { UserDialogComponent } from '../../../dialogs/user-dialog/user-dialog.component';

@Component({
  selector: 'app-account',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    CommonModule,
    MatCardModule
  ],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css'
})
export class AccountComponent implements OnInit {
  user = signal<UserInterface>(UserInitializer);
  myUsername: string = "";
  title: string = "Informacion de mi Cuenta";
   readonly dialog = inject(MatDialog);
  getData() {
    this.restService.getRequest("/administration/myaccount").subscribe({
      next: (data) => {
        this.user.set(data.data);
      },
      error: (error) => {
        this.alertService.infoMixin.fire({
          icon: 'error',
          title: error.error,
        });
      }
    });
  }

  constructor( 
    private readonly restService: RestApiService,
    private readonly alertService: AlertService
  ) {
    this.myUsername = String(localStorage.getItem("currentUser"));
  }

  ngOnInit() {
    this.getData();
  }

  openEditModal() {
      const dialogRef: MatDialogRef<any> = this.dialog.open(UserDialogComponent,
          {... SizemodalInitializer, data: {data: this.user(), mode: "editMyAccount"}});
          
        dialogRef.afterClosed().subscribe(result => {
          this.getData();
        }); 
  }

  openChangePassModal() {
    const dialogRef: MatDialogRef<any> = this.dialog.open(ChangePasswordComponent);
      
    dialogRef.afterClosed().subscribe(result => {
      this.getData();
    }); 
  }

}
