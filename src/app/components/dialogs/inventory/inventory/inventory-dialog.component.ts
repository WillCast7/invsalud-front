import { Component, inject, Inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_NATIVE_DATE_FORMATS, MatNativeDateModule, NativeDateAdapter } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { RestApiService } from '../../../../services/rest-api.service';
import { AlertService } from '../../../../services/alerts.service';
import { PrescriptionInventoryInterface, PrescriptionInventoryExample } from '../../../../models/inventory/prescription-inventory';
import { ProductInterface } from '../../../../models/inventory/product-interface';
import { BatchInterface } from '../../../../models/inventory/batch-interface';

@Component({
  selector: 'app-inventory-dialog',
  imports: [
    MatDialogModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatDividerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    CommonModule
  ],
  providers: [
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS }
  ],
  templateUrl: './inventory-dialog.component.html',
  styleUrl: './inventory-dialog.component.css'
})
export class InventoryDialogComponent {
  private dialogRef = inject(MatDialogRef<InventoryDialogComponent>);
  inventory: PrescriptionInventoryInterface = PrescriptionInventoryExample;
  title = signal("Crear inventario");
  inventoryForm!: FormGroup;
  products = signal<ProductInterface[]>([]);
  batches = signal<BatchInterface[]>([]);

  constructor(
    private readonly formBuilder: FormBuilder,
    private restService: RestApiService,
    private alertService: AlertService,
    @Inject(MAT_DIALOG_DATA) public data: { mode: string, data: any | undefined }
  ) {
    this.getData();
  }

  initializeForm() {
    this.inventoryForm = new FormGroup({
      id: new FormControl(''),
      product: new FormControl(null, Validators.required),
      batch: new FormControl(null, Validators.required),
      purchasePrice: new FormControl(0, [Validators.required, Validators.min(0)]),
      salePrice: new FormControl(0, [Validators.required, Validators.min(0)]),
      totalUnits: new FormControl(1, [Validators.required, Validators.min(1)]),
      availableUnits: new FormControl(0),
      expirationDate: new FormControl('', Validators.required),
      isActive: new FormControl(true)
    });
  }

  onSubmit() {
    if (this.inventoryForm.valid) {
      const payload = this.inventoryForm.value;
      const url = "/prescription-inventory";

      const request$ = this.data.mode === 'create'
        ? this.restService.postRequest(url, payload)
        : this.restService.putRequest(url + "/" + payload.id, payload);

      request$.subscribe({
        next: (objData) => {
          this.alertService.infoMixin.fire({
            icon: 'success',
            title: this.data.mode === 'create' ? "Registrado exitosamente" : "Actualizado exitosamente",
          });
          this.dialogRef.close(objData.data);
        },
        error: (error) => {
          this.alertService.infoMixin.fire({
            icon: 'error',
            title: error.error?.message || "Ocurrió un error",
          });
        }
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
    this.initializeForm();

    this.restService.getRequest("/products", { page: 0, size: 1000, searchValue: '' }).subscribe({
      next: (res) => this.products.set(res.pageable?.content || [])
    });
    this.restService.getRequest("/batches", { page: 0, size: 1000, searchValue: '' }).subscribe({
      next: (res) => this.batches.set(res.pageable?.content || [])
    });

    if (this.data.mode === "create") {
      this.title.set("Crear inventario");
    } else {
      this.restService.getRequest("/prescription-inventory/" + this.data.data?.id).subscribe({
        next: (objData) => {
          this.inventory = objData.data || objData;

          if (this.data.mode === "edit") {
            this.title.set("Editar inventario");
            this.inventoryForm.patchValue({
              id: this.inventory.id,
              product: this.inventory.product,
              batch: this.inventory.batch,
              purchasePrice: this.inventory.purchasePrice,
              salePrice: this.inventory.salePrice,
              totalUnits: this.inventory.totalUnits,
              availableUnits: this.inventory.availableUnits,
              expirationDate: this.inventory.expirationDate,
              isActive: this.inventory.isActive
            });
          } else {
            this.title.set("Detalles del medicamento");
          }
        },
        error: (error) => {
          this.alertService.infoMixin.fire({
            icon: 'error',
            title: error.error?.message || "Ocurrió un error",
          });
        }
      });
    }
  }

  compareObjects(o1: any, o2: any): boolean {
    return o1 && o2 ? o1.id === o2.id : o1 === o2;
  }
}
