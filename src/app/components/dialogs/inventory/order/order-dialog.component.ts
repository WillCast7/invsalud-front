import { Component, inject, Inject, signal, type OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { RestApiService } from '../../../../services/rest-api.service';
import { AlertService } from '../../../../services/alerts.service';
import { ProductInterface } from '../../../../models/inventory/product-interface';
import { ThirdPartyInterface } from '../../../../models/inventory/thirdparty-interface';

@Component({
  selector: 'app-order-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatAutocompleteModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './order-dialog.component.html'
})
export class OrderDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<OrderDialogComponent>);
  private restService = inject(RestApiService);
  private alertService = inject(AlertService);

  title = signal('Crear Cotización');
  isPublicHealth = false;
  mode: 'create' | 'edit' | 'view' = 'create';

  mainForm!: FormGroup;
  suppliers: ThirdPartyInterface[] = [];
  authorizedProducts: ProductInterface[] = [];

  constructor(@Inject(MAT_DIALOG_DATA) public data: { mode: string, type: string, data?: any }) {
    this.isPublicHealth = this.data.type === 'public';
    this.mode = this.data.mode as any;
    
    if (this.mode === 'create') {
      this.title.set(this.isPublicHealth ? 'Crear Cotización (Salud Pública)' : 'Crear Cotización (Control Especial)');
    } else if (this.mode === 'edit') {
      this.title.set('Editar Cotización');
    } else {
      this.title.set('Ver Cotización');
    }
  }

  ngOnInit() {
    this.initForm();
    this.loadSuppliers();
    this.setupTotalCalculation();
    this.setupThirdPartyListener();

    if ((this.mode === 'edit' || this.mode === 'view') && this.data.data) {
       this.loadDataForEditAndView(this.data.data);
       if (this.mode === 'view') {
           this.mainForm.disable();
       }
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
    // Al cambiar el tercero, cargamos sus productos permitidos y borramos la tabla
    this.mainForm.get('thirdParty')?.valueChanges.subscribe(supplier => {
       if (!supplier) {
         this.authorizedProducts = [];
         this.details.clear();
         return;
       }
       
       // Si estamos en modo view y ya se hizo set del tercero no queremos borrar los details accidentalmente
       // Así que validamos si el cambio viene por interfaz estando activo
       if (this.mode === 'view') return;

       // Limpiar detalles actuales
       this.details.clear();
       this.authorizedProducts = [];

       const thirdPartyId = supplier.id || supplier;
       this.loadAuthorizedProducts(thirdPartyId);
    });
  }

  loadAuthorizedProducts(thirdPartyId: number | string) {
    // LLamada al backend para obtener productos autorizados por resolución
    this.restService.getRequest('/resolutions/productlist/' + thirdPartyId).subscribe({
      next: (res) => {
        // Asumiendo que la respuesta es un array de productos o contiene 'data' con el array
        let products: ProductInterface[] = res.data || res;
        if (!Array.isArray(products)) products = [];

        // Filtramos según el tipo actual (Salud Pública o Control Especial)
        // A menos que las resoluciones ya traigan esto filtrado, es mejor asegurarse frontend
        this.authorizedProducts = products.filter(p => !!p.isPublicHealth === this.isPublicHealth);
      },
      error: (err) => {
        this.alertService.infoMixin.fire({
          icon: 'error',
          title: 'Error al cargar productos habilitados del tercero'
        });
      }
    });
  }

  addDetail() {
    if (!this.mainForm.get('thirdParty')?.value) {
       this.alertService.infoMixin.fire({
          icon: 'warning',
          title: 'Debe seleccionar un cliente/tercero primero.'
       });
       return;
    }

    const detailGroup = this.fb.group({
      product: [null, Validators.required],
      priceUnit: [this.isPublicHealth ? 0 : '', this.isPublicHealth ? [] : [Validators.required, Validators.min(0)]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      total: [0]
    });
    this.details.push(detailGroup);
  }

  removeDetail(index: number) {
    this.details.removeAt(index);
  }

  setupTotalCalculation() {
    this.mainForm.valueChanges.subscribe(() => {
      if (this.isPublicHealth) return;
      
      const detailsArray = this.details;
      for (let i = 0; i < detailsArray.length; i++) {
        const group = detailsArray.at(i) as FormGroup;
        const q = group.get('quantity')?.value || 0;
        const p = group.get('priceUnit')?.value || 0;
        const total = q * p;
        if (group.get('total')?.value !== total) {
          group.get('total')?.setValue(total, { emitEvent: false });
        }
      }
    });
  }

  get grandTotal() {
    if (this.isPublicHealth) return 0;
    return this.details.controls.reduce((sum, control) => {
      return sum + (control.get('total')?.value || 0);
    }, 0);
  }

  loadSuppliers() {
    this.restService.getRequest('/thirdparty', { page: 0, size: 1000 }).subscribe({
      next: (res) => {
        this.suppliers = res.pageable?.content || res.data?.content || res.data || [];
        
        // Match existing supplier if patching form
        if (this.mode !== 'create' && this.data.data?.thirdParty) {
            const tpData = this.data.data.thirdParty as any;
            const tpId = typeof tpData === 'object' ? tpData.id : tpData;
            const matchedSupplier = this.suppliers.find(s => s.id === tpId);
            if (matchedSupplier) {
                this.mainForm.get('thirdParty')?.setValue(matchedSupplier, { emitEvent: false });
                this.loadAuthorizedProducts(tpId);
            }
        }
      }
    });
  }

  loadDataForEditAndView(order: any) {
    // Se reconstruye el FormArray con base en orderItems que traiga el order.
    // Esto asume que el objeto traído tiene una estructura parecida.
    if (order.orderItems && Array.isArray(order.orderItems)) {
        order.orderItems.forEach((item: any) => {
            const detailGroup = this.fb.group({
              product: [item.product, Validators.required],
              priceUnit: [item.priceUnit || 0, this.isPublicHealth ? [] : [Validators.required, Validators.min(0)]],
              quantity: [item.quantity || 1, [Validators.required, Validators.min(1)]],
              total: [item.total || 0]
            });
            this.details.push(detailGroup);
        });
    }
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
          title: 'Debe agregar al menos un medicamento a la cotización.',
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
    const payload = {
      thirdParty: value.thirdParty?.id?.toString() || value.thirdParty, 
      type: this.isPublicHealth ? 'public' : 'special',
      total: this.grandTotal,
      orderItems: value.details.map((d: any) => ({
        product: d.product?.id?.toString() || d.product,
        priceUnit: this.isPublicHealth ? 0 : d.priceUnit,
        quantity: d.quantity,
        total: d.total
      }))
    };

    const url = this.mode === 'edit' ? `/orders/${this.data.data.id}` : '/orders';
    const request = this.mode === 'edit' ? this.restService.putRequest(url, payload) : this.restService.postRequest(url, payload);

    request.subscribe({
      next: (res) => {
        this.alertService.infoMixin.fire({
          icon: 'success',
          title: 'Cotización guardada correctamente'
        });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.alertService.infoMixin.fire({
          icon: 'error',
          title: err.error?.message || 'Error al guardar la cotización'
        });
      }
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
