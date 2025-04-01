// store/knowledgeStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@/utils/supabase/client';
import { geminiApi } from '@/lib/gemini/api';
import { Corpus, KnowledgeDocument, KnowledgeDocumentMetadata, KnowledgeState, } from '@/types/chartChek/knowledgeBase';
// Utility functions outside the store to prevent recreation on each call
const getSupabaseClient = (() => {
    let client: ReturnType<typeof createClient> | null = null;
    return () => {
        if (!client) client = createClient();
        return client;
    };
})();
const getUserId = async () => {
    const supabase = getSupabaseClient();
    const { data } = await supabase.auth.getUser();
    return data?.user?.id || 'anonymous';
};




export const useKnowledgeStore = create<KnowledgeState>((set, get) => {
    // No more gemini hook here - we'll use the API directly
    const supabase = getSupabaseClient();

    return {
        corpora: [],
        selectedCorpusId: null,
        documents: [],
        selectedDocumentId: null,
        metadata: [],
        isLoading: false,
        error: null,

        // Corpus actions
        fetchCorpora: async () => {
            set({ isLoading: true, error: null });
            try {
                const { data, error } = await supabase
                    .from('knowledge_corpus')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw new Error(error.message);
                set({ corpora: data });
            } catch (error: any) {
                set({ error: error.message });
            } finally {
                set({ isLoading: false });
            }
        },

        createCorpus: async (displayName, description) => {
            set({ isLoading: true, error: null });
            try {
                // Use the API function instead of inline fetch
                const data = await geminiApi.createCorpus(displayName, description);

                // Update state
                const { corpora } = get();
                set({ corpora: [data, ...corpora] });
            } catch (error: any) {
                set({ error: error.message });
            } finally {
                set({ isLoading: false });
            }
        },

        setSelectedCorpusId: (id) => {
            set({ selectedCorpusId: id });
        },

        // Document actions
        fetchDocuments: async (corpusId) => {
            set({ isLoading: true, error: null });
            try {
                const { data, error } = await supabase
                    .from('knowledge_documents')
                    .select('*')
                    .eq('corpus_id', corpusId)
                    .order('created_at', { ascending: false });

                if (error) throw new Error(error.message);
                set({ documents: data });
            } catch (error: any) {
                set({ error: error.message });
            } finally {
                set({ isLoading: false });
            }
        },

        uploadDocument: async (corpusId, file, metadata = {}) => {
            set({ isLoading: true, error: null });
            try {
                const userId = await getUserId();

                // Create form data
                const formData = new FormData();
                formData.append('file', file);
                formData.append('corpusId', corpusId);
                formData.append('userId', userId);

                // Add metadata if provided
                if (Object.keys(metadata).length > 0) {
                    formData.append('metadata', JSON.stringify(metadata));
                }

                // Use the API function instead of inline fetch
                const geminiData = await geminiApi.uploadDocument(formData);

                // Create record in Supabase
                const { data, error } = await supabase
                    .from('knowledge_documents')
                    .insert({
                        corpus_id: corpusId,
                        document_name: geminiData.name,
                        original_filename: file.name,
                        file_type: file.type,
                        file_size: file.size,
                        status: 'processing',
                        user_id: userId,
                    })
                    .select()
                    .single();

                if (error) throw new Error(error.message);

                // Insert metadata if provided
                if (Object.keys(metadata).length > 0 && data) {
                    const metadataRecords = Object.entries(metadata).map(([key, value]) => {
                        let valueType = 'string';
                        if (typeof value === 'number') valueType = 'number';
                        else if (typeof value === 'boolean') valueType = 'boolean';
                        else if (value instanceof Date) valueType = 'date';

                        return {
                            document_id: data.id,
                            key,
                            value: String(value),
                            value_type: valueType,
                        };
                    });

                    const { error: metadataError } = await supabase
                        .from('knowledge_document_metadata')
                        .insert(metadataRecords);

                    if (metadataError) throw new Error(metadataError.message);
                }

                // Update state
                const { documents } = get();
                if (data) {
                    set({ documents: [data, ...documents] });
                }
            } catch (error: any) {
                set({ error: error.message });
            } finally {
                set({ isLoading: false });
            }
        },

        setSelectedDocumentId: (id) => {
            set({ selectedDocumentId: id });
        },

        deleteDocument: async (documentId) => {
            set({ isLoading: true, error: null });
            try {
                // Get document from state
                const document = get().documents.find(d => d.id === documentId);
                if (!document) throw new Error('Document not found');

                // Delete from Gemini via API
                await geminiApi.deleteDocument(document.document_name);

                // Delete from Supabase
                const { error } = await supabase
                    .from('knowledge_documents')
                    .delete()
                    .eq('id', documentId);

                if (error) throw new Error(error.message);

                // Update state
                const { documents } = get();
                set({
                    documents: documents.filter(d => d.id !== documentId),
                    selectedDocumentId: null
                });
            } catch (error: any) {
                set({ error: error.message });
            } finally {
                set({ isLoading: false });
            }
        },

        // Metadata actions
        fetchMetadata: async (documentId) => {
            set({ isLoading: true, error: null });
            try {
                const { data, error } = await supabase
                    .from('knowledge_document_metadata')
                    .select('*')
                    .eq('document_id', documentId);

                if (error) throw new Error(error.message);
                set({ metadata: data });
            } catch (error: any) {
                set({ error: error.message });
            } finally {
                set({ isLoading: false });
            }
        },

        updateMetadata: async (documentId, metadata) => {
            set({ isLoading: true, error: null });
            try {
                // Get existing metadata
                const { data: existingMetadata, error: fetchError } = await supabase
                    .from('knowledge_document_metadata')
                    .select('*')
                    .eq('document_id', documentId);

                if (fetchError) throw new Error(fetchError.message);

                // Create a map of existing metadata
                const existingMap = new Map(existingMetadata.map(item => [item.key, item]));

                // Process updates and inserts
                const updates = [];
                const inserts = [];

                for (const [key, value] of Object.entries(metadata)) {
                    let valueType = 'string';
                    if (typeof value === 'number') valueType = 'number';
                    else if (typeof value === 'boolean') valueType = 'boolean';
                    else if (value instanceof Date) valueType = 'date';

                    const stringValue = String(value);

                    if (existingMap.has(key)) {
                        const existing = existingMap.get(key)!;
                        if (existing.value !== stringValue || existing.value_type !== valueType) {
                            updates.push({
                                id: existing.id,
                                value: stringValue,
                                value_type: valueType,
                            });
                        }
                        existingMap.delete(key);
                    } else {
                        inserts.push({
                            document_id: documentId,
                            key,
                            value: stringValue,
                            value_type: valueType,
                        });
                    }
                }

                // Process deletes (remaining items in existingMap)
                const deletes = Array.from(existingMap.values()).map(item => item.id);

                // Execute batch operations
                const batch = [];

                if (updates.length > 0) {
                    batch.push(
                        supabase
                            .from('knowledge_document_metadata')
                            .upsert(updates)
                    );
                }

                if (inserts.length > 0) {
                    batch.push(
                        supabase
                            .from('knowledge_document_metadata')
                            .insert(inserts)
                    );
                }

                if (deletes.length > 0) {
                    batch.push(
                        supabase
                            .from('knowledge_document_metadata')
                            .delete()
                            .in('id', deletes)
                    );
                }

                if (batch.length > 0) {
                    const results = await Promise.all(batch);
                    const errors = results.filter(r => r.error).map(r => r.error);
                    if (errors.length > 0) throw new Error;
                }

                // Refresh metadata
                await get().fetchMetadata(documentId);
            } catch (error: any) {
                set({ error: error.message });
            } finally {
                set({ isLoading: false });
            }
        },

        // Analytics
        fetchQueryHistory: async (corpusId, documentId) => {
            set({ isLoading: true, error: null });
            try {
                let query = supabase
                    .from('knowledge_queries')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (corpusId) {
                    query = query.eq('corpus_id', corpusId);
                }

                if (documentId) {
                    query = query.eq('document_id', documentId);
                }

                const { data, error } = await query;

                if (error) throw new Error(error.message);
                return data;
            } catch (error: any) {
                set({ error: error.message });
                return [];
            } finally {
                set({ isLoading: false });
            }
        }
    };
});