import { Leaf } from "lucide-react"
import * as z from 'zod';

interface DocumentStoreState {
    documents: Document[];
    isLoading: boolean;
    error: string | null;
    fileQueue: Document[];
  }
  
  interface DocumentMetadata {
    notes: string;
    tags: string[];
    category: string;
  }

  // Compliance concern types
  type ComplianceConcernType = 'jco' | 'dhcs' | 'carf' | 'other' | '';
  
  // Document categorization interface
  interface DocumentCategorization {
    facility_id?: string;
    patient_id?: string;
    compliance_concern?: ComplianceConcernType;
    compliance_concern_other?: string;
  }

  interface TextContentBlockParam {
    type: "text";
    text: string;
  }
  
  interface FileSearchTool {
    type: "file_search";
  }
  
  interface MessageAttachment {
    file_id: string;
    tools: FileSearchTool[]; // now each tool is guaranteed to be a FileSearch tool
  }
  
  interface MessagePayload {
    role: "user" | "assistant";
    content: string | TextContentBlockParam[];
    attachments?: MessageAttachment[] | null;
    metadata?: Record<string, string>;
  }
  
  
  
  interface Document {
    document_id: string;
    facility_id?: string;
    patient_id?: string;
    compliance_concern?: ComplianceConcernType;
    compliance_concern_other?: string;
    file_name?: string;
    file_type?: string;
    file_size?: number;
    file_path: z.infer<typeof filePathSchema>;
    bucket?: string;
    created_at?: string;
    updated_at?: string;
    user_id?: string;
    processing_status?: 'pending' | 'processing' | 'indexed' | 'failed' | 'unsupported_format' | string;
    processing_error?: string;
    metadata?: DocumentMetadata[];
    openai_file_id?: string;
    has_embeddings?: boolean;
  }

const filePathSchema = z.string().min(1);

  interface DocumentStore extends DocumentStoreState {
    setDocuments: (documents: Document[]) => void;
    setLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
    fetchDocuments: (facilityId?: string) => Promise<Document[]>;
    fetchDocumentsForCurrentFacility: () => Promise<Document[]>;
    addToFileQueue: (file: Document) => void;
    removeFromFileQueue: (file: Document) => void;
    uploadDocument: (file: File, categorization?: DocumentCategorization) => Promise<Document | null>;
    uploadAndProcessDocument: (file: File, categorization?: DocumentCategorization) => Promise<Document | null>;
    updateDocumentCategorization: (documentId: string, categorization: DocumentCategorization) => Promise<boolean>;
    getFileQueue: () => Document[];
  }

interface VectorStore {
    id: string;
    object: string;
    created_at: number;
    usage_bytes: number;
    last_active_at: number;
    name: string;
    status: string;
    file_counts: {
        in_progress: number;
        completed: number;
        cancelled: number;
        failed: number;
        total: number;
    };
    metadata: {};
    last_used_at: number;
}

interface VectorStoreFile {
    id: string;
    object: string;
    usage_bytes: number;
    created_at: number;
    vector_store_id: string;
    status: string;
    last_error: null;
    chunking_strategy: {
        type: string;
        static: {
            max_chunk_size_tokens: number;
            chunk_overlap_tokens: number;
        }
    }
}

interface VectorStoreFileBatch {
    id: string;
    object: string;
    created_at: number;
    vector_store_id: string;
    status: string;
    file_counts: {
        in_progress: number;
        completed: number;
        failed: number;
        cancelled: number;
        total: number;
    }
}

interface DocumentSearchResult {
  // Add properties for DocumentSearchResult here
}

export type {
  MessagePayload,
  DocumentStoreState,
  DocumentMetadata,
  Document,
  DocumentStore,
  VectorStore,
  VectorStoreFile,
  VectorStoreFileBatch,
  ComplianceConcernType,
  DocumentCategorization,
  DocumentSearchResult
};