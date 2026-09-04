import { Component, OnInit, ViewChild, signal, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSidenavModule, MatDrawer, MatDrawerMode } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';

// Propios
import { LoginComponent } from "../pages/login/login.component";
import { SessionService } from '../../services/session.service';
import { MenuItemInterface } from '../../models/menuItem-interface';
import { NotificationInterface } from '../../models/notifications/notification-interface';
import { NotificationService } from '../../services/notification.service';
import { AiChatComponent } from '../ai-chat/ai-chat.component';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    LoginComponent,
    AiChatComponent,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSidenavModule,
    MatIconModule,
    MatBadgeModule,
    MatToolbarModule,
    MatMenuModule
  ],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.css'
})
export class SidenavComponent implements OnInit {
  // --- Inyecciones ---
  readonly router = inject(Router);
  private readonly titleService = inject(Title);
  private readonly sessionService = inject(SessionService);
  public readonly notificationService = inject(NotificationService);

  // --- ViewChild ---
  @ViewChild('drawer') drawer!: MatDrawer;

  // --- Signals de Estado de UI ---
  isMobile = signal<boolean>(window.innerWidth < 768);
  drawerValue = signal<MatDrawerMode>('push');

  // --- Signals de Datos ---
  namesUser = this.sessionService.currentUserNames;
  menues = signal<MenuItemInterface[]>([]);

  // --- Lógica Reactiva de Navegación ---
  private readonly navEnd$ = this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd)
  );

  // Signal del Título del Navbar
  readonly pageTitle = toSignal(
    this.navEnd$.pipe(
      map(() => {
        let route = this.router.routerState.snapshot.root;
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route.title || this.titleService.getTitle();
      })
    ),
    { initialValue: this.titleService.getTitle() }
  );

  // Signal para detectar la ruta pública de restablecimiento de contraseña
  readonly isResetPasswordRoute = toSignal(
    this.navEnd$.pipe(
      map(() => this.router.url.split('?')[0] === '/reset-password')
    ),
    { initialValue: typeof window !== 'undefined' ? window.location.pathname === '/reset-password' : false }
  );

  // --- Listeners ---
  @HostListener('window:resize')
  onResize() {
    this.isMobile.set(window.innerWidth < 768);
  }

  ngOnInit(): void {
    // Suscripción al menú
    this.sessionService.menuSubject.subscribe(() => {
      this.menues.set(this.sessionService.menu);
    });
  }

  // --- Acciones de Sesión ---
  isSessionActive(): boolean {
    return this.sessionService.isSessionActive();
  }

  logOut(): void {
    this.sessionService.logOut();
  }

  // --- Navegación ---
  navigateTo(route: string): void {
    if (this.drawer) {
      this.drawer.close();
    }

    const accordions = document.querySelectorAll('.accordion-collapse');
    accordions.forEach((accordion) => {
      accordion.classList.remove('show');
    });

    this.router.navigate([route]);
  }

  // --- Notificaciones ---
  processNotification(notification: NotificationInterface): void {
    this.notificationService.processNotificationClick(notification);
  }

  markAllAsRead(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.notificationService.markAllAsRead();
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

  getPriorityIconClass(priority?: string): string {
    switch ((priority || '').toUpperCase()) {
      case 'CRITICAL':
        return 'text-danger';
      case 'WARNING':
        return 'text-warning';
      case 'INFO':
      default:
        return 'text-primary';
    }
  }

  getRelativeTime(dateStr?: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMin < 1) return 'Hace un momento';
      if (diffMin < 60) return `Hace ${diffMin} min`;
      if (diffHours < 24) return `Hace ${diffHours} h`;
      if (diffDays === 1) return 'Ayer';
      if (diffDays < 7) return `Hace ${diffDays} días`;
      return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
    } catch {
      return '';
    }
  }
}