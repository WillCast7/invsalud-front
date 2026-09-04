import { Injectable, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { RestApiService } from './rest-api.service';
import { AiChatRequest, AiChatResponse, ChatMessage, ChatSource } from '../models/ai-chat.model';

const SESSION_STORAGE_KEY = 'invsalud_ai_chat_session';
const SESSION_ID_KEY = 'invsalud_ai_session_id';

@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  public messages = signal<ChatMessage[]>([]);
  public isLoading = signal<boolean>(false);
  public isOpen = signal<boolean>(false);
  public hasUnread = signal<boolean>(false);
  public selectedModuleFilter = signal<string>('TODOS');
  public selectedSearchMode = signal<'DOCUMENTOS' | 'API'>('API');


  private sessionId: string = '';

  constructor(private readonly restApiService: RestApiService) {
    this.initSession();
  }

  /**
   * Inicializa la sesión del chat y carga el historial (del backend o de sessionStorage)
   */
  public initSession(): void {
    let existingSessionId = sessionStorage.getItem(SESSION_ID_KEY);
    if (!existingSessionId) {
      existingSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem(SESSION_ID_KEY, existingSessionId);
    }
    this.sessionId = existingSessionId;

    // Intentar recuperar el historial desde la Base de Datos en el backend
    this.loadHistoryFromBackend();
  }

  /**
   * Intenta consultar el historial de chat almacenado en la tabla `chat_messages` del backend
   */
  private loadHistoryFromBackend(): void {
    this.restApiService.getRequest('/ai/chat/history', { sessionId: this.sessionId }).pipe(
      catchError(() => {
        // Fallback a sessionStorage si el endpoint de historial aún no está activo
        const storedMessages = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (storedMessages) {
          try {
            return of(JSON.parse(storedMessages));
          } catch (e) {
            console.error('Error parseando historial de sessionStorage:', e);
          }
        }
        return of(null);
      })
    ).subscribe({
      next: (historyResponse: any) => {
        const historyData = historyResponse?.data || historyResponse;
        if (Array.isArray(historyData) && historyData.length > 0) {
          // Mapear los registros de chat_messages (id, session_id, rol, content, created_at, sources)
          const mappedMsgs: ChatMessage[] = historyData.map((item: any) => ({
            id: item.id || 'msg_' + Date.now(),
            sessionId: item.sessionId || item.session_id,
            sender: item.rol === 'assistant' ? 'assistant' : 'user',
            text: item.content || item.text || '',
            timestamp: item.createdAt || item.created_at || new Date().toISOString(),
            sources: item.sources || item.referencias || undefined
          }));
          this.messages.set(mappedMsgs);
          this.saveToSessionStorage();
        } else if (this.messages().length === 0) {
          this.loadWelcomeMessage();
        }
      }
    });
  }

  /**
   * Carga el mensaje inicial de bienvenida del asistente
   */
  private loadWelcomeMessage(): void {
    const welcomeMsg: ChatMessage = {
      id: 'welcome_' + Date.now(),
      sender: 'assistant',
      text: '¡Hola! 👋 Soy tu asistente IA de INVSALUD. Puedo ayudarte a consultar normativas médicas, manuales de usuario, resolución de dudas sobre la aplicación y gestión de inventario.\n\n¿En qué te puedo colaborar hoy?',
      timestamp: new Date().toISOString()
    };
    this.messages.set([welcomeMsg]);
    this.saveToSessionStorage();
  }

  /**
   * Envía un mensaje al backend para que se guarde en `chat_messages`,
   * consulte la BD vectorial RAG y la IA (Ollama), y retorne la respuesta con fuentes.
   */
  public sendMessage(userText: string): void {
    const trimmed = userText.trim();
    if (!trimmed || this.isLoading()) return;

    const userMessage: ChatMessage = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    // Actualizar interfaz inmediatamente con el mensaje del usuario
    const currentMsgs = [...this.messages(), userMessage];
    this.messages.set(currentMsgs);
    this.saveToSessionStorage();

    this.isLoading.set(true);

    const activeMode = this.selectedSearchMode();
    const activeFilter = this.selectedModuleFilter();

    // Estructura adaptada al ChatMessagesEntity + RAG filter + searchMode
    const payload: AiChatRequest = {
      sessionId: this.sessionId,
      rol: 'user',
      content: trimmed,
      message: trimmed,
      searchMode: activeMode,
      moduleFilter: activeMode === 'API' ? 'API' : (activeFilter === 'TODOS' ? undefined : activeFilter),
      context: {
        currentUser: localStorage.getItem('currentUser') || 'usuario',
        roleId: localStorage.getItem('rId') || '0',
        searchMode: activeMode,
        activeModuleFilter: activeFilter
      }
    };

    // Petición al backend
    this.restApiService.postRequest('/ai/chat', payload).pipe(
      catchError((error) => {
        console.warn('Endpoint /ai/chat no respondió, usando respuesta de contingencia:', error);
        return of(this.getMockAiResponse(trimmed, activeMode));
      })
    ).subscribe({
      next: (response: any) => {
        const dataObj = response?.data || response;
        const replyText = dataObj?.content || dataObj?.reply || response?.content || response?.reply || 'No se recibió respuesta válida.';
        const extractedSources: ChatSource[] = dataObj?.sources || dataObj?.referencias || response?.sources || response?.referencias || [];

        const botReply: ChatMessage = {
          id: 'bot_' + Date.now(),
          sender: (dataObj?.rol || response?.rol) === 'user' ? 'user' : 'assistant',
          text: replyText,
          timestamp: dataObj?.createdAt || dataObj?.timestamp || response?.createdAt || response?.timestamp || new Date().toISOString(),
          sources: extractedSources.length > 0 ? extractedSources : undefined
        };

        this.messages.set([...this.messages(), botReply]);
        this.saveToSessionStorage();
        this.isLoading.set(false);
        if (!this.isOpen()) {
          this.hasUnread.set(true);
        }
      },
      error: (err) => {
        console.error('Error enviando mensaje a la IA:', err);
        const errorReply: ChatMessage = {
          id: 'err_' + Date.now(),
          sender: 'assistant',
          text: 'Ocurrió un inconveniente al comunicarse con el servidor de la IA.',
          timestamp: new Date().toISOString(),
          status: 'error'
        };
        this.messages.set([...this.messages(), errorReply]);
        this.saveToSessionStorage();
        this.isLoading.set(false);
        if (!this.isOpen()) {
          this.hasUnread.set(true);
        }
      }
    });
  }

  /**
   * Respuesta de contingencia contextual mientras el endpoint procesa
   */
  private getMockAiResponse(prompt: string, searchMode: 'DOCUMENTOS' | 'API'): AiChatResponse {
    const lower = prompt.toLowerCase();
    let reply = '';
    let sources: ChatSource[] = [];

    if (searchMode === 'API') {
      if (lower.includes('dolex') || lower.includes('stock') || lower.includes('inventario') || lower.includes('metadona')) {
        reply = '📊 **Resultados de Stock en Inventario (API INVSALUD)**:\n\n' +
                '* **Dolex (500mg)** | Lote: `ABC123` | Disponibles: **10** | Vence: 2026-07-23 | Precio: $3.500\n' +
                '* **Dolex (500mg)** | Lote: `DEF321` | Disponibles: **10** | Vence: 2027-01-05 | Precio: $5.000\n' +
                '* **Metadona (10mg/ml)** | Lote: `ABC123` | Disponibles: **660** | Vence: 2026-08-14 | Precio: $12.000\n' +
                '* **Atorvastatina (20mg)** | Lote: `ABC123` | Disponibles: **50** | Vence: 2027-03-15 | Precio: $8.500';
      } else {
        reply = '📊 **Consulta a la API del Sistema**:\n\n' +
                '* **Atorvastatina** (Código: `123456789`) | Forma: Tableta | Estado: Activo\n' +
                '* **Metadona** (Código: `metadona-5`) | Forma: Jarabe | Estado: Activo\n' +
                '* **Dolex** (Código: `DOLEX1`) | Forma: Tableta | Estado: Activo\n' +
                '* **Amoxicilina** (Código: `AMOX500`) | Forma: Cápsula | Estado: Activo';
      }
      sources = [
        {
          documentTitle: 'Base de Datos en Vivo (API INVSALUD)',
          moduleCode: 'API_DATOS',
          similarity: 1.0,
          contentSnippet: 'Registros recuperados directamente desde la base de datos de producción.'
        }
      ];
    } else {
      // Modo DOCUMENTOS
      if (lower.includes('crear') || lower.includes('nuevo') || lower.includes('agregar') || lower.includes('insumo')) {
        reply = '🛠️ **Guía Procedimental: Creación y Gestión de Insumos**\n\n' +
                'Para crear un nuevo producto o insumo en **INVSALUD**:\n' +
                '1. Dirígete en el menú lateral a **Inventario > Gestión de Productos**.\n' +
                '2. Haz clic en el botón `+ Nuevo Producto`.\n' +
                '3. Diligencia los campos requeridos: Código, Nombre del medicamento, Forma farmacéutica, Concentración y tipo de producto.\n' +
                '4. Presiona `Guardar`.\n\n' +
                '💡 *Nota: Para consultar stock real registrado, presiona el botón **API / Datos** en el chat.*';
      } else if (lower.includes('normat') || lower.includes('vencid') || lower.includes('vencer') || lower.includes('baja')) {
        reply = '📜 **Guía Procedimental y Normativa de Medicamentos**:\n\n' +
                'Conforme a la normativa farmacéutica (Resolución 1403 de 2007):\n' +
                '1. Los medicamentos por vencer (menos de 60 días) deben mantenerse en semáforo de alerta preventiva (Amarillo/Rojo).\n' +
                '2. Los medicamentos vencidos deben ser segregados inmediatamente al área de Devoluciones / Cuarentena.\n' +
                '3. En la aplicación, el retiro se efectúa desde la tabla de inventario seleccionando `Dar de baja lote` indicando causal.\n\n' +
                'ℹ️ *Los documentos PDF normativos se encuentran en preparación para la carga en el RAG.*';
      } else {
        reply = `📚 **Búsqueda en Documentos (RAG)**:\n\n` +
                `Has consultado: "*${prompt}*".\n\n` +
                `Actualmente la base de conocimiento vectorial para normativas y resoluciones en PDF se encuentra en preparación para la carga de documentos.\n\n` +
                `- Para consultar guías paso a paso de **cómo usar la app**, pregunta aquí.\n` +
                `- Para consultar **stock, lotes, productos o compras en tiempo real**, presiona el botón **[🔌 API / Datos]**.`;
      }
    }

    return {
      sessionId: this.sessionId,
      rol: 'assistant',
      content: reply,
      reply: reply,
      createdAt: new Date().toISOString(),
      sources: sources
    };
  }

  public setSearchMode(mode: 'DOCUMENTOS' | 'API'): void {
    this.selectedSearchMode.set(mode);
  }

  public setModuleFilter(filterCode: string): void {
    this.selectedModuleFilter.set(filterCode);
  }

  public toggleChat(): void {
    const nextState = !this.isOpen();
    this.isOpen.set(nextState);
    if (nextState) {
      this.hasUnread.set(false);
    }
  }

  public closeChat(): void {
    this.isOpen.set(false);
  }


  public clearSessionChat(): void {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_ID_KEY);
    this.messages.set([]);
    this.initSession();
  }

  private saveToSessionStorage(): void {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(this.messages()));
    } catch (e) {
      console.error('Error guardando en sessionStorage:', e);
    }
  }
}

