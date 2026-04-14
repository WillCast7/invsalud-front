import { Component, inject, Inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CommonModule } from '@angular/common';

import { ProductInterface } from '../../../../models/inventory/product-interface';
import { RestApiService } from '../../../../services/rest-api.service';
import { AlertService } from '../../../../services/alerts.service';
import { ConfigparamsInterface } from '../../../../models/configparams-interface';

@Component({
  selector: 'app-management-product-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatSlideToggleModule,
    CommonModule
  ],
  templateUrl: './product-dialog.component.html',
  styleUrl: './product-dialog.component.css'
})
export class ProductDialogComponent {
  private dialogRef = inject(MatDialogRef<ProductDialogComponent>);
  private restService = inject(RestApiService);
  private alertService = inject(AlertService);
  units = ["unidad", "mililitro", "gramo", "miligramo", "litro", "kilogramo"];
  title = signal('Crear Medicamento');
  pharmaceuticalForms: ConfigparamsInterface[] = [];

  productTypes = [
    { value: 'CONTROL_ESPECIAL', label: 'Control Especial y Monopolio del Estado' },
    { value: 'SALUD_PUBLICA', label: 'Salud Pública' },
    { value: 'RECETARIO', label: 'Recetario' }
  ];

  productForm: FormGroup = new FormGroup({
    id: new FormControl(null),
    name: new FormControl('', Validators.required),
    code: new FormControl('', Validators.required),
    concentration: new FormControl(''),
    presentation: new FormControl(''),
    pharmaceuticalForm: new FormControl(''),
    details: new FormControl(''),
    isPublicHealth: new FormControl(false),
    isActive: new FormControl(true)
  });

  productSearched: ProductInterface | undefined;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { mode: string, data: ProductInterface | undefined }
  ) {
    this.getData();
  }

  onEdit() {
    this.data.mode = 'edit';
    this.getData();
  }


  getData() {

    if (this.data.mode === "create") {
      this.restService.getRequest("/configparams/parent/pharmaceuticalForm").subscribe({
        next: (objData) => {
          this.pharmaceuticalForms = objData.data;
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

      this.restService.getRequest("/products/" + this.data.data?.id)
        .subscribe({
          next: (objData) => {
            this.pharmaceuticalForms = objData.data.configParams;
            this.productSearched = objData.data.product;


            if (this.data.mode === "edit") {
              this.data.mode = 'edit';
              this.title.set('Editar Medicamento');
              this.productForm.patchValue({
                id: this.productSearched?.id,
                name: this.productSearched?.name,
                code: this.productSearched?.code,
                type: this.productSearched?.type,
                concentration: this.productSearched?.concentration,
                presentation: this.productSearched?.presentation,
                pharmaceuticalForm: this.productSearched?.pharmaceuticalForm,
                details: this.productSearched?.details,
                isPublicHealth: this.productSearched?.isPublicHealth,
                isActive: this.productSearched?.isActive
              });
            } else if (this.data.mode === "view") {
              this.title.set("Informacion del producto");
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


  onSave() {
    if (this.productForm.valid) {
      this.restService.postRequest('/products', this.productForm.value).subscribe({
        next: (objData) => {
          this.alertService.infoMixin.fire({
            icon: 'success',
            title: this.productSearched ? 'Medicamento actualizado exitosamente' : 'Medicamento registrado exitosamente',
          });
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.alertService.infoMixin.fire({
            icon: 'error',
            title: error.error?.message || 'Ocurrió un error',
          });
        }
      });
    } else {
      this.alertService.infoMixin.fire({
        icon: 'warning',
        title: 'Por favor complete todos los campos requeridos.',
      });
      this.productForm.markAllAsTouched();
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
