import { Component, inject, Inject, signal  } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import {MatTabsModule} from '@angular/material/tabs';
import { MatOption, MatSelect } from '@angular/material/select';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_NATIVE_DATE_FORMATS, MatNativeDateModule, NativeDateAdapter } from '@angular/material/core';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { RestApiService } from '../../../services/rest-api.service';
import { AlertService } from '../../../services/alerts.service';
import { ConfigparamsInterface } from '../../../models/configparams-interface';
import {  provideNgxMask } from 'ngx-mask';
import { UserInitializer, UserInterface, UserTableInterface } from '../../../models/user-interface';
import { MatChipsModule } from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { RoleInterface } from '../../../models/role-interface';

interface Food {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-userdialog',
  imports: [
    MatDialogModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatSelect,
    MatOption,
    MatDividerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatChipsModule,
    CommonModule
  ],
  providers: [ 
    {provide: DateAdapter, useClass: NativeDateAdapter},
    {provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS},
    provideNgxMask()
 ],
 
  templateUrl: './user-dialog.component.html',
  styleUrl: './user-dialog.component.css'
})

export class UserDialogComponent {
  hidePassword = true;
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<UserDialogComponent>);
  user: UserInterface = UserInitializer;
  title = signal("Crear usuario");
  roles = signal<RoleInterface[]>([]);
  documentTypes = signal<ConfigparamsInterface[]>([]);
  userForm! : FormGroup;

  constructor(
      private readonly formBuilder: FormBuilder,
      private restService: RestApiService,
      private alertService: AlertService,
      @Inject(MAT_DIALOG_DATA) public data: {mode: string, data: UserTableInterface | undefined}
  ) {

    this.getData();
  }

    initializeUserForm(){
      if(this.data.mode === "editMyAccount"){
        this.userForm = new FormGroup({
          id: new FormControl(''),
          email: new FormControl('', [Validators.required, Validators.email]),
          userName: new FormControl('', [Validators.required, Validators.minLength(4)])
        });
      }else{
        this.userForm = new FormGroup({
          id: new FormControl(''),
          email: new FormControl('', [Validators.required, Validators.email]),
          userName: new FormControl('', [Validators.required, Validators.minLength(4)]),
          role: new FormControl(null, Validators.required),
        });
      }
    }
    
    personForm: FormGroup = new FormGroup({
      id: new FormControl(''),
      documentType: new FormControl(''),
      names: new FormControl(''),
      surnames: new FormControl(''),
      phoneNumber: new FormControl(''),
      address: new FormControl(''),
      birthDate: new FormControl(''),
      documentNumber: new FormControl('', Validators.required)
      });
 
  onSubmit(){
    
    if (this.userForm.invalid) {
      Object.keys(this.userForm.controls).forEach(key => {
        const controlErrors = this.userForm.get(key)?.errors;
        if (controlErrors != null) {
          console.log('Campo con error:', key, 'Detalles:', controlErrors);
        }
      });
    }

    if (this.userForm.valid && this.personForm.valid) {
      const userData = {
      ...this.userForm.value,      // email, userName, role, etc.
      person: this.personForm.value // Metemos el formulario de persona aquí
    };
    
    const url = this.data.mode === "editMyAccount" ? "/administration/myAccount" : "/administration/user" ;
      this.restService.postRequest(url, userData).subscribe({
        next: (objData) => {
          this.alertService.infoMixin.fire({
            icon: 'success',
            title: "Usuario registrado exitosamente",
          });
          this.dialogRef.close(objData.data);
        },
        error: (error) => {
          this.alertService.infoMixin.fire({
            icon: 'error',
            title: error.error.message,
          });
        },
        complete: () => console.info('transaction complete'),
      });
    } else {
      this.alertService.infoMixin.fire({
        icon: 'warning',
        title: 'Por favor complete todos los campos requeridos.',
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  } 

  getData() {
    this.initializeUserForm();

    if(this.data.mode === "create"){
      this.restService.getRequest("/configparams/user").subscribe({
        next: (objData) => {
          this.roles.set(objData.data.roles);
            this.documentTypes.set(objData.data.documentTypes);
        },
        error: (error) => {
          this.alertService.infoMixin.fire({
            icon: 'error',
            title: error.error.message,
          });
        },
        complete: () => {return},
      });
    }else{
      this.restService.getRequest("/administration/user/" + this.data.data?.id).subscribe({
        next: (objData) => {
          this.user = objData.data.user;
           if(this.data.mode === "edit"){
              this.title.set("Editar usuario");
              
              this.roles.set(objData.data.roles);
              this.documentTypes.set(objData.data.documentTypes);

              this.userForm.patchValue({
                id: this.user?.id,
                email: this.user?.email,
                userName: this.user?.userName,
                enable: this.user?.enable,
                role: this.user?.role
              });

              this.personForm.patchValue({
                  id: this.user?.person.id,
                  documentType: this.user?.person.documentType,
                  documentNumber: this.user?.person.documentNumber,
                  names: this.user?.person.names,
                  surnames: this.user?.person.surnames,
                  phoneNumber: this.user?.person.phoneNumber,
                  address: this.user?.person.address,
                  birthDate: this.user?.person.birthDate
              });
            }if(this.data.mode === "editMyAccount"){
              this.title.set("Editar mi cuenta");
              
              this.documentTypes.set(objData.data.documentTypes);

              this.userForm.patchValue({
                id: this.user?.id,
                email: this.user?.email,
                userName: this.user?.userName,
                enable: this.user?.enable,
                role: this.user?.role
              });

              this.personForm.patchValue({
                  id: this.user?.person.id,
                  documentType: this.user?.person.documentType,
                  documentNumber: this.user?.person.documentNumber,
                  names: this.user?.person.names,
                  surnames: this.user?.person.surnames,
                  phoneNumber: this.user?.person.phoneNumber,
                  address: this.user?.person.address,
                  birthDate: this.user?.person.birthDate
              });
            } else {
              this.title.set("Ver usuario");
            }
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

  compareRoles(o1: any, o2: any): boolean {
    return o1 && o2 ? o1.id === o2.id : o1 === o2;
  }
}
