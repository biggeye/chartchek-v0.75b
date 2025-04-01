export interface Corpus {
    id: string,
    corpus_name: string,
    display_name: string,
    description?: string,
}

export interface KnowledgeDocument {
    id: string,
    corpus_id: string,
    document_name?: string,
    original_filename: string,
    file_type?: string,
    file_size?: any,
    content_hash?: any,
    status: 'pending' | 'processing' | 'complete' | 'error';
    created_by: string,
    created_at?: any,
    updated_at?: any
}

export interface KnowledgeDocumentMetadata {
    document_id: string,
    key: string,
    value: any,
    value_type?: 'string' | 'number' | 'boolean' | 'date',
    created_at: any,
    updated_at?: any
}

export interface Corpus {
    id: string;
    corpus_name: string;
    display_name: string;
    description?: string;
    created_at: string;
}


export interface KnowledgeState {
    corpora: Corpus[];
    selectedCorpusId: string | null;
    documents: KnowledgeDocument[];
    selectedDocumentId: string | null;
    metadata: KnowledgeDocumentMetadata[];
    isLoading: boolean;
    error: string | null;

    fetchCorpora: () => Promise<void>;
    createCorpus: (displayName: string, description?: string) => Promise<void>;
    setSelectedCorpusId: (id: string | null) => void;

    // Document actions
    fetchDocuments: (corpusId: string) => Promise<void>;
    uploadDocument: (corpusId: string, file: File, metadata?: Record<string, any>) => Promise<void>;
    setSelectedDocumentId: (id: string | null) => void;
    deleteDocument: (documentId: string) => Promise<void>;

    // Metadata actions
    fetchMetadata: (documentId: string) => Promise<void>;
    updateMetadata: (documentId: string, metadata: Record<string, any>) => Promise<void>;

    // Analytics
    fetchQueryHistory: (corpusId?: string, documentId?: string) => Promise<any[]>;
}

