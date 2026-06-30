import { Component, inject, Inject, signal, type OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators, FormGroupDirective, NgForm } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_NATIVE_DATE_FORMATS, MatNativeDateModule, NativeDateAdapter, ErrorStateMatcher } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { RestApiService } from '../../../../services/rest-api.service';
import { AlertService } from '../../../../services/alerts.service';
import { ProductInterface } from '../../../../models/inventory/product-interface';
import { BatchInterface } from '../../../../models/inventory/batch-interface';
import { ThirdPartyInterface } from '../../../../models/inventory/thirdparty-interface';
import { PurchaseExample, PurchaseInterface } from '../../../../models/inventory/purchase-interface';
import { greaterThanValidator } from '../../../../shared/validators/custom-validators';
import { ProductDialogComponent } from '../../management/product-dialog/product-dialog.component';
import { BatchDialogComponent } from '../../management/batch-dialog/batch-dialog.component';
import { HttpErrorResponse } from '@angular/common/http';

export class ParentErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form ? form.submitted : false;
    const controlInvalid = !!(control && control.invalid && (control.dirty || control.touched));
    const parentInvalid = !!(control && control.parent && control.parent.invalid && control.parent.hasError('priceLow') && (control.dirty || control.touched));

    return controlInvalid || parentInvalid || (isSubmitted && parentInvalid);
  }
}

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
    ReactiveFormsModule,
    NgxMaskDirective
  ],
  providers: [
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS },
    provideNgxMask()
  ],
  templateUrl: './purchasing-dialog.component.html',
  styleUrl: './purchasing-dialog.component.css'
})
export class PurchasingDialogComponent implements OnInit {
  today: Date = new Date(new Date().setHours(0, 0, 0, 0));
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<PurchasingDialogComponent>);
  private dialog = inject(MatDialog);
  private restService = inject(RestApiService);
  private alertService = inject(AlertService);

  title = signal('Registrar Compra / Ingreso');
  isPublicHealth = false;
  objData: PurchaseInterface = PurchaseExample;
  parentErrorMatcher = new ParentErrorStateMatcher();

  suppliersFinded: ThirdPartyInterface[] = [];
  productsFinded: { [key: number]: ProductInterface[] } = {};
  batchesFinded: { [key: number]: BatchInterface[] } = {};

  documentTypes = [
    { name: 'Cédula de Ciudadanía', shortname: 'CC' },
    { name: 'Tarjeta de Identidad', shortname: 'TI' },
    { name: 'Cédula de Extranjería', shortname: 'CE' },
    { name: 'Pasaporte', shortname: 'PA' },
    { name: 'NIT', shortname: 'NIT' }
  ];

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
      providerData: this.fb.group({
        id: [null],
        documentType: ['NIT', Validators.required],
        documentNumber: ['', Validators.required],
        fullName: ['', Validators.required],
        phoneNumber: ['', Validators.maxLength(10)],
        email: [''],
        address: ['']
      }),
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
      priceUnit: [0, this.isPublicHealth ? [] : [Validators.required, Validators.min(0)]],
      units: [1, [Validators.required, Validators.min(1)]],
      sellPrice: [0, this.isPublicHealth ? [] : [Validators.required, Validators.min(0)]],
      expirationDate: [null, Validators.required],
      priceTotal: [0]
    }, {
      // Aquí lo aplicas de forma generalizada
      validators: this.isPublicHealth ? [] : [greaterThanValidator('priceUnit', 'sellPrice', 'priceLow')]
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

  findSuppliers() {
    const documentNumber = this.mainForm.get('providerData.documentNumber')?.value;
    if (!documentNumber || String(documentNumber).length < 3) {
      this.suppliersFinded = [];
      return;
    }
    this.restService.getRequest('/thirdparty/' + documentNumber).subscribe({
      next: (res) => {
        this.suppliersFinded = res.data || [];
      },
      error: () => {
        // Fallback to local filter if search endpoint is not available
        this.suppliersFinded = this.suppliers.filter(s =>
          String(s.documentNumber).includes(String(documentNumber)) || s.fullName?.toLowerCase().includes(String(documentNumber).toLowerCase())
        );
      }
    });
  }

  onSupplierSelected(event: any) {
    const selectedDoc = event.option.value;
    const supplier = this.suppliersFinded.find(s => String(s.documentNumber) === String(selectedDoc));
    if (supplier) {
      this.mainForm.get('providerData')?.patchValue({
        id: supplier.id,
        documentType: supplier.documentType,
        documentNumber: supplier.documentNumber,
        fullName: supplier.fullName,
        phoneNumber: supplier.phoneNumber,
        email: supplier.email,
        address: supplier.address
      });
    }
  }

  displayProduct(product: ProductInterface): string {
    return product ? `${product.name} (${product.code})` : '';
  }

  displayBatch(batch: BatchInterface): string {
    return batch ? `${batch.code}` : '';
  }

  findProducts(index: number) {
    let searchValue = this.details.at(index).get('product')?.value;
    if (typeof searchValue !== 'string') {
      searchValue = searchValue?.name || searchValue?.code || '';
    }

    if (!searchValue || searchValue.length < 2) {
      this.productsFinded[index] = [];
      return;
    }

    this.restService.getRequest('/products', { page: 0, size: 10, searchValue: searchValue }).subscribe({
      next: (objData) => {
        let items = objData.pageable?.content || [];
        items = items.filter((p: any) => p.isPublicHealth === this.isPublicHealth);
        this.productsFinded[index] = items;
      }
    });
  }

  findBatches(index: number) {
    let searchValue = this.details.at(index).get('batch')?.value;
    if (typeof searchValue !== 'string') {
      searchValue = searchValue?.code || '';
    }

    if (!searchValue || searchValue.length < 2) {
      this.batchesFinded[index] = [];
      return;
    }

    this.restService.getRequest('/batches', { page: 0, size: 10, searchValue: searchValue }).subscribe({
      next: (objData) => {
        this.batchesFinded[index] = objData.pageable?.content || [];
      }
    });
  }

  onProductSelected(event: any, index: number) {
    // We could do something here if needed when product is selected
  }

  onBatchSelected(event: any, index: number) {
    // We could do something here if needed when batch is selected
  }

  onSubmit() {
    const detailsArray = this.details.controls;
    for (let i = 0; i < detailsArray.length; i++) {
      const product = detailsArray[i].get('product')?.value;
      const batch = detailsArray[i].get('batch')?.value;

      const isProductString = typeof product === 'string' && product.trim() !== '';
      const isBatchString = typeof batch === 'string' && batch.trim() !== '';

      if (isProductString || isBatchString) {
        this.alertService.reCallMixin.fire({
          title: 'Atención',
          text: `No se ha seleccionado un ${isProductString ? 'medicamento' : 'lote'} en la fila ${i + 1}. ¿Desea crear uno nuevo ${isProductString ? 'medicamento' : 'lote'}?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, crear',
          cancelButtonText: 'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            if (isProductString) {
              this.dialog.open(ProductDialogComponent, {
                width: '90vh',
                data: { mode: 'create' }
              });
            } else {
              this.dialog.open(BatchDialogComponent, {
                width: '600px',
                data: { mode: 'create' }
              });
            }
          }
        });
        return;
      }

      console.log("Entro aqui")

      console.log(this.isPublicHealth)

      if (!this.isPublicHealth) {
        if (detailsArray[i].get('priceUnit')?.value < 0 || detailsArray[i].get('sellPrice')?.value < 0) {
          this.alertService.reCallMixin.fire({
            title: 'Atención',
            text: `El precio de compra o venta en la fila ${i + 1} no puede ser negativo.`,
            icon: 'warning'
          });
          return;
        }

        if (detailsArray[i].get('sellPrice')?.value < detailsArray[i].get('priceUnit')?.value) {
          this.alertService.reCallMixin.fire({
            title: 'Atención',
            text: `El precio de venta debe superar el costo de compra en la fila ${i + 1}.`,
            icon: 'warning'
          });
          return;
        }
      }

    }


    if (this.mainForm.invalid || this.details.length === 0) {
      this.mainForm.markAllAsTouched();
      if (this.details.length === 0) {
        this.alertService.infoMixin.fire({
          icon: 'warning',
          title: 'Debe agregar al menos un producto a la compra.',
        });
      }

      console.log("Entro aqui 4")
      console.log(this.mainForm.getError)
      console.log(this.mainForm)
      if (this.mainForm.get('providerData')?.invalid) {
        this.alertService.infoMixin.fire({
          icon: 'warning',
          title: 'Por favor complete todos los campos requeridos correctamente.',
        });
      }

      return;
    }

    const value = this.mainForm.value;

    const newSupplier: ThirdPartyInterface = {
      ...value.providerData,
      rolesIds: [2] // Assuming 2 is Provider, we should ideally fetch or know it, but setting fallback
    };

    this.savePurchase(newSupplier);

  }

  savePurchase(newSupplier: ThirdPartyInterface) {
    const value = this.mainForm.value;
    const typeLabel = this.isPublicHealth ? 'public' : 'special';

    console.log("Entro aqui 2")

    const payload = {
      thirdParty: newSupplier,
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
        this.dialogRef.close({
          success: true,
          message: 'Guardado correctamente'
        });
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
    this.dialogRef.close({
      success: false,
      message: 'Operación cancelada'
    });
  }

  onPrint(row: any) {
    this.restService.fileGetRequest("/report/purchase/" + row.id).subscribe({
      next: (blob) => {
        const fileURL = URL.createObjectURL(blob);
        window.open(fileURL, '_blank');
      },
      error: async (error: HttpErrorResponse) => {
        console.log(error);

        let mensajeMostrar = "Ocurrió un error inesperado";

        // Verificamos si el error viene dentro de un Blob
        if (error.error instanceof Blob) {
          try {
            // Convertimos el Blob a texto plano
            const text = await error.error.text();
            // Parseamos el texto a JSON
            const errorJson = JSON.parse(text);
            // Extraemos el mensaje
            mensajeMostrar = errorJson.message || mensajeMostrar;
          } catch (e) {
            console.error("No se pudo parsear el error del Blob", e);
          }
        } else if (error.error?.message) {
          // Si por alguna razón ya viene parseado
          mensajeMostrar = error.error.message;
        }

        this.alertService.infoMixin.fire({
          icon: 'error',
          title: mensajeMostrar,
        });
      }
    });
  }
}
