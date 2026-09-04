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
  today: Date = new Date(new Date().setHours(0, 0, 0, 0));
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ResolutionDialogComponent>);
  private restService = inject(RestApiService);
  private alertService = inject(AlertService);

  public data: { mode: string, data: ResolutionInterface | undefined } = inject(MAT_DIALOG_DATA, { optional: true }) ?? { mode: 'create', data: undefined };
  title = signal("Crear Resolución");
  productsList: ProductInterface[] = [];
  thirdPartiesList: ThirdPartyInterface[] = [];
  resolutionSearched: ResolutionInterface = ResolutionInitializer;

  form: FormGroup = this.fb.group({
    id: [null],
    thirdParty: [null],
    code: [''],
    startDate: [this.today, [Validators.required, this.validateStartDate.bind(this)]],
    expirationDate: ['', [Validators.required, this.validateExpirationDate.bind(this)]],
    description: [''],
    isActive: [true],
    products: [[], [Validators.required]]
  });

  get minStartDate(): Date {
    if (this.data?.mode && this.data.mode !== 'create' && this.resolutionSearched?.startDate) {
      const orig = new Date(this.resolutionSearched.startDate);
      if (orig < this.today) {
        return orig;
      }
    }
    return this.today;
  }

  constructor() { }

  ngOnInit() {
    this.loadProducts();
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

    this.form.get('startDate')?.valueChanges.subscribe(() => {
      this.form.get('expirationDate')?.updateValueAndValidity();
    });
  }

  validateStartDate(control: FormControl) {
    if (!control.value) return null;
    const dateVal = new Date(control.value);
    if (isNaN(dateVal.getTime())) return null;
    const selected = new Date(dateVal).setHours(0, 0, 0, 0);
    const today = new Date().setHours(0, 0, 0, 0);

    // En edición o vista, permitir mantener la fecha original si no fue modificada
    if (this.data?.mode && this.data.mode !== 'create' && this.resolutionSearched?.startDate) {
      const orig = new Date(this.resolutionSearched.startDate).setHours(0, 0, 0, 0);
      if (selected === orig) {
        return null;
      }
    }

    return selected < today ? { minDate: true } : null;
  }

  validateExpirationDate(control: FormControl) {
    if (!control.value || !this.form) return null;
    const startDateVal = this.form.get('startDate')?.value;
    if (!startDateVal) return null;

    const expDate = new Date(control.value).setHours(0, 0, 0, 0);
    const startDate = new Date(startDateVal).setHours(0, 0, 0, 0);

    return expDate < startDate ? { minExpiration: true } : null;
  }

  displayThirdParty(tp: any): string {
    return tp && tp.fullName ? `${tp.fullName} - ${tp.documentNumber}` : '';
  }

  compareWithId(o1: any, o2: any): boolean {
    const id1 = o1 && typeof o1 === 'object' ? o1.id : o1;
    const id2 = o2 && typeof o2 === 'object' ? o2.id : o2;
    return id1 != null && id2 != null ? id1 == id2 : id1 === id2;
  }

  loadProducts() {
    this.restService.getRequest('/products', { page: 0, size: 1000, searchValue: '', isPublicHealth: false }).subscribe({
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
        this.ensureExistingProductsInList();
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
      }
    });
  }

  ensureExistingProductsInList() {
    if (this.resolutionSearched?.products && this.resolutionSearched.products.length > 0) {
      this.resolutionSearched.products.forEach(p => {
        if (!this.productsList.some(item => item.id === p.id)) {
          this.productsList.push(p);
        }
      });
    }
  }

  onSend() {
    if (this.form.valid) {
      const payload = { ...this.form.value };

      if (payload.products && payload.products.length > 0) {
        payload.products = payload.products.map((p: any) => {
          const id = typeof p === 'object' && p !== null ? p.id : p;
          return { id };
        });
      }

      if (payload.thirdParty && payload.thirdParty.id) {
        payload.thirdParty = { id: payload.thirdParty.id };
      } else {
        payload.thirdParty = null;
      }

      const method = this.data.mode === 'edit' && payload.id
        ? this.restService.putRequest(`/resolutions/${payload.id}`, payload)
        : this.restService.postRequest("/resolutions", payload);

      method.subscribe({
        next: () => {
          this.alertService.infoMixin.fire({
            icon: 'success',
            title: "Resolución guardada exitosamente",
          });
          this.dialogRef.close({
            success: true,
            message: "Resolución guardada exitosamente"
          });
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
    this.dialogRef.close({
      success: false,
      message: 'Operación cancelada'
    });
  }

  getData() {
    if (!this.data || this.data.mode === "create") {
      this.title.set("Crear Resolución");
      this.form.patchValue({
        startDate: this.today
      });
    } else if (this.data.data?.id) {
      if (this.data.mode === "edit") {
        this.title.set("Editar Resolución");
      } else {
        this.title.set("Información de la Resolución");
      }

      if (this.data.data) {
        this.resolutionSearched = { ...this.resolutionSearched, ...this.data.data };
      }

      this.restService.getRequest("/resolutions/" + this.data.data.id).subscribe({
        next: (objData) => {
          this.resolutionSearched = objData.data || objData;

          if (this.data?.mode === "edit") {
            this.form.patchValue({
              id: this.resolutionSearched.id,
              thirdParty: this.resolutionSearched.thirdParty,
              code: this.resolutionSearched.code,
              startDate: this.resolutionSearched.startDate,
              expirationDate: this.resolutionSearched.expirationDate,
              description: this.resolutionSearched.description,
              isActive: this.resolutionSearched.isActive,
              products: this.resolutionSearched.products ? this.resolutionSearched.products.map((p: any) => p.id) : []
            });
            this.ensureExistingProductsInList();
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
    } else if (this.data.data) {
      this.resolutionSearched = { ...this.resolutionSearched, ...this.data.data };
      if (this.data.mode === "view") {
        this.title.set("Información de la Resolución");
      }
    }
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
