import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';

// Propios
import { NotificationInterface } from '../../../../models/notifications/notification-interface';
import { NotificationService } from '../../../../services/notification.service';
import { AlertService } from '../../../../services/alerts.service';
import { PageableInitializer, PageableInterface } from '../../../../models/table/pageable-interface';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
    MatCardModule,
    MatProgressBarModule,
    DatePipe
  ],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export class NotificationsComponent implements OnInit {
  // --- Inyecciones ---
  private readonly router = inject(Router);
  public readonly notificationService = inject(NotificationService);
  private readonly alertService = inject(AlertService);

  // --- Estado de la Tabla ---
  title: string = 'Historial de Notificaciones';
  dataValue: PageableInterface<NotificationInterface> = PageableInitializer;
  dataSource: NotificationInterface[] = [];
  isLoading = signal<boolean>(false);

  // --- Filtros ---
  searchValue: string = '';
  selectedCategory: string = 'ALL';
  selectedStatus: string = 'ALL'; // 'ALL', 'UNREAD', 'READ'

  // --- Paginación ---
  pageIndex: number = 0;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  displayedColumns: string[] = [
    'id',
    'priority',
    'title',
    'message',
    'category',
    'createdAt',
    'status',
    'actions'
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    let isReadFilter: boolean | undefined = undefined;
    if (this.selectedStatus === 'UNREAD') isReadFilter = false;
    if (this.selectedStatus === 'READ') isReadFilter = true;

    this.notificationService.loadNotifications(
      this.pageIndex,
      this.pageSize,
      this.selectedCategory !== 'ALL' ? this.selectedCategory : undefined,
      isReadFilter,
      this.searchValue
    ).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        if (res?.pageable) {
          this.dataValue = res.pageable;
          this.dataSource = res.pageable.content || [];
        } else if (res?.data) {
          this.dataValue = res.data;
          this.dataSource = res.data.content || [];
        }
      },
      error: (err: any) => {
        this.isLoading.set(false);
        console.error('Error cargando notificaciones:', err);
      }
    });
  }

  onSearch(): void {
    this.pageIndex = 0;
    this.loadData();
  }

  onFilterChange(): void {
    this.pageIndex = 0;
    this.loadData();
  }

  handlePageEvent(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.loadData();
  }

  markAsRead(item: NotificationInterface, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.notificationService.markAsRead(item.id);
    item.isRead = true;
    item.readAt = new Date().toISOString();
  }

  markAllAsRead(): void {
    this.alertService.modal.fire({
      title: '¿Marcar todas como leídas?',
      text: 'Se actualizarán todas tus notificaciones pendientes.',
      icon: 'question',
      confirmButtonText: 'Sí, marcar todas',
      cancelButtonText: 'Cancelar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.notificationService.markAllAsRead();
        this.dataSource.forEach(n => {
          n.isRead = true;
          n.readAt = new Date().toISOString();
        });
        this.alertService.infoMixin.fire({
          icon: 'success',
          title: 'Todas las notificaciones fueron marcadas como leídas'
        });
      }
    });
  }

  navigateToTarget(item: NotificationInterface, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.notificationService.processNotificationClick(item);
  }

  // --- Helpers Visuales de Prioridad y Categoría ---
  getPriorityBadgeClass(priority?: string): string {
    switch ((priority || '').toUpperCase()) {
      case 'CRITICAL':
        return 'badge-priority-critical';
      case 'WARNING':
        return 'badge-priority-warning';
      case 'INFO':
      default:
        return 'badge-priority-info';
    }
  }

  getPriorityIcon(priority?: string): string {
    switch ((priority || '').toUpperCase()) {
      case 'CRITICAL':
        return 'error';
      case 'WARNING':
        return 'warning';
      case 'INFO':
      default:
        return 'info';
    }
  }

  getCategoryLabel(category?: string): string {
    switch ((category || '').toUpperCase()) {
      case 'SECURITY':
        return 'Seguridad';
      case 'EXPIRATION_MEDICINE':
        return 'Vencimiento Medicamento';
      case 'CONTRACT':
        return 'Contrato / Resolución';
      case 'INVENTORY_ALERT':
        return 'Alerta de Inventario';
      default:
        return category || 'General';
    }
  }
}
