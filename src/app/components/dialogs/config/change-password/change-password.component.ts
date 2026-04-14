import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RestApiService } from '../../../../services/rest-api.service';
import { AlertService } from '../../../../services/alerts.service';
import { EncryptService } from '../../../../services/encrypt.service';

@Component({
  selector: 'app-change-password',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatDividerModule,
    CommonModule

  ],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css',
})

export class ChangePasswordComponent {
  private fb = inject(FormBuilder);
  hideOld = signal(true);
  hideNew = signal(true);
  hideConfirm = signal(true);
  passwordForm!: FormGroup;
  
  // Función para comparar
private passwordMatchValidator = (g: AbstractControl): ValidationErrors | null => {
  const oldPass = g.get('oldPassword')?.value;
  const newPass = g.get('newPassword')?.value;
  const confirmPass = g.get('confirmPassword')?.value;

  const errors: ValidationErrors = {};

  // Validación 1: Nueva contraseña no puede ser igual a la anterior
  if (oldPass && newPass && oldPass === newPass) {
    errors['isSameAsOld'] = true;
    // Seteamos el error en el campo 'newPassword' para que se ponga rojo
    g.get('newPassword')?.setErrors({ isSameAsOld: true });
  } else {
    // Limpiamos el error si ya no es igual (sin borrar otros errores como minLength)
    const currentErrors = g.get('newPassword')?.errors;
    if (currentErrors) {
      delete currentErrors['isSameAsOld'];
      g.get('newPassword')?.setErrors(Object.keys(currentErrors).length ? currentErrors : null);
    }
  }

  // Validación 2: Confirmación debe coincidir con la nueva
  if (newPass !== confirmPass) {
    errors['mismatch'] = true;
    g.get('confirmPassword')?.setErrors({ mismatch: true });
  } else {
    // Si coinciden, limpiamos el error de mismatch del campo de confirmación
    g.get('confirmPassword')?.setErrors(null);
  }

  return Object.keys(errors).length ? errors : null;
};

  onSave() {
    const oldPassword = this.passwordForm.get('oldPassword');
    const newPassword = this.passwordForm.get('newPassword');
    const confirmPassword = this.passwordForm.get('confirmPassword');
    
    if (this.passwordForm.valid && oldPassword && newPassword && confirmPassword) {
      this.restService.postRequest("/administration/changepass", {
        oldPassword: this.encryptService.encrypt(oldPassword.value),
        newPassword: this.encryptService.encrypt(newPassword.value),
        confirmPassword: this.encryptService.encrypt(confirmPassword.value)
      }).subscribe({
      next: (objData) => {
        this.alertService.infoMixin.fire({
          icon: 'success',
          title: "Contraseña actualizada exitosamente.",
        });
        this.dialogRef.close();
      },
      error: (error) => {
        this.alertService.infoMixin.fire({
          icon: 'error',
          title: error.error.message,
        });
      },
      complete: () => console.info('transaction complete'),
    });
      
      
    } else {
      this.passwordForm.markAllAsTouched();
    }
  }

  constructor(
    private readonly restService: RestApiService,
    private readonly alertService: AlertService,
    private readonly dialogRef: MatDialogRef<ChangePasswordComponent>,
    private readonly encryptService: EncryptService
  ) { 
    this.passwordForm = new FormGroup({
      oldPassword: new FormControl('', [Validators.required, Validators.minLength(8)]),
      newPassword: new FormControl('', [Validators.required, Validators.minLength(8)]),
      confirmPassword: new FormControl('', Validators.required)
    }, { validators: this.passwordMatchValidator });
  }
}
