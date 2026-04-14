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

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    LoginComponent,
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

  // --- ViewChild ---
  @ViewChild('drawer') drawer!: MatDrawer;

  // --- Signals de Estado de UI ---
  isMobile = signal<boolean>(window.innerWidth < 768);
  drawerValue = signal<MatDrawerMode>('push');
  
  // --- Signals de Datos ---
  namesUser = this.sessionService.currentUserNames; // Ya es signal en el servicio
  menues = signal<MenuItemInterface[]>([]);
  notificationList = signal<NotificationInterface[]>([]);
  notificationsNumber = signal<number>(0);

  // --- Lógica Reactiva de Navegación ---
  private readonly navEnd$ = this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd)
  );

  // Signal del Título del Navbar
// 1. Signal del Título del Navbar (Versión ultra-precisa)
readonly pageTitle = toSignal(
  this.navEnd$.pipe(
    map(() => {
      // Navegamos por el árbol de rutas activas hasta llegar a la hoja final
      let route = this.router.routerState.snapshot.root;
      while (route.firstChild) {
        route = route.firstChild;
      }
      // Retornamos el título configurado en la ruta o, si no tiene, el del TitleService
      return route.title || this.titleService.getTitle();
    })
  ),
  { initialValue: this.titleService.getTitle() }
);
  // Signal de Acciones Dinámicas (Botones extra en navbar si existen)


  // --- Listeners ---
  @HostListener('window:resize')
  onResize() {
    this.isMobile.set(window.innerWidth < 768);
  }

  ngOnInit(): void {
    // Suscripción al menú (Hasta que el servicio sea 100% signals)
    this.sessionService.menuSubject.subscribe(() => {
      this.menues.set(this.sessionService.menu);
    });

    // Aquí podrías inicializar tus notificaciones
    // this.notificationList.set(notifs);
    // this.notificationsNumber.set(notifs.length);
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
    
    // Limpieza de acordeones de Bootstrap (necesario por el HTML que usas)
    const accordions = document.querySelectorAll('.accordion-collapse');
    accordions.forEach((accordion) => {
      accordion.classList.remove('show');
    });

    this.router.navigate([route]);
  }

  // --- Notificaciones ---
  processNotification(notification: NotificationInterface): void {
    // Lógica para marcar como leída si es necesario
    this.router.navigate([notification.route]);
  }
}