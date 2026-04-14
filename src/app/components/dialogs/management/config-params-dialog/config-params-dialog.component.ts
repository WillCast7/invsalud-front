import { Component, inject, Inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { ConfigparamsInterface } from '../../../../models/configparams-interface';
import { RestApiService } from '../../../../services/rest-api.service';
import { AlertService } from '../../../../services/alerts.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-config-params-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    FormsModule,
    MatSlideToggleModule,
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './config-params-dialog.component.html',
  styleUrl: './config-params-dialog.component.css'
})
export class ConfigParamsDialogComponent {
  private dialogRef = inject(MatDialogRef<ConfigParamsDialogComponent>);
  private restService = inject(RestApiService);
  private alertService = inject(AlertService);

  title = signal('Crear Parámetro de Configuración');

  configParamForm: FormGroup = new FormGroup({
    id: new FormControl(null),
    name: new FormControl('', Validators.required),
    parent: new FormControl('', Validators.required),
    shortname: new FormControl('', Validators.required),
    definition: new FormControl('', Validators.required),
    isActive: new FormControl(true),
    order: new FormControl(0, Validators.required)
  });

  configParamSearched: ConfigparamsInterface | undefined;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { mode: string, data: ConfigparamsInterface | undefined }
  ) {
    if (this.data.mode === 'edit') {
      this.onEdit();
    } else if (this.data.mode === 'view') {
      this.configParamSearched = this.data.data;
    }
  }

  setForm() {
    if (this.data.data) {
      if (this.data.data.shortname === "Resultado de contacto") {
        this.alertService.infoMixin.fire({
          icon: "error",
          title: "No se puede modificar estos parametros, por sus dependencias"
        });
        this.dialogRef.close();
        return;
      }
      this.configParamForm.patchValue({
        id: this.data.data.id,
        name: this.data.data.name,
        parent: this.data.data.parent,
        shortname: this.data.data.shortname,
        definition: this.data.data.definition,
        isActive: this.data.data.isActive,
        order: this.data.data.order
      });
    }
  }

  onEdit() {
    this.data.mode = 'edit';
    this.title.set('Editar Parámetro');
    this.setForm();
    this.configParamSearched = this.data.data;
  }

  onSave() {
    if (this.configParamForm.valid) {
      const endpoint = "/configparams";
      const request = this.configParamSearched ?
        this.restService.putRequest(endpoint, this.configParamForm.value) :
        this.restService.postRequest(endpoint, this.configParamForm.value);

      request.subscribe({
        next: (objData) => {
          this.alertService.infoMixin.fire({
            icon: 'success',
            title: this.configParamSearched ? 'Parámetro actualizado exitosamente' : 'Parámetro registrado exitosamente',
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
      this.configParamForm.markAllAsTouched();
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
