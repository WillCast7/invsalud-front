export interface ChatSource {
  documentTitle: string;
  moduleCode?: string;
  similarity?: number;
  chunkIndex?: number;
  contentSnippet?: string;
}

export interface ChatMessage {
  id?: string | number;
  sessionId?: string;
  sender: 'user' | 'assistant' | 'system' | 'tool';
  text: string;
  timestamp: Date | string;
  status?: 'sending' | 'sent' | 'error';
  sources?: ChatSource[];
}

export interface ChatSession {
  sessionId: string;
  startTime: string;
  messages: ChatMessage[];
}

export interface AiChatRequest {
  sessionId: string;
  rol: 'user' | 'assistant' | 'tool';
  content: string;
  message?: string;
  moduleFilter?: string;
  context?: Record<string, any>;
}

export interface AiChatResponse {
  sessionId?: string;
  rol?: 'assistant' | 'user' | 'tool';
  content?: string;
  reply?: string;
  createdAt?: string;
  timestamp?: string;
  sources?: ChatSource[];
  referencias?: ChatSource[];
  data?: any;
}

