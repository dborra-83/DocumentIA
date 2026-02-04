// User and Authentication Types
export interface User {
  id: string;
  email: string;
  username: string;
}

export interface AuthTokens {
  idToken: string;
  accessToken: string;
  refreshToken: string;
}

// Document Types
export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type VerticalType = 
  | 'Healthcare' 
  | 'Education' 
  | 'Retail' 
  | 'Legal' 
  | 'Finance' 
  | 'Manufacturing' 
  | 'HR' 
  | 'Technology';

export interface Document {
  documentId: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  vertical: VerticalType;
  status: DocumentStatus;
  uploadDate: string;
  processingTime?: number;
  errorMessage?: string;
}

// Analysis Result Types
export interface ExtractedData {
  nombres_personas?: string[];
  nombres_empresas?: string[];
  fechas_importantes?: Array<{
    fecha: string;
    descripcion: string;
  }>;
  valores_monetarios?: Array<{
    monto: string;
    moneda: string;
    concepto: string;
  }>;
  numeros_referencia?: string[];
  ubicaciones?: string[];
  emails?: string[];
  telefonos?: string[];
}

export interface AnalysisMetadata {
  tipo_documento?: string;
  idioma_original?: string;
  nivel_confianza?: 'alto' | 'medio' | 'bajo';
  requiere_revision_humana?: boolean;
}

export interface AnalysisResult {
  documentId: string;
  executiveSummary: string;
  keyPoints: string[];
  nextSteps: string[];
  extractedData?: ExtractedData;
  metadata?: AnalysisMetadata;
  processingTime: number;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
  };
  createdAt: string;
}

export interface DocumentWithAnalysis extends Document {
  analysis?: AnalysisResult;
}

// Document Record with embedded analysis (for history view)
export interface DocumentRecord {
  documentId: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  vertical: string;
  status: DocumentStatus;
  uploadedAt: string;
  processingTimeMs?: number | null;
  analysis?: {
    executiveSummary?: string;
    keyPoints?: string[];
    nextSteps?: string[];
    extractedData?: ExtractedData;
    metadata?: AnalysisMetadata;
    analyzedAt?: string;
    inputTokens?: number;
    outputTokens?: number;
  };
  analysisResult?: {
    executiveSummary?: string;
    keyPoints?: string[];
    nextSteps?: string[];
    extractedData?: ExtractedData;
    metadata?: AnalysisMetadata;
  };
  errorMessage?: string;
}

// Upload Types
export interface UploadRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
  vertical: VerticalType;
}

export interface UploadResponse {
  documentId: string;
  uploadUrl: string;
  expiresIn: number;
}

// History Types
export interface DocumentListRequest {
  page?: number;
  pageSize?: number;
  vertical?: VerticalType;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface DocumentListResponse {
  documents: Document[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Metrics Types
export interface UserMetrics {
  totalDocuments: number;
  documentsByVertical: Record<VerticalType, number>;
  averageProcessingTime: number;
  favoriteVertical: VerticalType | null;
  timeSeriesData: TimeSeriesDataPoint[];
}

export interface TimeSeriesDataPoint {
  date: string;
  count: number;
}

// Export Types
export type ExportFormat = 'pdf' | 'json' | 'excel' | 'word';

export interface ExportRequest {
  documentId: string;
  format: ExportFormat;
}

export interface ExportResponse {
  downloadUrl: string;
  expiresIn: number;
  format: ExportFormat;
}

// API Response Types
export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface UploadFormData {
  file: File | null;
  vertical: VerticalType;
}
