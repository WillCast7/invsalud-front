import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { MenuService } from './menu.service';
import { MenuItemInterface } from '../models/menuItem-interface';
import { WebSocketService } from './websocket-service';
import { AuthInterface } from '../models/auth-interface';
import { NotificationStoreService } from './notification-store.service';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  public currentUserNames = signal<string>(localStorage.getItem('namesUser') || '');
  constructor(
    private readonly router: Router,
    private readonly menuService: MenuService,
    //private readonly webSocket: WebSocketService,
    //private readonly notificationStoreService: NotificationStoreService
  ) { }
 
  public menuSubject: BehaviorSubject<MenuItemInterface[]> = new BehaviorSubject<MenuItemInterface[]>([]);

    // Almacenar sesión, incluyendo el JWT, nombre de usuario y menú en localStorage
    storeSession(authBody: AuthInterface) {
      const newMenu = this.menuService.groupByFather(authBody.menus);  // Agrupar menú por padre
      localStorage.setItem('isLogged', 'true');
      localStorage.setItem('currentUser', authBody.username);
      localStorage.setItem('namesUser', authBody.names);
      localStorage.setItem('menu', JSON.stringify(newMenu));
      localStorage.setItem('jwt', authBody.jwt);  // Almacenar JWT token en localStorage

      this.currentUserNames.set(authBody.names);
      
      //TODO notificacionesthis.notificationStoreService.setInitialNotifications(authBody.notifications);

      // localStorage.setItem('notifications', JSON.stringify(authBody.notifications));  // Almacenar notificaciones token en localStorage

      //this.webSocket.connect(authBody.jwt);
      
      // Guardar el menú también en el menúSubject para que esté disponible globalmente
      this.menuSubject.next(newMenu);
    }

  // Getter para obtener el menú
  get menu(): MenuItemInterface[] {
    if (this.menuSubject.value.length === 0) {
      // Si el menú no está cargado, lo obtenemos del localStorage
      const storedMenu = localStorage.getItem('menu');
      if (storedMenu) {
        this.menuSubject.next(JSON.parse(storedMenu)); 
      }

    }
    return this.menuSubject.value;
  }

  // Verifica si el JWT token está presente en localStorage
  isAuthenticated(): boolean {
    const token = this.getTokenFromLocalStorage('jwt');
    console.log('Token JWT encontrado:', token);
    return !!token;  // Devuelve true si existe un token
  }

  // Verifica si la sesión está activa y el token no está expirado
  isSessionActive(): boolean {
    const token = this.getTokenFromLocalStorage('jwt');
    return token != null && !this.isTokenExpired();
  }

  // Cerrar sesión (limpiar localStorage)
  logOut(): void {
    //this.webSocket.disconnect();
    this.currentUserNames.set('');
    localStorage.clear();
    this.router.navigate(['/']);
  }

  // Obtener el JWT token del localStorage
  getTokenFromLocalStorage(key: string) {
    return localStorage.getItem(key);  // Recupera el JWT desde el localStorage
  }

  // Verificar si el token está caducado (utiliza la información de expiración del JWT)
  isTokenExpired(): boolean {
    const token = this.getTokenFromLocalStorage('jwt');
    if (token) {
      const decoded = this.decodeJwt(token);
      return decoded.exp * 1000 < Date.now();  // Expira si el timestamp de expiración es menor que el tiempo actual
    }
    return true;  // Si no hay token, consideramos que está expirado
  }

  // Decodificar JWT (sin validación)
  decodeJwt(token: string): any {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace('-', '+').replace('_', '/');
    return JSON.parse(window.atob(base64));
  }

  // Redirigir al login si no está autenticado o si la sesión ha expirado
  redirectToLogin() {
    this.router.navigate(['/']);
  }

  // Verificar si el usuario está autenticado y redirigir si no lo está
  checkAuth() {
    if (!this.isSessionActive()) {
      this.logOut();  // Si no está autenticado o la sesión expiró, cerrar sesión
      this.redirectToLogin();  // Redirigir al login
    }
  }

  hasRole(role: string): boolean {
    const token = localStorage.getItem('jwt');
    if (!token) return false;
    const decoded: any = this.decodeJwt(token);
    return decoded.roles.includes(role);
  }

}
