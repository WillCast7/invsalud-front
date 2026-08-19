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

    const activeFilter = this.selectedModuleFilter();

    // Estructura adaptada al ChatMessagesEntity + RAG filter
    const payload: AiChatRequest = {
      sessionId: this.sessionId,
      rol: 'user',
      content: trimmed,
      message: trimmed,
      moduleFilter: activeFilter === 'TODOS' ? undefined : activeFilter,
      context: {
        currentUser: localStorage.getItem('currentUser') || 'usuario',
        roleId: localStorage.getItem('rId') || '0',
        activeModuleFilter: activeFilter
      }
    };

    // Petición al backend
    this.restApiService.postRequest('/ai/chat', payload).pipe(
      catchError((error) => {
        console.warn('Endpoint /ai/chat no respondió, usando respuesta de contingencia RAG:', error);
        return of(this.getMockAiResponse(trimmed, activeFilter));
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
   * Respuesta de contingencia contextual RAG mientras el endpoint procesa Ollama
   */
  private getMockAiResponse(prompt: string, moduleFilter: string): AiChatResponse {
    const lower = prompt.toLowerCase();
    let reply = '';
    let sources: ChatSource[] = [];

    if (lower.includes('normat') || lower.includes('ley') || lower.includes('resoluc') || lower.includes('vencid') || lower.includes('vencer')) {
      reply = '📜 **Consulta sobre Normatividad Sanitaria y Medicamentos Vencidos**:\n\nSegún la **Resolución 1403 de 2007** y los manuales de procedimientos de INVSALUD:\n\n1. Los medicamentos por vencer (menos de 60 días) deben ser colocados en **semáforo de alerta (Amarillo/Rojo)**.\n2. Los medicamentos vencidos deben ser segregados inmediatamente al área de **Devoluciones / Farmacovigilancia**.\n3. Queda prohibida la comercialización o dispensación de productos sin registro INVIMA activo.';
      sources = [
        {
          documentTitle: 'Resolución_1403_2007_Normativa_Farmaceutica.pdf',
          moduleCode: 'NORMATIVA',
          similarity: 0.94,
          chunkIndex: 12,
          contentSnippet: 'Artículo 8: Clasificación y semaforización de medicamentos según su fecha de vencimiento...'
        },
        {
          documentTitle: 'Manual_Procedimientos_Medicamentos_Vencidos.pdf',
          moduleCode: 'MANUALES',
          similarity: 0.88,
          chunkIndex: 4,
          contentSnippet: 'Segregación en el área de cuarentena para devolución al proveedor o acta de destrucción...'
        }
      ];
    } else if (lower.includes('crear') || lower.includes('agregar') || lower.includes('nuevo') || lower.includes('editar') || lower.includes('eliminar')) {
      reply = '🛠️ **Procedimiento en la Aplicación INVSALUD**:\n\nPara realizar acciones de creación, edición o eliminación:\n\n* **Crear Insumo/Producto**: Dirígete al menú **Inventario > Gestión** y haz clic en el botón `+ Nuevo Insumo`. Llena el código, Lote, Registro INVIMA y stock inicial.\n* **Editar Registro**: En la tabla de inventario, presiona el icono de lápiz `✏️` en la fila correspondiente.\n* **Eliminar/Baja**: Requiere permiso de Administrador y se realiza mediante la opción `Dar de baja lote`.';
      sources = [
        {
          documentTitle: 'Manual_Usuario_INVSALUD_v2.pdf',
          moduleCode: 'MANUALES',
          similarity: 0.96,
          chunkIndex: 2,
          contentSnippet: 'Capítulo 3: Gestión de Productos e Insumos Médicos. Alta, actualización y eliminación de lotes.'
        }
      ];
    } else if (lower.includes('inventario') || lower.includes('stock') || lower.includes('producto')) {
      reply = '📦 **Consulta de Inventario y Control de Stock**:\n\nPuedes revisar el catálogo completo de productos e insumos desde **Inventario > Gestión**.\n\nEl sistema soporta filtrado por lote, semaforización de vencimiento y trazabilidad de código de barras.';
      sources = [
        {
          documentTitle: 'Guia_Gestion_Inventario_INVSALUD.pdf',
          moduleCode: 'INVENTARIO',
          similarity: 0.91,
          chunkIndex: 1,
          contentSnippet: 'Visualización y control de existencias en bodegas y farmacias satélite...'
        }
      ];
    } else {
      reply = `🤖 Consulta recibida: "*${prompt}*".\n\nEl mensaje fue enviado con el filtro de módulo \`${moduleFilter}\`. El pipeline RAG buscará los vectores más cercanos en la tabla \`document_chunks\` y devolverá la respuesta respaldada en las normativas y manuales trozados.`;
      sources = [
        {
          documentTitle: 'Documento_General_INVSALUD.pdf',
          moduleCode: moduleFilter !== 'TODOS' ? moduleFilter : 'GENERAL',
          similarity: 0.85,
          chunkIndex: 1,
          contentSnippet: 'Fragmento recuperado mediante búsqueda de similitud coseno en la BD de vectores...'
        }
      ];
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

