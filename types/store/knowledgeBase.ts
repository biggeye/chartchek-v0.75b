export interface CorpusResponse {
    name: string,
    displayName: string,
    createTime: string,
    updateTime: string
}

export interface Corpus {
    id: string,
    name: string,
    displayName: string,
    created_by: string,
    description?: string,
}

export interface KnowledgeDocument {
    id: string,
    corpus_id: string,
    document_name: string,
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



export interface KnowledgeState {
    corpora: Corpus[];
    selectedCorpusId: string | '';
    documents: KnowledgeDocument[];
    selectedDocumentId: string | null;
    metadata: KnowledgeDocumentMetadata[];
    isLoading: boolean;
    error: string | null;

    fetchCorpora: () => Promise<void>;
    createCorpus: (name: string, displayName: string, description?: string) => Promise<void>;
    setSelectedCorpusId: (id: string | null) => void;
    deleteCorpus: (corpusId: string) => Promise<void>;
    queryCorpus: (corpusName: string, query: string, metadataFilters?: any, resultsCount?: number) => Promise<any>;
    getCorpus: (corpusName: string) => Promise<Corpus | null>;

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

