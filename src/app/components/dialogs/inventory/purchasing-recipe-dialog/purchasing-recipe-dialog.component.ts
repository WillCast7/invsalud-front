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
import { PurchaseTableInterface } from '../../../../models/inventory/purchase-interface';

@Component({
  selector: 'app-purchasing-recipe-dialog',
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
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './purchasing-recipe-dialog.component.html'
})
export class PurchasingRecipeDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<PurchasingRecipeDialogComponent>);
  private restService = inject(RestApiService);
  private alertService = inject(AlertService);

  title = signal('Registrar Compra de Recetarios');
  mode: 'create' | 'view' = 'create';

  mainForm!: FormGroup;
  suppliers: ThirdPartyInterface[] = [];

  constructor(@Inject(MAT_DIALOG_DATA) public data: { mode: string, data?: PurchaseTableInterface }) {
    if (this.data && this.data.mode) {
      this.mode = this.data.mode as any;
    }
    if (this.mode === 'view') {
      this.title.set('Ver Ingreso de Recetarios');
    }
  }

  ngOnInit() {
    this.initForm();
    this.loadSuppliers();
    this.setupTotalCalculation();

    if (this.mode === 'view' && this.data.data) {
      const purchase = this.data.data;
      let qty = 0;
      let price = 0;

      this.loadPurchaseDetails(this.data.data.id);

      if (purchase.purchasingItems && purchase.purchasingItems.length > 0) {
        qty = purchase.purchasingItems[0].units;
        price = purchase.purchasingItems[0].priceUnit;
      }

      this.mainForm.patchValue({
        thirdParty: purchase.thirdParty,
        units: qty || 1,
        priceUnit: price || 0,
        total: purchase.total
      });
      this.mainForm.disable();
    }
  }

  initForm() {
    this.mainForm = this.fb.group({
      thirdParty: [null, Validators.required],
      units: [1, [Validators.required, Validators.min(1)]],
      priceUnit: ['', [Validators.required, Validators.min(0)]],
      initialSerial: [0, [Validators.required, Validators.min(1)]],
      finalSerial: [0, [Validators.required, Validators.min(1)]],
      total: [0]
    });
  }

  setupTotalCalculation() {
    this.mainForm.valueChanges.subscribe(value => {
      if (this.mode === 'view') return;
      const qty = this.mainForm.get('units')?.value || 0;
      const price = this.mainForm.get('priceUnit')?.value || 0;
      const total = qty * price;
      if (this.mainForm.get('total')?.value !== total) {
        this.mainForm.get('total')?.setValue(total, { emitEvent: false });
      }
    });
  }

  loadSuppliers() {
    this.restService.getRequest('/thirdparty', { page: 0, size: 1000 }).subscribe({
      next: (res) => {
        this.suppliers = res.pageable?.content || res.data?.content || res.data || [];

        if (this.mode === 'view' && this.data.data?.thirdParty) {
          const tpData = this.data.data.thirdParty as any;
          const tpId = typeof tpData === 'object' ? tpData.id : tpData;
          const matchedSupplier = this.suppliers.find(s => s.id === tpId);
          if (matchedSupplier) {
            this.mainForm.get('thirdParty')?.setValue(matchedSupplier);
          }
        }
      }
    });
  }

  compareWithId(o1: any, o2: any): boolean {
    return o1 && o2 ? o1.id === o2.id : o1 === o2;
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
    const payload = {
      thirdParty: value.thirdParty?.id?.toString() || value.thirdParty,
      type: 'recipe',
      total: value.total,
      recipe: {
        units: value.units,
        priceUnit: value.priceUnit,
        priceTotal: value.total,
        startSerial: value.initialSerial,
        finalSerial: value.finalSerial
      }
    };

    this.restService.postRequest('/purchasing', payload).subscribe({
      next: (res) => {
        this.dialogRef.close({
            success: true,
            message: 'Registrado exitosamente'
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
    console.log('print', row);
    this.alertService.infoMixin.fire({
      icon: 'info',
      title: 'Funcionalidad en desarrollo'
    });
  }

  loadPurchaseDetails(id: number) {
    if (!id) return;
    this.restService.getRequest(`/purchasing/${id}`).subscribe({
      next: (res) => {
        this.data.data = res.data;
      },
      error: (err) => {
        this.alertService.infoMixin.fire({
          icon: 'error',
          title: err.error?.message || 'Error al cargar los datos de la compra'
        });
      }
    });
  }
}
