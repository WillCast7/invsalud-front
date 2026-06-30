import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { ThirdPartyInterface } from '../../../models/inventory/thirdparty-interface';
import { ProductInterface } from '../../../models/inventory/product-interface';
import { BatchInterface } from '../../../models/inventory/batch-interface';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { RestApiService } from '../../../services/rest-api.service';
import { AlertService } from '../../../services/alerts.service';
import { MatAutocomplete, MatAutocompleteTrigger } from "@angular/material/autocomplete";
import { ReportDialogComponent } from '../../dialogs/report-dialog/report-dialog.component';
import { SizemodalInitializer } from '../../../models/modal/sizemodal-interface';

interface ReportData {
  id: string;
  reportType: 'Cotizacion' | 'Ingresos' | 'Salidas';
  category: 'Recetarios' | 'Medicamentos' | 'Medicamentos sp';
  client: string;
  medicine: string;
  quantity: number;
  date: Date;
  amount: number;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatAutocomplete,
    MatAutocompleteTrigger
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
})
export class ReportsComponent implements OnInit {
  mainForm!: FormGroup;
  suppliersFinded: ThirdPartyInterface[] = [];
  productsFinded: ProductInterface[] = [];
  batchesFinded: BatchInterface[] = [];

  suppliers: ThirdPartyInterface[] = [];
  products: ProductInterface[] = [];
  batches: BatchInterface[] = [];
  private dialog = inject(MatDialog);
  private restService = inject(RestApiService);
  private alertService = inject(AlertService);
  private fb = inject(FormBuilder);

  ngOnInit(): void {
    this.mainForm = this.fb.group({
      type: ['', Validators.required],
      category: [''],
      startDate: [''],
      endDate: [''],
      documentNumber: [''],
      product: [''],
      batch: [''],
    });
  }

  findSuppliers() {
    const documentNumber = this.mainForm.get('documentNumber')?.value;
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
      this.mainForm.patchValue({
        documentNumber: supplier.documentNumber
      });
    }
  }

  displayProduct(product: ProductInterface): string {
    return product?.name || '';
  }

  findProducts() {
    const code = this.mainForm.get('product')?.value;
    if (!code || code.length < 3) {
      this.productsFinded = [];
      return;
    }

    this.restService.getRequest(`/product/${code}`).subscribe({
      next: (res) => {
        this.productsFinded = res.data || [];
      },
      error: () => {
        // Fallback local filter
        this.productsFinded = this.products.filter(p =>
          p.code?.toLowerCase().includes(code.toLowerCase()) || p.name?.toLowerCase().includes(code.toLowerCase())
        );
      }
    });
  }

  findBatches() {
    const code = this.mainForm.get('batch')?.value;
    if (!code || code.length < 3) {
      this.batchesFinded = [];
      return;
    }

    this.restService.getRequest('/batches', { page: 0, size: 10, searchValue: code }).subscribe({
      next: (objData) => {
        this.batchesFinded = objData.pageable?.content || [];
      }
    });
  }

  displayBatch(batch: BatchInterface): string {
    return batch ? `${batch.code}` : '';
  }

  onProductSelected(event: any) {
    // We could do something here if needed when product is selected
  }

  onBatchSelected(event: any) {
    // We could do something here if needed when batch is selected
  }

  onClear() {
    this.mainForm.reset();
  }

  onSearch() {
    if (this.mainForm.invalid) {
      this.alertService.infoMixin.fire({
        icon: 'warning',
        title: 'Seleccione el tipo de reporte'
      });
      return;
    }

    const dialogRef: MatDialogRef<any> = this.dialog.open(ReportDialogComponent,
      { ...SizemodalInitializer, data: { data: this.mainForm.value } });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.alertService.infoMixin.fire({
          icon: result.success ? 'success' : 'warning',
          title: result.message
        });
      }
    });
  }

}
