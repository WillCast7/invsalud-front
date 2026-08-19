import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { RestApiService } from '../../../../services/rest-api.service';
import { AlertService } from '../../../../services/alerts.service';
import { VectorialDocumentInterface } from '../../../../models/vectorial-document.interface';
import { RagDialogComponent, RagDialogData } from '../../../dialogs/config/rag/rag.component';
import { SizemodalInitializer } from '../../../../models/modal/sizemodal-interface';

@Component({
  selector: 'app-rag',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTooltipModule,
    MatPaginatorModule
  ],
  templateUrl: './rag.component.html',
  styleUrl: './rag.component.css',
})
export class RagComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly restService = inject(RestApiService);
  private readonly alertService = inject(AlertService);

  documents = signal<VectorialDocumentInterface[]>([]);
  isLoading = signal<boolean>(false);

  // Filters & Pagination
  searchValue = signal<string>('');
  selectedModule = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  totalItems = signal<number>(0);

  moduleOptions = [
    { code: '', label: 'Todos los módulos' },
    { code: 'MANUALES', label: 'Manuales / Instructivos' },
    { code: 'NORMATIVA', label: 'Normatividad / Legal' },
    { code: 'INVENTARIO', label: 'Inventario / Lotes' },
    { code: 'RESOLUCIONES', label: 'Resoluciones' },
    { code: 'GENERAL', label: 'General' }
  ];

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.isLoading.set(true);
    const search = encodeURIComponent(this.searchValue().trim());
    const moduleCode = encodeURIComponent(this.selectedModule());
    const url = `/rag/documents?page=${this.currentPage()}&size=${this.pageSize()}&search=${search}&moduleCode=${moduleCode}`;

    this.restService.getRequest(url).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response && response.data) {
          this.documents.set(response.data.documents || []);
          this.totalItems.set(response.data.totalItems || 0);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.alertService.infoMixin.fire({
          icon: 'error',
          title: err.error?.message || 'Error al obtener listado de documentos RAG.'
        });
      }
    });
  }

  onSearchChange(): void {
    this.currentPage.set(1);
    this.loadDocuments();
  }

  onModuleChange(): void {
    this.currentPage.set(1);
    this.loadDocuments();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadDocuments();
  }

  openCreateModal(): void {
    const dialogRef: MatDialogRef<RagDialogComponent> = this.dialog.open(RagDialogComponent, {
      ...SizemodalInitializer,
      width: '750px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.success) {
        this.alertService.infoMixin.fire({
          icon: 'success',
          title: result.message || 'Documento RAG registrado exitosamente.'
        });
        this.loadDocuments();
      }
    });
  }

  openReplaceModal(doc: VectorialDocumentInterface): void {
    const dialogRef: MatDialogRef<RagDialogComponent> = this.dialog.open(RagDialogComponent, {
      ...SizemodalInitializer,
      width: '750px',
      data: { mode: 'replace', document: doc }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.success) {
        this.alertService.infoMixin.fire({
          icon: 'success',
          title: result.message || 'Versión actualizada correctamente.'
        });
        this.loadDocuments();
      }
    });
  }

  openViewChunksModal(doc: VectorialDocumentInterface): void {
    this.dialog.open(RagDialogComponent, {
      ...SizemodalInitializer,
      width: '800px',
      data: { mode: 'view', document: doc }
    });
  }

  deleteDocument(doc: VectorialDocumentInterface): void {
    this.alertService.reCallMixin.fire({
      title: '¿Eliminar documento RAG?',
      text: `Esta acción removerá el documento "${doc.documentTitle}" y todos sus vectores asociados.`,
      icon: 'warning',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.restService.deleteRequest(`/rag/documents/${doc.id}`).subscribe({
          next: (res) => {
            this.alertService.infoMixin.fire({
              icon: 'success',
              title: 'Documento RAG y vectores eliminados exitosamente.'
            });
            this.loadDocuments();
          },
          error: (err) => {
            this.alertService.infoMixin.fire({
              icon: 'error',
              title: err.error?.message || 'Error al eliminar documento RAG.'
            });
          }
        });
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PROCESADO': return 'bg-success text-white';
      case 'PENDIENTE': return 'bg-warning text-dark';
      case 'REEMPLAZADO': return 'bg-secondary text-white';
      case 'ERROR': return 'bg-danger text-white';
      default: return 'bg-info text-dark';
    }
  }

  getModuleBadgeClass(code: string): string {
    switch (code) {
      case 'MANUALES': return 'badge-manuales';
      case 'NORMATIVA': return 'badge-normativa';
      case 'INVENTARIO': return 'badge-inventario';
      case 'RESOLUCIONES': return 'badge-resoluciones';
      default: return 'badge-general';
    }
  }
}
