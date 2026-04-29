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
import { PrescriptionInventoryInterface } from '../../../../models/inventory/prescription-inventory';

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
  isRecipe = false;
  recipePrice = 0;
  mode: 'create' | 'edit' | 'view' = 'create';

  mainForm!: FormGroup;
  suppliers: ThirdPartyInterface[] = [];
  authorizedProducts: PrescriptionInventoryInterface[] = [];

  constructor(@Inject(MAT_DIALOG_DATA) public data: { mode: string, type: string, data?: any }) {
    this.isPublicHealth = this.data.type === 'public';
    this.isRecipe = this.data.type === 'recipe';
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

    if (this.isRecipe && this.mode === 'create') {
      this.initRecipeMode();
    }
  }

  initRecipeMode() {
    this.restService.getRequest('/recipes', { searchValue: '' }).subscribe({
      next: (res) => {
        const payload = res?.data || res;
        const recipeData = Array.isArray(payload) ? payload[0] : payload;
        if (recipeData) {
          this.recipePrice = recipeData.salePrice || 0;
          this.addDetail();
          const firstItem = this.details.at(0);
          if (firstItem) {
            firstItem.patchValue({
              priceUnit: this.recipePrice,
              product: {
                id: recipeData.id,
                product: { name: 'Venta de Recetarios', code: 'REC' }
              }
            });
          }
        }
      }
    });
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
    this.restService.getRequest('/products/byresolution/' + thirdPartyId).subscribe({
      next: (res) => {
        console.log("res");
        console.log(res);
        // Asumiendo que la respuesta es un array de productos o contiene 'data' con el array
        let products: PrescriptionInventoryInterface[] = res.data || res;
        if (!Array.isArray(products)) products = [];

        // Filtramos según el tipo actual (Salud Pública o Control Especial)
        // A menos que las resoluciones ya traigan esto filtrado, es mejor asegurarse frontend
        this.authorizedProducts = products.filter(p => !!p.product.isPublicHealth === this.isPublicHealth);
      },
      error: (err) => {
        this.alertService.infoMixin.fire({
          icon: 'error',
          title: err.message || 'Error al cargar productos habilitados'
        });
      }
    });
  }

  private createDetailGroup(item?: any): FormGroup {
    const group = this.fb.group({
      product: [item?.product || null, Validators.required],
      priceUnit: [item?.priceUnit || (this.isPublicHealth ? 0 : ''), this.isPublicHealth ? [] : [Validators.required, Validators.min(0)]],
      quantity: [item?.quantity || 1, [Validators.required, Validators.min(1)]],
      total: [item?.total || 0]
    });

    // Listener para actualizar el precio unitario cuando cambia el producto
    group.get('product')?.valueChanges.subscribe((product: PrescriptionInventoryInterface) => {
      if (product) {
        if (!this.isPublicHealth) {
          group.get('priceUnit')?.setValue(product.salePrice || 0);
        }

        // Actualizar el validador de máximo según disponibilidad
        const quantityCtrl = group.get('quantity');
        quantityCtrl?.setValidators([Validators.required, Validators.min(1), Validators.max(product.availableUnits)]);
        quantityCtrl?.updateValueAndValidity();
      }
    });

    return group;
  }

  addDetail() {
    if (!this.mainForm.get('thirdParty')?.value) {
      this.alertService.infoMixin.fire({
        icon: 'warning',
        title: 'Debe seleccionar un cliente/tercero primero.'
      });
      return;
    }

    this.details.push(this.createDetailGroup());
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
    // Siempre cargamos los terceros para el mat-select
    this.restService.getRequest('/thirdparty', { page: 0, size: 1000 }).subscribe({
      next: (res) => {
        this.suppliers = res.pageable?.content || res.data?.content || res.data || [];

        // Si estamos viendo, cargamos los detalles completos de la cotización
        if (this.mode === 'view' && this.data.data?.id) {
          this.restService.getRequest('/orders/' + this.data.data.id).subscribe({
            next: (orderRes) => {
              const order = orderRes.data || orderRes;
              // Actualizamos el objeto data con la información completa (incluyendo items e inventory)
              this.data.data = order;

              // Sincronizamos el tercero seleccionado
              const tpData = order.thirdParty;
              const tpId = typeof tpData === 'object' ? tpData.id : tpData;
              const matchedSupplier = this.suppliers.find(s => s.id === tpId);
              if (matchedSupplier) {
                this.mainForm.get('thirdParty')?.setValue(matchedSupplier, { emitEvent: false });
                this.loadAuthorizedProducts(tpId);
              }

              // Cargamos los items en el formulario
              this.loadDataForEditAndView(order);
            },
            error: (err) => {
              this.alertService.infoMixin.fire({
                icon: 'error',
                title: 'Error al cargar los detalles de la cotización'
              });
            }
          });
        }
      }
    });
  }

  loadDataForEditAndView(order: any) {
    if (order.items && Array.isArray(order.items)) {
      this.details.clear();
      order.items.forEach((item: any) => {
        this.details.push(this.createDetailGroup({
          product: item.inventory,
          priceUnit: item.priceUnit,
          quantity: item.units,
          total: item.priceTotal
        }));
      });
    }
  }

  compareWithId(o1: any, o2: any): boolean {
    return o1 && o2 ? o1.id === o2.id : o1 === o2;
  }

  onSell() {
    this.alertService.modal.fire({
      title: '¿Vender esta cotización?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3d5a80',
      cancelButtonColor: '#ac0505',
      confirmButtonText: 'Sí, vender',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.restService.postRequest('/orders/sell/' + this.data.data?.id, {}).subscribe({
          next: (res) => {
            this.dialogRef.close({ success: true, message: 'Venta realizada con éxito' });
          },
          error: (err) => {
            this.alertService.infoMixin.fire({
              icon: 'error',
              title: err.error?.message || 'Error al vender la cotización'
            });
          }
        });
      }
    });

  }

  onAbort() {
    this.alertService.modal.fire({
      title: '¿Está seguro que desea anular esta cotización?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3d5a80',
      cancelButtonColor: '#ac0505',
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.restService.putRequest('/orders/abort/' + this.data.data?.id, {}).subscribe({
          next: (res) => {
            this.dialogRef.close({ success: true, message: 'Cotización anulada con éxito' });
          },
          error: (err) => {
            this.alertService.infoMixin.fire({
              icon: 'error',
              title: err.error?.message || 'Error al anular la cotización'
            });
          }
        });
      }
    });
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
      items: value.details.map((d: any) => ({
        product: d.product?.id?.toString() || d.product,
        priceUnit: this.isPublicHealth ? 0 : d.priceUnit,
        units: d.quantity,
        priceTotal: d.total
      }))
    };

    this.restService.postRequest('/orders', payload).subscribe({
      next: (res) => {
        this.dialogRef.close({ success: true, message: 'Cotización guardada con éxito' });
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
