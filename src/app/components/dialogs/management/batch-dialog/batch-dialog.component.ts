import { Component, inject, Inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';

import { BatchInterface } from '../../../../models/inventory/batch-interface';
import { RestApiService } from '../../../../services/rest-api.service';
import { AlertService } from '../../../../services/alerts.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-management-batch-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    CommonModule
  ],
  templateUrl: './batch-dialog.component.html',
  styleUrl: './batch-dialog.component.css'
})
export class BatchDialogComponent {
  private dialogRef = inject(MatDialogRef<BatchDialogComponent>);
  private restService = inject(RestApiService);
  private alertService = inject(AlertService);

  title = signal('Crear Lote');

  batchForm: FormGroup = new FormGroup({
    id: new FormControl(null),
    code: new FormControl('', Validators.required),
    details: new FormControl(''),
    isActive: new FormControl(true)
  });

  batchSearched: BatchInterface | undefined;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { mode: string, data: BatchInterface | undefined }
  ) {
    if (this.data.mode === 'edit') {
      this.onEdit();
    } else if (this.data.mode === 'view') {
      this.batchSearched = this.data.data;
    }
  }

  setForm() {
    if (this.data.data) {
      this.batchForm.patchValue({
        id: this.data.data.id,
        code: this.data.data.code,
        details: this.data.data.details,
        isActive: this.data.data.isActive
      });
    }
  }

  onEdit() {
    this.data.mode = 'edit';
    this.title.set('Editar Lote');
    this.setForm();
    this.batchSearched = this.data.data;
  }

  onSave() {
    if (this.batchForm.valid) {
      this.restService.postRequest('/batches', this.batchForm.value).subscribe({
        next: (objData) => {
          this.alertService.infoMixin.fire({
            icon: 'success',
            title: this.batchSearched ? 'Lote actualizado exitosamente' : 'Lote registrado exitosamente',
          });
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.alertService.infoMixin.fire({
            icon: 'error',
            title: error.error?.message || 'Ocurrió un error',
          });
        }
      });
    } else {
      this.alertService.infoMixin.fire({
        icon: 'warning',
        title: 'Por favor complete todos los campos requeridos.',
      });
      this.batchForm.markAllAsTouched();
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
