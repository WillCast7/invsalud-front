import { Component, inject, Inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_NATIVE_DATE_FORMATS, MatNativeDateModule, NativeDateAdapter } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { RestApiService } from '../../../services/rest-api.service';
import { AlertService } from '../../../services/alerts.service';
import { ProductInterface } from '../../../models/inventory/product-interface';
import { ResolutionInterface, ResolutionInitializer } from '../../../models/inventory/resolution-interface';
import { ThirdPartyInterface } from '../../../models/inventory/thirdparty-interface';

@Component({
  selector: 'app-resolution-dialog',
  imports: [
    MatDialogModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatDividerModule,
    MatChipsModule,
    MatAutocompleteModule,
    CommonModule
  ],
  providers: [
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS }
  ],
  templateUrl: './resolution-dialog.component.html',
  styleUrl: './resolution-dialog.component.css'
})
export class ResolutionDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ResolutionDialogComponent>);
  private restService = inject(RestApiService);
  private alertService = inject(AlertService);

  title = signal("Crear Resolución");
  productsList: ProductInterface[] = [];
  thirdPartiesList: ThirdPartyInterface[] = [];
  selectedProducts: ProductInterface[] = [];
  
  productSearchCtrl = new FormControl('');
  resolutionSearched: ResolutionInterface = ResolutionInitializer;

  form: FormGroup = this.fb.group({
    id: [null],
    thirdParty: [null],
    code: ['', [Validators.required]],
    startDate: ['', [Validators.required]],
    expirationDate: ['', [Validators.required]],
    description: [''],
    isActive: [true],
    products: [[], [Validators.required]]
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { mode: string, data: ResolutionInterface | undefined }
  ) { }

  ngOnInit() {
    this.getData();
    
    this.form.get('thirdParty')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      const term = typeof value === 'string' ? value : (value as any)?.fullName;
      if (term && term.length >= 3) {
        this.searchThirdParties(term);
      } else {
        this.thirdPartiesList = [];
      }
    });

    this.productSearchCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      const term = typeof value === 'string' ? value : (value as any)?.name;
      if (term && term.length >= 3) {
        this.searchProducts(term);
      } else {
        this.productsList = [];
      }
    });
  }

  displayThirdParty(tp: any): string {
    return tp && tp.fullName ? `${tp.fullName} - ${tp.documentNumber}` : '';
  }

  addProduct(event: MatAutocompleteSelectedEvent) {
    const product = event.option.value;
    if (!this.selectedProducts.find(p => p.id === product.id)) {
      this.selectedProducts.push(product);
      this.form.patchValue({ products: this.selectedProducts.map(p => p.id) });
    }
    // No reseteamos acá el valor directamente con setValue para evitar que cause otro valueChanges
    // de todos modos podemos hacerlo con emitEvent falso
    this.productSearchCtrl.setValue('', { emitEvent: false });
    this.productsList = [];
  }

  removeProduct(product: ProductInterface) {
    this.selectedProducts = this.selectedProducts.filter(p => p.id !== product.id);
    this.form.patchValue({ products: this.selectedProducts.map(p => p.id) });
  }

  compareWithId(o1: any, o2: any): boolean {
    return o1 && o2 ? o1.id === o2.id : o1 === o2;
  }

  onSend() {
    if (this.form.valid) {
      const payload = { ...this.form.value };

      if (payload.products && payload.products.length > 0) {
        payload.products = payload.products.map((pId: number) => ({ id: pId }));
      }

      if (payload.thirdParty && payload.thirdParty.id) {
        payload.thirdParty = { id: payload.thirdParty.id };
      } else {
        payload.thirdParty = null;
      }

      const method = this.data.mode === 'edit' && payload.id
        ? this.restService.putRequest(`/resolution/${payload.id}`, payload)
        : this.restService.postRequest("/resolution", payload);

      method.subscribe({
        next: () => {
          this.alertService.infoMixin.fire({
            icon: 'success',
            title: "Resolución guardada exitosamente",
          });
          this.dialogRef.close(true);
        },
        error: (error) => {
          let errorMessage = "Ocurrió un error";
          if (error && error.error && error.error.message) {
            errorMessage = error.error.message;
          }
          this.alertService.infoMixin.fire({
            icon: 'error',
            title: errorMessage,
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
    if (this.data.mode === "create") {
      this.title.set("Crear Resolución");
    } else if (this.data.data?.id) {
      this.restService.getRequest("/resolutions/" + this.data.data.id).subscribe({
        next: (objData) => {
          this.resolutionSearched = objData.data || objData;

          if (this.data.mode === "edit") {
            this.title.set("Editar Resolución");
            this.form.patchValue({
              id: this.resolutionSearched.id,
              thirdParty: this.resolutionSearched.thirdParty,
              code: this.resolutionSearched.code,
              startDate: this.resolutionSearched.startDate,
              expirationDate: this.resolutionSearched.expirationDate,
              description: this.resolutionSearched.description,
              isActive: this.resolutionSearched.isActive,
              products: this.resolutionSearched.products ? this.resolutionSearched.products.map(p => p.id) : []
            });
            this.selectedProducts = this.resolutionSearched.products || [];
          } else {
            this.title.set("Información de la Resolución");
          }
        },
        error: (error) => {
          let errorMessage = "Ocurrió un error al obtener la resolución";
          if (error && error.error && error.error.message) {
            errorMessage = error.error.message;
          }
          this.alertService.infoMixin.fire({
            icon: 'error',
            title: errorMessage,
          });
        }
      });
    }
  }

  searchProducts(term: string) {
    this.restService.getRequest('/products', { page: 0, size: 50, searchValue: term }).subscribe({
      next: (res) => {
        if (res.pageable && res.pageable.content) {
          this.productsList = res.pageable.content;
        } else if (res.data && res.data.content) {
          this.productsList = res.data.content;
        } else if (res.data) {
          this.productsList = res.data;
        } else {
          this.productsList = Array.isArray(res) ? res : [];
        }
      }
    });
  }

  searchThirdParties(term: string) {
    this.restService.getRequest('/thirdparty', { page: 0, size: 50, searchValue: term }).subscribe({
      next: (res) => {
        if (res.pageable && res.pageable.content) {
          this.thirdPartiesList = res.pageable.content;
        } else if (res.data && res.data.content) {
          this.thirdPartiesList = res.data.content;
        } else if (res.data) {
          this.thirdPartiesList = res.data;
        } else {
          this.thirdPartiesList = Array.isArray(res) ? res : [];
        }
      }
    });
  }
}
