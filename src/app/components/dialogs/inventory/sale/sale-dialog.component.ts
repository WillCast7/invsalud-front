import { Component, inject, Inject, signal, type OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RestApiService } from '../../../../services/rest-api.service';
import { AlertService } from '../../../../services/alerts.service';
import { ThirdPartyInterface } from '../../../../models/inventory/thirdparty-interface';
import { PrescriptionInventoryInterface } from '../../../../models/inventory/prescription-inventory';

@Component({
  selector: 'app-sale-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './sale-dialog.component.html'
})
export class SaleDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<SaleDialogComponent>);
  private fb = inject(FormBuilder);
  private restService = inject(RestApiService);
  private alertService = inject(AlertService);

  title = signal('Detalles de Venta');
  mode: 'create' | 'view' = 'view';
  isPublicHealth = false;

  mainForm!: FormGroup;
  suppliers: ThirdPartyInterface[] = [];
  authorizedProducts: PrescriptionInventoryInterface[] = [];

  constructor(@Inject(MAT_DIALOG_DATA) public data: { mode: string, type: string, data?: any }) {
    this.mode = this.data.mode as any;
    this.isPublicHealth = this.data.type === 'public';
    if (this.mode === 'create') {
      this.title.set('Crear Salida (Salud Pública)');
    }
  }

  ngOnInit() {
    if (this.mode === 'create') {
      this.initForm();
      this.loadSuppliers();
      this.setupThirdPartyListener();
    } else {
      this.loadSaleDetails();
    }
  }

  initForm() {
    this.mainForm = this.fb.group({
      thirdParty: [null, Validators.required],
      details: this.fb.array([])
    });
  }

  get details() {
    return this.mainForm.get('details') as FormArray;
  }

  setupThirdPartyListener() {
    this.mainForm.get('thirdParty')?.valueChanges.subscribe(supplier => {
      if (!supplier) {
        this.authorizedProducts = [];
        this.details.clear();
        return;
      }
      this.details.clear();
      this.authorizedProducts = [];
      const thirdPartyId = supplier.id || supplier;
      this.loadAuthorizedProducts(thirdPartyId);
    });
  }

  loadAuthorizedProducts(thirdPartyId: number | string) {
    this.restService.getRequest('/products/byresolution/' + thirdPartyId).subscribe({
      next: (res) => {
        let products: PrescriptionInventoryInterface[] = res.data || res;
        if (!Array.isArray(products)) products = [];
        // Only public health products
        this.authorizedProducts = products.filter(p => !!p.product.isPublicHealth === true);
      },
      error: (err) => {
        this.alertService.infoMixin.fire({
          icon: 'error',
          title: err.message || 'Error al cargar productos habilitados'
        });
      }
    });
  }

  addDetail() {
    if (!this.mainForm.get('thirdParty')?.value) {
      this.alertService.infoMixin.fire({
        icon: 'warning',
        title: 'Debe seleccionar un receptor (tercero) primero.'
      });
      return;
    }

    const group = this.fb.group({
      product: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
    });

    group.get('product')?.valueChanges.subscribe((product: PrescriptionInventoryInterface | null) => {
      if (product) {
        const quantityCtrl = group.get('quantity');
        quantityCtrl?.setValidators([Validators.required, Validators.min(1), Validators.max(product.availableUnits)]);
        quantityCtrl?.updateValueAndValidity();
      }
    });

    this.details.push(group);
  }

  removeDetail(index: number) {
    this.details.removeAt(index);
  }

  loadSuppliers() {
    this.restService.getRequest('/thirdparty', { page: 0, size: 1000 }).subscribe({
      next: (res) => {
        this.suppliers = res.pageable?.content || res.data?.content || res.data || [];
      }
    });
  }

  loadSaleDetails() {
    if (this.data.data?.id) {
      this.restService.getRequest('/orders/' + this.data.data.id).subscribe({
        next: (orderRes) => {
          this.data.data = orderRes.data || orderRes;
        },
        error: (err) => {
          this.alertService.infoMixin.fire({
            icon: 'error',
            title: 'Error al cargar los detalles de la venta'
          });
        }
      });
    }
  }

  compareWithId(o1: any, o2: any): boolean {
    return o1 && o2 ? o1.id === o2.id : o1 === o2;
  }

  onSubmit() {
    if (this.mainForm.invalid || this.details.length === 0) {
      this.mainForm.markAllAsTouched();
      this.alertService.infoMixin.fire({
        icon: 'warning',
        title: this.details.length === 0 ? 'Debe agregar al menos un medicamento.' : 'Complete todos los campos requeridos.'
      });
      return;
    }

    const value = this.mainForm.value;
    const payload = {
      thirdParty: value.thirdParty?.id?.toString() || value.thirdParty,
      type: 'public',
      total: 0,
      items: value.details.map((d: any) => ({
        product: d.product?.id?.toString() || d.product?.id || null,
        priceUnit: 0,
        units: d.quantity,
        priceTotal: 0
      }))
    };

    this.restService.postRequest('/sales', payload).subscribe({
      next: (res) => {
        this.dialogRef.close({ success: true, message: 'Salida creada con éxito' });
      },
      error: (err) => {
        this.alertService.infoMixin.fire({
          icon: 'error',
          title: err.error?.message || 'Error al guardar la salida'
        });
      }
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
