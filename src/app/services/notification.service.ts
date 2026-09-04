import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { config } from '../../environment/aurea';
import { NotificationInterface } from '../models/notifications/notification-interface';
import { RestApiService } from './rest-api.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly router = inject(Router);
  private readonly restApiService = inject(RestApiService);
  private readonly snackBar = inject(MatSnackBar);

  // --- Signals Reactivos ---
  public notifications = signal<NotificationInterface[]>([]);
  public recentNotifications = signal<NotificationInterface[]>([]);
  public unreadCount = signal<number>(0);
  public isConnected = signal<boolean>(false);
  public isLoading = signal<boolean>(false);

  // --- STOMP Client ---
  private stompClient: Client | null = null;
  private currentUserId: number = 0;

  constructor() {
    // Si ya existe sesión activa al cargar la app, conectar e inicializar conteo
    const token = localStorage.getItem('jwt');
    if (token) {
      this.initUserSession(token);
    }
  }

  /**
   * Inicializa la sesión de notificaciones (carga conteo REST y conecta WebSocket)
   */
  public initUserSession(token: string): void {
    this.currentUserId = this.extractUserIdFromToken(token);
    this.loadUnreadCount();
    this.loadRecentNotifications();
    this.connectWebSocket(token);
  }

  /**
   * Cierra la sesión y desconecta el WebSocket
   */
  public disconnectSession(): void {
    this.disconnectWebSocket();
    this.notifications.set([]);
    this.recentNotifications.set([]);
    this.unreadCount.set(0);
    this.currentUserId = 0;
  }

  /**
   * Conecta al WebSocket broker vía STOMP sobre SockJS
   */
  public connectWebSocket(token: string): void {
    if (this.stompClient && this.stompClient.active) {
      return;
    }

    try {
      this.stompClient = new Client({
        webSocketFactory: () => new SockJS(`${config.urlBackend}/ws`),
        connectHeaders: {
          Authorization: `Bearer ${token}`
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        debug: (msg: string) => {
          // console.log('[STOMP Debug]:', msg);
        }
      });

      this.stompClient.onConnect = (frame) => {
        console.log('✅ Conectado a WebSocket de Notificaciones (STOMP)');
        this.isConnected.set(true);
        this.subscribeToUserChannels();
      };

      this.stompClient.onStompError = (frame) => {
        console.error('❌ Error en broker STOMP:', frame.headers['message']);
        this.isConnected.set(false);
      };

      this.stompClient.onWebSocketClose = () => {
        this.isConnected.set(false);
      };

      this.stompClient.activate();
    } catch (err) {
      console.error('Error inicializando STOMP client:', err);
    }
  }

  /**
   * Suscribe a los tópicos privados del usuario autenticado
   */
  private subscribeToUserChannels(): void {
    if (!this.stompClient || !this.stompClient.connected) return;

    const userId = this.currentUserId || this.extractUserIdFromToken(localStorage.getItem('jwt') || '');

    // 1. Tópico específico de notificaciones del usuario
    if (userId > 0) {
      this.stompClient.subscribe(`/topic/notifications/${userId}`, (message: IMessage) => {
        this.handleIncomingNotification(message);
      });

      // Tópico de actualización en vivo del conteo
      this.stompClient.subscribe(`/topic/notifications/${userId}/count`, (message: IMessage) => {
        try {
          const body = JSON.parse(message.body);
          if (body && typeof body.unreadCount === 'number') {
            this.unreadCount.set(body.unreadCount);
          }
        } catch (e) {
          console.error('Error procesando actualización de conteo:', e);
        }
      });
    }

    // 2. Cola privada STOMP User: /user/queue/notifications
    this.stompClient.subscribe('/user/queue/notifications', (message: IMessage) => {
      this.handleIncomingNotification(message);
    });

    // 3. Tópico global de notificaciones para todos los usuarios
    this.stompClient.subscribe('/topic/notifications/global', (message: IMessage) => {
      this.handleIncomingNotification(message);
    });
  }

  /**
   * Procesa una notificación entrante en tiempo real
   */
  private handleIncomingNotification(message: IMessage): void {
    try {
      const notif: NotificationInterface = JSON.parse(message.body);
      console.log('🔔 Notificación en tiempo real recibida:', notif);

      // 1. Actualizar estado reactivo
      this.recentNotifications.update(prev => [notif, ...prev.slice(0, 9)]);
      this.notifications.update(prev => [notif, ...prev]);
      this.unreadCount.update(c => c + 1);

      // 2. Reproducir sonido de alerta
      this.playNotificationSound();

      // 3. Mostrar MatSnackBar con duración de 3000 ms (3 segundos)
      const actionText = notif.targetUrl ? 'Ver' : 'Cerrar';
      const snackRef = this.snackBar.open(`${notif.title}: ${notif.message}`, actionText, {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: this.getPrioritySnackbarClass(notif.priority)
      });

      snackRef.onAction().subscribe(() => {
        this.processNotificationClick(notif);
      });

    } catch (err) {
      console.error('Error procesando mensaje WebSocket:', err);
    }
  }

  /**
   * Desconecta el cliente STOMP
   */
  public disconnectWebSocket(): void {
    if (this.stompClient) {
      try {
        this.stompClient.deactivate();
      } catch (err) {
        console.warn('Error desconectando STOMP:', err);
      }
      this.stompClient = null;
      this.isConnected.set(false);
    }
  }

  // ==========================================
  // MÉTODOS REST API
  // ==========================================

  /**
   * Consulta el listado paginado de notificaciones desde el backend
   */
  public loadNotifications(page: number = 0, size: number = 10, category?: string, isRead?: boolean, search: string = ''): Observable<any> {
    this.isLoading.set(true);
    const params: Record<string, any> = {
      page: page + 1, // Adaptador: Backend espera 1-based page
      size: size,
      searchValue: search || ''
    };
    if (category && category !== 'ALL' && category !== 'TODAS') {
      params['category'] = category;
    }
    if (isRead !== undefined && isRead !== null) {
      params['isRead'] = isRead;
    }

    return this.restApiService.getRequest('/notifications', params).pipe(
      tap((res: any) => {
        const pageable = res?.pageable || res?.data;
        const list: NotificationInterface[] = pageable?.content || [];
        this.notifications.set(list);
        this.isLoading.set(false);
      }),
      catchError(err => {
        console.error('Error cargando notificaciones:', err);
        this.isLoading.set(false);
        return of(null);
      })
    );
  }

  /**
   * Carga las notificaciones recientes para el panel desplegable del sidenav
   */
  public loadRecentNotifications(): void {
    this.restApiService.getRequest('/notifications', { page: 1, size: 8 }).pipe(
      catchError(err => {
        console.warn('Error cargando notificaciones recientes:', err);
        return of(null);
      })
    ).subscribe((res: any) => {
      const pageable = res?.pageable || res?.data;
      if (pageable && pageable.content) {
        this.recentNotifications.set(pageable.content);
      }
    });
  }

  /**
   * Consulta el conteo de notificaciones no leídas
   */
  public loadUnreadCount(): void {
    this.restApiService.getRequest('/notifications/unread-count').pipe(
      catchError(err => {
        console.warn('Error consultando conteo de no leídas:', err);
        return of(null);
      })
    ).subscribe((res: any) => {
      const count = res?.data?.unreadCount !== undefined ? res.data.unreadCount : (res?.unreadCount || 0);
      this.unreadCount.set(count);
    });
  }

  /**
   * Marca una notificación individual como leída en backend y actualiza la UI
   */
  public markAsRead(id: number, targetUrl?: string): void {
    // Actualizar optimisticamente en la UI
    this.notifications.update(list => list.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n));
    this.recentNotifications.update(list => list.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n));
    this.unreadCount.update(c => Math.max(0, c - 1));

    // Petición al backend
    this.restApiService.patchRequest(`/notifications/${id}/read`, {}).pipe(
      catchError(err => {
        return this.restApiService.putRequest(`/notifications/${id}/read`, {});
      }),
      catchError(err => {
        console.error(`Error marcando notificación ${id} como leída:`, err);
        return of(null);
      })
    ).subscribe(() => {
      if (targetUrl) {
        this.router.navigate([targetUrl]);
      }
    });
  }

  /**
   * Marca todas las notificaciones del usuario como leídas
   */
  public markAllAsRead(): void {
    // Actualizar optimisticamente en la UI
    this.notifications.update(list => list.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
    this.recentNotifications.update(list => list.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
    this.unreadCount.set(0);

    // Petición al backend
    this.restApiService.patchRequest('/notifications/read-all', {}).pipe(
      catchError(err => {
        return this.restApiService.putRequest('/notifications/read-all', {});
      }),
      catchError(err => {
        console.error('Error marcando todas las notificaciones como leídas:', err);
        return of(null);
      })
    ).subscribe(() => {
      console.log('✅ Todas las notificaciones fueron marcadas como leídas');
    });
  }

  /**
   * Al hacer clic en una notificación: marca como leída y navega a target_url si existe
   */
  public processNotificationClick(notif: NotificationInterface): void {
    if (!notif.isRead && notif.id) {
      this.markAsRead(notif.id, notif.targetUrl);
    } else if (notif.targetUrl) {
      this.router.navigate([notif.targetUrl]);
    }
  }

  /**
   * Reproduce el sonido de alerta
   */
  private playNotificationSound(): void {
    try {
      const audio = new Audio('assets/sounds/notification.mp3');
      audio.play().catch(err => {
        // Los navegadores pueden bloquear audio autoplay sin interacción
      });
    } catch (e) {
      // Ignorar error de audio
    }
  }

  /**
   * Determina la clase CSS para el snackbar según la prioridad
   */
  private getPrioritySnackbarClass(priority?: string): string[] {
    switch ((priority || '').toUpperCase()) {
      case 'CRITICAL':
        return ['notif-snackbar-critical'];
      case 'WARNING':
        return ['notif-snackbar-warning'];
      case 'INFO':
      default:
        return ['notif-snackbar-info'];
    }
  }

  /**
   * Extrae el ID del usuario del JWT
   */
  private extractUserIdFromToken(token: string): number {
    try {
      if (!token) return 0;
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace('-', '+').replace('_', '/');
      const decoded = JSON.parse(window.atob(base64));
      return decoded.id || decoded.userId || Number(localStorage.getItem('rId') || '0');
    } catch (e) {
      return Number(localStorage.getItem('rId') || '0');
    }
  }
}