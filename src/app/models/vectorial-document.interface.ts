export interface VectorialDocumentInterface {
  id: number;
  documentTitle: string;
  chunkContent?: string;
  moduleCode: string;
  vectorEmbedding?: string;
  version: string;
  status: 'PROCESADO' | 'PENDIENTE' | 'REEMPLAZADO' | 'ERROR';
  metadata?: string;
  fileType: string;
  fileSize?: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  chunkCount?: number;
}

export interface VectorialDocumentRequestInterface {
  id?: number;
  documentTitle: string;
  content: string;
  moduleCode: string;
  version?: string;
  status?: string;
  metadata?: string;
  fileType?: string;
  fileSize?: number;
  chunks?: string[];
}

export interface VectorialDocumentPaginatedResponse {
  documents: VectorialDocumentInterface[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
}
