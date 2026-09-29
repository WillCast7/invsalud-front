import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RestApiService } from '../../services/rest-api.service';
import { AlertService } from '../../services/alerts.service';
import { DocumentTemplateSummary } from '../../models/config/document-template.interface';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-document-template-viewer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './document-template-viewer.component.html',
  styleUrls: ['./document-template-viewer.component.css']
})
export class DocumentTemplateViewerComponent implements OnInit, OnChanges {
  @Input() documentId?: number | string | null;
  @Input() documentType!: 'order' | 'sale' | 'purchase';
  @Input() templateType!: string; // 'COTIZACION' | 'VENTA' | 'COMPRA'
  @Input() category?: string | null; // 'MEDICAMENTOS' | 'RECETARIOS' | 'MEDICAMENTOS_SP'
  @Input() initialTemplateId?: string | null;
  @Input() orderType?: string; // 'order' | 'sold'

  @Output() templateSaved = new EventEmitter<string | null>();

  @ViewChild('previewFrame') previewFrame?: ElementRef<HTMLIFrameElement>;

  private readonly restService: RestApiService = inject(RestApiService);
  private readonly alertService: AlertService = inject(AlertService);
  private readonly sanitizer: DomSanitizer = inject(DomSanitizer);
  private readonly sessionService: SessionService = inject(SessionService);

  get canEditTemplate(): boolean {
    return this.sessionService.canEditTemplate();
  }

  templates: DocumentTemplateSummary[] = [];
  selectedTemplateId: string | null = null;
  savedTemplateId: string | null = null;
  userHasManuallyChanged = false;

  previewHtml: SafeHtml | null = null;
  isLoading = false;
  isSaving = false;
  loadingTemplates = false;

  ngOnInit(): void {
    this.selectedTemplateId = this.initialTemplateId || null;
    this.savedTemplateId = this.initialTemplateId || null;

    this.loadTemplates();

    if (this.selectedTemplateId && this.documentId) {
      this.loadPreview(this.selectedTemplateId);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialTemplateId'] && !changes['initialTemplateId'].firstChange) {
      const newId = changes['initialTemplateId'].currentValue || null;
      if (!this.userHasManuallyChanged && newId !== this.selectedTemplateId) {
        this.selectedTemplateId = newId;
        this.savedTemplateId = newId;
        if (this.selectedTemplateId && this.documentId) {
          this.loadPreview(this.selectedTemplateId);
        } else {
          this.previewHtml = null;
        }
      }
    }
    if (changes['documentId'] && !changes['documentId'].firstChange) {
      if (this.selectedTemplateId && this.documentId) {
        this.loadPreview(this.selectedTemplateId);
      }
    }
  }

  loadTemplates(): void {
    this.loadingTemplates = true;
    const params: any = {};
    if (this.templateType) params.documentType = this.templateType;
    if (this.category) params.category = this.category;

    this.restService.getRequest('/document-templates/list', params).subscribe({
      next: (res: any) => {
        this.loadingTemplates = false;
        this.templates = Array.isArray(res) ? res : (res?.data || []);
      },
      error: (err: any) => {
        this.loadingTemplates = false;
        console.error('Error al cargar la lista de plantillas:', err);
      }
    });
  }

  onSelectTemplate(templateId: string | null): void {
    this.userHasManuallyChanged = true;
    this.selectedTemplateId = templateId;

    if (templateId && this.documentId) {
      this.loadPreview(templateId);
    } else {
      this.previewHtml = null;
    }
  }

  loadPreview(templateId: string): void {
    if (!this.documentId) return;
    this.isLoading = true;

    const url = `/report/${this.documentType}/${this.documentId}/preview`;
    this.restService.textGetRequest(url, { templateId }).subscribe({
      next: (html: string) => {
        this.isLoading = false;
        this.previewHtml = this.sanitizer.bypassSecurityTrustHtml(html);
        setTimeout(() => {
          if (this.previewFrame?.nativeElement) {
            this.previewFrame.nativeElement.srcdoc = html;
          }
        }, 50);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.previewHtml = null;
        console.error('Error al generar vista previa de plantilla:', err);
        this.alertService.infoMixin.fire({
          icon: 'warning',
          title: 'No se pudo generar la vista previa de la plantilla'
        });
      }
    });
  }

  printDocument(): void {
    if (this.previewFrame?.nativeElement?.contentWindow) {
      this.previewFrame.nativeElement.contentWindow.print();
    }
  }

  saveTemplate(): void {
    if (!this.documentId) return;
    this.isSaving = true;

    if (this.documentType === 'order' || this.documentType === 'sale') {
      const type = this.orderType || (this.documentType === 'sale' ? 'sold' : 'order');
      let url = `/orders/${this.documentId}/template?type=${type}`;
      if (this.selectedTemplateId) {
        url += `&templateId=${this.selectedTemplateId}`;
      }

      this.restService.putRequest(url, {}).subscribe({
        next: () => {
          this.isSaving = false;
          this.savedTemplateId = this.selectedTemplateId;
          this.alertService.infoMixin.fire({
            icon: 'success',
            title: 'Plantilla guardada correctamente'
          });
          this.templateSaved.emit(this.selectedTemplateId);
        },
        error: (err: any) => {
          this.isSaving = false;
          console.error('Error al guardar la plantilla:', err);
          this.alertService.infoMixin.fire({
            icon: 'error',
            title: err.error?.message || 'Error al guardar la plantilla'
          });
        }
      });
    } else if (this.documentType === 'purchase') {
      let url = `/purchasing/${this.documentId}/template`;
      if (this.selectedTemplateId) {
        url += `?templateId=${this.selectedTemplateId}`;
      }

      this.restService.putRequest(url, {}).subscribe({
        next: () => {
          this.isSaving = false;
          this.savedTemplateId = this.selectedTemplateId;
          this.alertService.infoMixin.fire({
            icon: 'success',
            title: 'Plantilla guardada correctamente'
          });
          this.templateSaved.emit(this.selectedTemplateId);
        },
        error: (err: any) => {
          this.isSaving = false;
          console.error('Error al guardar la plantilla de compra:', err);
          this.alertService.infoMixin.fire({
            icon: 'error',
            title: err.error?.message || 'Error al guardar la plantilla'
          });
        }
      });
    }
  }
}
