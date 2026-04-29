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

  title = signal('Crear Cotización (Recetarios)');
  mode: 'create' | 'edit' | 'view' = 'create';

  mainForm!: FormGroup;
  suppliers: ThirdPartyInterface[] = [];
  salePrice: number = 2000;

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
    this.initForm();
    this.loadSuppliers();
    this.fetchRecipePrice();

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
      units: [1, [Validators.required, Validators.min(1)]]
    });
  }

  get total() {
    const units = this.mainForm.get('units')?.value || 0;
    return units * this.salePrice;
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

  loadDataForEditAndView(order: any) {
    let parsedUnits = order.units || 1;

    if (order.observations) {
      // Regex to extract basic text from "Serial Inicial: 10, Serial Final: 10, Unidades: 1"
      const unitsMatch = order.observations.match(/Unidades:\s*(\d+)/);
      if (unitsMatch) parsedUnits = parseInt(unitsMatch[1], 10);
    }

    this.mainForm.patchValue({
      units: parsedUnits
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
      total: this.total,
      units: value.units,
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

  onCancel() {
    this.dialogRef.close();
  }
}
