import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';

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

  methods = [
    { value: 'PSE', label: 'PSE' },
    { value: 'Efectivo', label: 'Efectivo' },
    { value: 'Tarjeta de crédito', label: 'Tarjeta de Crédito' },
    { value: 'Tarjeta de débito', label: 'Tarjeta de Débito' },
    { value: 'Otro', label: 'Otro' }
  ];

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
