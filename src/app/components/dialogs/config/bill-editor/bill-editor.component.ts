import { Component, inject, Inject, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RestApiService } from '../../../../services/rest-api.service';
import { AlertService } from '../../../../services/alerts.service';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

export enum TemplateMode {
  VIEW = 'view',
  EDIT = 'edit',
  CREATE = 'create'
}

export interface SectionItem {
  id: string;
  name: string;
  html_template: string;
}

export interface SectionsJson {
  sections: SectionItem[];
}

export interface DocumentTemplateSaveModel {
  name: string;
  documentType: string;
  category: string;
  htmlContent: string;
  cssContent: string;
  sectionsState: string;
  isDefault: boolean;
}

const MOCK_RECETARIOS_COTIZACION: SectionsJson = {
  sections: [
    {
      id: 'sec-header',
      name: 'Cabecera Gobernación',
      html_template: `<div style="text-align: center; border-bottom: 2px solid #ccc; padding-bottom: 10px;">\n  <h1 style="margin: 0; color: #333;">GOBERNACIÓN DE EJEMPLO</h1>\n  <p style="margin: 5px 0 0 0; color: #666;">Dirección de Salud - Cotización de Recetarios</p>\n</div>`
    },
    {
      id: 'sec-sender',
      name: 'Remitente',
      html_template: `<div style="margin-top: 20px; font-size: 14px;">\n  <p><strong>De:</strong> Departamento de Compras</p>\n  <p><strong>Para:</strong> Proveedor Autorizado</p>\n  <p><strong>Fecha:</strong> 22/05/2026</p>\n</div>`
    },
    {
      id: 'sec-table',
      name: 'Tabla Dinámica',
      html_template: `<div style="margin-top: 20px;">\n  <table style="width: 100%; border-collapse: collapse; text-align: left;">\n    <thead style="background-color: #f5f5f5;">\n      <tr>\n        <th style="border: 1px solid #ddd; padding: 8px;">Código</th>\n        <th style="border: 1px solid #ddd; padding: 8px;">Descripción</th>\n        <th style="border: 1px solid #ddd; padding: 8px;">Cantidad</th>\n      </tr>\n    </thead>\n    <tbody>\n      <tr>\n        <td style="border: 1px solid #ddd; padding: 8px;">REC-001</td>\n        <td style="border: 1px solid #ddd; padding: 8px;">Recetario Estándar</td>\n        <td style="border: 1px solid #ddd; padding: 8px;">1000</td>\n      </tr>\n    </tbody>\n  </table>\n</div>`
    },
    {
      id: 'sec-footer',
      name: 'Pie de Página',
      html_template: `<div style="margin-top: 40px; text-align: center; font-size: 12px; color: #888;">\n  <p>Este es un documento generado automáticamente. No requiere firma física.</p>\n</div>`
    }
  ]
};

@Component({
  selector: 'app-bill-editor',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonToggleModule,
    MatSlideToggleModule, 
    MatSelectModule
  ],
  templateUrl: './bill-editor.component.html',
  styleUrl: './bill-editor.component.css',
  encapsulation: ViewEncapsulation.None
})
export class BillEditorComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<BillEditorComponent>);
  private fb = inject(FormBuilder);
  private restService = inject(RestApiService);
  private alertService = inject(AlertService);
  private sanitizer = inject(DomSanitizer);
  
  title = signal('Plantilla');
  mode: TemplateMode = TemplateMode.CREATE;
  isViewMode = false;
  templateId?: string;
  mainForm!: FormGroup;

  // JSON State
  templateData: SectionsJson = { sections: [] };
  selectedSection: SectionItem | null = null;
  showVariables = false;

  availableCategories = ['MEDICAMENTOS', 'MEDICAMENTOS_SP', 'RECETARIOS'];
  availableDocumentTypes = ['COTIZACION', 'VENTA', 'COMPRA'];

  constructor(@Inject(MAT_DIALOG_DATA) public data: { mode: string, type: string, data?: any }) {
    this.mode = (this.data.mode as TemplateMode) || TemplateMode.CREATE;
    this.isViewMode = this.mode === TemplateMode.VIEW;
    this.templateId = this.data.data?.id;

    let initCategory = 'RECETARIOS';
    if (this.data.type?.toUpperCase().includes('MEDICAMENTOS')) {
      initCategory = this.data.type.toUpperCase() === 'MEDICAMENTOS_SP' ? 'MEDICAMENTOS_SP' : 'MEDICAMENTOS';
    }

    if (this.isViewMode) {
      this.title.set(`Ver Plantilla A4`);
    } else if (this.mode === TemplateMode.EDIT) {
      this.title.set(`Editar Plantilla A4`);
    } else {
      this.title.set(`Crear Plantilla A4`);
    }

    this.mainForm = this.fb.group({
      name: ['', Validators.required],
      documentType: ['COTIZACION', Validators.required],
      category: [initCategory, Validators.required],
      isDefault: [false]
    });
  }

  ngOnInit() {
    // Si estamos en modo crear, siempre cargamos el mock (ignoramos si data.data es un objeto vacío)
    if (this.mode === TemplateMode.CREATE) {
      this.templateData = JSON.parse(JSON.stringify(MOCK_RECETARIOS_COTIZACION));
    } else if (this.data.data) {

       this.restService.getRequest("/document-templates/" + this.templateId).subscribe({
      
        next: (res) => {
          this.alertService.infoMixin.fire({ icon: 'success', title: `Plantilla cargada correctamente.` });
        },
        error: (err) => {
          this.alertService.infoMixin.fire({
            icon: 'error',
            title: err.error?.message || 'Error al cargar la plantilla'
          });
        }
      });
      this.mainForm.patchValue({
        name: this.data.data.name,
        documentType: this.data.data.documentType,
        category: this.data.data.category,
        isDefault: this.data.data.isDefault
      });
      if (this.isViewMode) {
        this.mainForm.disable();
      }

      if (this.data.data.sectionsState) {
        try {
          const parsed = typeof this.data.data.sectionsState === 'string' 
            ? JSON.parse(this.data.data.sectionsState) 
            : this.data.data.sectionsState;
          
          if (parsed && parsed.sections && parsed.sections.length > 0) {
            this.templateData = parsed;
          } else {
            this.templateData = { sections: [] };
          }
        } catch (e) {
          console.error("Error parsing block state", e);
        }
      }
    }
  }

  enableEditMode() {
    this.isViewMode = false;
    this.mode = TemplateMode.EDIT;
    this.title.set(`Editar Plantilla A4`);
    this.mainForm.enable();
  }

  selectSection(section: SectionItem) {
    this.selectedSection = section;
  }

  addNewSection() {
    const newId = 'sec-' + Math.random().toString(36).substr(2, 9);
    const newSection: SectionItem = {
      id: newId,
      name: 'Nueva Sección',
      html_template: '<div style="padding: 10px; border: 1px dashed #ccc;">\n  <p>Escribe tu código HTML aquí...</p>\n</div>'
    };
    this.templateData.sections.push(newSection);
  }

  removeSection(section: SectionItem, event: Event) {
    event.stopPropagation();
    this.templateData.sections = this.templateData.sections.filter(s => s.id !== section.id);
    if (this.selectedSection?.id === section.id) {
      this.selectedSection = null;
    }
  }

  getAvailableVariables() {
    const docType = this.mainForm?.get('documentType')?.value;
    const globalVars = [
      { label: 'Empresa', vars: ['{{ company.name }}', '{{ company.nit }}', '{{ company.address }}', '{{ company.phone }}', '{{ company.logoUrl }}'] }
    ];

    if (docType === 'COMPRA') {
      return [...globalVars, 
        { label: 'Compra (Purchasing)', vars: ['{{ purchasing.purchasedCode }}', '{{ purchasing.createdAt }}', '{{ purchasing.total }}', '{{ purchasing.observations }}'] },
        { label: 'Proveedor (ThirdParty)', vars: ['{{ thirdParty.fullName }}', '{{ thirdParty.documentNumber }}', '{{ thirdParty.address }}'] },
        { label: 'Tabla de Items (Iterar)', vars: ['{{ item.product.name }}', '{{ item.product.code }}', '{{ item.units }}', '{{ item.priceUnit }}', '{{ item.priceTotal }}'] }
      ];
    } else {
      // VENTA o COTIZACION
      return [...globalVars,
        { label: 'Orden (Order)', vars: ['{{ order.orderCode }}', '{{ order.createdAt }}', '{{ order.total }}', '{{ order.observations }}'] },
        { label: 'Cliente (ThirdParty)', vars: ['{{ thirdParty.fullName }}', '{{ thirdParty.documentNumber }}', '{{ thirdParty.email }}', '{{ thirdParty.phone }}'] },
        { label: 'Tabla de Items (Iterar)', vars: ['{{ item.inventory.product.name }}', '{{ item.units }}', '{{ item.priceUnit }}', '{{ item.priceTotal }}'] }
      ];
    }
  }

  getSafeHtml(html: string): SafeHtml {
    if (!html) return '';
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  onSubmit() {
    console.log("Submitting form with data:");
    console.log(this.mainForm.value);
    console.log(this.mainForm.invalid);
    if (this.mainForm.invalid) {
      this.mainForm.markAllAsTouched();
      this.alertService.infoMixin.fire({ icon: 'warning', title: 'Complete los campos obligatorios.' });
      return;
    }

    // Concatenate HTML from all sections
    let concatenatedHtml = '';
    this.templateData.sections.forEach(sec => {
      concatenatedHtml += `<!-- Section: ${sec.name} -->\n${sec.html_template}\n`;
    });

    // Wrap in A4 container for final output if needed, but usually just sections is fine.
    const finalHtmlContent = `<div class="a4-document-print" style="width: 100%; max-width: 210mm; margin: 0 auto; font-family: sans-serif;">\n${concatenatedHtml}\n</div>`;
    
    const stateOutput = JSON.stringify(this.templateData);
    const formValue = this.mainForm.value;

    const payload: DocumentTemplateSaveModel = {
      name: formValue.name,
      documentType: formValue.documentType,
      category: formValue.category,
      htmlContent: finalHtmlContent,
      cssContent: '', 
      sectionsState: stateOutput,
      isDefault: formValue.isDefault
    };

    console.log("Payload to save:");
    console.log(payload);
    const url = this.mode === TemplateMode.EDIT ? `/document-templates/${this.templateId}` : '/document-templates';
    const request = this.mode === TemplateMode.EDIT ? this.restService.putRequest(url, payload) : this.restService.postRequest(url, payload);

    request.subscribe({
      next: (res) => {
        this.dialogRef.close({
          success: true,
          message: 'Plantilla estructurada guardada correctamente'
        });
      },
      error: (err) => {
        this.alertService.infoMixin.fire({
          icon: 'error',
          title: err.error?.message || 'Error al guardar la plantilla'
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
