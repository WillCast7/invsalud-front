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
import { MatMenuModule } from '@angular/material/menu';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

export enum TemplateMode {
  VIEW = 'view',
  EDIT = 'edit',
  CREATE = 'create'
}

export interface SectionField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'checkbox';
  value: any;
}

export interface SectionItem {
  id: string;
  name: string;
  type: 'header' | 'title' | 'subtitle' | 'table' | 'footer';
  fields: SectionField[];
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
      name: 'Cabecera',
      type: 'header',
      fields: [
        { key: 'title', label: 'Título Principal', type: 'text', value: 'GOBERNACIÓN DE EJEMPLO' },
        { key: 'subtitle', label: 'Subtítulo / Dependencia', type: 'text', value: 'Dirección de Salud - Cotización de Recetarios' },
        { key: 'showLogo', label: 'Mostrar Logo', type: 'checkbox', value: true },
        { key: 'logoUrl', label: 'URL del Logo', type: 'text', value: '{{ company.logoUrl }}' },
        { key: 'nit', label: 'NIT Empresa', type: 'text', value: '{{ company.nit }}' },
        { key: 'address', label: 'Dirección', type: 'text', value: '{{ company.address }}' },
        { key: 'phone', label: 'Teléfono', type: 'text', value: '{{ company.phone }}' }
      ],
      html_template: ''
    },
    {
      id: 'sec-title',
      name: 'Título Documento',
      type: 'title',
      fields: [
        { key: 'titleText', label: 'Texto de Título', type: 'text', value: 'COTIZACIÓN DE RECETARIOS' },
        { key: 'documentCode', label: 'Formato Número de Factura/Orden', type: 'text', value: 'No. {{ order.orderCode }}' },
        { key: 'dateText', label: 'Formato de Fecha', type: 'text', value: 'Fecha: {{ order.createdAt }}' }
      ],
      html_template: ''
    },
    {
      id: 'sec-subtitle',
      name: 'Subtítulo / Detalles',
      type: 'subtitle',
      fields: [
        { key: 'leftLabel1', label: 'Etiqueta Izquierda 1', type: 'text', value: 'Remitente:' },
        { key: 'leftValue1', label: 'Valor Izquierda 1', type: 'text', value: 'Departamento de Compras' },
        { key: 'leftLabel2', label: 'Etiqueta Izquierda 2', type: 'text', value: 'De parte de:' },
        { key: 'leftValue2', label: 'Valor Izquierda 2', type: 'text', value: '{{ company.name }}' },
        { key: 'rightLabel1', label: 'Etiqueta Derecha 1', type: 'text', value: 'Cliente / Proveedor:' },
        { key: 'rightValue1', label: 'Valor Derecha 1', type: 'text', value: '{{ thirdParty.fullName }}' },
        { key: 'rightLabel2', label: 'Etiqueta Derecha 2', type: 'text', value: 'Documento / NIT:' },
        { key: 'rightValue2', label: 'Valor Derecha 2', type: 'text', value: '{{ thirdParty.documentNumber }}' }
      ],
      html_template: ''
    },
    {
      id: 'sec-table',
      name: 'Texto Tabla',
      type: 'table',
      fields: [
        { key: 'headerCode', label: 'Encabezado Código', type: 'text', value: 'Código' },
        { key: 'headerDescription', label: 'Encabezado Descripción', type: 'text', value: 'Descripción / Medicamento' },
        { key: 'headerQuantity', label: 'Encabezado Cantidad', type: 'text', value: 'Cantidad' },
        { key: 'headerPrice', label: 'Encabezado Precio Unitario', type: 'text', value: 'Precio Unitario' },
        { key: 'headerTotal', label: 'Encabezado Total', type: 'text', value: 'Total' },
        { key: 'showPrices', label: 'Mostrar Precios y Totales', type: 'checkbox', value: true },
        { key: 'tableNotes', label: 'Notas o Texto debajo de la Tabla (opcional)', type: 'textarea', value: '' }
      ],
      html_template: ''
    },
    {
      id: 'sec-footer',
      name: 'Pie de Página',
      type: 'footer',
      fields: [
        { key: 'footerText', label: 'Texto de Cierre', type: 'textarea', value: 'Este es un documento generado automáticamente. No requiere firma física.' },
        { key: 'disclaimer', label: 'Nota Legal / Advertencia', type: 'textarea', value: '' }
      ],
      html_template: ''
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
    MatSelectModule,
    MatMenuModule,
    DragDropModule
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

    // Listen to document type changes to regenerate the table html accordingly
    this.mainForm.get('documentType')?.valueChanges.subscribe(() => {
      this.templateData.sections.forEach(sec => {
        if (sec.type === 'table') {
          sec.html_template = this.generateHtmlForSection(sec);
        }
      });
    });
  }

  ngOnInit() {
    if (this.mode === TemplateMode.CREATE) {
      this.templateData = JSON.parse(JSON.stringify(MOCK_RECETARIOS_COTIZACION));
      // Generate initial HTML templates
      this.templateData.sections.forEach(sec => {
        sec.html_template = this.generateHtmlForSection(sec);
      });
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
            const hasFields = parsed.sections.every((s: any) => s.fields && s.fields.length > 0);
            if (hasFields) {
              this.templateData = parsed;
            } else {
              this.templateData = this.migrateOldSections(parsed.sections);
            }
          } else {
            this.templateData = JSON.parse(JSON.stringify(MOCK_RECETARIOS_COTIZACION));
          }
        } catch (e) {
          console.error("Error parsing block state", e);
          this.templateData = JSON.parse(JSON.stringify(MOCK_RECETARIOS_COTIZACION));
        }
        // Regenerate to synchronize HTML
        this.templateData.sections.forEach(sec => {
          sec.html_template = this.generateHtmlForSection(sec);
        });
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

  onFieldChange(section: SectionItem) {
    section.html_template = this.generateHtmlForSection(section);
  }

  generateHtmlForSection(section: SectionItem): string {
    const fieldsMap: { [key: string]: any } = {};
    section.fields.forEach(f => {
      fieldsMap[f.key] = f.value;
    });

    switch (section.type) {
      case 'header':
        return this.generateHeaderHtml(fieldsMap);
      case 'title':
        return this.generateTitleHtml(fieldsMap);
      case 'subtitle':
        return this.generateSubtitleHtml(fieldsMap);
      case 'table':
        return this.generateTableHtml(fieldsMap);
      case 'footer':
        return this.generateFooterHtml(fieldsMap);
      default:
        return section.html_template;
    }
  }

  private generateHeaderHtml(fields: any): string {
    const showLogo = fields.showLogo !== false;
    const logoUrl = fields.logoUrl || '{{ company.logoUrl }}';
    const title = fields.title || '';
    const subtitle = fields.subtitle || '';
    const nit = fields.nit || '';
    const address = fields.address || '';
    const phone = fields.phone || '';

    return `
<div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #ccc; padding-bottom: 10px; font-family: Arial, sans-serif;">
  <div style="flex-grow: 1; text-align: left;">
    <h1 style="margin: 0; color: #333; font-size: 20px; font-weight: bold;">${title}</h1>
    <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">${subtitle}</p>
    <div style="margin-top: 5px; font-size: 11px; color: #777;">
      ${nit ? `<span style="margin-right: 15px;"><strong>NIT:</strong> ${nit}</span>` : ''}
      ${address ? `<span style="margin-right: 15px;"><strong>Dir:</strong> ${address}</span>` : ''}
      ${phone ? `<span><strong>Tel:</strong> ${phone}</span>` : ''}
    </div>
  </div>
  ${showLogo ? `
  <div style="margin-left: 20px;">
    <img src="${logoUrl}" alt="Logo" style="max-height: 60px; max-width: 150px; object-fit: contain;" />
  </div>` : ''}
</div>`;
  }

  private generateTitleHtml(fields: any): string {
    const titleText = fields.titleText || '';
    const documentCode = fields.documentCode || '';
    const dateText = fields.dateText || '';

    return `
<div style="margin-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid #eee; padding-bottom: 8px; font-family: Arial, sans-serif;">
  <h2 style="margin: 0; color: #222; font-size: 18px; text-transform: uppercase; font-weight: bold;">${titleText}</h2>
  <div style="text-align: right; font-size: 12px; color: #555;">
    <div style="font-weight: bold; font-size: 14px; color: #0d6efd;">${documentCode}</div>
    <div style="margin-top: 2px;">${dateText}</div>
  </div>
</div>`;
  }

  private generateSubtitleHtml(fields: any): string {
    const leftLabel1 = fields.leftLabel1 || '';
    const leftValue1 = fields.leftValue1 || '';
    const leftLabel2 = fields.leftLabel2 || '';
    const leftValue2 = fields.leftValue2 || '';
    
    const rightLabel1 = fields.rightLabel1 || '';
    const rightValue1 = fields.rightValue1 || '';
    const rightLabel2 = fields.rightLabel2 || '';
    const rightValue2 = fields.rightValue2 || '';

    return `
<div style="margin-top: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 12px; font-family: Arial, sans-serif; background-color: #f9fafb; padding: 10px; border-radius: 4px; border: 1px solid #e5e7eb;">
  <div>
    ${leftLabel1 || leftValue1 ? `
    <div style="color: #4b5563; font-weight: bold; margin-bottom: 2px; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">${leftLabel1}</div>
    <div style="color: #1f2937; margin-bottom: 8px;">${leftValue1}</div>` : ''}
    ${leftLabel2 || leftValue2 ? `
    <div style="color: #4b5563; font-weight: bold; margin-bottom: 2px; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">${leftLabel2}</div>
    <div style="color: #1f2937;">${leftValue2}</div>` : ''}
  </div>
  <div>
    ${rightLabel1 || rightValue1 ? `
    <div style="color: #4b5563; font-weight: bold; margin-bottom: 2px; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">${rightLabel1}</div>
    <div style="color: #1f2937; margin-bottom: 8px;">${rightValue1}</div>` : ''}
    ${rightLabel2 || rightValue2 ? `
    <div style="color: #4b5563; font-weight: bold; margin-bottom: 2px; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">${rightLabel2}</div>
    <div style="color: #1f2937;">${rightValue2}</div>` : ''}
  </div>
</div>`;
  }

  private generateTableHtml(fields: any): string {
    const codeHeader = fields.headerCode || 'Código';
    const descHeader = fields.headerDescription || 'Descripción';
    const qtyHeader = fields.headerQuantity || 'Cantidad';
    const priceHeader = fields.headerPrice || 'Precio Unitario';
    const totalHeader = fields.headerTotal || 'Total';
    const showPrices = fields.showPrices !== false;
    const notes = fields.tableNotes || '';

    const docType = this.mainForm?.get('documentType')?.value;
    const isCompra = docType === 'COMPRA';
    
    const itemCodeVar = isCompra ? '{{ item.product.code }}' : '{{ item.inventory.product.code }}';
    const itemDescVar = isCompra ? '{{ item.product.name }}' : '{{ item.inventory.product.name }}';
    const itemQtyVar = '{{ item.units }}';
    const itemPriceVar = '{{ item.priceUnit }}';
    const itemTotalVar = '{{ item.priceTotal }}';
    const totalSumVar = isCompra ? '{{ purchasing.total }}' : '{{ order.total }}';

    let colsHtml = `
      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f3f4f6; color: #374151; font-weight: bold; font-size: 12px; width: 15%;">${codeHeader}</th>
      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f3f4f6; color: #374151; font-weight: bold; font-size: 12px; width: ${showPrices ? '45%' : '70%'};">${descHeader}</th>
      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f3f4f6; color: #374151; font-weight: bold; font-size: 12px; text-align: center; width: 15%;">${qtyHeader}</th>
    `;
    
    let bodyColsHtml = `
      <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px;">${itemCodeVar}</td>
      <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px;">${itemDescVar}</td>
      <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px; text-align: center;">${itemQtyVar}</td>
    `;

    if (showPrices) {
      colsHtml += `
        <th style="border: 1px solid #ddd; padding: 8px; background-color: #f3f4f6; color: #374151; font-weight: bold; font-size: 12px; text-align: right; width: 12%;">${priceHeader}</th>
        <th style="border: 1px solid #ddd; padding: 8px; background-color: #f3f4f6; color: #374151; font-weight: bold; font-size: 12px; text-align: right; width: 13%;">${totalHeader}</th>
      `;
      bodyColsHtml += `
        <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px; text-align: right;">${itemPriceVar}</td>
        <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px; text-align: right;">${itemTotalVar}</td>
      `;
    }

    let notesHtml = '';
    if (notes) {
      notesHtml = `<div style="margin-top: 8px; font-size: 11px; color: #666; font-style: italic;">${notes}</div>`;
    }

    let totalFooterHtml = '';
    if (showPrices) {
      totalFooterHtml = `
        <div style="margin-top: 15px; text-align: right; font-family: Arial, sans-serif; font-size: 13px;">
          <strong>Total:</strong> <span style="color: #0d6efd; font-size: 15px; font-weight: bold;">${totalSumVar}</span>
        </div>
      `;
    }

    return `
<div style="margin-top: 20px; font-family: Arial, sans-serif;">
  <table style="width: 100%; border-collapse: collapse; text-align: left; border: 1px solid #ddd;">
    <thead>
      <tr>
        ${colsHtml}
      </tr>
    </thead>
    <tbody>
      <tr>
        ${bodyColsHtml}
      </tr>
    </tbody>
  </table>
  ${notesHtml}
  ${totalFooterHtml}
</div>`;
  }

  private generateFooterHtml(fields: any): string {
    const footerText = fields.footerText || '';
    const disclaimer = fields.disclaimer || '';

    return `
<div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 15px; text-align: center; font-size: 11px; color: #888; font-family: Arial, sans-serif;">
  <p style="margin: 0 0 5px 0; font-weight: 500;">${footerText}</p>
  ${disclaimer ? `<p style="margin: 0; font-size: 9px; color: #aaa; font-style: italic;">${disclaimer}</p>` : ''}
</div>`;
  }

  migrateOldSections(oldSections: any[]): SectionsJson {
    const migrated: SectionsJson = JSON.parse(JSON.stringify(MOCK_RECETARIOS_COTIZACION));

    oldSections.forEach(oldSec => {
      let targetType: 'header' | 'title' | 'subtitle' | 'table' | 'footer' | null = null;
      if (oldSec.id === 'sec-header' || oldSec.name?.toLowerCase().includes('cabecera')) {
        targetType = 'header';
      } else if (oldSec.id === 'sec-title' || oldSec.name?.toLowerCase().includes('título') || oldSec.name?.toLowerCase().includes('titulo')) {
        targetType = 'title';
      } else if (oldSec.id === 'sec-sender' || oldSec.id === 'sec-subtitle' || oldSec.name?.toLowerCase().includes('remitente') || oldSec.name?.toLowerCase().includes('detalles') || oldSec.name?.toLowerCase().includes('subtítulo') || oldSec.name?.toLowerCase().includes('subtitulo')) {
        targetType = 'subtitle';
      } else if (oldSec.id === 'sec-table' || oldSec.name?.toLowerCase().includes('tabla')) {
        targetType = 'table';
      } else if (oldSec.id === 'sec-footer' || oldSec.name?.toLowerCase().includes('pie')) {
        targetType = 'footer';
      }

      if (targetType) {
        const newSec = migrated.sections.find(s => s.type === targetType);
        if (newSec && oldSec.html_template) {
          // Fall back to clean defaults
        }
      }
    });

    return migrated;
  }

  getSafeHtml(html: string): SafeHtml {
    if (!html) return '';
    return this.sanitizer.bypassSecurityTrustHtml(html);
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

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.alertService.infoMixin.fire({
        icon: 'success',
        title: `Variable copiada: ${text}`,
        timer: 1500,
        showConfirmButton: false
      });
    });
  }

  onSubmit() {
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

  addPredefinedSection(type: 'title' | 'subtitle' | 'table') {
    const defaultTemplates = MOCK_RECETARIOS_COTIZACION.sections;
    const templateSec = defaultTemplates.find(s => s.type === type);
    if (!templateSec) return;

    const uniqueId = `sec-${type}-${Math.random().toString(36).substr(2, 9)}`;
    const newSection: SectionItem = {
      id: uniqueId,
      name: `${templateSec.name} (Copia)`,
      type: type,
      fields: JSON.parse(JSON.stringify(templateSec.fields)),
      html_template: ''
    };
    
    newSection.html_template = this.generateHtmlForSection(newSection);

    const footerIndex = this.templateData.sections.findIndex(s => s.type === 'footer');
    if (footerIndex !== -1) {
      this.templateData.sections.splice(footerIndex, 0, newSection);
    } else {
      this.templateData.sections.push(newSection);
    }

    this.selectedSection = newSection;
  }

  removeSection(section: SectionItem, event: Event) {
    event.stopPropagation();
    if (section.type === 'header' || section.type === 'footer') {
      this.alertService.infoMixin.fire({
        icon: 'warning',
        title: 'No se puede eliminar la cabecera ni el pie de página.'
      });
      return;
    }

    this.templateData.sections = this.templateData.sections.filter(s => s.id !== section.id);
    if (this.selectedSection?.id === section.id) {
      this.selectedSection = null;
    }
  }

  drop(event: CdkDragDrop<SectionItem[]>) {
    const middleSections = this.getMiddleSections();
    moveItemInArray(middleSections, event.previousIndex, event.currentIndex);
    
    const header = this.getHeaderSection();
    const footer = this.getFooterSection();
    
    const newSections: SectionItem[] = [];
    if (header) newSections.push(header);
    newSections.push(...middleSections);
    if (footer) newSections.push(footer);
    
    this.templateData.sections = newSections;
  }

  getHeaderSection(): SectionItem | undefined {
    return this.templateData.sections.find(s => s.type === 'header');
  }

  getFooterSection(): SectionItem | undefined {
    return this.templateData.sections.find(s => s.type === 'footer');
  }

  getMiddleSections(): SectionItem[] {
    return this.templateData.sections.filter(s => s.type !== 'header' && s.type !== 'footer');
  }

  onCancel() {
    this.dialogRef.close({
      success: false,
      message: 'Operación cancelada'
    });
  }
}
