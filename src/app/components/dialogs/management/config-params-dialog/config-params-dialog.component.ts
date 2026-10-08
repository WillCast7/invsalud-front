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
  parentList: string[] = [];
  allConfigParams: ConfigparamsInterface[] = [];

  configParamForm: FormGroup = new FormGroup({
    id: new FormControl(null),
    name: new FormControl('', Validators.required),
    parent: new FormControl('', Validators.required),
    shortname: new FormControl('', Validators.required),
    definition: new FormControl(''),
    isActive: new FormControl(true),
    order: new FormControl(0, Validators.required)
  });

  configParamSearched: ConfigparamsInterface | undefined;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { mode: string, data: ConfigparamsInterface | undefined, configParams?: ConfigparamsInterface[] }
  ) {
    this.configParamForm.get('name')?.valueChanges.subscribe((val) => {
      if (typeof val === 'string') {
        const upper = val.toUpperCase();
        if (val !== upper) {
          this.configParamForm.get('name')?.setValue(upper, { emitEvent: false });
        }
      }
    });

    this.configParamForm.get('shortname')?.valueChanges.subscribe((val) => {
      if (typeof val === 'string' && val.length > 0) {
        const formatted = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
        if (val !== formatted) {
          this.configParamForm.get('shortname')?.setValue(formatted, { emitEvent: false });
        }
      }
    });

    if (this.data.configParams) {
      this.extractParents(this.data.configParams);
    }
    this.loadParents();

    if (this.data.mode === 'edit') {
      this.onEdit();
    } else if (this.data.mode === 'view') {
      this.configParamSearched = this.data.data;
    }
  }

  onNameInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const upper = (input.value || '').toUpperCase();
    if (input.value !== upper) {
      input.value = upper;
      this.configParamForm.get('name')?.setValue(upper, { emitModelToViewChange: false });
      if (start !== null && end !== null) {
        input.setSelectionRange(start, end);
      }
    }
  }

  onShortnameInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input || !input.value) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const formatted = input.value.charAt(0).toUpperCase() + input.value.slice(1).toLowerCase();
    if (input.value !== formatted) {
      input.value = formatted;
      this.configParamForm.get('shortname')?.setValue(formatted, { emitModelToViewChange: false });
      if (start !== null && end !== null) {
        input.setSelectionRange(start, end);
      }
    }
  }

  loadParents() {
    this.restService.getRequest('/configparams', { page: 0, size: 1000, row: 1000 }).subscribe({
      next: (objData) => {
        const list = objData?.pageable?.content || objData?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          this.extractParents(list);
        }
      },
      error: (error) => {
        console.error('Error al cargar la lista de padres:', error);
      }
    });
  }

  extractParents(configParams: ConfigparamsInterface[]) {
    this.allConfigParams = [...this.allConfigParams, ...configParams];
    const parentSet = new Set<string>();

    if (this.data.data?.parent && this.data.data.parent.trim() !== '') {
      parentSet.add(this.data.data.parent.trim());
    }

    configParams.forEach(param => {
      if (param?.parent && param.parent.trim() !== '') {
        parentSet.add(param.parent.trim());
      }
    });

    this.parentList = Array.from(parentSet).sort((a, b) => a.localeCompare(b));
  }

  onParentChange(selectedParent: string) {
    if (!selectedParent) return;

    // Calcular el siguiente orden a partir de los datos locales de inmediato
    const localItems = this.allConfigParams.filter(item => item?.parent === selectedParent);
    const localOrders = localItems
      .map(item => item?.order)
      .filter((o): o is number => typeof o === 'number' && !isNaN(o));

    const currentMax = localOrders.length > 0 ? Math.max(...localOrders) : 0;
    this.configParamForm.patchValue({ order: currentMax + 1 });

    // Llenar definición con la del padre si existe localmente
    const localItemWithDef = localItems.find(item => item?.definition && item.definition.trim() !== '') ||
      this.allConfigParams.find(item => (item?.name === selectedParent || item?.shortname === selectedParent || item?.parent === selectedParent) && item?.definition && item.definition.trim() !== '');

    if (localItemWithDef?.definition) {
      this.configParamForm.patchValue({ definition: localItemWithDef.definition });
    }

    // Consultar el endpoint del backend para obtener el orden definitivo y la definición actualizada
    this.restService.getRequest(`/configparams/parent/${encodeURIComponent(selectedParent)}`).subscribe({
      next: (res) => {
        const items: ConfigparamsInterface[] = res?.data || [];
        if (Array.isArray(items) && items.length > 0) {
          const orders = items
            .map(item => item?.order)
            .filter((o): o is number => typeof o === 'number' && !isNaN(o));
          if (orders.length > 0) {
            const maxOrder = Math.max(...orders);
            this.configParamForm.patchValue({ order: maxOrder + 1 });
          }

          const itemWithDef = items.find(item => item?.definition && item.definition.trim() !== '');
          if (itemWithDef?.definition) {
            this.configParamForm.patchValue({ definition: itemWithDef.definition });
          }
        }
      },
      error: (error) => {
        console.error('Error al obtener parámetros del padre seleccionado:', error);
      }
    });
  }

  setForm() {
    if (this.data.data) {
      if (this.data.data.shortname === "Resultado de contacto") {
        this.dialogRef.close({ success: false, message: 'No se puede modificar estos parametros, por sus dependencias' });
        return;
      }
      const formattedName = this.data.data.name ? this.data.data.name.toUpperCase() : '';
      const formattedShortname = this.data.data.shortname
        ? this.data.data.shortname.charAt(0).toUpperCase() + this.data.data.shortname.slice(1).toLowerCase()
        : '';
      this.configParamForm.patchValue({
        id: this.data.data.id,
        name: formattedName,
        parent: this.data.data.parent,
        shortname: formattedShortname,
        definition: this.data.data.definition,
        isActive: this.data.data.isActive,
        order: this.data.data.order
      });
    }
  }

  onEdit() {
    this.data.mode = 'edit';
    this.title.set('Editar Parámetro de configuracion');
    this.setForm();
    this.configParamSearched = this.data.data;
  }

  onSave() {
    if (this.configParamForm.valid) {
      const rawValue = this.configParamForm.value;
      const formattedName = typeof rawValue.name === 'string' ? rawValue.name.toUpperCase() : rawValue.name;
      const formattedShortname = typeof rawValue.shortname === 'string' && rawValue.shortname.length > 0
        ? rawValue.shortname.charAt(0).toUpperCase() + rawValue.shortname.slice(1).toLowerCase()
        : rawValue.shortname;

      let formattedDefinition = rawValue.definition;
      if (!formattedDefinition && rawValue.parent) {
        formattedDefinition = this.allConfigParams.find(
          item => (item?.parent === rawValue.parent || item?.name === rawValue.parent || item?.shortname === rawValue.parent) && item?.definition && item.definition.trim() !== ''
        )?.definition || '';
      }

      this.configParamForm.patchValue({
        name: formattedName,
        shortname: formattedShortname,
        definition: formattedDefinition
      }, { emitEvent: false });

      const endpoint = "/configparams";
      const request = this.configParamSearched ?
        this.restService.putRequest(endpoint, this.configParamForm.value) :
        this.restService.postRequest(endpoint, this.configParamForm.value);

      request.subscribe({
        next: (objData) => {
          this.dialogRef.close({
            success: true,
            message: this.configParamSearched ? 'Parámetro actualizado exitosamente' : 'Parámetro registrado exitosamente'
          });
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
    this.dialogRef.close({ success: false, message: 'Operación cancelada' });
  }
}
