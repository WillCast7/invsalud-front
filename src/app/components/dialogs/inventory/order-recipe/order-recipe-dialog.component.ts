import { Component, inject, Inject, signal, type OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { RestApiService } from '../../../../services/rest-api.service';
import { AlertService } from '../../../../services/alerts.service';
import { ThirdPartyInterface } from '../../../../models/inventory/thirdparty-interface';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { HttpErrorResponse } from '@angular/common/http';
import { QuotePrintService } from '../../../../services/quote-print.service';

@Component({
  selector: 'app-order-recipe-dialog',
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
  templateUrl: './order-recipe-dialog.component.html'
})
export class OrderRecipeDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<OrderRecipeDialogComponent>);
  private restService = inject(RestApiService);
  private alertService = inject(AlertService);
  private quotePrintService = inject(QuotePrintService);

  title = signal('Crear Cotización (Recetarios)');
  mode: 'create' | 'edit' | 'view' = 'create';

  mainForm!: FormGroup;
  sellForm!: FormGroup;
  showSellDiv = false;
  suppliers: ThirdPartyInterface[] = [];
  suppliersFinded: ThirdPartyInterface[] = [];
  salePrice: number = 2000;
  useIva: boolean = false;
  ivaPercent: number = 0;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { mode: string, type: string, data?: any }) {
    this.mode = this.data.mode as any;

    if (this.mode === 'create') {
      this.title.set('Crear Cotización (Recetarios)');
    } else if (this.mode === 'edit') {
      this.title.set('Editar Cotización (Recetarios)');
    } else {
      this.title.set('Ver Cotización (Recetarios)');
    }
  }

  ngOnInit() {
    console.log(this.data.mode);
    this.initForm();
    this.fetchCompanyData();

    if ((this.mode === 'edit' || this.mode === 'view') && this.data.data) {
      if (this.mode === 'view') {
        this.fetchOrderData();
        this.mainForm.disable();
      }
    } else {
      this.loadSuppliers();
      this.fetchRecipePrice();
    }
  }

  initForm() {
    this.mainForm = this.fb.group({
      thirdParty: [null, Validators.required],
      units: [1, [Validators.required, Validators.min(1)]]
    });

    this.sellForm = this.fb.group({
      initialSerial: ['', Validators.required],
      finalSerial: ['', Validators.required]
    });
  }

  fetchCompanyData() {
    this.restService.getRequest('/company').subscribe({
      next: (res) => {
        const company = res?.data || res;
        if (company) {
          this.useIva = !!company.useIva;
          this.ivaPercent = company.useIva ? (company.iva || 0) : 0;
        }
      },
      error: (err) => {
        console.warn('Could not fetch company tax config', err);
      }
    });
  }

  get units(): number {
    return this.mainForm.get('units')?.value || 0;
  }

  get subtotal(): number {
    return this.units * this.salePrice;
  }

  get iva(): number {
    return this.useIva ? this.ivaPercent : 0;
  }

  get priceIva(): number {
    return this.useIva ? (this.subtotal * (this.iva / 100)) : 0;
  }

  get total(): number {
    return this.subtotal + this.priceIva;
  }

  fetchRecipePrice() {
    this.restService.getRequest('/recipes', { searchValue: '' }).subscribe({
      next: (objData) => {
        const payload = objData?.data || objData;
        let recipeData: any;
        if (Array.isArray(payload) && payload.length > 0) {
          recipeData = payload[0];
        } else if (payload && payload.id !== undefined) {
          recipeData = payload;
        }

        if (recipeData && recipeData.salePrice) {
          this.salePrice = recipeData.salePrice;
        }
      },
      error: (err) => {
        console.warn('Could not fetch recipes sale price', err);
      }
    });
  }

  fetchOrderData() {
    this.restService.getRequest('/orders/' + this.data.data.id).subscribe({
      next: (objData) => {
        this.data.data = objData?.data || objData;
      },
      error: (err) => {
        console.warn('Could not fetch order data', err);
      }
    });
  }

  loadSuppliers() {
    this.restService.getRequest('/thirdparty', { page: 0, size: 1000 }).subscribe({
      next: (res) => {
        this.suppliers = res.pageable?.content || res.data?.content || res.data || [];

        if (this.mode !== 'create' && this.data.data?.thirdParty) {
          const tpData = this.data.data.thirdParty as any;
          const tpId = typeof tpData === 'object' ? tpData.id : tpData;
          const matchedSupplier = this.suppliers.find(s => s.id === tpId);
          if (matchedSupplier) {
            this.mainForm.get('thirdParty')?.setValue(matchedSupplier, { emitEvent: false });
          }
        }
      }
    });
  }


  compareWithId(o1: any, o2: any): boolean {
    return o1 && o2 ? o1.id === o2.id : o1 === o2;
  }

  displaySupplier(supplier: ThirdPartyInterface): string {
    return supplier ? `${supplier.documentNumber} - ${supplier.fullName}` : '';
  }

  findSuppliers() {
    let searchValue = this.mainForm.get('thirdParty')?.value;
    if (typeof searchValue !== 'string') {
      searchValue = searchValue?.documentNumber || searchValue?.fullName || '';
    }

    if (!searchValue || searchValue.length < 3) {
      this.suppliersFinded = [];
      return;
    }

    this.restService.getRequest('/thirdparty/' + searchValue).subscribe({
      next: (res) => {
        this.suppliersFinded = res.data || [];
      },
      error: () => {
        this.suppliersFinded = this.suppliers.filter(s =>
          s.documentNumber?.includes(searchValue) || s.fullName?.toLowerCase().includes(searchValue.toLowerCase())
        );
      }
    });
  }

  onSupplierSelected(event: any) {
    // Selection handled by formControlName="thirdParty"
  }

  onSubmit() {
    if (this.mainForm.invalid) {
      this.mainForm.markAllAsTouched();
      this.alertService.infoMixin.fire({
        icon: 'warning',
        title: 'Por favor complete todos los campos requeridos correctamente.',
      });
      return;
    }

    const value = this.mainForm.value;
    const units = value.units || 1;
    const subtotal = units * this.salePrice;
    const ivaVal = this.useIva ? this.ivaPercent : 0;
    const priceIvaVal = this.useIva ? (subtotal * (ivaVal / 100)) : 0;
    const totalVal = subtotal + priceIvaVal;

    const payload = {
      thirdParty: value.thirdParty?.id?.toString() || value.thirdParty,
      type: 'recipe',
      subtotal: subtotal,
      total: totalVal,
      units: units,
      iva: ivaVal,
      priceIva: priceIvaVal,
      items: []
    };

    const url = this.mode === 'edit' ? `/orders/${this.data.data.id}` : '/orders';
    const request = this.mode === 'edit' ? this.restService.putRequest(url, payload) : this.restService.postRequest(url, payload);

    request.subscribe({
      next: (res) => {
        this.dialogRef.close({ success: true, message: 'Cotización guardada correctamente' });
      },
      error: (err) => {
        this.alertService.infoMixin.fire({
          icon: 'error',
          title: err.error?.message || 'Error al guardar la cotización'
        });
      }
    });
  }

  toggleSellDiv() {
    this.showSellDiv = !this.showSellDiv;
  }

  onSell() {
    if (this.sellForm.invalid) {
      this.sellForm.markAllAsTouched();
      this.alertService.infoMixin.fire({
        icon: 'warning',
        title: 'Por favor complete todos los campos requeridos correctamente.'
      });
      return;
    }

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
        const payload = this.sellForm.value;
        this.restService.postRequest('/orders/sell/recipe/' + this.data.data?.id, payload).subscribe({
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

  onPrint(row: any) {
    const id = row?.id || this.data.data?.id;
    if (!id) return;
    this.quotePrintService.printOrder(id);
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

  onCancel() {
    this.dialogRef.close({
      success: false,
      message: 'Operación cancelada'
    });
  }
}
