import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RestApiService } from '../../../../services/rest-api.service';
import { AlertService } from '../../../../services/alerts.service';
import { EncryptService } from '../../../../services/encrypt.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-public-change-password',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    CommonModule
  ],
  templateUrl: './public-change-password.component.html',
  styleUrl: './public-change-password.component.css',
})
export class PublicChangePasswordComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  hideNew = signal(true);
  hideConfirm = signal(true);
  passwordForm!: FormGroup;
  token: string | null = null;
  tokenValid = signal<boolean | null>(null);

  confirmToken() {
    if (!this.token) return;
    this.restService.postRequest('/confirm-token', { token: this.token }).subscribe({
      next: (response) => {
        this.tokenValid.set(response.valid);
        if (!response.valid) {
          this.alertService.infoMixin.fire({
            icon: 'error',
            title: response.message || 'El token no es válido o ha expirado.',
            target: 'body'
          });
          this.router.navigate(['/']);
        }
      },
      error: (error) => {
        this.tokenValid.set(false);
        this.alertService.infoMixin.fire({
          icon: 'error',
          title: error.error?.message || 'Error al validar el token.',
          target: 'body'
        });
        this.router.navigate(['/']);
      }
    });
  }

  private passwordMatchValidator = (g: AbstractControl): ValidationErrors | null => {
    const newPass = g.get('newPassword')?.value;
    const confirmPass = g.get('confirmPassword')?.value;

    if (newPass !== confirmPass) {
      g.get('confirmPassword')?.setErrors({ mismatch: true });
      return { mismatch: true };
    } else {
      g.get('confirmPassword')?.setErrors(null);
    }
    return null;
  };

  onSave() {
    const newPassword = this.passwordForm.get('newPassword');
    const confirmPassword = this.passwordForm.get('confirmPassword');

    if (this.passwordForm.valid && newPassword && confirmPassword && this.token) {
      this.restService.postRequest("/reset-password", {
        token: this.token,
        newPassword: this.encryptService.encrypt(newPassword.value),
        confirmPassword: this.encryptService.encrypt(confirmPassword.value)
      }).subscribe({
        next: (objData) => {
          this.alertService.infoMixin.fire({
            icon: 'success',
            title: "Contraseña actualizada exitosamente.",
          });
          this.router.navigate(['/']);
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
    private readonly encryptService: EncryptService
  ) {
    this.passwordForm = new FormGroup({
      newPassword: new FormControl('', [Validators.required, Validators.minLength(8)]),
      confirmPassword: new FormControl('', Validators.required)
    }, { validators: this.passwordMatchValidator });

    this.route.queryParams.subscribe(params => {
      const tokenParam = params['token'] || null;
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (!tokenParam || !uuidPattern.test(tokenParam)) {
        this.token = null;
        this.alertService.infoMixin.fire({
          icon: 'error',
          title: 'El token de recuperación no es válido o ha expirado.',
          target: 'body'
        });
        this.router.navigate(['/']);
      } else {
        this.token = tokenParam;
        this.confirmToken();
      }
    });
  }
}
