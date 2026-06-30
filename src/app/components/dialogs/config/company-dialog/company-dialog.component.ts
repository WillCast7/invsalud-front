import { Component, inject, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { RestApiService } from '../../../../services/rest-api.service';
import { AlertService } from '../../../../services/alerts.service';
import { CompanyInterface, CompanyInitializer } from '../../../../models/company-interface';

@Component({
  selector: 'app-company-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatDividerModule,
    MatCheckboxModule,
    CommonModule
  ],
  templateUrl: './company-dialog.component.html',
  styleUrl: './company-dialog.component.css'
})
export class CompanyDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CompanyDialogComponent>);
  private restService = inject(RestApiService);
  private alertService = inject(AlertService);

  companyForm!: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { data: CompanyInterface }
  ) {}

  ngOnInit() {
    this.initializeForm();
    if (this.data && this.data.data) {
      this.companyForm.patchValue(this.data.data);
    }
  }

  initializeForm() {
    this.companyForm = this.fb.group({
      id: [0],
      nit: ['', Validators.required],
      name: ['', Validators.required],
      legalName: ['', Validators.required],
      taxId: [''],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      address: ['', Validators.required],
      country: ['', Validators.required],
      type: [''],
      city: ['', Validators.required],
      website: [''],
      logoUrl: [''],
      logoOrder: [''],
      logoSold: [''],
      logoPurchasing: [''],
      nameApp: ['', Validators.required],
      isActive: [true]
    });
  }

  onFileSelected(event: any, fieldName: string) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.companyForm.patchValue({
          [fieldName]: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  }

  clearImage(fieldName: string) {
    this.companyForm.patchValue({
      [fieldName]: ''
    });
  }

  onSubmit() {
    if (this.companyForm.invalid) {
      this.companyForm.markAllAsTouched();
      this.alertService.infoMixin.fire({
        icon: 'warning',
        title: 'Por favor complete todos los campos requeridos.'
      });
      return;
    }

    const payload = {
      ...this.companyForm.value,
      subscriptionPlan: '' // Not used but keeps model complete
    };

    // Update company details using the endpoint
    this.restService.putRequest('/login', payload).subscribe({
      next: (response) => {
        this.dialogRef.close({
          success: true,
          message: 'Información de la empresa actualizada correctamente.'
        });
      },
      error: (error) => {
        this.alertService.infoMixin.fire({
          icon: 'error',
          title: error.error?.message || 'Error al actualizar la información de la empresa.'
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
