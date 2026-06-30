import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { EncryptService } from '../../../services/encrypt.service';
import { RestApiService } from '../../../services/rest-api.service';
import { AlertService } from '../../../services/alerts.service';
import { SessionService } from '../../../services/session.service';
import { ApiInterface } from '../../../models/api-interface';
import { MenuInterface } from '../../../models/menu-interface';
import { AuthInterface } from '../../../models/auth-interface';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { RememberPassDialogComponent } from '../../dialogs/remember-pass-dialog/remember-pass-dialog.component';
import { CompanyInitializer, CompanyInterface } from '../../../models/company-interface';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  title: string = 'Inicia sesión';
  public loginForm!: FormGroup;
  errorMessage = signal('');
  hidePassword = signal(true);
  company: CompanyInterface = CompanyInitializer;
  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly encryptService: EncryptService,
    private readonly restService: RestApiService,
    private readonly alertService: AlertService,
    private readonly router: Router,
    private readonly sessionService: SessionService,
    private readonly dialog: MatDialog
  ) {
    console.log("session");
    console.log(this.sessionService.isSessionActive());
    this.getData()
    this.initForm();
  }

  initForm() {
    this.loginForm = this.formBuilder.group({
      user: ['', [Validators.required, Validators.minLength(4)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  tryAuthenticate() {
    const pass = this.loginForm.get('password');
    const username = this.loginForm.get('user')?.value;

    if (this.loginForm.valid && pass) {
      this.restService
        .Login({
          username,
          password: this.encryptService.encrypt(pass.value),
        })
        .subscribe({
          next: (response: ApiInterface<AuthInterface>) => {

            if (!response.state) {
              this.apiError({ error: { message: response.message } });
              return;
            }

            // Almacenar sesión y menú en localStorage
            this.sessionService.storeSession(response.data);

            // Redirigir a la página principal
            this.router.navigate(['/']);

          },
          error: (error) => {
            this.apiError(error);
          },
          complete: () => console.info('Autenticación completa'),
        });
    }
  }

  apiError(error: any) {
    console.log('Error de autenticación:', error);
    this.alertService.infoMixin.fire({
      icon: 'error',
      title: error.error.message || 'Error desconocido',
    });
  }

  openRememberPassDialog() {
    this.dialog.open(RememberPassDialogComponent, {
      width: '400px',
      disableClose: true
    });
  }

  getData() {

    this.restService.getRequest("/login").subscribe({
      next: (response: ApiInterface<any>) => {
        this.company = response.data;
      },
      error: (error) => {
        console.log(error);
      },
      complete: () => console.info('Autenticación completa'),
    });
  }
}
