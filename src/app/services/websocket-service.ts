import { Injectable } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { config } from '../../environment/aurea';
import { NotificationInterface } from '../models/notifications/notification-interface';
import { AlertService } from './alerts.service';
import { Router } from '@angular/router';
import { SessionService } from './session.service';
import { NotificationStoreService } from './notification-store.service';

// Declarar las variables globales
declare var SockJS: any;
declare var Stomp: any;

@Injectable({ providedIn: 'root' })
export class WebSocketService{
  private stompClient: any;
  private connected = false;
  private messageQueue: { destination: string; body: string }[] = [];
  private connectionSubject = new Subject<boolean>();
  private sub!: Subscription; 
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  constructor(
      readonly router: Router,
      private readonly alertService: AlertService,
      private readonly notificationStoreService: NotificationStoreService
    ) {
  }

  private initConnection(token: string) {
    try {
      // Usar exactamente la misma sintaxis que funcionaba antes
      const socket = new SockJS(config.urlBackend + '/ws');
      this.stompClient = Stomp.over(socket);

      // Configurar opciones
      this.stompClient.heartbeat.outgoing = 4000;
      this.stompClient.heartbeat.incoming = 4000;
      this.stompClient.reconnect_delay = 5000;

      // Debug (opcional)
      this.stompClient.debug = (msg: string) => console.log("STOMP: ", msg);

      this.stompClient.connect({Authorization: `Bearer ${token}`}, 
        (frame: any) => {
          console.log("✅ Conectado al websocket: " + frame);
          this.reconnectAttempts = 0;
          this.connected = true;
          this.connectionSubject.next(true);
          this.flushQueue();
        },
        (error: any) => {
          console.error('❌ Error STOMP: ', error);
          this.connected = false;
          this.connectionSubject.next(false);
          console.warn("🔴 Conexión cerrada, reintentando...");
          this.handleReconnect();
        }
      );

    } catch (error) {
      console.error('Error inicializando WebSocket:', error);
    }
  }

  private finalizeConection(){
    if (this.stompClient && this.connected) {
      try {
        this.stompClient.disconnect(() => {
          console.log("🔴 Desconectado del WebSocket");
        });
      } catch (error) {
        console.error('Error desconectando:', error);
      }
      this.connected = false;
      this.connectionSubject.next(false);
    }
  }
  /**
   * Permite a otros componentes saber si hay conexión activa
   */
  getConnectionStatus(): Observable<boolean> {
    return this.connectionSubject.asObservable();
  }

  /**
   * Suscribirse a un topic y recibir mensajes como Observable
   */
  subscribeToTopic(topic: string): Observable<any> {
    return new Observable(observer => {
      if (!this.stompClient || !this.connected) {
        console.warn('⚠ STOMP client no conectado');
        return;
      }

      const subscription = this.stompClient.subscribe(topic, (message: any) => {
        try {
          const parsedMessage = JSON.parse(message.body);
          observer.next(parsedMessage);
        } catch (error) {
          console.error('Error parsing message:', error);
          observer.next(message.body); // Enviar como string si no es JSON
        }
      });

      // Función de cleanup
      return () => {
        if (subscription && subscription.unsubscribe) {
          subscription.unsubscribe();
        }
      };
    });
  }

  /**
   * Publicar mensaje, si no hay conexión lo guarda en la cola
   */
  sendMessage(destination: string, payload: any) {
    const body = JSON.stringify(payload);
    
    if (this.connected && this.stompClient) {
      try {
        this.stompClient.send(destination, {}, body);
      } catch (error) {
        console.error('Error enviando mensaje:', error);
        this.messageQueue.push({ destination, body });
      }
    } else {
      console.warn("⚠ Sin conexión, mensaje en cola");
      this.messageQueue.push({ destination, body });
    }
  }

  /**
   * Reenvía todos los mensajes pendientes cuando vuelve la conexión
   */
  private flushQueue() {
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift();
      if (msg && this.stompClient) {
        console.log("Reenviando mensaje de cola", msg);
        try {
          this.stompClient.send(msg.destination, {}, msg.body);
        } catch (error) {
          console.error('Error reenviando mensaje:', error);
          // Volver a encolar si falla
          this.messageQueue.unshift(msg);
          break;
        }
      }
    }
  }

     // ✅ Esperar a que STOMP esté conectado antes de suscribirnos
  private connectSubscription(){
    this.getConnectionStatus().subscribe(status => {
      console.info('Estado conexión:', status ? '✅ Conectado' : '🔴 Desconectado');
      
      if (status) {
        this.sub = this.subscribeToTopic('/topic/notifications')
          .subscribe((msg: NotificationInterface) => {
            this.notificationStoreService.addNotification(msg);
            this.playNotificationSound();
            this.alertService.reCallMixin.fire({ 
              icon: 'warning',
              title: msg.title,
              text: msg.message,
              confirmButtonText: "Llamar"
            }).then((result: any) => {
              if (result.isConfirmed) {
                if(msg.id){
                  this.notificationStoreService.markAsRead(msg.id)
                }
                this.router.navigate([msg.route])
              }
            });
          });
      }
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('🚨 Máximo de intentos de reconexión alcanzado');
      return;
    }
    this.reconnectAttempts++;
    const delay = Math.min(1000 * this.reconnectAttempts, 10000); // Backoff hasta 10s
    const jwt: string | null = localStorage.getItem("jwt");
    console.log(`🔄 Reintentando conexión en ${delay / 1000}s...`);
    
    jwt ?
    setTimeout(() => this.initConnection(jwt), delay) : 
    console.error("🔴 No hay sesion valida");
  }

  public autoReconnectIfTokenExists() {
    const token = localStorage.getItem('jwt');
    if (token && !this.connected) {
      console.log('🔄 Reconectando WebSocket con token persistente...');
      this.connect(token);
    }
  }

  public connect(token: string ) {
    if (!this.connected) {
      this.initConnection(token);
      this.connectSubscription(); 
    }
  }

  public disconnect() {
    if (this.connected) {
      this.finalizeConection();
    }
  }

  playNotificationSound() {
    const audio = new Audio('assets/sounds/notification.mp3');
    audio.play();
  }
  
}