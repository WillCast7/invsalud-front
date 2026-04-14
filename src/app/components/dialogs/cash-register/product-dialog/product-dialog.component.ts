import { Component, inject, Inject, signal  } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import {MatTabsModule} from '@angular/material/tabs';
import { MatOption, MatSelect, MatSelectModule } from '@angular/material/select';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { RestApiService } from '../../../../services/rest-api.service';
import { AlertService } from '../../../../services/alerts.service';
import { ConfigparamsInterface } from '../../../../models/configparams-interface';
import { ThirdpartyRoleInterface } from '../../../../models/inventory/thirdparty-role-interface';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import { ProductInterface } from '../../../../models/inventory/product-interface';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {  NgxMaskDirective, provideNgxMask } from 'ngx-mask';

interface Food {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-product-dialog',
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
    MatButtonToggleModule,
    MatCheckboxModule,
    MatDividerModule,
    MatChipsModule,
    CommonModule,
    MatSlideToggleModule, 
    MatSelectModule
  ],
  providers: [provideNgxMask()],
 
  templateUrl: './product-dialog.component.html',
  styleUrl: './product-dialog.component.css'
})

export class ProductDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ProductDialogComponent>);
  thirdPartyTypes : ThirdpartyRoleInterface[] = [];
  documentTypes : ConfigparamsInterface[] = [];
  productSearched : ProductInterface | undefined;
  title = signal("Crear producto");
  productTypes = [
    { value: 'INCOME', label: 'Ingreso' },
    { value: 'EXPENSE', label: 'Egreso' }
  ];
  productForm: FormGroup = new FormGroup({
      id: new FormControl(null),
      name: new FormControl('', Validators.required),
      basePrice: new FormControl(0, [
        Validators.required,
        Validators.pattern(/^\d+(\.\d+)?$/)
      ]),
      description: new FormControl('', Validators.required),
      type: new FormControl('', Validators.required),
      active: new FormControl(true),
    });

  constructor(
      private readonly formBuilder: FormBuilder,
      private restService: RestApiService,
      private alertService: AlertService,
      @Inject(MAT_DIALOG_DATA) public data: {mode: string, data: ProductInterface | undefined}
  ) {
    console.log(data)
    if(this.data.mode === "edit"){
      this.onEdit();
    }
  }


  setForm(){
    this.productForm.patchValue({
      id: this.data.data?.id,
      name: this.data.data?.name
    })
  }

  onEdit(){
    this.data.mode = "edit"
    this.title.set("Editar producto");
    this.setForm()
  }

  onSave(){
    if (this.productForm.valid) {

      this.restService.postRequest("/products", this.productForm.value).subscribe({
          next: (objData) => {
            this.alertService.infoMixin.fire({
              icon: 'success',
              title: "Producto registrado exitosamente",
            });
            this.dialogRef.close();
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

}
