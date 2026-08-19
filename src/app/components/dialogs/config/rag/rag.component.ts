import { Component, inject, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { CommonModule } from '@angular/common';
import { RestApiService } from '../../../../services/rest-api.service';
import { AlertService } from '../../../../services/alerts.service';
import { VectorialDocumentInterface } from '../../../../models/vectorial-document.interface';

export interface RagDialogData {
  mode: 'create' | 'replace' | 'view';
  document?: VectorialDocumentInterface;
}

@Component({
  selector: 'app-rag-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDividerModule,
    MatTabsModule
  ],
  templateUrl: './rag.component.html',
  styleUrl: './rag.component.css',
})
export class RagDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<RagDialogComponent>);
  private restService = inject(RestApiService);
  private alertService = inject(AlertService);

  ragForm!: FormGroup;
  isSubmitting = false;
  fileName: string = '';
  chunksList: VectorialDocumentInterface[] = [];
  loadingChunks = false;

  modulesList = [
    { code: 'MANUALES', label: 'Manuales de Uso / Instructivos' },
    { code: 'NORMATIVA', label: 'Normatividad y Aspectos Legales' },
    { code: 'INVENTARIO', label: 'Inventario y Medicamentos' },
    { code: 'RESOLUCIONES', label: 'Resoluciones y Contratos' },
    { code: 'GENERAL', label: 'General / Otros' }
  ];

  fileTypes = [
    { code: 'txt', label: 'Texto Plano (.txt)' },
    { code: 'pdf', label: 'Documento PDF (.pdf)' },
    { code: 'md', label: 'Markdown (.md)' },
    { code: 'docx', label: 'Documento Word (.docx)' },
    { code: 'json', label: 'Estructura JSON (.json)' }
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: RagDialogData
  ) {}

  ngOnInit(): void {
    this.initForm();

    if (this.data.mode === 'replace' && this.data.document) {
      const nextVer = this.calculateNextVersion(this.data.document.version);
      this.ragForm.patchValue({
        id: this.data.document.id,
        documentTitle: this.data.document.documentTitle,
        moduleCode: this.data.document.moduleCode || 'GENERAL',
        version: nextVer,
        fileType: this.data.document.fileType || 'txt',
        metadata: this.data.document.metadata || '',
        content: ''
      });
    } else if (this.data.mode === 'view' && this.data.document) {
      this.loadChunks(this.data.document.documentTitle);
    }
  }

  private initForm(): void {
    this.ragForm = this.fb.group({
      id: [null],
      documentTitle: ['', [Validators.required, Validators.maxLength(150)]],
      moduleCode: ['MANUALES', [Validators.required]],
      version: ['1.0', [Validators.required]],
      fileType: ['txt', [Validators.required]],
      metadata: [''],
      content: ['', [Validators.required]]
    });
  }

  calculateNextVersion(currentVersion: string): string {
    if (!currentVersion) return '2.0';
    const parts = currentVersion.split('.');
    if (parts.length > 0 && !isNaN(Number(parts[0]))) {
      return `${Number(parts[0]) + 1}.0`;
    }
    return `${currentVersion}-v2`;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.fileName = file.name;
      const extension = file.name.split('.').pop()?.toLowerCase() || 'txt';
      if (['txt', 'md', 'json', 'csv'].includes(extension)) {
        this.ragForm.patchValue({ fileType: extension });
        const reader = new FileReader();
        reader.onload = () => {
          this.ragForm.patchValue({ content: reader.result as string });
        };
        reader.readAsText(file);
      } else {
        this.ragForm.patchValue({ fileType: extension });
        // Set info note in content for non-plain text files
        this.ragForm.patchValue({
          content: `Archivo adjuntado: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
        });
      }
    }
  }

  loadChunks(title: string): void {
    this.loadingChunks = true;
    this.restService.getRequest(`/rag/documents/chunks?title=${encodeURIComponent(title)}`).subscribe({
      next: (res) => {
        this.loadingChunks = false;
        if (res && res.data) {
          this.chunksList = res.data;
        }
      },
      error: (err) => {
        this.loadingChunks = false;
        this.alertService.infoMixin.fire({
          icon: 'error',
          title: 'Error al cargar fragmentos del documento'
        });
      }
    });
  }

  onSubmit(): void {
    if (this.ragForm.invalid) {
      this.ragForm.markAllAsTouched();
      this.alertService.infoMixin.fire({
        icon: 'warning',
        title: 'Por favor diligencie todos los campos requeridos.'
      });
      return;
    }

    this.isSubmitting = true;
    const formVal = this.ragForm.value;

    const payload = {
      documentTitle: formVal.documentTitle,
      content: formVal.content,
      moduleCode: formVal.moduleCode,
      version: formVal.version,
      fileType: formVal.fileType,
      metadata: formVal.metadata,
      status: 'PROCESADO'
    };

    if (this.data.mode === 'create') {
      this.restService.postRequest('/rag/documents', payload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.dialogRef.close({
            success: true,
            message: 'Documento RAG registrado y vectorizado exitosamente.'
          });
        },
        error: (err) => {
          this.isSubmitting = false;
          this.alertService.infoMixin.fire({
            icon: 'error',
            title: err.error?.message || 'Error al guardar el documento RAG.'
          });
        }
      });
    } else if (this.data.mode === 'replace') {
      const docId = this.data.document?.id || formVal.id;
      this.restService.postRequest(`/rag/documents/${docId}/replace`, payload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.dialogRef.close({
            success: true,
            message: `Nueva versión (${formVal.version}) del documento registrada exitosamente.`
          });
        },
        error: (err) => {
          this.isSubmitting = false;
          this.alertService.infoMixin.fire({
            icon: 'error',
            title: err.error?.message || 'Error al actualizar versión del documento.'
          });
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close({ success: false });
  }
}
