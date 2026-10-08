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
import { MatSlideToggleModule, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatMenuModule } from '@angular/material/menu';
import Swal from 'sweetalert2';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { CompanyInterface } from '../../../../models/company-interface';
import {
  OFFICIAL_RECIPE_HEADER_LOGO,
  OFFICIAL_RECIPE_FOOTER_BANNER,
  RECIPE_QUOTE_CSS
} from './recipe-template.constants';

export enum TemplateMode {
  VIEW = 'view',
  EDIT = 'edit',
  CREATE = 'create'
}

export interface TableColumn {
  header: string;
  variable: string;
}

export interface SectionField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'checkbox' | 'image';
  value: any;
}

export interface SectionItem {
  id: string;
  name: string;
  type: 'header' | 'title' | 'subtitle' | 'table' | 'conditions' | 'signatures' | 'footer';
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

export const BASE_BLANK_TEMPLATE: SectionsJson = {
  sections: [
    {
      id: 'sec-header',
      name: 'Cabecera Institucional',
      type: 'header',
      fields: [
        { key: 'showLogo', label: 'Mostrar Logo', type: 'checkbox', value: true },
        { key: 'logoUrl', label: 'Logo Cabecera', type: 'image', value: '{{ companyEntity.logoOrder }}' },
        { key: 'docCode', label: 'Código Formato', type: 'text', value: 'FO-M9-P3-02- V04' },
        { key: 'docSubcode', label: 'Subcódigo Consecutivo', type: 'text', value: '1.220.30 - 27.39' },
        { key: 'docNumber', label: 'Número de Documento', type: 'text', value: '{{ order.orderCode }}' },
        { key: 'cityDate', label: 'Ciudad y Fecha', type: 'text', value: 'Santiago de Cali, {{ order.createdAt }}' }
      ],
      html_template: ''
    },
    {
      id: 'sec-footer',
      name: 'Pie de Página Institucional',
      type: 'footer',
      fields: [
        { key: 'footerUrl', label: 'Logo / Banner Pie de Página', type: 'image', value: '{{ companyEntity.footer }}' },
        { key: 'entity', label: 'Entidad', type: 'text', value: 'Gobernación Departamento del Valle del Cauca' },
        { key: 'address', label: 'Dirección Complejo', type: 'text', value: 'Carrera 76 # 4 - 30 edificio complejo integral de servicios de salud pública "Aníbal Patiño Rodríguez"' },
        { key: 'contact', label: 'Contacto y Correo', type: 'text', value: 'fre@valledelcauca.gov.co | 3104683988' }
      ],
      html_template: ''
    }
  ]
};

export const BASE_COTIZACION_MEDICAMENTOS: SectionsJson = {
  sections: [
    {
      id: 'sec-header',
      name: 'Cabecera Institucional',
      type: 'header',
      fields: [
        { key: 'showLogo', label: 'Mostrar Logo', type: 'checkbox', value: true },
        { key: 'logoUrl', label: 'Logo Cabecera', type: 'image', value: '{{ companyEntity.logoOrder }}' },
        { key: 'docCode', label: 'Código Formato', type: 'text', value: 'FO-M9-P3-02- V04' },
        { key: 'docSubcode', label: 'Subcódigo Consecutivo', type: 'text', value: '1.220.30 - 27.39' },
        { key: 'docNumber', label: 'Número de Cotización', type: 'text', value: '{{ order.orderCode }}' },
        { key: 'cityDate', label: 'Ciudad y Fecha', type: 'text', value: 'Santiago de Cali, {{ order.createdAt }}' }
      ],
      html_template: ''
    },
    {
      id: 'sec-recipient',
      name: 'Destinatario y Asunto',
      type: 'subtitle',
      fields: [
        { key: 'recipientTitle', label: 'Encabezado Destinatario', type: 'text', value: 'Señor(s):' },
        { key: 'recipientName', label: 'Nombre Destinatario', type: 'text', value: '{{ thirdParty.fullName }}' },
        { key: 'subject', label: 'Asunto del Documento', type: 'text', value: 'Asunto: Cotización.' },
        { key: 'introText', label: 'Texto de Introducción', type: 'textarea', value: 'De acuerdo a su solicitud, remitimos cotización acorde a la disponibilidad del Fondo Rotatorio de Estupefacientes FRE Valle:' }
      ],
      html_template: ''
    },
    {
      id: 'sec-table',
      name: 'Tabla de Medicamentos',
      type: 'table',
      fields: [
        { key: 'tableType', label: 'Tipo de Tabla', type: 'text', value: 'medicamentos' },
        { key: 'header_1', label: 'Cabecera Columna 1', type: 'text', value: 'Lote' },
        { key: 'var_1', label: 'Variable Columna 1', type: 'text', value: '{{ item.inventory.batch.code }}' },
        { key: 'header_2', label: 'Cabecera Columna 2', type: 'text', value: 'Nombre' },
        { key: 'var_2', label: 'Variable Columna 2', type: 'text', value: '{{ item.inventory.product.name }}' },
        { key: 'header_3', label: 'Cabecera Columna 3', type: 'text', value: 'Presentación' },
        { key: 'var_3', label: 'Variable Columna 3', type: 'text', value: '{{ item.inventory.product.presentation }}' },
        { key: 'header_4', label: 'Cabecera Columna 4', type: 'text', value: 'Fecha Vencimiento' },
        { key: 'var_4', label: 'Variable Columna 4', type: 'text', value: '{{ item.inventory.expirationDate }}' },
        { key: 'header_5', label: 'Cabecera Columna 5', type: 'text', value: 'Cantidad' },
        { key: 'var_5', label: 'Variable Columna 5', type: 'text', value: '{{ item.units }}' },
        { key: 'header_6', label: 'Cabecera Columna 6', type: 'text', value: 'Valor Unitario' },
        { key: 'var_6', label: 'Variable Columna 6', type: 'text', value: '{{ item.priceUnit }}' },
        { key: 'header_7', label: 'Cabecera Columna 7', type: 'text', value: 'Total' },
        { key: 'var_7', label: 'Variable Columna 7', type: 'text', value: '{{ item.priceTotal }}' },
        { key: 'grandTotalVar', label: 'Variable Total General', type: 'text', value: '{{ order.total }}' }
      ],
      html_template: ''
    },
    {
      id: 'sec-conditions',
      name: 'Condiciones y Normativas',
      type: 'conditions',
      fields: [
        { key: 'notesTitle', label: 'Título de Notas', type: 'text', value: 'Nota:' },
        { key: 'legalizeIntro', label: 'Título Legalización (Ítem 1)', type: 'text', value: '1. Con el fin de legalizar la cuenta, favor:' },
        {
          key: 'clause1',
          label: 'Cláusula 1: Requisitos de Pago (a, b, c, d)',
          type: 'textarea',
          value: 'a) Realice el pago en el Banco DAVIVIENDA, cuenta de ahorros # 379400001804, Departamento del Valle del Cauca-Fondo Rotatorio de Estupefacientes NIT 890399029-5.\nb) Entregue a la oficina del Fondo Rotatorio de Estupefacientes FRE Valle, un original y una copia del recibo de consignación con firma y sello del cajero, el mismo día en que se hace la consignación. Este recibo debe llevar el NIT de la institución.\nc) Para los casos de Transferencia entregar impresión a color y en estado debitado o aprobado a nombre de la Gobernación del Valle de acuerdo a la cuenta relacionada en el ítem No 1 (hoja membretada por la entidad bancaria).\nd) El pago no debe tener fecha superior a una (1) semana.'
        },
        { key: 'clause2', label: 'Cláusula 2 (Vigencia)', type: 'textarea', value: '2. Cotización válida por 08 días. Después de esta fecha no se responde por cantidades ni por precios. Pasado este lapso de tiempo antes de consignar solicitar reconfirmación de esta cotización.' },
        { key: 'clause3', label: 'Cláusula 3 (Autorización Entrega)', type: 'textarea', value: '3. Para la entrega de los medicamentos se requiere autorización escrita, firmada por el Representante Legal, el Director de la Institución o el Jefe del Servicio Farmacéutico y fotocopia de la cédula de la persona que vaya a reclamarlos.' },
        { key: 'clause4', label: 'Cláusula 4 (Cita Previa)', type: 'textarea', value: '4. La entrega de medicamentos se realiza con cita previa asignada por correo electrónico.' },
        { key: 'clause5', label: 'Cláusula 5 (Dispensación Monopolio)', type: 'textarea', value: '5. La dispensación de los Medicamentos Monopolio del Estado y los recetarios oficiales para la prescripción de Medicamentos de Control Especial en el Complejo Integral de Servicios de Salud Pública Aníbal Patiño Rodríguez - Carrera 76 No 4-30 B/ Nápoles.' },
        { key: 'thanks', label: 'Agradecimiento', type: 'text', value: 'Gracias por su atención.' },
        { key: 'farewell', label: 'Despedida', type: 'text', value: 'Atentamente,' },
        { key: 'signText', label: 'Firma y Despedida', type: 'textarea', value: 'Fondo Rotatorio de Estupefacientes del Valle del Cauca\nSecretaría Departamental de Salud del Valle' }
      ],
      html_template: ''
    },
    {
      id: 'sec-footer',
      name: 'Pie de Página Institucional',
      type: 'footer',
      fields: [
        { key: 'footerUrl', label: 'Logo / Banner Pie de Página', type: 'image', value: '{{ companyEntity.footer }}' },
        { key: 'entity', label: 'Entidad', type: 'text', value: 'Gobernación Departamento del Valle del Cauca' },
        { key: 'address', label: 'Dirección Complejo', type: 'text', value: 'Carrera 76 # 4 - 30 edificio complejo integral de servicios de salud pública "Aníbal Patiño Rodríguez"' },
        { key: 'email', label: 'Correo de Contacto', type: 'text', value: 'fre@valledelcauca.gov.co' },
        { key: 'phone', label: 'Teléfono', type: 'text', value: '3104683988' }
      ],
      html_template: ''
    }
  ]
};

export const BASE_COTIZACION_RECETARIOS: SectionsJson = {
  sections: [
    {
      id: 'sec-header',
      name: 'Cabecera Institucional',
      type: 'header',
      fields: [
        { key: 'showLogo', label: 'Mostrar Logo', type: 'checkbox', value: true },
        { key: 'logoUrl', label: 'Logo Cabecera', type: 'image', value: '{{ companyEntity.logoOrder }}' },
        { key: 'docCode', label: 'Código Formato', type: 'text', value: 'FO-M9-P3-02- V04' },
        { key: 'docSubcode', label: 'Subcódigo Consecutivo', type: 'text', value: '1.220.30 - 27.39' },
        { key: 'docNumber', label: 'Número de Cotización', type: 'text', value: '{{ order.orderCode }}' },
        { key: 'cityDate', label: 'Ciudad y Fecha', type: 'text', value: 'Santiago de Cali, {{ order.createdAt }}' }
      ],
      html_template: ''
    },
    {
      id: 'sec-recipient',
      name: 'Destinatario y Referencia',
      type: 'subtitle',
      fields: [
        { key: 'recipientTitle', label: 'Encabezado Destinatario', type: 'text', value: 'Señor. (A):' },
        { key: 'recipientName', label: 'Nombre Destinatario', type: 'text', value: '{{ thirdParty.fullName }}' },
        { key: 'subject', label: 'Referencia Documento', type: 'text', value: 'Ref: COTIZACION RECETARIOS OFICIALES PARA LA PRESCRIPCION DE MCE' }
      ],
      html_template: ''
    },
    {
      id: 'sec-table',
      name: 'Tabla de Recetarios (1 Item)',
      type: 'table',
      fields: [
        { key: 'tableType', label: 'Tipo de Tabla', type: 'text', value: 'recetarios' },
        { key: 'header_1', label: 'Cabecera Columna 1', type: 'text', value: 'Cantidad' },
        { key: 'var_1', label: 'Variable Columna 1', type: 'text', value: '{{ item.units }}' },
        { key: 'header_2', label: 'Cabecera Columna 2', type: 'text', value: 'Valor Unitario' },
        { key: 'var_2', label: 'Variable Columna 2', type: 'text', value: '{{ item.priceUnit }}' },
        { key: 'header_3', label: 'Cabecera Columna 3', type: 'text', value: 'Subtotal' },
        { key: 'var_3', label: 'Variable Columna 3', type: 'text', value: '{{ order.subtotal }}' },
        { key: 'header_4', label: 'Cabecera Columna 4', type: 'text', value: 'Iva /<br>{{order.iva}}%' },
        { key: 'var_4', label: 'Variable Columna 4', type: 'text', value: '{{ order.priceIva }}' },
        { key: 'header_5', label: 'Cabecera Columna 5', type: 'text', value: 'Valor Total' },
        { key: 'var_5', label: 'Variable Columna 5', type: 'text', value: '{{ order.total }}' },
        { key: 'grandTotalVar', label: 'Variable Total General', type: 'text', value: '{{ orderTotal }}' }
      ],
      html_template: ''
    },
    {
      id: 'sec-conditions',
      name: 'Requisitos y Reposición',
      type: 'conditions',
      fields: [
        { key: 'note1Title', label: 'Título Nota 1', type: 'text', value: 'Nota: 1.   Para reclamar los recetarios por primera vez, favor:' },
        {
          key: 'clause1',
          label: 'Nota 1: Requisitos por primera vez (Ítems A - I)',
          type: 'textarea',
          value: 'A. Original y Copia del Recibo de Consignación con Firma y sello del Cajero;\nConsignación del Banco DAVIVIENDA cuenta de ahorros No 379400001804, a nombre del\nDepartamento del Valle del Cauca - Fondo Rotatorio de Estupefacientes NIT 890399029-5\nB. Listado de Médicos u Odontólogos con La fotocopia del registro o tarjeta profesional respectiva.\nC. Autoevaluación vigente de Habilitación según Resolución 3100 del 2019 como prestadores de Servicios de Salud.\nD. Dirección de la Institución.\nE. Teléfono, Fax y Correo Electrónico de la Institución.\nF. Resolución de inscripción ante el fondo de estupefacientes si realizan la dispensación, Y utilización del medicamento en sus procedimientos.\nG. Autorización firmada por el representante legal donde delegue al personal que realizara El proceso de reclamación de los talonarios y copia de La cedula.\nH. Entrega de recetarios CITA PREVIA SOLICITADA POR CORREO ELECTRONICO.\nI. Cotización válida por 08 días. Después de esta fecha no se responde por cantidades ni por precios. Pasado este lapso de tiempo antes de consignar solicitar reconfirmación de esta cotización.'
        },
        { key: 'note2Title', label: 'Título Nota 2', type: 'text', value: 'Nota: 2.   Para reposición de los recetarios, favor:' },
        {
          key: 'clause2',
          label: 'Nota 2: Reposición de los recetarios (Ítems A - J)',
          type: 'textarea',
          value: 'A. Entrega de recetarios CITA PREVIA SOLICITADA POR CORREO ELECTRONICO.\nB. Original y Copia del Recibo de Consignación con Firma y sello del Cajero;\nConsignación del Banco DAVIVIENDA Cuenta de Ahorros # 379400001804, a nombre\ndel Departamento del Valle del Cauca - Fondo Rotatorio de Estupefacientes NIT de la\ninstitución.\nC. Oficio membretado con los datos del prestador, persona autorizada para reclamar los recetarios.\nD. Cédula de la persona autorizada.\nE. Estar al día con él envió de los anexos.\nF. Formulas anuladas.\nG. Formatos blancos que se encuentran en la última parte de los recetarios debidamente diligenciados\nH. Entrega de recetarios CITA PREVIA SOLICITADA POR CORREO ELECTRONICO.\nI. Cotización válida por 08 días. Después de esta fecha no se responde por cantidades ni por precios. Pasado este lapso de tiempo antes de consignar solicitar reconfirmación de esta cotización.\nJ. Rut actualizado'
        },
        { key: 'farewell', label: 'Despedida', type: 'text', value: 'Atentamente,' },
        { key: 'signText', label: 'Firma Institucional', type: 'textarea', value: 'Fondo Rotatorio de Estupefacientes del Valle del Cauca\nSecretaría Departamental de Salud del Valle' }
      ],
      html_template: ''
    },
    {
      id: 'sec-footer',
      name: 'Pie de Página Institucional',
      type: 'footer',
      fields: [
        { key: 'footerUrl', label: 'Logo / Banner Pie de Página', type: 'image', value: '{{ companyEntity.footer }}' },
        { key: 'entity', label: 'Entidad', type: 'text', value: 'Gobernación Departamento del Valle del Cauca' },
        { key: 'address', label: 'Dirección Complejo', type: 'text', value: 'Carrera 76 # 4 - 30 edificio complejo integral de servicios de salud pública "Aníbal Patiño Rodríguez"' },
        { key: 'email', label: 'Correo de Contacto', type: 'text', value: 'fre@valledelcauca.gov.co' },
        { key: 'phone', label: 'Teléfono', type: 'text', value: '3104683988' }
      ],
      html_template: ''
    }
  ]
};

export const BASE_ORDEN_SALIDA_MEDICAMENTOS: SectionsJson = {
  sections: [
    {
      id: 'sec-header',
      name: 'Cabecera Institucional',
      type: 'header',
      fields: [
        { key: 'showLogo', label: 'Mostrar Logo', type: 'checkbox', value: true },
        { key: 'logoUrl', label: 'Logo Cabecera', type: 'image', value: '{{ companyEntity.logoSold }}' },
        { key: 'docCode', label: 'Código Formato', type: 'text', value: 'FO-M9-P3-02- V04' },
        { key: 'docSubcode', label: 'Subcódigo Consecutivo', type: 'text', value: '1.220.30 - 27.39' },
        { key: 'docNumber', label: 'Número de Orden de Salida', type: 'text', value: 'ORDEN DE SALIDA Nº {{ order.soldCode }}' },
        { key: 'cityDate', label: 'Ciudad y Fecha', type: 'text', value: 'Santiago de Cali, {{ order.soldAt }}' }
      ],
      html_template: ''
    },
    {
      id: 'sec-recipient',
      name: 'Orden de Entrega',
      type: 'subtitle',
      fields: [
        { key: 'recipientTitle', label: 'Encabezado Destinatario', type: 'text', value: 'Coordinador Almacén' },
        { key: 'recipientName', label: 'Dependencia', type: 'text', value: 'Secretaría Departamental de Salud del Valle del Cauca' },
        { key: 'introText', label: 'Instrucción de Entrega', type: 'textarea', value: 'Sírvase ENTREGAR A {{ thirdParty.fullName }} cargo a salida de bienes, producto de la cotización No. {{ order.soldCode }} con abono mediante TRANSFERENCIA a DAVIVIENDA Cuenta de Ahorros# 379400001804 de fecha. {{ order.createdAt }}.' }
      ],
      html_template: ''
    },
    {
      id: 'sec-table',
      name: 'Tabla de Medicamentos',
      type: 'table',
      fields: [
        { key: 'tableType', label: 'Tipo de Tabla', type: 'text', value: 'medicamentos' },
        { key: 'header_1', label: 'Cabecera Columna 1', type: 'text', value: 'Lote' },
        { key: 'var_1', label: 'Variable Columna 1', type: 'text', value: '{{ item.inventory.batch.code }}' },
        { key: 'header_2', label: 'Cabecera Columna 2', type: 'text', value: 'Nombre' },
        { key: 'var_2', label: 'Variable Columna 2', type: 'text', value: '{{ item.inventory.product.name }}' },
        { key: 'header_3', label: 'Cabecera Columna 3', type: 'text', value: 'Presentación' },
        { key: 'var_3', label: 'Variable Columna 3', type: 'text', value: '{{ item.inventory.product.presentation }}' },
        { key: 'header_4', label: 'Cabecera Columna 4', type: 'text', value: 'Fecha Vencimiento' },
        { key: 'var_4', label: 'Variable Columna 4', type: 'text', value: '{{ item.inventory.expirationDate }}' },
        { key: 'header_5', label: 'Cabecera Columna 5', type: 'text', value: 'Cantidad' },
        { key: 'var_5', label: 'Variable Columna 5', type: 'text', value: '{{ item.units }}' },
        { key: 'header_6', label: 'Cabecera Columna 6', type: 'text', value: 'Valor Unitario' },
        { key: 'var_6', label: 'Variable Columna 6', type: 'text', value: '{{ item.priceUnit }}' },
        { key: 'header_7', label: 'Cabecera Columna 7', type: 'text', value: 'Total' },
        { key: 'var_7', label: 'Variable Columna 7', type: 'text', value: '{{ item.priceTotal }}' },
        { key: 'grandTotalVar', label: 'Variable Total General', type: 'text', value: '{{ order.total }}' }
      ],
      html_template: ''
    },
    {
      id: 'sec-signatures',
      name: 'Firmas de Recibido y Entrega',
      type: 'signatures',
      fields: [
        { key: 'receivedBy', label: 'Nombre quien recibe', type: 'text', value: 'RECIBÍ: ________________________________________' },
        { key: 'documentId', label: 'Cédula de quien recibe', type: 'text', value: 'CC: ____________________ de ____________________' },
        { key: 'dateReceived', label: 'Fecha de recepción', type: 'text', value: 'FECHA: Día _____ Mes _________ Año ____________' },
        { key: 'phoneContact', label: 'Teléfono o Contacto', type: 'text', value: 'Teléfono – Contacto: __________________________' },
        { key: 'signFooter', label: 'Pie de Firma Entrega', type: 'textarea', value: 'Fondo Rotatorio de Estupefacientes del Valle del Cauca\nSecretaría Departamental de Salud' }
      ],
      html_template: ''
    },
    {
      id: 'sec-footer',
      name: 'Pie de Página Institucional',
      type: 'footer',
      fields: [
        { key: 'footerUrl', label: 'Logo / Banner Pie de Página', type: 'image', value: '{{ companyEntity.footer }}' },
        { key: 'entity', label: 'Entidad', type: 'text', value: 'Gobernación Departamento del Valle del Cauca' },
        { key: 'address', label: 'Dirección Complejo', type: 'text', value: 'Carrera 76 # 4 - 30 edificio complejo integral de servicios de salud pública "Aníbal Patiño Rodríguez"' },
        { key: 'email', label: 'Correo de Contacto', type: 'text', value: 'fre@valledelcauca.gov.co' },
        { key: 'phone', label: 'Teléfono', type: 'text', value: '3104683988' }
      ],
      html_template: ''
    }
  ]
};

export const BASE_ORDEN_SALIDA_RECETARIOS: SectionsJson = {
  sections: [
    {
      id: 'sec-header',
      name: 'Cabecera Institucional',
      type: 'header',
      fields: [
        { key: 'showLogo', label: 'Mostrar Logo', type: 'checkbox', value: true },
        { key: 'logoUrl', label: 'Logo Cabecera', type: 'image', value: '{{ companyEntity.logoSold }}' },
        { key: 'docCode', label: 'Código Formato', type: 'text', value: 'FO-M9-P3-02- V04' },
        { key: 'docSubcode', label: 'Subcódigo Consecutivo', type: 'text', value: '1.220.30 - 27.39' },
        { key: 'docNumber', label: 'Número de Orden de Salida', type: 'text', value: 'ORDEN DE SALIDA Nº {{ order.soldCode }}' },
        { key: 'cityDate', label: 'Ciudad y Fecha', type: 'text', value: 'Santiago de Cali, {{ order.soldAt }}' }
      ],
      html_template: ''
    },
    {
      id: 'sec-recipient',
      name: 'Orden de Entrega',
      type: 'subtitle',
      fields: [
        { key: 'recipientTitle', label: 'Encabezado Destinatario', type: 'text', value: 'Coordinador Almacén' },
        { key: 'recipientName', label: 'Dependencia', type: 'text', value: 'Secretaría Departamental de Salud del Valle del Cauca' },
        { key: 'introText', label: 'Instrucción de Entrega', type: 'textarea', value: 'Sírvase ENTREGAR A {{ thirdParty.fullName }} cargo a salida de bienes, producto de la cotización No. {{ order.orderCode }} con abono mediante TRANSFERENCIA a DAVIVIENDA Cuenta de Ahorros# 379400001804 de fecha, {{ order.createdAt }}.' }
      ],
      html_template: ''
    },
    {
      id: 'sec-table',
      name: 'Tabla de Recetarios (1 Item)',
      type: 'table',
      fields: [
        { key: 'tableType', label: 'Tipo de Tabla', type: 'text', value: 'recetarios' },
        { key: 'header_1', label: 'Cabecera Columna 1', type: 'text', value: 'Cantidad' },
        { key: 'var_1', label: 'Variable Columna 1', type: 'text', value: '{{ item.units }}' },
        { key: 'header_2', label: 'Cabecera Columna 2', type: 'text', value: 'Valor Unitario' },
        { key: 'var_2', label: 'Variable Columna 2', type: 'text', value: '{{ item.priceUnit }}' },
        { key: 'header_3', label: 'Cabecera Columna 3', type: 'text', value: 'Subtotal' },
        { key: 'var_3', label: 'Variable Columna 3', type: 'text', value: '{{ order.subtotal }}' },
        { key: 'header_4', label: 'Cabecera Columna 4', type: 'text', value: 'Iva / {{ order.iva }}%' },
        { key: 'var_4', label: 'Variable Columna 4', type: 'text', value: '{{ order.priceIva }}' },
        { key: 'header_5', label: 'Cabecera Columna 5', type: 'text', value: 'Valor Total' },
        { key: 'var_5', label: 'Variable Columna 5', type: 'text', value: '{{ order.total }}' },
        { key: 'grandTotalVar', label: 'Variable Total General', type: 'text', value: '{{ order.total }}' }
      ],
      html_template: ''
    },
    {
      id: 'sec-signatures',
      name: 'Firmas de Recibido y Entrega',
      type: 'signatures',
      fields: [
        { key: 'receivedBy', label: 'Nombre quien recibe', type: 'text', value: 'RECIBÍ: ________________________________________' },
        { key: 'documentId', label: 'Cédula de quien recibe', type: 'text', value: 'CC: ____________________ de ____________________' },
        { key: 'dateReceived', label: 'Fecha de recepción', type: 'text', value: 'FECHA: Día _____ Mes _________ Año ____________' },
        { key: 'phoneContact', label: 'Teléfono o Contacto', type: 'text', value: 'Teléfono – Contacto: __________________________' },
        { key: 'signFooter', label: 'Pie de Firma Entrega', type: 'textarea', value: 'Fondo Rotatorio de Estupefacientes del Valle del Cauca\nSecretaría Departamental de Salud' }
      ],
      html_template: ''
    },
    {
      id: 'sec-footer',
      name: 'Pie de Página Institucional',
      type: 'footer',
      fields: [
        { key: 'footerUrl', label: 'Logo / Banner Pie de Página', type: 'image', value: '{{ companyEntity.footer }}' },
        { key: 'entity', label: 'Entidad', type: 'text', value: 'Gobernación Departamento del Valle del Cauca' },
        { key: 'address', label: 'Dirección Complejo', type: 'text', value: 'Carrera 76 # 4 - 30 edificio complejo integral de servicios de salud pública "Aníbal Patiño Rodríguez"' },
        { key: 'email', label: 'Correo de Contacto', type: 'text', value: 'fre@valledelcauca.gov.co' },
        { key: 'phone', label: 'Teléfono', type: 'text', value: '3104683988' }
      ],
      html_template: ''
    }
  ]
};

export const BASE_COMPRA_MEDICAMENTOS: SectionsJson = {
  sections: [
    {
      id: 'sec-header',
      name: 'Cabecera Institucional',
      type: 'header',
      fields: [
        { key: 'showLogo', label: 'Mostrar Logo', type: 'checkbox', value: true },
        { key: 'logoUrl', label: 'Logo Cabecera', type: 'image', value: '{{ companyEntity.logoOrder }}' },
        { key: 'docCode', label: 'Código Formato', type: 'text', value: 'FO-M9-P3-02- V04' },
        { key: 'docSubcode', label: 'Subcódigo Consecutivo', type: 'text', value: '1.220.30 - 27.39' },
        { key: 'docNumber', label: 'Número de Entrada / Compra', type: 'text', value: 'ORDEN DE COMPRA Nº {{ purchasing.code }}' },
        { key: 'cityDate', label: 'Ciudad y Fecha', type: 'text', value: 'Santiago de Cali, {{ purchasing.createdAt }}' }
      ],
      html_template: ''
    },
    {
      id: 'sec-recipient',
      name: 'Proveedor y Datos de Compra',
      type: 'subtitle',
      fields: [
        { key: 'recipientTitle', label: 'Proveedor', type: 'text', value: 'Proveedor:' },
        { key: 'recipientName', label: 'Nombre Proveedor', type: 'text', value: '{{ thirdParty.fullName }}' },
        { key: 'subject', label: 'Referencia Documento', type: 'text', value: 'Orden de Entrada / Compra de Medicamentos' },
        { key: 'introText', label: 'Observaciones / Detalle', type: 'textarea', value: 'Entrada de medicamentos a almacén FRE Valle.' }
      ],
      html_template: ''
    },
    {
      id: 'sec-table',
      name: 'Tabla de Compra Medicamentos',
      type: 'table',
      fields: [
        { key: 'header_1', label: 'Cabecera Columna 1', type: 'text', value: 'Código' },
        { key: 'var_1', label: 'Variable Columna 1', type: 'text', value: '{{ item.product.code }}' },
        { key: 'header_2', label: 'Cabecera Columna 2', type: 'text', value: 'Descripción' },
        { key: 'var_2', label: 'Variable Columna 2', type: 'text', value: '{{ item.product.name }}' },
        { key: 'header_3', label: 'Cabecera Columna 3', type: 'text', value: 'Cantidad' },
        { key: 'var_3', label: 'Variable Columna 3', type: 'text', value: '{{ item.units }}' },
        { key: 'header_4', label: 'Cabecera Columna 4', type: 'text', value: 'Precio Unitario' },
        { key: 'var_4', label: 'Variable Columna 4', type: 'text', value: '{{ item.priceUnit }}' },
        { key: 'header_5', label: 'Cabecera Columna 5', type: 'text', value: 'Total' },
        { key: 'var_5', label: 'Variable Columna 5', type: 'text', value: '{{ item.priceTotal }}' },
        { key: 'grandTotalVar', label: 'Variable Total General', type: 'text', value: '{{ purchasing.total }}' }
      ],
      html_template: ''
    },
    {
      id: 'sec-signatures',
      name: 'Firmas de Recepción',
      type: 'signatures',
      fields: [
        { key: 'receivedBy', label: 'Recibido por', type: 'text', value: 'RECIBÍ CONFORME: _____________________________' },
        { key: 'documentId', label: 'Identificación', type: 'text', value: 'CC: _____________________ de ________________' },
        { key: 'dateReceived', label: 'Fecha de recepción', type: 'text', value: 'FECHA: Día _______ Mes _________ Año _________' },
        { key: 'signFooter', label: 'Responsable Almacén', type: 'textarea', value: 'Fondo Rotatorio de Estupefacientes del Valle del Cauca' }
      ],
      html_template: ''
    },
    {
      id: 'sec-footer',
      name: 'Pie de Página Institucional',
      type: 'footer',
      fields: [
        { key: 'footerUrl', label: 'Logo / Banner Pie de Página', type: 'image', value: '{{ companyEntity.footer }}' },
        { key: 'entity', label: 'Entidad', type: 'text', value: 'Gobernación Departamento del Valle del Cauca' },
        { key: 'address', label: 'Dirección Complejo', type: 'text', value: 'Carrera 76 # 4 - 30 edificio complejo integral de servicios de salud pública "Aníbal Patiño Rodríguez"' },
        { key: 'email', label: 'Correo de Contacto', type: 'text', value: 'fre@valledelcauca.gov.co' },
        { key: 'phone', label: 'Teléfono', type: 'text', value: '3104683988' }
      ],
      html_template: ''
    }
  ]
};

export const BASE_COMPRA_RECETARIOS: SectionsJson = {
  sections: [
    {
      id: 'sec-header',
      name: 'Cabecera Institucional',
      type: 'header',
      fields: [
        { key: 'showLogo', label: 'Mostrar Logo', type: 'checkbox', value: true },
        { key: 'logoUrl', label: 'Logo Cabecera', type: 'image', value: '{{ companyEntity.logoOrder }}' },
        { key: 'docCode', label: 'Código Formato', type: 'text', value: 'FO-M9-P3-02- V04' },
        { key: 'docSubcode', label: 'Subcódigo Consecutivo', type: 'text', value: '1.220.30 - 27.39' },
        { key: 'docNumber', label: 'Número de Entrada / Compra', type: 'text', value: 'ORDEN DE COMPRA RECETARIOS Nº {{ purchasing.code }}' },
        { key: 'cityDate', label: 'Ciudad y Fecha', type: 'text', value: 'Santiago de Cali, {{ purchasing.createdAt }}' }
      ],
      html_template: ''
    },
    {
      id: 'sec-recipient',
      name: 'Proveedor y Referencia',
      type: 'subtitle',
      fields: [
        { key: 'recipientTitle', label: 'Proveedor', type: 'text', value: 'Proveedor:' },
        { key: 'recipientName', label: 'Nombre Proveedor', type: 'text', value: '{{ thirdParty.fullName }}' },
        { key: 'subject', label: 'Referencia Documento', type: 'text', value: 'Entrada Talonarios Recetarios Oficiales' }
      ],
      html_template: ''
    },
    {
      id: 'sec-table',
      name: 'Tabla de Recetarios (Entrada)',
      type: 'table',
      fields: [
        { key: 'header_1', label: 'Cabecera Columna 1', type: 'text', value: 'Cantidad' },
        { key: 'var_1', label: 'Variable Columna 1', type: 'text', value: '{{ item.units }}' },
        { key: 'header_2', label: 'Cabecera Columna 2', type: 'text', value: 'Descripción' },
        { key: 'var_2', label: 'Variable Columna 2', type: 'text', value: 'TALONARIOS DE RECETARIOS OFICIALES' },
        { key: 'header_3', label: 'Cabecera Columna 3', type: 'text', value: 'Serial Inicial' },
        { key: 'var_3', label: 'Variable Columna 3', type: 'text', value: '{{ item.serialInit }}' },
        { key: 'header_4', label: 'Cabecera Columna 4', type: 'text', value: 'Serial Final' },
        { key: 'var_4', label: 'Variable Columna 4', type: 'text', value: '{{ item.serialFinal }}' },
        { key: 'header_5', label: 'Cabecera Columna 5', type: 'text', value: 'Valor Unitario' },
        { key: 'var_5', label: 'Variable Columna 5', type: 'text', value: '{{ item.priceUnit }}' },
        { key: 'header_6', label: 'Cabecera Columna 6', type: 'text', value: 'Total' },
        { key: 'var_6', label: 'Variable Columna 6', type: 'text', value: '{{ item.priceTotal }}' },
        { key: 'grandTotalVar', label: 'Variable Total General', type: 'text', value: '{{ purchasing.total }}' }
      ],
      html_template: ''
    },
    {
      id: 'sec-signatures',
      name: 'Firmas de Recepción',
      type: 'signatures',
      fields: [
        { key: 'receivedBy', label: 'Recibido por', type: 'text', value: 'RECIBÍ CONFORME: _____________________________' },
        { key: 'documentId', label: 'Identificación', type: 'text', value: 'CC: _____________________ de ________________' },
        { key: 'dateReceived', label: 'Fecha de recepción', type: 'text', value: 'FECHA: Día _______ Mes _________ Año _________' },
        { key: 'signFooter', label: 'Responsable Almacén', type: 'textarea', value: 'Fondo Rotatorio de Estupefacientes del Valle del Cauca' }
      ],
      html_template: ''
    },
    {
      id: 'sec-footer',
      name: 'Pie de Página Institucional',
      type: 'footer',
      fields: [
        { key: 'footerUrl', label: 'Logo / Banner Pie de Página', type: 'image', value: '{{ companyEntity.footer }}' },
        { key: 'entity', label: 'Entidad', type: 'text', value: 'Gobernación Departamento del Valle del Cauca' },
        { key: 'address', label: 'Dirección Complejo', type: 'text', value: 'Carrera 76 # 4 - 30 edificio complejo integral de servicios de salud pública "Aníbal Patiño Rodríguez"' },
        { key: 'email', label: 'Correo de Contacto', type: 'text', value: 'fre@valledelcauca.gov.co' },
        { key: 'phone', label: 'Teléfono', type: 'text', value: '3104683988' }
      ],
      html_template: ''
    }
  ]
};

const MOCK_RECETARIOS_COTIZACION: SectionsJson = BASE_COTIZACION_RECETARIOS;

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
    MatTooltipModule,
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
  initialIsDefault = false;
  mainForm!: FormGroup;

  // JSON State
  templateData: SectionsJson = { sections: [] };
  selectedSection: SectionItem | null = null;
  showVariables = false;
  companyData: CompanyInterface | null = null;

  availableCategories = ['MEDICAMENTOS', 'MEDICAMENTOS_SP', 'RECETARIOS'];
  availableDocumentTypes = ['COTIZACION', 'VENTA', 'COMPRA'];

  selectedStandardTemplateKey: string = '';

  standardTemplatesList = [
    { key: 'EMPTY', label: 'Plantilla en Blanco (Desde Cero)', category: 'MEDICAMENTOS', docType: 'COTIZACION', defaultName: 'Nueva Plantilla' },
    { key: 'COTIZACION_MEDICAMENTOS', label: 'Cotización Medicamentos', category: 'MEDICAMENTOS', docType: 'COTIZACION', defaultName: 'Cotización Medicamentos' },
    { key: 'COTIZACION_RECETARIOS', label: 'Cotización Recetarios', category: 'RECETARIOS', docType: 'COTIZACION', defaultName: 'Cotización Recetarios' },
    { key: 'ORDEN_SALIDA_MEDICAMENTOS', label: 'Orden de Salida Medicamentos', category: 'MEDICAMENTOS', docType: 'VENTA', defaultName: 'Orden de Salida Medicamentos' },
    { key: 'ORDEN_SALIDA_RECETARIOS', label: 'Orden de Salida Recetarios', category: 'RECETARIOS', docType: 'VENTA', defaultName: 'Orden de Salida Recetarios' },
    { key: 'COMPRA_MEDICAMENTOS', label: 'Orden de Compra Medicamentos', category: 'MEDICAMENTOS', docType: 'COMPRA', defaultName: 'Orden de Compra Medicamentos' },
    { key: 'COMPRA_RECETARIOS', label: 'Orden de Compra Recetarios', category: 'RECETARIOS', docType: 'COMPRA', defaultName: 'Orden de Compra Recetarios' }
  ];

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

    // Listen to document type changes ONLY to check combination default status
    this.mainForm.get('documentType')?.valueChanges.subscribe((newDocType) => {
      this.checkCombinationDefaultStatus(this.mainForm.get('category')?.value, newDocType);
    });

    this.mainForm.get('category')?.valueChanges.subscribe((newCat) => {
      this.checkCombinationDefaultStatus(newCat, this.mainForm.get('documentType')?.value);
    });
  }

  onSelectStandardTemplate(key: string) {
    this.selectedStandardTemplateKey = key;
    const item = this.standardTemplatesList.find(t => t.key === key);
    if (!item) return;

    this.mainForm.patchValue({
      category: item.category,
      documentType: item.docType,
      name: item.defaultName
    });

    let templateJson: SectionsJson;
    switch (key) {
      case 'EMPTY':
        templateJson = JSON.parse(JSON.stringify(BASE_BLANK_TEMPLATE));
        break;
      case 'COTIZACION_MEDICAMENTOS':
        templateJson = JSON.parse(JSON.stringify(BASE_COTIZACION_MEDICAMENTOS));
        break;
      case 'COTIZACION_RECETARIOS':
        templateJson = JSON.parse(JSON.stringify(BASE_COTIZACION_RECETARIOS));
        break;
      case 'ORDEN_SALIDA_MEDICAMENTOS':
        templateJson = JSON.parse(JSON.stringify(BASE_ORDEN_SALIDA_MEDICAMENTOS));
        break;
      case 'ORDEN_SALIDA_RECETARIOS':
        templateJson = JSON.parse(JSON.stringify(BASE_ORDEN_SALIDA_RECETARIOS));
        break;
      case 'COMPRA_MEDICAMENTOS':
        templateJson = JSON.parse(JSON.stringify(BASE_COMPRA_MEDICAMENTOS));
        break;
      case 'COMPRA_RECETARIOS':
        templateJson = JSON.parse(JSON.stringify(BASE_COMPRA_RECETARIOS));
        break;
      default:
        templateJson = JSON.parse(JSON.stringify(BASE_COTIZACION_MEDICAMENTOS));
    }

    this.templateData = templateJson;
    if (key === 'COTIZACION_RECETARIOS') {
      this.ensureRecipeTemplateFields();
    } else if (key === 'COTIZACION_MEDICAMENTOS') {
      this.ensureMedicineTemplateFields();
    } else if (key === 'ORDEN_SALIDA_MEDICAMENTOS') {
      this.ensureMedicineSaleOrderTemplateFields();
    } else if (key === 'ORDEN_SALIDA_RECETARIOS') {
      this.ensureRecipeSaleOrderTemplateFields();
    }
    this.templateData.sections.forEach(sec => {
      sec.html_template = this.generateHtmlForSection(sec);
    });

    this.selectedSection = null;
    this.alertService.infoMixin.fire({
      icon: 'success',
      title: `Formato estándar cargado: ${item.label}`
    });
  }

  ngOnInit() {
    this.loadCompanyData();

    if (this.mode === TemplateMode.CREATE) {
      let initCat = this.mainForm.get('category')?.value;
      let initDocType = this.mainForm.get('documentType')?.value;
      if (initCat === 'RECETARIOS' && initDocType === 'VENTA') {
        this.selectedStandardTemplateKey = 'ORDEN_SALIDA_RECETARIOS';
        this.templateData = JSON.parse(JSON.stringify(BASE_ORDEN_SALIDA_RECETARIOS));
        this.mainForm.patchValue({ name: 'Orden de Salida Recetarios' });
        this.ensureRecipeSaleOrderTemplateFields();
      } else if (initCat === 'RECETARIOS' && initDocType === 'COMPRA') {
        this.selectedStandardTemplateKey = 'COMPRA_RECETARIOS';
        this.templateData = JSON.parse(JSON.stringify(BASE_COMPRA_RECETARIOS));
        this.mainForm.patchValue({ name: 'Orden de Compra Recetarios' });
      } else if (initCat === 'RECETARIOS') {
        this.selectedStandardTemplateKey = 'COTIZACION_RECETARIOS';
        this.templateData = JSON.parse(JSON.stringify(BASE_COTIZACION_RECETARIOS));
        this.mainForm.patchValue({ name: 'Cotización Recetarios' });
        this.ensureRecipeTemplateFields();
      } else if ((initCat === 'MEDICAMENTOS' || initCat === 'MEDICAMENTOS_SP') && initDocType === 'VENTA') {
        this.selectedStandardTemplateKey = 'ORDEN_SALIDA_MEDICAMENTOS';
        this.templateData = JSON.parse(JSON.stringify(BASE_ORDEN_SALIDA_MEDICAMENTOS));
        this.mainForm.patchValue({ name: 'Orden de Salida Medicamentos' });
        this.ensureMedicineSaleOrderTemplateFields();
      } else if ((initCat === 'MEDICAMENTOS' || initCat === 'MEDICAMENTOS_SP') && initDocType === 'COMPRA') {
        this.selectedStandardTemplateKey = 'COMPRA_MEDICAMENTOS';
        this.templateData = JSON.parse(JSON.stringify(BASE_COMPRA_MEDICAMENTOS));
        this.mainForm.patchValue({ name: 'Orden de Compra Medicamentos' });
      } else {
        this.selectedStandardTemplateKey = 'COTIZACION_MEDICAMENTOS';
        this.templateData = JSON.parse(JSON.stringify(BASE_COTIZACION_MEDICAMENTOS));
        this.mainForm.patchValue({ name: 'Cotización Medicamentos' });
        this.ensureMedicineTemplateFields();
      }

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
      this.initialIsDefault = !!this.data.data.isDefault;
      this.mainForm.patchValue({
        name: this.data.data.name,
        documentType: this.data.data.documentType,
        category: this.data.data.category,
        isDefault: this.data.data.isDefault
      });
      if (this.data.data.category === 'RECETARIOS' && this.data.data.documentType === 'COTIZACION') {
        this.selectedStandardTemplateKey = 'COTIZACION_RECETARIOS';
      } else if (this.data.data.category === 'RECETARIOS' && this.data.data.documentType === 'VENTA') {
        this.selectedStandardTemplateKey = 'ORDEN_SALIDA_RECETARIOS';
      } else if (this.data.data.category === 'RECETARIOS' && this.data.data.documentType === 'COMPRA') {
        this.selectedStandardTemplateKey = 'COMPRA_RECETARIOS';
      } else if ((this.data.data.category === 'MEDICAMENTOS' || this.data.data.category === 'MEDICAMENTOS_SP') && this.data.data.documentType === 'COTIZACION') {
        this.selectedStandardTemplateKey = 'COTIZACION_MEDICAMENTOS';
      } else if ((this.data.data.category === 'MEDICAMENTOS' || this.data.data.category === 'MEDICAMENTOS_SP') && this.data.data.documentType === 'VENTA') {
        this.selectedStandardTemplateKey = 'ORDEN_SALIDA_MEDICAMENTOS';
      } else if ((this.data.data.category === 'MEDICAMENTOS' || this.data.data.category === 'MEDICAMENTOS_SP') && this.data.data.documentType === 'COMPRA') {
        this.selectedStandardTemplateKey = 'COMPRA_MEDICAMENTOS';
      }
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

        this.ensureRecipeTemplateFields();
        this.ensureMedicineTemplateFields();
        this.ensureMedicineSaleOrderTemplateFields();
        this.ensureRecipeSaleOrderTemplateFields();

        // Ensure image fields have proper type for loaded templates
        this.templateData.sections.forEach(sec => {
          if (sec.fields) {
            sec.fields.forEach(f => {
              if (f.key === 'logoUrl' || f.key === 'footerUrl' || f.key.toLowerCase().includes('logo') || f.key.toLowerCase().includes('footerurl')) {
                f.type = 'image';
              }
            });
          }
          sec.html_template = this.generateHtmlForSection(sec);
        });
      }
    }
  }

  loadCompanyData() {
    this.restService.getRequest('/company').subscribe({
      next: (res) => {
        this.companyData = res?.data || res;
        // Regenerate HTML with company data if needed
        this.templateData.sections.forEach(sec => {
          sec.html_template = this.generateHtmlForSection(sec);
        });
      },
      error: () => { }
    });
  }

  enableEditMode() {
    this.isViewMode = false;
    this.mode = TemplateMode.EDIT;
    this.title.set(`Editar Plantilla A4`);
    this.mainForm.enable();
  }

  onToggleDefault(event: MatSlideToggleChange) {
    const isChecked = event.checked;
    const formValue = this.mainForm.value;
    const documentType = formValue.documentType;
    const category = formValue.category;

    const params: any = {
      documentType: documentType,
      category: category
    };
    if (this.templateId) {
      params.excludeId = this.templateId;
    }

    if (!isChecked) {
      // Usuario desactiva la casilla predeterminada
      this.restService.getRequest('/document-templates/check-default', params).subscribe({
        next: (res: any) => {
          if (!res.hasDefault) {
            Swal.fire({
              icon: 'warning',
              title: 'Advertencia: Sin plantilla predeterminada',
              text: `La categoría "${category}" y tipo de documento "${documentType}" no cuenta con ninguna otra plantilla predeterminada. Si la deshabilita, el sistema no tendrá una plantilla oficial asignada para generar estos documentos.`,
              confirmButtonText: 'Entendido',
              confirmButtonColor: '#3d5a80',
              target: 'mat-dialog-container',
              customClass: {
                container: 'swal2-on-top'
              }
            });
          }
        },
        error: (err) => {
          console.error('Error al verificar plantilla predeterminada', err);
        }
      });
    } else {
      // Usuario activa la casilla predeterminada
      this.restService.getRequest('/document-templates/check-default', params).subscribe({
        next: (res: any) => {
          if (res.hasDefault && res.defaultTemplateName) {
            this.alertService.infoMixin.fire({
              icon: 'info',
              title: `Al guardar, esta plantilla pasará a ser la única predeterminada y reemplazará a "${res.defaultTemplateName}".`
            });
          }
        },
        error: (err) => {
          console.error('Error al verificar plantilla predeterminada', err);
        }
      });
    }
  }

  private checkCombinationDefaultStatus(cat: string, docType: string) {
    if (!cat || !docType) return;
    const isDefault = this.mainForm.get('isDefault')?.value;
    if (isDefault) {
      const params: any = {
        documentType: docType,
        category: cat
      };
      if (this.templateId) {
        params.excludeId = this.templateId;
      }
      this.restService.getRequest('/document-templates/check-default', params).subscribe({
        next: (res: any) => {
          if (res.hasDefault && res.defaultTemplateName) {
            this.alertService.infoMixin.fire({
              icon: 'info',
              title: `Esta combinación ya tiene la plantilla predeterminada "${res.defaultTemplateName}". Al guardar, será reemplazada.`
            });
          }
        },
        error: () => {}
      });
    }
  }

  selectSection(section: SectionItem) {
    if (section && section.type === 'table') {
      this.migrateTableSectionIfNeeded(section);
    }
    this.selectedSection = section;
  }

  onFieldChange(section: SectionItem) {
    section.html_template = this.generateHtmlForSection(section);
  }

  formatImageSrc(src: string): string {
    if (!src) return '';
    const trimmed = src.trim();
    if (
      trimmed.startsWith('data:') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('{{') ||
      trimmed.startsWith('/') ||
      trimmed.startsWith('assets/')
    ) {
      return trimmed;
    }
    // If it is a raw base64 string
    return `data:image/png;base64,${trimmed}`;
  }

  onImageFileSelected(event: any, field: SectionField, section: SectionItem) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        field.value = reader.result as string;
        this.onFieldChange(section);
      };
      reader.readAsDataURL(file);
    }
  }

  clearImageField(field: SectionField, section: SectionItem) {
    field.value = '';
    this.onFieldChange(section);
  }

  isRecipeQuoteTemplate(): boolean {
    return this.selectedStandardTemplateKey === 'COTIZACION_RECETARIOS';
  }

  isMedicineQuoteTemplate(): boolean {
    return this.selectedStandardTemplateKey === 'COTIZACION_MEDICAMENTOS';
  }

  isMedicineSaleOrderTemplate(): boolean {
    return this.selectedStandardTemplateKey === 'ORDEN_SALIDA_MEDICAMENTOS';
  }

  isRecipeSaleOrderTemplate(): boolean {
    return this.selectedStandardTemplateKey === 'ORDEN_SALIDA_RECETARIOS';
  }

  isOfficialLetterQuoteTemplate(): boolean {
    return this.isRecipeQuoteTemplate() || this.isMedicineQuoteTemplate();
  }

  isOfficialLetterTemplate(): boolean {
    return this.isOfficialLetterQuoteTemplate() || this.isMedicineSaleOrderTemplate() || this.isRecipeSaleOrderTemplate();
  }

  getSectionById(id: string): SectionItem | undefined {
    return this.templateData.sections.find(s => s.id === id);
  }

  selectSectionById(id: string): void {
    const sec = this.getSectionById(id);
    if (sec) {
      this.selectSection(sec);
    }
  }

  getField(sectionId: string, fieldKey: string, defaultValue: any = ''): any {
    const section = this.getSectionById(sectionId);
    if (!section) return defaultValue;
    const field = section.fields.find(f => f.key === fieldKey);
    return field && field.value !== undefined && field.value !== null && field.value !== '' ? field.value : defaultValue;
  }

  parseNoteItems(text: string): { letter: string, text: string }[] {
    if (!text) return [];
    const lines = text.split('\n');
    const items: { letter: string, text: string }[] = [];
    let currentItem: { letter: string, text: string } | null = null;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      const match = line.match(/^([A-Z]\.)\s*(.*)$/);
      if (match) {
        if (currentItem) {
          items.push(currentItem);
        }
        currentItem = { letter: match[1], text: match[2] };
      } else {
        if (currentItem) {
          currentItem.text += '<br>' + line;
        } else {
          currentItem = { letter: '•', text: line };
        }
      }
    }
    if (currentItem) {
      items.push(currentItem);
    }
    return items;
  }

  getNote1Page1Items(): { letter: string, text: string }[] {
    const clause1 = this.getField('sec-conditions', 'clause1', '');
    const items = this.parseNoteItems(clause1);
    return items.slice(0, 8);
  }

  getNote1Page2Items(): { letter: string, text: string }[] {
    const clause1 = this.getField('sec-conditions', 'clause1', '');
    const items = this.parseNoteItems(clause1);
    return items.slice(8);
  }

  getNote2Items(): { letter: string, text: string }[] {
    const clause2 = this.getField('sec-conditions', 'clause2', '');
    return this.parseNoteItems(clause2);
  }

  parseMedicineLetterItems(text: string): { letter: string, text: string }[] {
    if (!text) return [];
    const lines = text.split('\n');
    const items: { letter: string, text: string }[] = [];
    let currentItem: { letter: string, text: string } | null = null;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      if (line.toLowerCase().includes('con el fin de legalizar') || line.startsWith('1.')) {
        continue;
      }
      const match = line.match(/^([a-zA-Z]\)|\([a-zA-Z]\)|[a-zA-Z]\.)\s*(.*)$/);
      if (match) {
        if (currentItem) {
          items.push(currentItem);
        }
        currentItem = { letter: match[1], text: match[2] };
      } else {
        if (currentItem) {
          currentItem.text += ' ' + line;
        } else {
          currentItem = { letter: '•', text: line };
        }
      }
    }
    if (currentItem) {
      items.push(currentItem);
    }
    return items;
  }

  getMedicineNote1Page1Items(): { letter: string, text: string }[] {
    const clause1 = this.getField('sec-conditions', 'clause1', '');
    const items = this.parseMedicineLetterItems(clause1);
    return items.slice(0, 3);
  }

  getMedicineNote1Page2Items(): { letter: string, text: string }[] {
    const clause1 = this.getField('sec-conditions', 'clause1', '');
    const items = this.parseMedicineLetterItems(clause1);
    return items.slice(3);
  }

  getSignatureLines(): string[] {
    const signText = this.getField('sec-conditions', 'signText', 'Fondo Rotatorio de Estupefacientes del Valle del Cauca\nSecretaría Departamental de Salud del Valle');
    if (!signText) return [];
    return signText.split('\n').map((l: string) => l.trim()).filter((l: string) => !!l);
  }

  getSaleSignatureLines(): string[] {
    const signText = this.getField('sec-signatures', 'signFooter', 'Fondo Rotatorio de Estupefacientes del Valle del Cauca\nSecretaría Departamental de Salud');
    if (!signText) return [];
    return signText.split('\n').map((l: string) => l.trim()).filter((l: string) => !!l);
  }

  getHeaderLogoSrc(): string {
    const custom = this.getField('sec-header', 'logoUrl', '');
    if (custom && !custom.includes('{{') && custom.trim() !== '') {
      return this.formatImageSrc(custom);
    }
    if ((this.isMedicineSaleOrderTemplate() || this.isRecipeSaleOrderTemplate()) && this.companyData?.logoSold) {
      return this.formatImageSrc(this.companyData.logoSold);
    }
    if (this.companyData?.logoOrder) {
      return this.formatImageSrc(this.companyData.logoOrder);
    }
    return OFFICIAL_RECIPE_HEADER_LOGO;
  }

  getFooterBannerSrc(): string {
    const custom = this.getField('sec-footer', 'footerUrl', '');
    if (custom && !custom.includes('{{') && custom.trim() !== '') {
      return this.formatImageSrc(custom);
    }
    if (this.companyData?.footer) {
      return this.formatImageSrc(this.companyData.footer);
    }
    return OFFICIAL_RECIPE_FOOTER_BANNER;
  }

  Math = Math;

  trackByColIndex(index: number, item: any): number {
    return item?.index !== undefined ? item.index : index;
  }

  migrateTableSectionIfNeeded(section: SectionItem): void {
    if (!section || section.type !== 'table' || !section.fields) return;
    const hasIndexed = section.fields.some(f => f.key.startsWith('header_') || f.key.startsWith('var_'));
    if (!hasIndexed) {
      const cols = this.getTableColumns(section);
      this.syncTableColumnsToFields(section, cols);
    }
  }

  getTableColumnPairs(section?: SectionItem | null): { index: number; headerField: SectionField; varField: SectionField }[] {
    if (!section || section.type !== 'table') {
      section = this.getSectionById('sec-table') || this.templateData.sections.find(s => s.type === 'table') || null;
    }
    if (!section || !section.fields) return [];

    const pairsMap: { [index: number]: { headerField?: SectionField; varField?: SectionField } } = {};

    section.fields.forEach(f => {
      const headerMatch = f.key.match(/^header_(\d+)$/);
      const varMatch = f.key.match(/^var_(\d+)$/);
      if (headerMatch) {
        const idx = parseInt(headerMatch[1], 10);
        if (!pairsMap[idx]) pairsMap[idx] = {};
        pairsMap[idx].headerField = f;
      } else if (varMatch) {
        const idx = parseInt(varMatch[1], 10);
        if (!pairsMap[idx]) pairsMap[idx] = {};
        pairsMap[idx].varField = f;
      }
    });

    const indices = Object.keys(pairsMap).map(k => parseInt(k, 10)).sort((a, b) => a - b);
    const result: { index: number; headerField: SectionField; varField: SectionField }[] = [];

    indices.forEach(idx => {
      let h = pairsMap[idx].headerField;
      let v = pairsMap[idx].varField;
      if (!h) {
        h = { key: `header_${idx}`, label: `Cabecera Columna ${idx}`, type: 'text', value: `Columna ${idx}` };
        section!.fields.push(h);
      }
      if (!v) {
        v = { key: `var_${idx}`, label: `Variable Columna ${idx}`, type: 'text', value: '{{ item.units }}' };
        section!.fields.push(v);
      }
      result.push({ index: idx, headerField: h, varField: v });
    });

    return result;
  }

  getTableColumns(section?: SectionItem | null): TableColumn[] {
    if (!section || section.type !== 'table') {
      section = this.getSectionById('sec-table') || this.templateData.sections.find(s => s.type === 'table') || null;
    }
    if (!section || !section.fields) return [];

    // Check if we already have indexed fields
    const indexedCols: { [index: number]: TableColumn } = {};
    const legacyHeaders: { key: string; label: string; val: string }[] = [];
    const legacyVars: { key: string; label: string; val: string }[] = [];

    section.fields.forEach(f => {
      const headerMatch = f.key.match(/^header_(\d+)$/);
      const varMatch = f.key.match(/^var_(\d+)$/);

      if (headerMatch) {
        const idx = parseInt(headerMatch[1], 10);
        if (!indexedCols[idx]) indexedCols[idx] = { header: '', variable: '' };
        indexedCols[idx].header = f.value || '';
      } else if (varMatch) {
        const idx = parseInt(varMatch[1], 10);
        if (!indexedCols[idx]) indexedCols[idx] = { header: '', variable: '' };
        indexedCols[idx].variable = f.value || '';
      } else if (f.key.startsWith('header') && f.key !== 'headerTitle') {
        legacyHeaders.push({ key: f.key, label: f.label, val: f.value });
      } else if (f.key.startsWith('var') && f.key !== 'grandTotalVar') {
        legacyVars.push({ key: f.key, label: f.label, val: f.value });
      }
    });

    const indexedKeys = Object.keys(indexedCols).map(k => parseInt(k, 10)).sort((a, b) => a - b);
    if (indexedKeys.length > 0) {
      return indexedKeys.map(k => indexedCols[k]);
    }

    if (legacyHeaders.length > 0) {
      return legacyHeaders.map((h, i) => {
        const suffix = h.key.replace(/^header/, '');
        const matchedVar = legacyVars.find(v => v.key === 'var' + suffix) || legacyVars[i];
        return {
          header: h.val || '',
          variable: matchedVar ? matchedVar.val : ''
        };
      });
    }

    return [
      { header: 'Columna 1', variable: '{{ item.units }}' }
    ];
  }

  addTableColumn(section: SectionItem): void {
    this.migrateTableSectionIfNeeded(section);
    const columns = this.getTableColumns(section);
    const nextNum = columns.length + 1;
    columns.push({
      header: `Columna ${nextNum}`,
      variable: '{{ item.units }}'
    });
    this.syncTableColumnsToFields(section, columns);
  }

  removeTableColumn(section: SectionItem, colIndex: number): void {
    this.migrateTableSectionIfNeeded(section);
    const columns = this.getTableColumns(section);
    if (columns.length <= 1) {
      this.alertService.infoMixin.fire({
        icon: 'warning',
        title: 'La tabla debe tener al menos una columna.'
      });
      return;
    }
    const idxToRemove = colIndex - 1;
    if (idxToRemove >= 0 && idxToRemove < columns.length) {
      columns.splice(idxToRemove, 1);
      this.syncTableColumnsToFields(section, columns);
    }
  }

  getNonColumnTableFields(section?: SectionItem | null): SectionField[] {
    if (!section || section.type !== 'table') return [];
    return section.fields.filter(f => 
      !f.key.startsWith('header_') && 
      !f.key.startsWith('var_') && 
      !f.key.startsWith('headerBatch') &&
      !f.key.startsWith('headerProduct') &&
      !f.key.startsWith('headerPresentation') &&
      !f.key.startsWith('headerExpiration') &&
      !f.key.startsWith('headerQuantity') &&
      !f.key.startsWith('headerPriceUnit') &&
      !f.key.startsWith('headerSubtotal') &&
      !f.key.startsWith('headerIva') &&
      !f.key.startsWith('headerTotal') &&
      !f.key.startsWith('headerDescription') &&
      !f.key.startsWith('headerCode') &&
      !f.key.startsWith('headerPrice') &&
      !f.key.startsWith('varBatch') &&
      !f.key.startsWith('varProduct') &&
      !f.key.startsWith('varPresentation') &&
      !f.key.startsWith('varExpiration') &&
      !f.key.startsWith('varQuantity') &&
      !f.key.startsWith('varPriceUnit') &&
      !f.key.startsWith('varSubtotal') &&
      !f.key.startsWith('varIva') &&
      !f.key.startsWith('varTotal') &&
      !f.key.startsWith('varDescription') &&
      !f.key.startsWith('varCode') &&
      !f.key.startsWith('varPrice') &&
      f.key !== 'tableType'
    );
  }

  syncTableColumnsToFields(section: SectionItem, columns: TableColumn[]): void {
    if (!section) return;

    const nonColFields = this.getNonColumnTableFields(section);

    const newColFields: SectionField[] = [];
    columns.forEach((col, idx) => {
      const num = idx + 1;
      newColFields.push({
        key: `header_${num}`,
        label: `Cabecera Columna ${num}`,
        type: 'text',
        value: col.header
      });
      newColFields.push({
        key: `var_${num}`,
        label: `Variable Columna ${num}`,
        type: 'text',
        value: col.variable
      });
    });

    section.fields = [...newColFields, ...nonColFields];
    section.html_template = this.generateHtmlForSection(section);
  }

  ensureRecipeTemplateFields(): void {
    if (!this.isRecipeQuoteTemplate()) return;
    const base = BASE_COTIZACION_RECETARIOS;
    base.sections.forEach(baseSec => {
      let existingSec = this.templateData.sections.find(s => s.id === baseSec.id || s.type === baseSec.type);
      if (!existingSec) {
        this.templateData.sections.push(JSON.parse(JSON.stringify(baseSec)));
      } else {
        baseSec.fields.forEach(bf => {
          if (baseSec.type === 'table' && (bf.key.startsWith('header_') || bf.key.startsWith('var_') || bf.key.startsWith('header') || bf.key.startsWith('var'))) {
            const hasAnyCols = existingSec!.fields.some(f => f.key.startsWith('header_') || f.key.startsWith('var_') || f.key.startsWith('header') || f.key.startsWith('var'));
            if (!hasAnyCols) {
              existingSec!.fields.push(JSON.parse(JSON.stringify(bf)));
            }
          } else {
            const ef = existingSec!.fields.find(f => f.key === bf.key);
            if (!ef) {
              existingSec!.fields.push(JSON.parse(JSON.stringify(bf)));
            }
          }
        });
      }
    });
  }

  ensureMedicineTemplateFields(): void {
    if (!this.isMedicineQuoteTemplate()) return;
    const base = BASE_COTIZACION_MEDICAMENTOS;
    base.sections.forEach(baseSec => {
      let existingSec = this.templateData.sections.find(s => s.id === baseSec.id || s.type === baseSec.type);
      if (!existingSec) {
        this.templateData.sections.push(JSON.parse(JSON.stringify(baseSec)));
      } else {
        baseSec.fields.forEach(bf => {
          if (baseSec.type === 'table' && (bf.key.startsWith('header_') || bf.key.startsWith('var_') || bf.key.startsWith('header') || bf.key.startsWith('var'))) {
            const hasAnyCols = existingSec!.fields.some(f => f.key.startsWith('header_') || f.key.startsWith('var_') || f.key.startsWith('header') || f.key.startsWith('var'));
            if (!hasAnyCols) {
              existingSec!.fields.push(JSON.parse(JSON.stringify(bf)));
            }
          } else {
            const ef = existingSec!.fields.find(f => f.key === bf.key);
            if (!ef) {
              existingSec!.fields.push(JSON.parse(JSON.stringify(bf)));
            }
          }
        });
      }
    });
  }

  ensureMedicineSaleOrderTemplateFields(): void {
    if (!this.isMedicineSaleOrderTemplate()) return;
    const base = BASE_ORDEN_SALIDA_MEDICAMENTOS;
    base.sections.forEach(baseSec => {
      let existingSec = this.templateData.sections.find(s => s.id === baseSec.id || s.type === baseSec.type);
      if (!existingSec) {
        this.templateData.sections.push(JSON.parse(JSON.stringify(baseSec)));
      } else {
        baseSec.fields.forEach(bf => {
          if (baseSec.type === 'table' && (bf.key.startsWith('header_') || bf.key.startsWith('var_') || bf.key.startsWith('header') || bf.key.startsWith('var'))) {
            const hasAnyCols = existingSec!.fields.some(f => f.key.startsWith('header_') || f.key.startsWith('var_') || f.key.startsWith('header') || f.key.startsWith('var'));
            if (!hasAnyCols) {
              existingSec!.fields.push(JSON.parse(JSON.stringify(bf)));
            }
          } else {
            const ef = existingSec!.fields.find(f => f.key === bf.key);
            if (!ef) {
              existingSec!.fields.push(JSON.parse(JSON.stringify(bf)));
            }
          }
        });
      }
    });
  }

  ensureRecipeSaleOrderTemplateFields(): void {
    if (!this.isRecipeSaleOrderTemplate()) return;
    const base = BASE_ORDEN_SALIDA_RECETARIOS;
    base.sections.forEach(baseSec => {
      let existingSec = this.templateData.sections.find(s => s.id === baseSec.id || s.type === baseSec.type);
      if (!existingSec) {
        this.templateData.sections.push(JSON.parse(JSON.stringify(baseSec)));
      } else {
        baseSec.fields.forEach(bf => {
          if (baseSec.type === 'table' && (bf.key.startsWith('header_') || bf.key.startsWith('var_') || bf.key.startsWith('header') || bf.key.startsWith('var'))) {
            const hasAnyCols = existingSec!.fields.some(f => f.key.startsWith('header_') || f.key.startsWith('var_') || f.key.startsWith('header') || f.key.startsWith('var'));
            if (!hasAnyCols) {
              existingSec!.fields.push(JSON.parse(JSON.stringify(bf)));
            }
          } else {
            const ef = existingSec!.fields.find(f => f.key === bf.key);
            if (!ef) {
              existingSec!.fields.push(JSON.parse(JSON.stringify(bf)));
            }
          }
        });
      }
    });
  }

  generateCompleteRecipeQuoteHtml(): string {
    const showLogo = this.getField('sec-header', 'showLogo', true) !== false;
    const logoSrc = showLogo ? this.getHeaderLogoSrc() : '';
    const docCode = this.getField('sec-header', 'docCode', 'FO-M9-P3-02- V04');
    const docSubcode = this.getField('sec-header', 'docSubcode', '1.220.30 - 27.39');
    const docNumber = this.getField('sec-header', 'docNumber', '{{ order.orderCode }}');
    const cityDate = this.getField('sec-header', 'cityDate', 'Santiago de Cali, {{ order.createdAt }}');

    const recipientTitle = this.getField('sec-recipient', 'recipientTitle', 'Señor. (A):');
    const recipientName = this.getField('sec-recipient', 'recipientName', '{{ thirdParty.fullName }}');
    const subject = this.getField('sec-recipient', 'subject', 'Ref: COTIZACION RECETARIOS OFICIALES PARA LA PRESCRIPCION DE MCE');

    const tableSec = this.getSectionById('sec-table') || this.templateData.sections.find(s => s.type === 'table');
    const cols = this.getTableColumns(tableSec);
    const grandTotal = this.getField('sec-table', 'grandTotalVar', '${{orderTotal}}');
    const ths = cols.map(c => `<th>${c.header}</th>`).join('\n          ');
    const tds = cols.map(c => `<td>${c.variable}</td>`).join('\n          ');
    const colSpan = Math.max(1, cols.length - 1);

    const note1Title = this.getField('sec-conditions', 'note1Title', 'Nota: 1.   Para reclamar los recetarios por primera vez, favor:');
    const note1Page1Items = this.getNote1Page1Items();
    const note1Page2Items = this.getNote1Page2Items();

    const note2Title = this.getField('sec-conditions', 'note2Title', 'Nota: 2.   Para reposición de los recetarios, favor:');
    const note2Items = this.getNote2Items();

    const farewell = this.getField('sec-conditions', 'farewell', 'Atentamente,');
    const signatureLines = this.getSignatureLines();

    const footerBanner = this.getFooterBannerSrc();

    const formatNoteItemsHtml = (items: { letter: string, text: string }[]) => {
      return items.map(it => `
      <div class="note-item">
        <span class="letter">${it.letter}</span>
        <span class="text">${it.text}</span>
      </div>`).join('\n');
    };

    const formatSignaturesHtml = (lines: string[]) => {
      return lines.map(l => `<div>${l}</div>`).join('\n');
    };

    return `
<style>
${RECIPE_QUOTE_CSS}
</style>

<!-- ==================== PÁGINA 1 ==================== -->
<section class="page page-1">
  <div class="header">
    ${logoSrc ? `<img src="${logoSrc}" alt="Gobernación del Valle del Cauca">` : ''}
  </div>

  <main class="content">
    <p class="form-code">${docCode}</p>
    <p class="document-code">${docSubcode}</p>

    <div class="order-info">
      <div class="order-code">${docNumber}</div>
      <div>${cityDate}</div>
    </div>

    <div class="recipient">
      <div>${recipientTitle}</div>
      <div class="recipient-name">${recipientName}</div>
    </div>

    <div class="reference">
      ${subject}
    </div>

    <table class="quote-table">
      <thead>
        <tr>
          ${ths}
        </tr>
      </thead>
      <tbody>
        <tr>
          ${tds}
        </tr>
        ${grandTotal ? `
        <tr>
          <td colspan="${colSpan}" class="grand-label">TOTAL</td>
          <td class="grand-total">${grandTotal}</td>
        </tr>` : ''}
      </tbody>
    </table>

    <div class="notes">
      <div class="note-title">
        ${note1Title}
      </div>
      ${formatNoteItemsHtml(note1Page1Items)}
    </div>
  </main>

  <div class="footer">
    <img src="${footerBanner}" alt="Información de contacto">
  </div>
</section>

<!-- ==================== PÁGINA 2 ==================== -->
<section class="page page-2">
  <div class="header">
    ${logoSrc ? `<img src="${logoSrc}" alt="Gobernación del Valle del Cauca">` : ''}
  </div>

  <main class="content">
    <p class="form-code">${docCode}</p>
    <p class="document-code">${docSubcode}</p>

    <div class="notes">
      ${formatNoteItemsHtml(note1Page2Items)}

      <div class="note-title" style="margin-top: 22pt;">
        ${note2Title}
      </div>

      ${formatNoteItemsHtml(note2Items)}

      <div class="signature">
        ${farewell}
      </div>

      <div class="signature-block">
        ${formatSignaturesHtml(signatureLines)}
      </div>
    </div>
  </main>

  <div class="footer">
    <img src="${footerBanner}" alt="Información de contacto">
  </div>
</section>
    `.trim();
  }

  generateCompleteMedicineQuoteHtml(): string {
    const showLogo = this.getField('sec-header', 'showLogo', true) !== false;
    const logoSrc = showLogo ? this.getHeaderLogoSrc() : '';
    const docCode = this.getField('sec-header', 'docCode', 'FO-M9-P3-02- V04');
    const docSubcode = this.getField('sec-header', 'docSubcode', '1.220.30 - 27.39');
    const docNumber = this.getField('sec-header', 'docNumber', '{{ order.orderCode }}');
    const cityDate = this.getField('sec-header', 'cityDate', 'Santiago de Cali, {{ order.createdAt }}');

    const recipientTitle = this.getField('sec-recipient', 'recipientTitle', 'Señor(s):');
    const recipientName = this.getField('sec-recipient', 'recipientName', '{{ thirdParty.fullName }}');
    const subject = this.getField('sec-recipient', 'subject', 'Asunto: Cotización.');
    const introText = this.getField('sec-recipient', 'introText', 'De acuerdo a su solicitud, remitimos cotización acorde a la disponibilidad del Fondo Rotatorio de Estupefacientes FRE Valle:');

    const tableSec = this.getSectionById('sec-table') || this.templateData.sections.find(s => s.type === 'table');
    const cols = this.getTableColumns(tableSec);
    const grandTotal = this.getField('sec-table', 'grandTotalVar', '${{order.total}}');
    const ths = cols.map(c => `<th>${c.header}</th>`).join('\n          ');
    const tds = cols.map(c => `<td>${c.variable}</td>`).join('\n          ');
    const colSpan = Math.max(1, cols.length - 1);

    const notesTitle = this.getField('sec-conditions', 'notesTitle', 'Nota:');
    const legalizeIntro = this.getField('sec-conditions', 'legalizeIntro', '1. Con el fin de legalizar la cuenta, favor:');
    const note1Page1Items = this.getMedicineNote1Page1Items();
    const note1Page2Items = this.getMedicineNote1Page2Items();

    const clause2 = this.getField('sec-conditions', 'clause2', '2. Cotización válida por 08 días. Después de esta fecha no se responde por cantidades ni por precios. Pasado este lapso de tiempo antes de consignar solicitar reconfirmación de esta cotización.');
    const clause3 = this.getField('sec-conditions', 'clause3', '3. Para la entrega de los medicamentos se requiere autorización escrita, firmada por el Representante Legal, el Director de la Institución o el Jefe del Servicio Farmacéutico y fotocopia de la cédula de la persona que vaya a reclamarlos.');
    const clause4 = this.getField('sec-conditions', 'clause4', '4. La entrega de medicamentos se realiza con cita previa asignada por correo electrónico.');
    const clause5 = this.getField('sec-conditions', 'clause5', '5. La dispensación de los Medicamentos Monopolio del Estado y los recetarios oficiales para la prescripción de Medicamentos de Control Especial en el Complejo Integral de Servicios de Salud Pública Aníbal Patiño Rodríguez - Carrera 76 No 4-30 B/ Nápoles.');

    const thanks = this.getField('sec-conditions', 'thanks', 'Gracias por su atención.');
    const farewell = this.getField('sec-conditions', 'farewell', 'Atentamente,');
    const signatureLines = this.getSignatureLines();

    const footerBanner = this.getFooterBannerSrc();

    const formatNoteItemsHtml = (items: { letter: string, text: string }[]) => {
      return items.map(it => `
      <div class="note-item" style="grid-template-columns: 24pt 1fr; margin-bottom: 6pt;">
        <span class="letter">${it.letter}</span>
        <span class="text">${it.text}</span>
      </div>`).join('\n');
    };

    const formatSignaturesHtml = (lines: string[]) => {
      return lines.map(l => `<div>${l}</div>`).join('\n');
    };

    return `
<style>
${RECIPE_QUOTE_CSS}
</style>

<!-- ==================== PÁGINA 1 ==================== -->
<section class="page page-1">
  <div class="header">
    ${logoSrc ? `<img src="${logoSrc}" alt="Gobernación del Valle del Cauca">` : ''}
  </div>

  <main class="content">
    <p class="form-code">${docCode}</p>
    <p class="document-code">${docSubcode}</p>

    <div class="order-info">
      <div class="order-code">${docNumber}</div>
      <div>${cityDate}</div>
    </div>

    <div class="recipient">
      <div>${recipientTitle}</div>
      <div class="recipient-name">${recipientName}</div>
    </div>

    <div class="recipient-subject">
      ${subject}
    </div>
    <div class="recipient-intro">
      ${introText}
    </div>

    <table class="quote-table medicamentos">
      <thead>
        <tr>
          ${ths}
        </tr>
      </thead>
      <tbody>
        <tr>
          ${tds}
        </tr>
        ${grandTotal ? `
        <tr>
          <td colspan="${colSpan}" class="grand-label">TOTAL</td>
          <td class="grand-total">${grandTotal}</td>
        </tr>` : ''}
      </tbody>
    </table>

    <div class="notes medicamentos">
      <div class="note-title">
        ${notesTitle}
      </div>
      <div class="med-note-sub">
        ${legalizeIntro}
      </div>
      ${formatNoteItemsHtml(note1Page1Items)}
    </div>
  </main>

  <div class="footer">
    <img src="${footerBanner}" alt="Información de contacto">
  </div>
</section>

<!-- ==================== PÁGINA 2 ==================== -->
<section class="page page-2">
  <div class="header">
    ${logoSrc ? `<img src="${logoSrc}" alt="Gobernación del Valle del Cauca">` : ''}
  </div>

  <main class="content">
    <p class="form-code">${docCode}</p>
    <p class="document-code">${docSubcode}</p>

    <div class="notes medicamentos" style="margin-top: 14pt;">
      ${formatNoteItemsHtml(note1Page2Items)}

      <div class="med-clause" style="margin-top: 10pt;">
        ${clause2}
      </div>

      <div class="med-clause">
        ${clause3}
      </div>

      <div class="med-clause">
        ${clause4}
      </div>

      <div class="med-clause">
        ${clause5}
      </div>

      <div class="thanks">
        ${thanks}
      </div>

      <div class="signature">
        ${farewell}
      </div>

      <div class="signature-block">
        ${formatSignaturesHtml(signatureLines)}
      </div>
    </div>
  </main>

  <div class="footer">
    <img src="${footerBanner}" alt="Información de contacto">
  </div>
</section>
    `.trim();
  }

  generateCompleteMedicineSaleOrderHtml(): string {
    const showLogo = this.getField('sec-header', 'showLogo', true) !== false;
    const logoSrc = showLogo ? this.getHeaderLogoSrc() : '';
    const docCode = this.getField('sec-header', 'docCode', 'FO-M9-P3-02- V04');
    const docSubcode = this.getField('sec-header', 'docSubcode', '1.220.30 - 27.39');
    const docNumber = this.getField('sec-header', 'docNumber', 'ORDEN DE SALIDA Nº {{ order.soldCode }}');
    const cityDate = this.getField('sec-header', 'cityDate', 'Santiago de Cali, {{ order.soldAt }}');

    const recipientTitle = this.getField('sec-recipient', 'recipientTitle', 'Coordinador Almacén');
    const recipientName = this.getField('sec-recipient', 'recipientName', 'Secretaría Departamental de Salud del Valle del Cauca');
    const introText = this.getField('sec-recipient', 'introText', 'Sírvase ENTREGAR A {{ thirdParty.fullName }} cargo a salida de bienes, producto de la cotización No. {{ order.soldCode }} con abono mediante TRANSFERENCIA a DAVIVIENDA Cuenta de Ahorros# 379400001804 de fecha. {{ order.createdAt }}.');

    const tableSec = this.getSectionById('sec-table') || this.templateData.sections.find(s => s.type === 'table');
    const cols = this.getTableColumns(tableSec);
    const grandTotal = this.getField('sec-table', 'grandTotalVar', '${{order.total}}');
    const ths = cols.map(c => `<th>${c.header}</th>`).join('\n          ');
    const tds = cols.map(c => `<td>${c.variable}</td>`).join('\n          ');
    const colSpan = Math.max(1, cols.length - 1);

    const receivedBy = this.getField('sec-signatures', 'receivedBy', 'RECIBÍ: ________________________________________');
    const documentId = this.getField('sec-signatures', 'documentId', 'CC: ____________________ de ____________________');
    const dateReceived = this.getField('sec-signatures', 'dateReceived', 'FECHA: Día _____ Mes _________ Año ____________');
    const phoneContact = this.getField('sec-signatures', 'phoneContact', 'Teléfono – Contacto: __________________________');
    const signatureLines = this.getSaleSignatureLines();

    const footerBanner = this.getFooterBannerSrc();

    const formatSignaturesHtml = (lines: string[]) => {
      return lines.map(l => `<div>${l}</div>`).join('\n');
    };

    return `
<style>
${RECIPE_QUOTE_CSS}
</style>

<!-- ==================== PÁGINA 1 ==================== -->
<section class="page page-1">
  <div class="header">
    ${logoSrc ? `<img src="${logoSrc}" alt="Gobernación del Valle del Cauca">` : ''}
  </div>

  <main class="content">
    <p class="form-code">${docCode}</p>
    <p class="document-code">${docSubcode}</p>

    <div class="order-info">
      <div class="order-code">${docNumber}</div>
      <div>${cityDate}</div>
    </div>

    <div class="sale-order-recipient">
      <div class="recipient-title">${recipientTitle}</div>
      <div class="recipient-dept">${recipientName}</div>
      <div class="recipient-intro-delivery">${introText}</div>
    </div>

    <table class="quote-table medicamentos">
      <thead>
        <tr>
          ${ths}
        </tr>
      </thead>
      <tbody>
        <tr>
          ${tds}
        </tr>
        ${grandTotal ? `
        <tr>
          <td colspan="${colSpan}" class="grand-label">TOTAL</td>
          <td class="grand-total">${grandTotal}</td>
        </tr>` : ''}
      </tbody>
    </table>

    <div class="sale-order-signatures">
      <div class="receipt-data">
        <div>${receivedBy}</div>
        <div>${documentId}</div>
        <div>${dateReceived}</div>
        <div>${phoneContact}</div>
      </div>

      <div class="sale-institution-sign">
        <div class="sign-line">________________________________________________________</div>
        ${formatSignaturesHtml(signatureLines)}
      </div>
    </div>
  </main>

  <div class="footer">
    <img src="${footerBanner}" alt="Información de contacto">
  </div>
</section>
    `.trim();
  }

  generateCompleteRecipeSaleOrderHtml(): string {
    const showLogo = this.getField('sec-header', 'showLogo', true) !== false;
    const logoSrc = showLogo ? this.getHeaderLogoSrc() : '';
    const docCode = this.getField('sec-header', 'docCode', 'FO-M9-P3-02- V04');
    const docSubcode = this.getField('sec-header', 'docSubcode', '1.220.30 - 27.39');
    const docNumber = this.getField('sec-header', 'docNumber', 'ORDEN DE SALIDA Nº {{ order.soldCode }}');
    const cityDate = this.getField('sec-header', 'cityDate', 'Santiago de Cali, {{ order.soldAt }}');

    const recipientTitle = this.getField('sec-recipient', 'recipientTitle', 'Coordinador Almacén');
    const recipientName = this.getField('sec-recipient', 'recipientName', 'Secretaría Departamental de Salud del Valle del Cauca');
    const introText = this.getField('sec-recipient', 'introText', 'Sírvase ENTREGAR A {{ thirdParty.fullName }} cargo a salida de bienes, producto de la cotización No. {{ order.orderCode }} con abono mediante TRANSFERENCIA a DAVIVIENDA Cuenta de Ahorros# 379400001804 de fecha, {{ order.createdAt }}.');

    const tableSec = this.getSectionById('sec-table') || this.templateData.sections.find(s => s.type === 'table');
    const cols = this.getTableColumns(tableSec);
    const grandTotal = this.getField('sec-table', 'grandTotalVar', '${{order.total}}');
    const ths = cols.map(c => `<th>${c.header}</th>`).join('\n          ');
    const tds = cols.map(c => `<td>${c.variable}</td>`).join('\n          ');
    const colSpan = Math.max(1, cols.length - 1);

    const receivedBy = this.getField('sec-signatures', 'receivedBy', 'RECIBÍ: ________________________________________');
    const documentId = this.getField('sec-signatures', 'documentId', 'CC: ____________________ de ____________________');
    const dateReceived = this.getField('sec-signatures', 'dateReceived', 'FECHA: Día _____ Mes _________ Año ____________');
    const phoneContact = this.getField('sec-signatures', 'phoneContact', 'Teléfono – Contacto: __________________________');
    const signatureLines = this.getSaleSignatureLines();

    const footerBanner = this.getFooterBannerSrc();

    const formatSignaturesHtml = (lines: string[]) => {
      return lines.map(l => `<div>${l}</div>`).join('\n');
    };

    return `
<style>
${RECIPE_QUOTE_CSS}
</style>

<!-- ==================== PÁGINA 1 ==================== -->
<section class="page page-1">
  <div class="header">
    ${logoSrc ? `<img src="${logoSrc}" alt="Gobernación del Valle del Cauca">` : ''}
  </div>

  <main class="content">
    <p class="form-code">${docCode}</p>
    <p class="document-code">${docSubcode}</p>

    <div class="order-info">
      <div class="order-code">${docNumber}</div>
      <div>${cityDate}</div>
    </div>

    <div class="sale-order-recipient">
      <div class="recipient-title">${recipientTitle}</div>
      <div class="recipient-dept">${recipientName}</div>
      <div class="recipient-intro-delivery">${introText}</div>
    </div>

    <table class="quote-table recetarios-salida">
      <thead>
        <tr>
          ${ths}
        </tr>
      </thead>
      <tbody>
        <tr>
          ${tds}
        </tr>
        ${grandTotal ? `
        <tr>
          <td colspan="${colSpan}" class="grand-label">TOTAL</td>
          <td class="grand-total">${grandTotal}</td>
        </tr>` : ''}
      </tbody>
    </table>

    <div class="sale-order-signatures">
      <div class="receipt-data">
        <div>${receivedBy}</div>
        <div>${documentId}</div>
        <div>${dateReceived}</div>
        <div>${phoneContact}</div>
      </div>

      <div class="sale-institution-sign">
        <div class="sign-line">________________________________________________________</div>
        ${formatSignaturesHtml(signatureLines)}
      </div>
    </div>
  </main>

  <div class="footer">
    <img src="${footerBanner}" alt="Información de contacto">
  </div>
    `.trim();
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
      case 'conditions':
        return this.generateConditionsHtml(fieldsMap);
      case 'signatures':
        return this.generateSignaturesHtml(fieldsMap);
      case 'footer':
        return this.generateFooterHtml(fieldsMap);
      default:
        return section.html_template;
    }
  }

  private generateHeaderHtml(fields: any): string {
    if (this.isOfficialLetterTemplate()) {
      const showLogo = fields.showLogo !== false;
      const logo = this.getHeaderLogoSrc();
      const docCode = fields.docCode || 'FO-M9-P3-02- V04';
      const docSubcode = fields.docSubcode || '1.220.30 - 27.39';
      const docNumber = fields.docNumber || '{{ order.orderCode }}';
      const cityDate = fields.cityDate || 'Santiago de Cali, {{ order.createdAt }}';

      return `
      <div class="header">
        ${showLogo && logo ? `<img src="${logo}" alt="Gobernación del Valle del Cauca">` : ''}
      </div>
      <p class="form-code">${docCode}</p>
      <p class="document-code">${docSubcode}</p>
      <div class="order-info">
        <div class="order-code">${docNumber}</div>
        <div>${cityDate}</div>
      </div>`;
    }

    const showLogo = fields.showLogo !== false;
    const rawLogo = fields.logoUrl !== undefined ? fields.logoUrl : '{{ companyEntity.logoOrder }}';
    const logoUrl = this.formatImageSrc(rawLogo);
    const docCode = fields.docCode || 'FO-M9-P3-02- V04';
    const docSubcode = fields.docSubcode || '1.220.30 - 27.39';
    const docNumber = fields.docNumber || '{{ order.orderCode }}';
    const cityDate = fields.cityDate || 'Santiago de Cali, {{ order.createdAt }}';
    const title = fields.title || '';
    const subtitle = fields.subtitle || '';

    return `
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; font-family: Arial, sans-serif;">
        <tr>
          <td width="65%" valign="top" style="width: 65%; vertical-align: top; text-align: left;">
            <table border="0" cellpadding="0" cellspacing="0">
              <tr>
                ${showLogo && logoUrl ? `
                <td valign="middle" style="vertical-align: middle; padding-right: 12px;">
                  <img src="${logoUrl}" width="220" alt="Logo Institucional" style="max-height: 75px; max-width: 220px; object-fit: contain;" />
                </td>` : ''}
                ${(title || subtitle) ? `
                <td valign="middle" style="vertical-align: middle;">
                  ${title ? `<h1 style="margin: 0; color: #111; font-size: 15px; font-weight: bold; text-transform: uppercase;">${title}</h1>` : ''}
                  ${subtitle ? `<p style="margin: 2px 0 0 0; color: #555; font-size: 11px;">${subtitle}</p>` : ''}
                </td>` : ''}
              </tr>
            </table>
          </td>
          <td width="35%" valign="top" align="right" style="width: 35%; text-align: right; vertical-align: top; font-size: 11px; color: #222; line-height: 1.4;">
            <div style="font-weight: bold; letter-spacing: 0.5px;">${docCode}</div>
            <div style="color: #555; font-size: 10px;">${docSubcode}</div>
            <div style="font-weight: bold; font-size: 13px; color: #000; margin-top: 4px;">${docNumber}</div>
            <div style="margin-top: 2px; color: #333;">${cityDate}</div>
          </td>
        </tr>
      </table>`;
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
    if (this.isRecipeQuoteTemplate()) {
      const recipientTitle = fields.recipientTitle || 'Señor. (A):';
      const recipientName = fields.recipientName || '{{ thirdParty.fullName }}';
      const subject = fields.subject || 'Ref: COTIZACION RECETARIOS OFICIALES PARA LA PRESCRIPCION DE MCE';

      return `
      <div class="recipient">
        <div>${recipientTitle}</div>
        <div class="recipient-name">${recipientName}</div>
      </div>
      <div class="reference">
        ${subject}
      </div>`;
    }

    const recipientTitle = fields.recipientTitle || '';
    const recipientName = fields.recipientName || '';
    const subject = fields.subject || '';
    const introText = fields.introText || '';

    if (recipientTitle || recipientName || subject || introText) {
      return `
<div style="margin-top: 12px; font-size: 11px; font-family: Arial, sans-serif; color: #222; line-height: 1.45;">
  ${recipientTitle ? `<div style="font-weight: bold; margin-bottom: 2px;">${recipientTitle}</div>` : ''}
  ${recipientName ? `<div style="font-size: 12px; font-weight: bold; color: #000; margin-bottom: 6px;">${recipientName}</div>` : ''}
  ${subject ? `<div style="font-weight: bold; margin-bottom: 6px;">${subject}</div>` : ''}
  ${introText ? `<div style="margin-top: 4px; text-align: justify;">${introText}</div>` : ''}
</div>`;
    }

    // Custom 2 columns layout
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
    const fakeSec = {
      fields: Object.entries(fields).map(([k, v]) => ({ key: k, value: v, label: '', type: 'text' as const })),
      type: 'table' as const
    };
    const cols = this.getTableColumns(fakeSec as any);
    const grandTotal = fields.grandTotalVar || '{{ order.total }}';
    const ths = cols.map(c => `<th style="border: 1px solid #333; padding: 6px 4px; font-size: 10px; text-align: center; box-sizing: border-box;">${c.header}</th>`).join('\n        ');
    const tds = cols.map(c => `<td style="border: 1px solid #333; padding: 6px 4px; font-size: 10px; text-align: center; box-sizing: border-box;">${c.variable}</td>`).join('\n        ');
    const colSpan = Math.max(1, cols.length - 1);

    return `
<div style="margin-top: 15px; font-family: Arial, sans-serif; width: 100%; box-sizing: border-box;">
  <table width="100%" border="1" cellpadding="5" cellspacing="0" style="width: 100%; border-collapse: collapse; border: 1px solid #333; table-layout: fixed; word-wrap: break-word; word-break: break-word;">
    <thead>
      <tr style="background-color: #f2f2f2;">
        ${ths}
      </tr>
    </thead>
    <tbody>
      <tr>
        ${tds}
      </tr>
    </tbody>
    <tfoot>
      <tr style="background-color: #fafafa; font-weight: bold;">
        <td colspan="${colSpan}" style="border: 1px solid #333; padding: 6px 4px; font-size: 10px; text-align: right; box-sizing: border-box;">TOTAL</td>
        <td style="border: 1px solid #333; padding: 6px 4px; font-size: 10px; text-align: right; color: #000; box-sizing: border-box;">${grandTotal}</td>
      </tr>
    </tfoot>
  </table>
</div>`;
  }

  private generateConditionsHtml(fields: any): string {
    if (this.isRecipeQuoteTemplate()) {
      const note1Title = fields.note1Title || 'Nota: 1.   Para reclamar los recetarios por primera vez, favor:';
      const note2Title = fields.note2Title || 'Nota: 2.   Para reposición de los recetarios, favor:';
      const clause1 = fields.clause1 || '';
      const clause2 = fields.clause2 || '';
      const farewell = fields.farewell || 'Atentamente,';
      const signText = fields.signText || '';

      const formatNoteItemsHtml = (items: { letter: string, text: string }[]) => {
        return items.map(it => `
        <div class="note-item">
          <span class="letter">${it.letter}</span>
          <span class="text">${it.text}</span>
        </div>`).join('\n');
      };

      const p1Items = this.parseNoteItems(clause1).slice(0, 8);
      const p2Items = this.parseNoteItems(clause1).slice(8);
      const note2Items = this.parseNoteItems(clause2);
      const signLines = signText.split('\n').filter((l: string) => !!l.trim()).map((l: string) => `<div>${l}</div>`).join('\n');

      return `
      <div class="notes">
        <div class="note-title">${note1Title}</div>
        ${formatNoteItemsHtml(p1Items)}
        ${formatNoteItemsHtml(p2Items)}
        <div class="note-title" style="margin-top: 22pt;">${note2Title}</div>
        ${formatNoteItemsHtml(note2Items)}
        <div class="signature">${farewell}</div>
        <div class="signature-block">${signLines}</div>
      </div>`;
    }

    const title = fields.notesTitle || 'Nota:';
    const content1 = fields.clause1 || '';
    const content2 = fields.clause2 || '';
    const content3 = fields.clause3 || '';
    const content4 = fields.clause4 || '';
    const content5 = fields.clause5 || '';
    const signText = fields.signText || '';

    const formatParagraph = (text: string) => {
      if (!text) return '';
      return text.split('\n').map((line: string) => `<p style="margin: 1.5px 0;">${line}</p>`).join('');
    };

    return `
<div style="margin-top: 8px; font-family: Arial, sans-serif; font-size: 8pt; color: #222; line-height: 1.15;">
  ${title ? `<div style="font-weight: bold; margin-bottom: 3px; text-transform: uppercase; font-size: 8.5pt;">${title}</div>` : ''}
  ${content1 ? `<div style="margin-bottom: 3px;">${formatParagraph(content1)}</div>` : ''}
  ${content2 ? `<div style="margin-bottom: 3px;">${formatParagraph(content2)}</div>` : ''}
  ${content3 ? `<div style="margin-bottom: 3px;">${formatParagraph(content3)}</div>` : ''}
  ${content4 ? `<div style="margin-bottom: 3px;">${formatParagraph(content4)}</div>` : ''}
  ${content5 ? `<div style="margin-bottom: 3px;">${formatParagraph(content5)}</div>` : ''}
  ${signText ? `<div style="margin-top: 8px; font-weight: bold; line-height: 1.2;">${formatParagraph(signText)}</div>` : ''}
</div>`;
  }

  private generateSignaturesHtml(fields: any): string {
    const receivedBy = fields.receivedBy || 'RECIBÍ: ____________________________________';
    const documentId = fields.documentId || 'CC: _____________________ de ________________';
    const dateReceived = fields.dateReceived || 'FECHA: Día _______ Mes _________ Año _________';
    const phoneContact = fields.phoneContact || 'Teléfono – Contacto: ________________________';
    const signFooter = fields.signFooter || 'Fondo Rotatorio de Estupefacientes del Valle del Cauca\nSecretaría Departamental de Salud';

    const formatParagraph = (text: string) => {
      if (!text) return '';
      return text.split('\n').map((line: string) => `<p style="margin: 2px 0;">${line}</p>`).join('');
    };

    return `
<div style="margin-top: 20px; font-family: Arial, sans-serif; font-size: 10px; color: #222;">
  <table style="width: 100%; border: none; border-collapse: collapse;">
    <tr>
      <td style="width: 58%; vertical-align: top; line-height: 1.8;">
        <div>${receivedBy}</div>
        <div>${documentId}</div>
        <div>${dateReceived}</div>
        <div>${phoneContact}</div>
      </td>
      <td style="width: 42%; vertical-align: bottom; text-align: center; line-height: 1.4;">
        <div style="border-top: 1px solid #333; padding-top: 5px; font-weight: bold; font-size: 9.5px;">
          ${formatParagraph(signFooter)}
        </div>
      </td>
    </tr>
  </table>
</div>`;
  }

  private generateFooterHtml(fields: any): string {
    if (this.isOfficialLetterTemplate()) {
      const banner = this.getFooterBannerSrc();
      return `
      <div class="footer">
        <img src="${banner}" alt="Información de contacto">
      </div>`;
    }

    const entity = fields.entity || 'Gobernación Departamento del Valle del Cauca';
    const address = fields.address || 'Carrera 76 # 4 - 30 edificio complejo integral de servicios de salud pública "Aníbal Patiño Rodríguez"';
    const email = fields.email || 'fre@valledelcauca.gov.co';
    const phone = fields.phone || '3104683988';

    return `
<table width="100%" border="0" cellpadding="2" cellspacing="0" style="width: 100%; border-collapse: collapse; border-top: 2px solid #003399; margin-top: 15px; font-family: Arial, sans-serif; font-size: 7.5pt;">
  <tr>
    <td width="28%" valign="middle" style="border-right: 1px solid #b0bec5; padding: 2px 6px; font-weight: bold; color: #003399; font-size: 7.5pt; line-height: 1.15;">
      ${entity}
    </td>
    <td width="42%" valign="middle" style="border-right: 1px solid #b0bec5; padding: 2px 6px; color: #333; font-size: 7pt; line-height: 1.15;">
      ${address}
    </td>
    <td width="18%" valign="middle" align="center" style="border-right: 1px solid #b0bec5; padding: 2px 6px; text-align: center; color: #333; font-size: 7pt;">
      ${email}
    </td>
    <td width="12%" valign="middle" align="center" style="padding: 2px 6px; text-align: center; color: #333; font-size: 7.5pt; font-weight: bold;">
      ${phone}
    </td>
  </tr>
</table>`;
  }

  migrateOldSections(oldSections: any[]): SectionsJson {
    const migrated: SectionsJson = JSON.parse(JSON.stringify(BASE_COTIZACION_RECETARIOS));

    oldSections.forEach(oldSec => {
      let targetType: 'header' | 'title' | 'subtitle' | 'table' | 'conditions' | 'signatures' | 'footer' | null = null;
      if (oldSec.id === 'sec-header' || oldSec.name?.toLowerCase().includes('cabecera')) {
        targetType = 'header';
      } else if (oldSec.id === 'sec-title' || oldSec.name?.toLowerCase().includes('título') || oldSec.name?.toLowerCase().includes('titulo')) {
        targetType = 'title';
      } else if (oldSec.id === 'sec-sender' || oldSec.id === 'sec-subtitle' || oldSec.name?.toLowerCase().includes('remitente') || oldSec.name?.toLowerCase().includes('detalles') || oldSec.name?.toLowerCase().includes('subtítulo') || oldSec.name?.toLowerCase().includes('subtitulo') || oldSec.name?.toLowerCase().includes('destinatario')) {
        targetType = 'subtitle';
      } else if (oldSec.id === 'sec-table' || oldSec.name?.toLowerCase().includes('tabla')) {
        targetType = 'table';
      } else if (oldSec.id === 'sec-conditions' || oldSec.name?.toLowerCase().includes('condiciones') || oldSec.name?.toLowerCase().includes('requisitos') || oldSec.name?.toLowerCase().includes('notas')) {
        targetType = 'conditions';
      } else if (oldSec.id === 'sec-signatures' || oldSec.name?.toLowerCase().includes('firmas') || oldSec.name?.toLowerCase().includes('recibido')) {
        targetType = 'signatures';
      } else if (oldSec.id === 'sec-footer' || oldSec.name?.toLowerCase().includes('pie')) {
        targetType = 'footer';
      }

      if (targetType) {
        const newSec = migrated.sections.find(s => s.type === targetType);
        if (newSec && oldSec.html_template) {
          // Keep default migrated structure
        }
      }
    });

    return migrated;
  }

  getSafeHtml(html: string): SafeHtml {
    if (!html) return '';
    let rendered = html;
    if (this.companyData) {
      if (this.companyData.logoOrder) {
        rendered = rendered.split('{{ companyEntity.logoOrder }}').join(this.formatImageSrc(this.companyData.logoOrder));
        rendered = rendered.split('{{ company.logoOrder }}').join(this.formatImageSrc(this.companyData.logoOrder));
      }
      if (this.companyData.logoSold) {
        rendered = rendered.split('{{ companyEntity.logoSold }}').join(this.formatImageSrc(this.companyData.logoSold));
        rendered = rendered.split('{{ company.logoSold }}').join(this.formatImageSrc(this.companyData.logoSold));
      }
      if (this.companyData.logoPurchasing) {
        rendered = rendered.split('{{ companyEntity.logoPurchasing }}').join(this.formatImageSrc(this.companyData.logoPurchasing));
      }
      if (this.companyData.logoUrl) {
        rendered = rendered.split('{{ companyEntity.logoUrl }}').join(this.formatImageSrc(this.companyData.logoUrl));
      }
      if (this.companyData.footer) {
        rendered = rendered.split('{{ companyEntity.footer }}').join(this.formatImageSrc(this.companyData.footer));
        rendered = rendered.split('{{ company.footer }}').join(this.formatImageSrc(this.companyData.footer));
      }
    }
    return this.sanitizer.bypassSecurityTrustHtml(rendered);
  }

  getAvailableVariables() {
    const docType = this.mainForm?.get('documentType')?.value;
    const globalVars = [
      {
        label: 'Empresa (CompanyEntity)',
        vars: [
          { name: '{{ companyEntity.name }}', desc: 'Nombre de la empresa' },
          { name: '{{ companyEntity.legalName }}', desc: 'Razón social' },
          { name: '{{ companyEntity.nit }}', desc: 'NIT o identificación tributaria' },
          { name: '{{ companyEntity.address }}', desc: 'Dirección física de la empresa' },
          { name: '{{ companyEntity.phone }}', desc: 'Teléfono de contacto' },
          { name: '{{ companyEntity.email }}', desc: 'Correo electrónico de la empresa' },
          { name: '{{ companyEntity.logoUrl }}', desc: 'URL del logo general' },
          { name: '{{ companyEntity.logoOrder }}', desc: 'Logo institucional para Cotizaciones' },
          { name: '{{ companyEntity.logoSold }}', desc: 'Logo institucional para Órdenes de Salida / Ventas' },
          { name: '{{ companyEntity.logoPurchasing }}', desc: 'Logo para Órdenes de Compra' },
          { name: '{{ companyEntity.footer }}', desc: 'Imagen o banner de pie de página' },
          { name: '{{ companyEntity.iva }}', desc: 'Porcentaje de IVA configurado en la empresa' },
          { name: '{{ company.logoOrder }}', desc: 'Alias para logo de cotizaciones' },
          { name: '{{ company.logoSold }}', desc: 'Alias para logo de orden de salida' },
          { name: '{{ company.footer }}', desc: 'Alias para banner de pie de página' }
        ]
      }
    ];

    if (docType === 'COMPRA') {
      return [
        ...globalVars,
        {
          label: 'Compra (PurchasingEntity)',
          vars: [
            { name: '{{ purchasing.purchasedCode }}', desc: 'Código consecutivo de la compra' },
            { name: '{{ purchasing.createdAt }}', desc: 'Fecha y hora de registro de la compra' },
            { name: '{{ purchasing.total }}', desc: 'Valor total de la compra' },
            { name: '{{ purchasing.observations }}', desc: 'Observaciones o notas de la compra' },
            { name: '{{ purchasing.purchasedBy }}', desc: 'Usuario o responsable de la compra' },
            { name: '{{ purchasing.type }}', desc: 'Tipo de compra (RECETARIOS, MEDICAMENTOS)' }
          ]
        },
        {
          label: 'Proveedor (ThirdParty)',
          vars: [
            { name: '{{ thirdParty.fullName }}', desc: 'Nombre completo o razón social del proveedor' },
            { name: '{{ thirdParty.documentType }}', desc: 'Tipo de documento (NIT, CC)' },
            { name: '{{ thirdParty.documentNumber }}', desc: 'Número de documento o NIT del proveedor' },
            { name: '{{ thirdParty.email }}', desc: 'Correo electrónico del proveedor' },
            { name: '{{ thirdParty.phone }}', desc: 'Teléfono de contacto del proveedor' },
            { name: '{{ thirdParty.address }}', desc: 'Dirección física del proveedor' }
          ]
        },
        {
          label: 'Items de Compra (PurchasingItemEntity - Bucle for)',
          vars: [
            { name: '{{ item.product.code }}', desc: 'Código o SKU del producto comprado' },
            { name: '{{ item.product.name }}', desc: 'Nombre del medicamento o producto' },
            { name: '{{ item.product.presentation }}', desc: 'Presentación comercial' },
            { name: '{{ item.product.concentration }}', desc: 'Concentración del producto' },
            { name: '{{ item.batch.code }}', desc: 'Lote ingresado' },
            { name: '{{ item.expirationDate }}', desc: 'Fecha de vencimiento del lote' },
            { name: '{{ item.units }}', desc: 'Cantidad de unidades compradas' },
            { name: '{{ item.priceUnit }}', desc: 'Precio unitario de compra' },
            { name: '{{ item.sellPrice }}', desc: 'Precio de venta al público sugerido' },
            { name: '{{ item.priceTotal }}', desc: 'Total fila comprada' }
          ]
        },
        {
          label: 'Recetarios de Compra (PurchasingRecipeEntity)',
          vars: [
            { name: '{{ purchasingRecipe.startSerial }}', desc: 'Serial inicial de talonarios comprados' },
            { name: '{{ purchasingRecipe.finalSerial }}', desc: 'Serial final de talonarios comprados' },
            { name: '{{ purchasingRecipe.serials }}', desc: 'Rango de seriales comprados (ej: 0001 - 0050)' },
            { name: '{{ purchasingRecipe.serialRange }}', desc: 'Rango de seriales comprados (alias)' },
            { name: '{{ purchasingRecipe.units }}', desc: 'Cantidad de recetarios comprados' },
            { name: '{{ purchasingRecipe.priceUnit }}', desc: 'Precio unitario de compra de recetarios' },
            { name: '{{ purchasingRecipe.priceTotal }}', desc: 'Total compra de recetarios' },
            { name: '{{ item.startSerial }}', desc: 'Serial inicial de recetarios' },
            { name: '{{ item.finalSerial }}', desc: 'Serial final de recetarios' },
            { name: '{{ item.serials }}', desc: 'Rango de seriales de recetarios' },
            { name: '{{ item.serialRange }}', desc: 'Rango de seriales de recetarios (alias)' }
          ]
        }
      ];
    } else {
      // VENTA o COTIZACION
      return [
        ...globalVars,
        {
          label: 'Orden / Cotización / Salida (OrderEntity)',
          vars: [
            { name: '{{ order.orderCode }}', desc: 'Código o número de cotización' },
            { name: '{{ order.soldCode }}', desc: 'Código o número de la orden de salida / venta' },
            { name: '{{ order.createdAt }}', desc: 'Fecha de creación de la cotización' },
            { name: '{{ order.soldAt }}', desc: 'Fecha de la orden de salida / venta' },
            { name: '{{ order.subtotal }}', desc: 'Subtotal de la orden (sin IVA)' },
            { name: '{{ order.iva }}', desc: 'Porcentaje de IVA aplicado' },
            { name: '{{ order.priceIva }}', desc: 'Valor total del IVA calculado' },
            { name: '{{ order.total }}', desc: 'Valor total general de la cotización u orden' },
            { name: '{{ order.observations }}', desc: 'Observaciones o notas adicionales del documento' },
            { name: '{{ order.status }}', desc: 'Estado de la orden (PENDING, SOLD)' },
            { name: '{{ order.type }}', desc: 'Tipo de producto (RECETARIOS, MEDICAMENTOS)' }
          ]
        },
        {
          label: 'Tercero / Cliente (ThirdParty)',
          vars: [
            { name: '{{ thirdParty.fullName }}', desc: 'Nombre completo o razón social del cliente' },
            { name: '{{ thirdParty.documentType }}', desc: 'Tipo de documento (CC, NIT)' },
            { name: '{{ thirdParty.documentNumber }}', desc: 'Número de identificación del cliente' },
            { name: '{{ thirdParty.email }}', desc: 'Correo electrónico del cliente' },
            { name: '{{ thirdParty.phone }}', desc: 'Teléfono de contacto del cliente' },
            { name: '{{ thirdParty.address }}', desc: 'Dirección del cliente' }
          ]
        },
        {
          label: 'Medicamentos (OrderItemEntity - Ciclo for / Múltiples items)',
          vars: [
            { name: '{{ item.inventory.batch.code }}', desc: 'Lote del medicamento' },
            { name: '{{ item.inventory.product.name }}', desc: 'Nombre del medicamento' },
            { name: '{{ item.inventory.product.code }}', desc: 'Código del medicamento' },
            { name: '{{ item.inventory.product.presentation }}', desc: 'Presentación comercial' },
            { name: '{{ item.inventory.product.concentration }}', desc: 'Concentración' },
            { name: '{{ item.inventory.expirationDate }}', desc: 'Fecha de vencimiento del lote' },
            { name: '{{ item.units }}', desc: 'Cantidad de unidades cotizadas o entregadas' },
            { name: '{{ item.priceUnit }}', desc: 'Precio / valor unitario' },
            { name: '{{ item.priceTotal }}', desc: 'Total del item (unidades x precio unitario)' }
          ]
        },
        {
          label: 'Recetarios (OrderItemEntity - 1 Solo item)',
          vars: [
            { name: '{{ item.units }}', desc: 'Cantidad de talonarios de recetarios' },
            { name: '{{ item.priceUnit }}', desc: 'Valor unitario del talonario' },
            { name: '{{ item.startSerialSold }}', desc: 'Serial inicial vendido / despachado' },
            { name: '{{ item.endSerialSold }}', desc: 'Serial final vendido / despachado' },
            { name: '{{ item.startSerial }}', desc: 'Serial inicial (alias)' },
            { name: '{{ item.finalSerial }}', desc: 'Serial final (alias)' },
            { name: '{{ item.serials }}', desc: 'Rango completo de seriales (ej: 0001 - 0050)' },
            { name: '{{ item.serialRange }}', desc: 'Rango de seriales (alias)' },
            { name: '{{ order.subtotal }}', desc: 'Subtotal cotizado' },
            { name: '{{ order.iva }}', desc: 'Porcentaje de IVA cotizado' },
            { name: '{{ order.priceIva }}', desc: 'Precio del IVA' },
            { name: '{{ order.total }}', desc: 'Valor total con IVA incluido' }
          ]
        }
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

    const formValue = this.mainForm.value;

    if (!formValue.isDefault) {
      const params: any = {
        documentType: formValue.documentType,
        category: formValue.category
      };
      if (this.templateId) {
        params.excludeId = this.templateId;
      }

      this.restService.getRequest('/document-templates/check-default', params).subscribe({
        next: (res: any) => {
          if (!res.hasDefault) {
            Swal.fire({
              icon: 'warning',
              title: 'Sin plantilla predeterminada',
              text: `Actualmente no existe ninguna plantilla predeterminada para la categoría "${formValue.category}" y tipo "${formValue.documentType}". ¿Desea marcarla como predeterminada o guardar de todos modos?`,
              showCancelButton: true,
              showDenyButton: true,
              confirmButtonText: 'Marcar como predeterminada y guardar',
              denyButtonText: 'Guardar sin predeterminada',
              cancelButtonText: 'Cancelar',
              confirmButtonColor: '#3d5a80',
              denyButtonColor: '#6c757d',
              cancelButtonColor: '#ac0505',
              target: 'mat-dialog-container',
              customClass: {
                container: 'swal2-on-top'
              }
            }).then((alertResult) => {
              if (alertResult.isDismissed) {
                return;
              }
              if (alertResult.isConfirmed) {
                this.mainForm.patchValue({ isDefault: true });
              }
              this.executeSave();
            });
          } else {
            this.executeSave();
          }
        },
        error: () => {
          this.executeSave();
        }
      });
    } else {
      this.executeSave();
    }
  }

  private executeSave() {
    let finalHtmlContent = '';
    let cssContent = '';

    if (this.isRecipeQuoteTemplate()) {
      finalHtmlContent = this.generateCompleteRecipeQuoteHtml();
      cssContent = RECIPE_QUOTE_CSS;
    } else if (this.isMedicineQuoteTemplate()) {
      finalHtmlContent = this.generateCompleteMedicineQuoteHtml();
      cssContent = RECIPE_QUOTE_CSS;
    } else if (this.isMedicineSaleOrderTemplate()) {
      finalHtmlContent = this.generateCompleteMedicineSaleOrderHtml();
      cssContent = RECIPE_QUOTE_CSS;
    } else if (this.isRecipeSaleOrderTemplate()) {
      finalHtmlContent = this.generateCompleteRecipeSaleOrderHtml();
      cssContent = RECIPE_QUOTE_CSS;
    } else {
      // Concatenate HTML from all sections
      let concatenatedHtml = '';
      this.templateData.sections.forEach(sec => {
        concatenatedHtml += `<!-- Section: ${sec.name} -->\n${sec.html_template}\n`;
      });
      finalHtmlContent = `<div class="a4-document-print" style="width: 100%; max-width: 210mm; margin: 0 auto; font-family: sans-serif;">\n${concatenatedHtml}\n</div>`;
    }

    const stateOutput = JSON.stringify(this.templateData);
    const formValue = this.mainForm.value;

    const payload: DocumentTemplateSaveModel = {
      name: formValue.name,
      documentType: formValue.documentType,
      category: formValue.category,
      htmlContent: finalHtmlContent,
      cssContent: cssContent,
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

  printPreview() {
    window.print();
  }

  addPredefinedSection(type: 'title' | 'subtitle' | 'table' | 'conditions' | 'signatures') {
    const uniqueId = `sec-${type}-${Math.random().toString(36).substr(2, 9)}`;
    let newSection: SectionItem;

    switch (type) {
      case 'title':
        newSection = {
          id: uniqueId,
          name: 'Título Documento',
          type: 'title',
          fields: [
            { key: 'titleText', label: 'Texto de Título', type: 'text', value: 'DOCUMENTO' },
            { key: 'documentCode', label: 'Formato Número de Orden', type: 'text', value: 'No. {{ order.orderCode }}' },
            { key: 'dateText', label: 'Formato de Fecha', type: 'text', value: 'Fecha: {{ order.createdAt }}' }
          ],
          html_template: ''
        };
        break;
      case 'subtitle':
        newSection = {
          id: uniqueId,
          name: 'Destinatario / Asunto',
          type: 'subtitle',
          fields: [
            { key: 'recipientTitle', label: 'Destinatario', type: 'text', value: 'Señor(es):' },
            { key: 'recipientName', label: 'Nombre Destinatario', type: 'text', value: '{{ thirdParty.fullName }}' },
            { key: 'subject', label: 'Asunto / Referencia', type: 'text', value: 'Asunto: Cotización.' },
            { key: 'introText', label: 'Texto de Introducción', type: 'textarea', value: '' }
          ],
          html_template: ''
        };
        break;
      case 'table':
        newSection = {
          id: uniqueId,
          name: 'Tabla de Medicamentos',
          type: 'table',
          fields: [
            { key: 'header_1', label: 'Cabecera Columna 1', type: 'text', value: 'Lote' },
            { key: 'var_1', label: 'Variable Columna 1', type: 'text', value: '{{ item.inventory.batch.code }}' },
            { key: 'header_2', label: 'Cabecera Columna 2', type: 'text', value: 'Nombre' },
            { key: 'var_2', label: 'Variable Columna 2', type: 'text', value: '{{ item.inventory.product.name }}' },
            { key: 'header_3', label: 'Cabecera Columna 3', type: 'text', value: 'Presentación' },
            { key: 'var_3', label: 'Variable Columna 3', type: 'text', value: '{{ item.inventory.product.presentation }}' },
            { key: 'header_4', label: 'Cabecera Columna 4', type: 'text', value: 'Fecha Vencimiento' },
            { key: 'var_4', label: 'Variable Columna 4', type: 'text', value: '{{ item.inventory.expirationDate }}' },
            { key: 'header_5', label: 'Cabecera Columna 5', type: 'text', value: 'Cantidad' },
            { key: 'var_5', label: 'Variable Columna 5', type: 'text', value: '{{ item.units }}' },
            { key: 'header_6', label: 'Cabecera Columna 6', type: 'text', value: 'Valor Unitario' },
            { key: 'var_6', label: 'Variable Columna 6', type: 'text', value: '{{ item.priceUnit }}' },
            { key: 'header_7', label: 'Cabecera Columna 7', type: 'text', value: 'Total' },
            { key: 'var_7', label: 'Variable Columna 7', type: 'text', value: '{{ item.priceTotal }}' },
            { key: 'grandTotalVar', label: 'Variable Total General', type: 'text', value: '{{ order.total }}' }
          ],
          html_template: ''
        };
        break;
      case 'conditions':
        newSection = {
          id: uniqueId,
          name: 'Condiciones y Normativas',
          type: 'conditions',
          fields: [
            { key: 'notesTitle', label: 'Título de Notas', type: 'text', value: 'Nota:' },
            { key: 'clause1', label: 'Condición 1', type: 'textarea', value: '' },
            { key: 'clause2', label: 'Condición 2', type: 'textarea', value: '' },
            { key: 'signText', label: 'Firma / Despedida', type: 'textarea', value: 'Atentamente,\nFondo Rotatorio de Estupefacientes' }
          ],
          html_template: ''
        };
        break;
      case 'signatures':
        newSection = {
          id: uniqueId,
          name: 'Firmas de Recibido',
          type: 'signatures',
          fields: [
            { key: 'receivedBy', label: 'Nombre quien recibe', type: 'text', value: 'RECIBÍ: ____________________________________' },
            { key: 'documentId', label: 'Cédula de quien recibe', type: 'text', value: 'CC: _____________________ de ________________' },
            { key: 'dateReceived', label: 'Fecha de recepción', type: 'text', value: 'FECHA: Día _______ Mes _________ Año _________' },
            { key: 'phoneContact', label: 'Teléfono o Contacto', type: 'text', value: 'Teléfono – Contacto: ________________________' },
            { key: 'signFooter', label: 'Pie de Firma Entrega', type: 'textarea', value: 'Fondo Rotatorio de Estupefacientes del Valle del Cauca\nSecretaría Departamental de Salud' }
          ],
          html_template: ''
        };
        break;
    }

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
