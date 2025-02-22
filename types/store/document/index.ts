import { Leaf } from "lucide-react"


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
  
  interface Document {
    document_id: string;
    facility_id?: string;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
    filePath?: string;
    bucket?: string;
    createdAt?: string;
    updatedAt?: string;
    userId?: string;
    processingStatus?: string;
    metadata?: DocumentMetadata[];
  }
  
  interface DocumentStore extends DocumentStoreState {
    setLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
    fetchDocuments: () => any;
    addToFileQueue: (file: Document) => void;
    removeFromFileQueue: (file: Document) => void;
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

export type {
    DocumentStoreState,
    DocumentMetadata,
    Document,
    DocumentStore,
    VectorStore,
    VectorStoreFile,
    VectorStoreFileBatch,
};