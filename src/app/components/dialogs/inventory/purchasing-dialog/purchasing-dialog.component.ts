import { Component, inject, Inject, signal, type OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_NATIVE_DATE_FORMATS, MatNativeDateModule, NativeDateAdapter } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { RestApiService } from '../../../../services/rest-api.service';
import { AlertService } from '../../../../services/alerts.service';
import { ProductInterface } from '../../../../models/inventory/product-interface';
import { BatchInterface } from '../../../../models/inventory/batch-interface';
import { ThirdPartyInterface } from '../../../../models/inventory/thirdparty-interface';
import { PurchaseExample, PurchaseInterface } from '../../../../models/inventory/purchase-interface';

@Component({
  selector: 'app-purchasing-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatAutocompleteModule,
    MatChipsModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS }
  ],
  templateUrl: './purchasing-dialog.component.html',
  styleUrl: './purchasing-dialog.component.css'
})
export class PurchasingDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<PurchasingDialogComponent>);
  private restService = inject(RestApiService);
  private alertService = inject(AlertService);

  title = signal('Registrar Compra / Ingreso');
  isPublicHealth = false;
  objData: PurchaseInterface = PurchaseExample;

  mainForm!: FormGroup;

  suppliers: ThirdPartyInterface[] = [];
  products: ProductInterface[] = [];
  batches: BatchInterface[] = [];

  constructor(@Inject(MAT_DIALOG_DATA) public data: { mode: string, type: string, data?: any }) {
    this.isPublicHealth = this.data.type === 'public';

    if (this.data.mode === 'view') {
      this.title.set(this.isPublicHealth ? 'Detalle de Ingreso (Salud Pública)' : 'Detalle de Compra (Control Especial)');
    } else if (this.isPublicHealth) {
      this.title.set('Registrar Ingreso (Salud Pública)');
    } else {
      this.title.set('Registrar Compra (Control Especial)');
    }
  }

  ngOnInit() {
    this.initForm();
    if (this.data.mode === 'view') {
      console.log("view")
      console.log(this.data.type)
      this.loadPurchaseDetails(this.data.data?.id);
    } else {
      this.loadData();
      this.setupTotalCalculation();
    }
  }

  loadPurchaseDetails(id: number) {
    if (!id) return;
    this.restService.getRequest(`/purchasing/${id}`).subscribe({
      next: (res) => {
        this.objData = res.data;
      },
      error: (err) => {
        this.alertService.infoMixin.fire({
          icon: 'error',
          title: err.error?.message || 'Error al cargar los datos de la compra'
        });
      }
    });
  }

  initForm() {
    this.mainForm = this.fb.group({
      thirdParty: [null, Validators.required],
      observations: [null],
      details: this.fb.array([])
    });
  }

  get details() {
    return this.mainForm.get('details') as FormArray;
  }

  addDetail() {
    const detailGroup = this.fb.group({
      product: [null, Validators.required],
      batch: [null, Validators.required],
      observations: [null],
      priceUnit: [this.isPublicHealth ? 0 : '', this.isPublicHealth ? [] : [Validators.required, Validators.min(0)]],
      units: [1, [Validators.required, Validators.min(1)]],
      sellPrice: [this.isPublicHealth ? 0 : '', this.isPublicHealth ? [] : [Validators.required, Validators.min(0)]],
      expirationDate: [null, Validators.required],
      priceTotal: [0]
    });
    this.details.push(detailGroup);
  }

  removeDetail(index: number) {
    this.details.removeAt(index);
  }

  setupTotalCalculation() {
    this.mainForm.valueChanges.subscribe(value => {
      if (this.isPublicHealth) return;

      const detailsArray = this.details;
      for (let i = 0; i < detailsArray.length; i++) {
        const group = detailsArray.at(i) as FormGroup;
        const q = group.get('units')?.value || 0;
        const p = group.get('priceUnit')?.value || 0;
        const priceTotal = q * p;
        if (group.get('priceTotal')?.value !== priceTotal) {
          group.get('priceTotal')?.setValue(priceTotal, { emitEvent: false });
        }
      }
    });
  }

  get grandTotal() {
    if (this.isPublicHealth) return 0;
    return this.details.controls.reduce((sum, control) => {
      return sum + (control.get('priceTotal')?.value || 0);
    }, 0);
  }

  loadData() {
    // Load suppliers
    this.restService.getRequest('/thirdparty', { page: 0, size: 1000 }).subscribe({
      next: (res) => {
        this.suppliers = res.pageable?.content || res.data?.content || res.data || [];
      }
    });

    // Load products
    this.restService.getRequest('/products', { page: 0, size: 1000 }).subscribe({
      next: (res) => {
        const allProducts = res.pageable?.content || res.data?.content || res.data || [];
        this.products = allProducts.filter((p: any) => p.isPublicHealth === this.isPublicHealth);
      }
    });

    // Load batches
    this.restService.getRequest('/batches', { page: 0, size: 1000 }).subscribe({
      next: (res) => {
        this.batches = res.pageable?.content || res.data?.content || res.data || [];
      }
    });
  }

  compareWithId(o1: any, o2: any): boolean {
    return o1 && o2 ? o1.id === o2.id : o1 === o2;
  }

  onSubmit() {
    if (this.mainForm.invalid || this.details.length === 0) {
      this.mainForm.markAllAsTouched();
      if (this.details.length === 0) {
        this.alertService.infoMixin.fire({
          icon: 'warning',
          title: 'Debe agregar al menos un producto a la compra.',
        });
      } else {
        this.alertService.infoMixin.fire({
          icon: 'warning',
          title: 'Por favor complete todos los campos requeridos correctamente.',
        });
      }
      return;
    }

    const value = this.mainForm.value;
    const typeLabel = this.isPublicHealth ? 'public' : 'special';

    const payload = {
      thirdParty: value.thirdParty?.id?.toString(),
      type: typeLabel,
      total: this.grandTotal,
      observations: value.observations,
      items: value.details.map((d: any) => ({
        product: d.product,
        batch: d.batch,
        priceUnit: this.isPublicHealth ? 0 : d.priceUnit,
        sellPrice: this.isPublicHealth ? 0 : d.sellPrice,
        units: d.units,
        expirationDate: d.expirationDate,
        priceTotal: d.priceTotal
      }))
    };

    const url = this.data.mode === 'edit' ? `/purchasing/${this.data.data.id}` : '/purchasing';
    const method = this.data.mode === 'edit' ? this.restService.putRequest(url, payload) : this.restService.postRequest(url, payload);

    method.subscribe({
      next: (res) => {
        this.alertService.infoMixin.fire({
          icon: 'success',
          title: 'Guardado correctamente'
        });
        //TODO: this.dialogRef.close(true);
      },
      error: (err) => {
        this.alertService.infoMixin.fire({
          icon: 'error',
          title: err.error?.message || 'Error al guardar'
        });
      }
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
