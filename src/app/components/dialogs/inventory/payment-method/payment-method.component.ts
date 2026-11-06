import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../../../services/alerts.service';
import { RestApiService } from '../../../../services/rest-api.service';
import { ThirdpartyRoleInterface } from '../../../../models/inventory/thirdparty-role-interface';
import { ConfigparamsInterface } from '../../../../models/configparams-interface';

@Component({
  selector: 'app-payment-method',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  templateUrl: './payment-method.component.html',
  styleUrl: './payment-method.component.css'
})
export class PaymentMethodComponent {
  private readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(MatDialogRef<PaymentMethodComponent>);

  paymentForm: FormGroup = this.fb.group({
    paymentMethod: ['', Validators.required]
  });

  constructor(
    private restService: RestApiService,
    private alertService: AlertService,
  ) { }

  methods: ConfigparamsInterface[] = []

  searchPaymentMethods() {
    this.restService.getRequest("/configparams/active/parent/paymentmethods").subscribe({
      next: (objData) => {
        this.methods = objData.data.documentTypes;
      },
      error: (error) => {
        this.alertService.infoMixin.fire({
          icon: 'error',
          title: error.error.message,
        });
      },
      complete: () => { return }
    });
  }

  onConfirm(): void {
    if (this.paymentForm.valid) {
      this.dialogRef.close({
        isConfirmed: true,
        paymentMethod: this.paymentForm.value.paymentMethod
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close({ isConfirmed: false });
  }
}
