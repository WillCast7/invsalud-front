import { Injectable, inject } from '@angular/core';
import { RestApiService } from './rest-api.service';
import { AlertService } from './alerts.service';
import {
  OFFICIAL_RECIPE_HEADER_LOGO,
  OFFICIAL_RECIPE_FOOTER_BANNER,
  RECIPE_QUOTE_CSS
} from '../components/dialogs/config/bill-editor/recipe-template.constants';

@Injectable({
  providedIn: 'root'
})
export class QuotePrintService {
  private readonly restService = inject(RestApiService);
  private readonly alertService = inject(AlertService);

  /**
   * Imprime una cotización asegurando que se apliquen el 100% de los estilos CSS
   * y que el formato coincida fielmente con el diseño oficial del frontend.
   */
  printOrder(orderId: number | string): void {
    this.alertService.infoMixin.fire({
      icon: 'info',
      title: 'Preparando formato de impresión...'
    });

    // 1. Obtener la información completa de la orden
    this.restService.getRequest(`/orders/${orderId}`).subscribe({
      next: (orderRes: any) => {
        const order = orderRes?.data || orderRes;
        if (!order) {
          this.alertService.infoMixin.fire({
            icon: 'error',
            title: 'No se pudo obtener la información de la cotización'
          });
          return;
        }

        // 2. Obtener datos de la empresa para logos y banners
        this.restService.getRequest('/company').subscribe({
          next: (compRes: any) => {
            const company = compRes?.data || compRes || {};
            this.generateAndPrint(order, company);
          },
          error: () => {
            this.generateAndPrint(order, {});
          }
        });
      },
      error: (err) => {
        this.alertService.infoMixin.fire({
          icon: 'error',
          title: err.error?.message || 'Error al cargar la cotización para impresión'
        });
      }
    });
  }

  private generateAndPrint(order: any, company: any): void {
    const isRecipe = order.type === 'RECIPE' || order.type === 'RECETARIOS';
    const html = isRecipe
      ? this.buildRecipeQuoteHtml(order, company)
      : this.buildMedicineQuoteHtml(order, company);

    this.openPrintWindow(html, order.orderCode || 'Cotizacion');
  }

  private formatCurrency(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '$ 0';
    const num = Number(value);
    if (isNaN(num)) return String(value);
    return '$ ' + num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  private formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  }

  private getHeaderLogo(company: any): string {
    if (company?.logoOrder && company.logoOrder.trim().length > 0) {
      const val = company.logoOrder.trim();
      return val.startsWith('data:') || val.startsWith('http') ? val : `data:image/png;base64,${val}`;
    }
    return OFFICIAL_RECIPE_HEADER_LOGO;
  }

  private getFooterBanner(company: any): string {
    if (company?.footer && company.footer.trim().length > 0) {
      const val = company.footer.trim();
      return val.startsWith('data:') || val.startsWith('http') ? val : `data:image/jpeg;base64,${val}`;
    }
    return OFFICIAL_RECIPE_FOOTER_BANNER;
  }

  private buildMedicineQuoteHtml(order: any, company: any): string {
    const logoSrc = this.getHeaderLogo(company);
    const footerBanner = this.getFooterBanner(company);

    const docCode = 'FO-M9-P3-02- V04';
    const docSubcode = '1.220.30 - 27.39';
    const docNumber = order.orderCode || '---';
    const orderDateFormatted = this.formatDate(order.createdAt);
    const cityDate = `Santiago de Cali, ${orderDateFormatted}`;

    const recipientName = order.thirdParty?.fullName || '---';
    const recipientTitle = 'Señor(s):';
    const subject = 'Asunto: Cotización.';
    const introText = 'De acuerdo a su solicitud, remitimos cotización acorde a la disponibilidad del Fondo Rotatorio de Estupefacientes FRE Valle:';

    // Generación de filas de la tabla de medicamentos (7 columnas)
    let rowsHtml = '';
    const items = order.items || [];

    if (items.length > 0) {
      rowsHtml = items.map((it: any) => {
        const prod = it.inventory?.product || it.product || {};
        const batch = it.inventory?.batch?.code || it.batch?.code || 'N/A';
        const name = prod.name || '---';
        const presentation = [prod.pharmaceuticalForm, prod.presentation].filter(Boolean).join(' - ') || prod.concentration || '---';
        const expDate = this.formatDate(it.inventory?.expirationDate || it.expirationDate);
        const units = it.units || 1;
        const priceUnit = this.formatCurrency(it.priceUnit);
        const priceTotal = this.formatCurrency(it.priceTotal || (units * (it.priceUnit || 0)));

        return `
          <tr>
            <td>${batch}</td>
            <td style="text-align: left; padding-left: 6pt;">${name}</td>
            <td>${presentation}</td>
            <td>${expDate}</td>
            <td>${units}</td>
            <td style="text-align: right; padding-right: 6pt;">${priceUnit}</td>
            <td style="text-align: right; padding-right: 6pt; font-weight: 600;">${priceTotal}</td>
          </tr>
        `;
      }).join('');
    } else {
      rowsHtml = `<tr><td colspan="7" style="text-align: center; padding: 12pt;">No hay ítems registrados</td></tr>`;
    }

    const grandTotal = this.formatCurrency(order.total);

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Cotización - ${docNumber}</title>
  <style>
${RECIPE_QUOTE_CSS}

/* Estilos de la barra de acciones de impresión en pantalla */
@media screen {
  body {
    background-color: #525659;
    padding: 20px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }
  .print-action-bar {
    position: sticky;
    top: 10px;
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 12px;
    background: #ffffff;
    padding: 10px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
  }
  .print-action-bar button {
    cursor: pointer;
    border: none;
    outline: none;
    padding: 8px 18px;
    border-radius: 4px;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.2s;
  }
  .btn-print {
    background-color: #0d6efd;
    color: #fff;
  }
  .btn-print:hover {
    background-color: #0b5ed7;
  }
  .btn-close {
    background-color: #6c757d;
    color: #fff;
  }
  .btn-close:hover {
    background-color: #5c636a;
  }
  .page {
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    margin-bottom: 20px;
  }
}

@media print {
  .print-action-bar {
    display: none !important;
  }
  body {
    background: #fff;
    padding: 0;
    margin: 0;
  }
  .page {
    box-shadow: none;
    margin: 0;
  }
}
  </style>
</head>
<body>

  <!-- Barra de control sólo en pantalla -->
  <div class="print-action-bar no-print">
    <span style="font-family: sans-serif; font-size: 14px; color: #333;">Cotización: <strong>${docNumber}</strong></span>
    <button class="btn-print" onclick="window.print()">Imprimir / Guardar PDF</button>
    <button class="btn-close" onclick="window.close()">Cerrar</button>
  </div>

  <!-- ==================== PÁGINA 1 ==================== -->
  <section class="page page-1">
    <div class="header">
      <img src="${logoSrc}" alt="Gobernación del Valle del Cauca">
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
        <colgroup>
          <col class="col-batch">
          <col class="col-name">
          <col class="col-pres">
          <col class="col-exp">
          <col class="col-qty">
          <col class="col-unit">
          <col class="col-total">
        </colgroup>
        <thead>
          <tr>
            <th>Lote</th>
            <th>Nombre</th>
            <th>Presentación</th>
            <th>Fecha Vencimiento</th>
            <th>Cantidad</th>
            <th>Valor Unitario</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr>
            <td colspan="6" class="grand-label">TOTAL</td>
            <td class="grand-total" style="text-align: right; padding-right: 6pt; font-weight: bold;">${grandTotal}</td>
          </tr>
        </tbody>
      </table>

      <div class="notes medicamentos">
        <div class="note-title">
          Nota:
        </div>
        <div class="med-note-sub">
          1. Con el fin de legalizar la cuenta, favor:
        </div>
        <div class="note-item" style="grid-template-columns: 24pt 1fr; margin-bottom: 6pt;">
          <span class="letter">a)</span>
          <span class="text">Realice el pago en el Banco DAVIVIENDA, cuenta de ahorros # 379400001804, Departamento del Valle del Cauca-Fondo Rotatorio de Estupefacientes NIT 890399029-5.</span>
        </div>
        <div class="note-item" style="grid-template-columns: 24pt 1fr; margin-bottom: 6pt;">
          <span class="letter">b)</span>
          <span class="text">Entregue a la oficina del Fondo Rotatorio de Estupefacientes FRE Valle, un original y una copia del recibo de consignación con firma y sello del cajero, el mismo día en que se hace la consignación. Este recibo debe llevar el NIT de la institución.</span>
        </div>
        <div class="note-item" style="grid-template-columns: 24pt 1fr; margin-bottom: 6pt;">
          <span class="letter">c)</span>
          <span class="text">Para los casos de Transferencia entregar impresión a color y en estado debitado o aprobado a nombre de la Gobernación del Valle de acuerdo a la cuenta relacionada en el ítem No 1 (hoja membretada por la entidad bancaria).</span>
        </div>
        <div class="note-item" style="grid-template-columns: 24pt 1fr; margin-bottom: 6pt;">
          <span class="letter">d)</span>
          <span class="text">El pago no debe tener fecha superior a una (1) semana.</span>
        </div>
      </div>
    </main>

    <div class="footer">
      <img src="${footerBanner}" alt="Información de contacto">
    </div>
  </section>

  <!-- ==================== PÁGINA 2 ==================== -->
  <section class="page page-2">
    <div class="header">
      <img src="${logoSrc}" alt="Gobernación del Valle del Cauca">
    </div>

    <main class="content">
      <p class="form-code">${docCode}</p>
      <p class="document-code">${docSubcode}</p>

      <div class="notes medicamentos" style="margin-top: 14pt;">
        <div class="med-clause" style="margin-top: 10pt;">
          2. Cotización válida por 08 días. Después de esta fecha no se responde por cantidades ni por precios. Pasado este lapso de tiempo antes de consignar solicitar reconfirmación de esta cotización.
        </div>

        <div class="med-clause">
          3. Para la entrega de los medicamentos se requiere autorización escrita, firmada por el Representante Legal, el Director de la Institución o el Jefe del Servicio Farmacéutico y fotocopia de la cédula de la persona que vaya a reclamarlos.
        </div>

        <div class="med-clause">
          4. La entrega de medicamentos se realiza con cita previa asignada por correo electrónico.
        </div>

        <div class="med-clause">
          5. La dispensación de los Medicamentos Monopolio del Estado y los recetarios oficiales para la prescripción de Medicamentos de Control Especial en el Complejo Integral de Servicios de Salud Pública Aníbal Patiño Rodríguez - Carrera 76 No 4-30 B/ Nápoles.
        </div>

        <div class="thanks" style="margin-top: 24pt;">
          Gracias por su atención.
        </div>

        <div class="signature" style="margin-top: 24pt;">
          Atentamente,
        </div>

        <div class="signature-block" style="margin-top: 40pt;">
          <div>Fondo Rotatorio de Estupefacientes del Valle del Cauca</div>
          <div>Secretaría Departamental de Salud del Valle</div>
        </div>
      </div>
    </main>

    <div class="footer">
      <img src="${footerBanner}" alt="Información de contacto">
    </div>
  </section>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>
    `.trim();
  }

  private buildRecipeQuoteHtml(order: any, company: any): string {
    const logoSrc = this.getHeaderLogo(company);
    const footerBanner = this.getFooterBanner(company);

    const docCode = 'FO-M9-P3-02- V04';
    const docSubcode = '1.220.30 - 27.39';
    const docNumber = order.orderCode || '---';
    const orderDateFormatted = this.formatDate(order.createdAt);
    const cityDate = `Santiago de Cali, ${orderDateFormatted}`;

    const recipientName = order.thirdParty?.fullName || '---';
    const recipientTitle = 'Señor. (A):';
    const subject = 'Ref: COTIZACION RECETARIOS OFICIALES PARA LA PRESCRIPCION DE MCE';

    const item = order.items?.[0] || {};
    const units = item.units || 1;
    const priceUnit = this.formatCurrency(item.priceUnit || 2000);
    const subtotal = this.formatCurrency(order.subtotal || (units * (item.priceUnit || 2000)));
    const ivaPercent = order.iva !== undefined ? order.iva : 19;
    const priceIva = this.formatCurrency(order.priceIva || 0);
    const grandTotal = this.formatCurrency(order.total);

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Cotización Recetarios - ${docNumber}</title>
  <style>
${RECIPE_QUOTE_CSS}

@media screen {
  body {
    background-color: #525659;
    padding: 20px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }
  .print-action-bar {
    position: sticky;
    top: 10px;
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 12px;
    background: #ffffff;
    padding: 10px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
  }
  .print-action-bar button {
    cursor: pointer;
    border: none;
    outline: none;
    padding: 8px 18px;
    border-radius: 4px;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.2s;
  }
  .btn-print {
    background-color: #0d6efd;
    color: #fff;
  }
  .btn-print:hover {
    background-color: #0b5ed7;
  }
  .btn-close {
    background-color: #6c757d;
    color: #fff;
  }
  .btn-close:hover {
    background-color: #5c636a;
  }
  .page {
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    margin-bottom: 20px;
  }
}

@media print {
  .print-action-bar {
    display: none !important;
  }
  body {
    background: #fff;
    padding: 0;
    margin: 0;
  }
  .page {
    box-shadow: none;
    margin: 0;
  }
}
  </style>
</head>
<body>

  <div class="print-action-bar no-print">
    <span style="font-family: sans-serif; font-size: 14px; color: #333;">Cotización: <strong>${docNumber}</strong></span>
    <button class="btn-print" onclick="window.print()">Imprimir / Guardar PDF</button>
    <button class="btn-close" onclick="window.close()">Cerrar</button>
  </div>

  <!-- ==================== PÁGINA 1 ==================== -->
  <section class="page page-1">
    <div class="header">
      <img src="${logoSrc}" alt="Gobernación del Valle del Cauca">
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
        <colgroup>
          <col class="qty">
          <col class="unit">
          <col class="subtotal">
          <col class="iva">
          <col class="total">
        </colgroup>
        <thead>
          <tr>
            <th>Cantidad</th>
            <th>Valor Unitario</th>
            <th>Subtotal</th>
            <th>Iva /<br>${ivaPercent}%</th>
            <th>Valor Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${units}</td>
            <td>${priceUnit}</td>
            <td>${subtotal}</td>
            <td>$<br>${priceIva}</td>
            <td>${grandTotal}</td>
          </tr>
          <tr>
            <td colspan="4" class="grand-label">TOTAL</td>
            <td class="grand-total">${grandTotal}</td>
          </tr>
        </tbody>
      </table>

      <div class="notes">
        <div class="note-title">
          Nota: 1.   Para reclamar los recetarios por primera vez, favor:
        </div>
        <div class="note-item">
          <span class="letter">A.</span>
          <span class="text">Original y Copia del Recibo de Consignación con Firma y sello del Cajero; Consignación del Banco DAVIVIENDA cuenta de ahorros No 379400001804, a nombre del Departamento del Valle del Cauca - Fondo Rotatorio de Estupefacientes NIT 890399029-5</span>
        </div>
        <div class="note-item">
          <span class="letter">B.</span>
          <span class="text">Listado de Médicos u Odontólogos con La fotocopia del registro o tarjeta profesional respectiva.</span>
        </div>
        <div class="note-item">
          <span class="letter">C.</span>
          <span class="text">Autoevaluación vigente de Habilitación según Resolución 3100 del 2019 como prestadores de Servicios de Salud.</span>
        </div>
        <div class="note-item">
          <span class="letter">D.</span>
          <span class="text">Dirección de la Institución.</span>
        </div>
        <div class="note-item">
          <span class="letter">E.</span>
          <span class="text">Teléfono, Fax y Correo Electrónico de la Institución.</span>
        </div>
      </div>
    </main>

    <div class="footer">
      <img src="${footerBanner}" alt="Información de contacto">
    </div>
  </section>

  <!-- ==================== PÁGINA 2 ==================== -->
  <section class="page page-2">
    <div class="header">
      <img src="${logoSrc}" alt="Gobernación del Valle del Cauca">
    </div>

    <main class="content">
      <p class="form-code">${docCode}</p>
      <p class="document-code">${docSubcode}</p>

      <div class="notes">
        <div class="note-item">
          <span class="letter">F.</span>
          <span class="text">Resolución de inscripción ante el fondo de estupefacientes si realizan la dispensación, Y utilización del medicamento en sus procedimientos.</span>
        </div>
        <div class="note-item">
          <span class="letter">G.</span>
          <span class="text">Autorización firmada por el representante legal donde delegue al personal que realizara El proceso de reclamación de los talonarios y copia de La cedula.</span>
        </div>
        <div class="note-item">
          <span class="letter">H.</span>
          <span class="text">Entrega de recetarios CITA PREVIA SOLICITADA POR CORREO ELECTRONICO.</span>
        </div>
        <div class="note-item">
          <span class="letter">I.</span>
          <span class="text">Cotización válida por 08 días. Después de esta fecha no se responde por cantidades ni por precios. Pasado este lapso de tiempo antes de consignar solicitar reconfirmación de esta cotización.</span>
        </div>

        <div class="note-title" style="margin-top: 22pt;">
          Nota: 2.   Para reposición de los recetarios, favor:
        </div>

        <div class="note-item">
          <span class="letter">A.</span>
          <span class="text">Entrega de recetarios CITA PREVIA SOLICITADA POR CORREO ELECTRONICO.</span>
        </div>
        <div class="note-item">
          <span class="letter">B.</span>
          <span class="text">Original y Copia del Recibo de Consignación con Firma y sello del Cajero; Consignación del Banco DAVIVIENDA Cuenta de Ahorros # 379400001804, a nombre del Departamento del Valle del Cauca - Fondo Rotatorio de Estupefacientes NIT de la Institución.</span>
        </div>
        <div class="note-item">
          <span class="letter">C.</span>
          <span class="text">Oficio membretado con los datos del prestador, persona autorizada para reclamar los recetarios.</span>
        </div>
        <div class="note-item">
          <span class="letter">D.</span>
          <span class="text">Cédula de la persona autorizada.</span>
        </div>
        <div class="note-item">
          <span class="letter">E.</span>
          <span class="text">Estar al día con el envió de los anexos.</span>
        </div>
        <div class="note-item">
          <span class="letter">F.</span>
          <span class="text">Formulas anuladas.</span>
        </div>
        <div class="note-item">
          <span class="letter">G.</span>
          <span class="text">Formatos blancos que se encuentran en la última parte de los recetarios debidamente diligenciados</span>
        </div>
        <div class="note-item">
          <span class="letter">H.</span>
          <span class="text">Entrega de recetarios CITA PREVIA SOLICITADA POR CORREO ELECTRONICO.</span>
        </div>
        <div class="note-item">
          <span class="letter">I.</span>
          <span class="text">Cotización válida por 08 días. Después de esta fecha no se responde por cantidades ni por precios. Pasado este lapso de tiempo antes de consignar solicitar reconfirmación de esta cotización.</span>
        </div>
        <div class="note-item">
          <span class="letter">J.</span>
          <span class="text">Rut actualizado</span>
        </div>

        <div class="signature" style="margin-top: 18pt;">
          Atentamente,
        </div>

        <div class="signature-block" style="margin-top: 36pt;">
          <div>Fondo Rotatorio de Estupefacientes del Valle del Cauca</div>
          <div>Secretaría Departamental de Salud del Valle</div>
        </div>
      </div>
    </main>

    <div class="footer">
      <img src="${footerBanner}" alt="Información de contacto">
    </div>
  </section>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>
    `.trim();
  }

  private openPrintWindow(htmlContent: string, title: string): void {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
    } else {
      // Fallback a iframe oculto si las ventanas emergentes (popups) están bloqueadas
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();
        iframe.contentWindow?.focus();
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1500);
        }, 500);
      }
    }
  }
}
