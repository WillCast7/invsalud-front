import { Component, inject, Inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators, FormControl, FormArray } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_NATIVE_DATE_FORMATS, MatNativeDateModule, NativeDateAdapter } from '@angular/material/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { RestApiService } from '../../../../services/rest-api.service';
import { AlertService } from '../../../../services/alerts.service';
import { ConfigparamsInterface } from '../../../../models/configparams-interface';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { ThirdpartyRoleInterface } from '../../../../models/inventory/thirdparty-role-interface';
import { ThirdPartyExample, ThirdPartyInterface } from '../../../../models/inventory/thirdparty-interface';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import { ProductInterface } from '../../../../models/inventory/product-interface';
import { ResolutionInterface } from '../../../../models/inventory/resolution-interface';

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
    NgxMaskDirective,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatDividerModule,
    MatChipsModule,
    CommonModule
  ],
  providers: [
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS },
    provideNgxMask()
  ],

  templateUrl: './third-party-dialog.component.html',
  styleUrl: './third-party-dialog.component.css'
})

export class ThirdPartyDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ThirdPartyDialogComponent>);
  thirdPartyTypes: ThirdpartyRoleInterface[] = [];
  documentTypes: ConfigparamsInterface[] = [];
  thirdPartySearched: ThirdPartyInterface = ThirdPartyExample;
  title = signal("Crear tercero");
  productsList: ProductInterface[] = [];

  constructor(
    private readonly formBuilder: FormBuilder,
    private restService: RestApiService,
    private alertService: AlertService,
    @Inject(MAT_DIALOG_DATA) public data: { mode: string, data: ThirdPartyInterface | undefined }
  ) {
    this.getData();
  }

  form: FormGroup = this.fb.group({
    id: [null],
    documentType: ['', [Validators.required]],
    documentNumber: ['', [Validators.required, Validators.maxLength(20)]],
    fullName: ['', [Validators.required]],
    phoneNumber: ['', [Validators.required]],
    email: ['', [Validators.email]],
    address: [''],
    rolesIds: [[], [Validators.required]],
    resolutions: this.fb.array([])
  });

  get resolutions(): FormArray {
    return this.form.get('resolutions') as FormArray;
  }

  addResolution() {
    this.resolutions.push(
      this.fb.group({
        id: [null],
        code: ['', Validators.required],
        startDate: ['', Validators.required],
        expirationDate: ['', Validators.required],
        description: [''],
        isActive: [true],
        products: [[], Validators.required]
      })
    );
  }

  removeResolution(index: number) {
    this.resolutions.removeAt(index);
  }

  onSend() {
    if (this.form.valid) {

      this.restService.postRequest("/thirdparty", this.form.value).subscribe({
        next: (objData) => {
          this.alertService.infoMixin.fire({
            icon: 'success',
            title: "Ingreso registrado exitosamente",
          });
          // this.dialogRef.close();
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
    this.getAllProducts();

    if (this.data.mode === "create") {
      this.restService.getRequest("/configparams/thirdParty").subscribe({
        next: (objData) => {
          this.thirdPartyTypes = objData.data.roles;
          this.documentTypes = objData.data.documentTypes;
        },
        error: (error) => {
          this.alertService.infoMixin.fire({
            icon: 'error',
            title: error.error.message,
          });
        },
        complete: () => { return },
      });
    } else {

      this.restService.getRequest("/thirdparty/andparams/" + this.data.data?.id)
        .subscribe({
          next: (objData) => {
            this.thirdPartyTypes = objData.data.roles;
            this.documentTypes = objData.data.documentTypes;
            this.thirdPartySearched = objData.data.thirdParty;


            if (this.data.mode === "edit") {
              this.title.set("Editar tercero");
              this.form.patchValue({
                id: this.thirdPartySearched?.id,
                documentType: this.thirdPartySearched?.documentType,
                documentNumber: this.thirdPartySearched?.documentNumber,
                fullName: this.thirdPartySearched?.fullName,
                phoneNumber: this.thirdPartySearched?.phoneNumber,
                email: this.thirdPartySearched?.email,
                address: this.thirdPartySearched?.address,
                rolesIds: Array.from(this.thirdPartySearched?.roles || []).map(role => role.id) || []
              });

              console.log(this.thirdPartySearched.roles);
              if (this.thirdPartySearched?.resolutions) {
                this.resolutions.clear();
                this.thirdPartySearched.resolutions.forEach(res => {
                  this.resolutions.push(
                    this.fb.group({
                      id: [res.id],
                      code: [res.code, Validators.required],
                      startDate: [res.startDate, Validators.required],
                      expirationDate: [res.expirationDate, Validators.required],
                      description: [res.description],
                      isActive: [res.isActive],
                      products: [res.products]
                    })
                  );
                });
              }
            } else {
              this.title.set("Informacion del tercero");
            }
          },
          error: (error) => {
            this.alertService.infoMixin.fire({
              icon: 'error',
              title: error.error.message,
            });
          },
          complete: () => { return },
        });
    }
  }

  getAllProducts() {
    this.restService.getRequest('/products', { page: 0, size: 1000 }).subscribe({
      next: (res) => {
        if (res.pageable && res.pageable.content) {
          this.productsList = res.pageable.content;
        } else if (res.data && res.data.content) {
          this.productsList = res.data.content;
        } else if (res.data) {
          this.productsList = res.data;
        } else {
          this.productsList = Array.isArray(res) ? res : [];
        }
      }
    });
  }
}
