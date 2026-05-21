import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { RestApiService } from '../../../services/rest-api.service';
import { AlertService } from '../../../services/alerts.service';

@Component({
  selector: 'app-remember-pass-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './remember-pass-dialog.component.html',
  styleUrl: './remember-pass-dialog.component.css',
})
export class RememberPassDialogComponent {
  recoveryForm: FormGroup;
  private dialogRef = inject(MatDialogRef<RememberPassDialogComponent>);

  constructor(
    private formBuilder: FormBuilder,
    private restService: RestApiService,
    private alertService: AlertService
  ) {
    this.recoveryForm = this.formBuilder.group({
      userName: ['', [Validators.required]],
      documentNumber: ['', [Validators.required]]
    });
  }

  onSubmit() {
    if (this.recoveryForm.valid) {
      const url = '/forgot-password'; // Replace with actual endpoint if different
      const body = {
        username: this.recoveryForm.value.userName,
        dniNumber: this.recoveryForm.value.documentNumber
      };

      this.restService.postRequest(url, body).subscribe({
        next: (response) => {
          this.dialogRef.close({
            success: true,
            message: 'Se ha enviado un enlace al correo para que cree la nueva contraseña'
          });
        },
        error: (error) => {
          this.alertService.infoMixin.fire({
            icon: 'error',
            title: error.error?.message || 'Error al validar los datos',
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
}
