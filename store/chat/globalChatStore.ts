import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Patient, Document, UploadFile, QueueItem, PatientRecord } from "@/types/store/globalChat"
import { type TrainingDataset, TRAINING_DATASETS } from "@/types/training-datasets"
import { LLMOption, LLM_OPTIONS } from "@/lib/llm-service"
import { v4 as uuidv4 } from 'uuid'
import { GlobalChatState } from "@/types/store/globalChat"
import { useDocumentStore } from "../doc/documentStore"
import { AggregatedContext } from "@/types/store/globalChat";

export const useGlobalChatStore = create<GlobalChatState>()(
  
  persist(
    (set, get) => ({

      selectedPatient: null,
      selectedEvaluations: [],
      selectedDocuments: [],

      queueItems: [],
      uploadFiles: [],
      isUploading: false,

      aggregatedContext: [],

      assistantId: '',
      messages: [],
      isGenerating: false,
      currentMessage: '',
      isFullScreen: false,

      availableModels: LLM_OPTIONS,
      selectedModel: LLM_OPTIONS[0], // Default to GPT-4o

      availableTrainingDatasets: TRAINING_DATASETS,
      selectedTrainingDataset: TRAINING_DATASETS[0], // Default to The Joint Commission

      selectQueueItem: (record: any) => {
        const id = typeof record === 'object' ? record.id : record;
        const name = typeof record === 'object' ? record.name : record;
        
        const { queueItems } = get();
        if (!queueItems.some((r) => r.id === id)) {
          // Set state directly
          set((state) => ({
            queueItems: [...state.queueItems, {
              queueId: uuidv4(), // If you need a unique queue ID
              id: id,
              name: name,
              // Any other properties you need
            }]
          }));
        }
      },

      deselectQueueItem: (id) => {
        // Just set state directly once
        set((state) => ({
          queueItems: state.queueItems.filter((item) => String(item.id) !== String(id))
        }));
      },

      // File upload actions
      addFilesToUpload: (files) => {
        const uploadFiles: UploadFile[] = Array.from(files).map(file => ({
          id: uuidv4(),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          progress: 0,
          status: 'pending'
        }))

        set((state) => ({
          uploadFiles: [...state.uploadFiles, ...uploadFiles]
        }))
      },

      removeUploadFile: (fileId) => {
        set((state) => ({
          uploadFiles: state.uploadFiles.filter(f => f.id !== fileId)
        }))
      },

      processUploadFiles: async () => {
        const { uploadFiles } = get()
        if (uploadFiles.length === 0) return
      
        set({ isUploading: true })
      
        try {
          // Update each file status to uploading
          set((state) => ({
            uploadFiles: state.uploadFiles.map(file => ({
              ...file,
              status: 'uploading'
            }))
          }))
      
          // Process each file upload
          for (const file of uploadFiles) {
            try {
              const documentStore = useDocumentStore.getState()
              // Now call the method on the store state
              const document = await documentStore.uploadAndProcessDocument(file.file)
              
              console.log('Document processed successfully:', document?.document_id)
              
              // Update the status of this specific file
              set((state) => ({
                uploadFiles: state.uploadFiles.map(f => 
                  f.id === file.id ? { ...f, status: 'success' } : f
                ),
              }
            ))
            if (document) {
              // Call selectQueueItem with the document
              get().selectQueueItem({
                id: document.document_id,
                name: file.name || 'Uploaded document',
                type: 'document'
              });
            }
            } catch (fileError) {
              console.error(`Error processing file ${file.name}:`, fileError)
              // Update just this file's status to error
              set((state) => ({
                uploadFiles: state.uploadFiles.map(f => 
                  f.id === file.id ? { ...f, status: 'error' } : f
                )
              }))
              // Continue with other files instead of failing the whole batch
            }
          }
          
          console.log('All files processed, setting isUploading to false')
          set({ isUploading: false })
        } catch (error) {
          console.error('Error in processUploadFiles:', error)
          set({ isUploading: false })
        } finally {
          // Ensure isUploading is set to false even if there's an error
          set({ isUploading: false })
        }
      },

      clearUploadFiles: () => {
        set({ uploadFiles: [] })
      },


      clearQueue: () => {
        set({ queueItems: [] })
      },

      // Chat actions
      setCurrentMessage: (message) => {
        set({ currentMessage: message })
      },

      sendMessage: async () => {
        const { currentMessage, messages, selectedModel, selectedTrainingDataset, queueItems } = get()

        if (!currentMessage.trim()) return

        const userMessage = {
          id: uuidv4(),
          role: 'user' as const,
          content: currentMessage
        }

        // Add user message to chat
        set((state) => ({
          messages: [...state.messages, userMessage],
          currentMessage: '',
          isGenerating: true
        }))

        try {
          // Prepare context from queue items
          const context = queueItems.length > 0
            ? { items: queueItems }
            : undefined

          // Call API endpoint for chat completion
          const response = await fetch('/api/chat/completion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [...messages, userMessage],
              model: selectedModel.id,
              trainingDataset: selectedTrainingDataset.id,
              context
            }),
          })

          if (!response.ok) throw new Error('Failed to get chat completion')

          const data = await response.json()

          // Add assistant response to chat
          set((state) => ({
            messages: [...state.messages, {
              id: uuidv4(),
              role: 'assistant',
              content: data.content
            }]
          }))
        } catch (error) {
          console.error('Error in chat completion:', error)

          // Add error message
          set((state) => ({
            messages: [...state.messages, {
              id: uuidv4(),
              role: 'assistant',
              content: 'Sorry, I encountered an error processing your request. Please try again.'
            }]
          }))
        } finally {
          set({ isGenerating: false })
        }
      },

      toggleFullScreen: () => {
        set((state) => ({
          isFullScreen: !state.isFullScreen
        }))
      },

      // LLM actions
      setSelectedModel: (model) => {
        set({ selectedModel: model })
      },

      // Training dataset actions
      setSelectedTrainingDataset: (dataset) => {
        set({ selectedTrainingDataset: dataset })
      },

    // Fix for the setAggregatedContext function
setAggregatedContext: (
  selectedRecords: any[], 
  selectedTrainingDataset: TrainingDataset
) => {
  set({
    aggregatedContext: selectedRecords.map(record => ({
      recordId: record.id || '',
      recordType: 'patient_record',
      recordName: record.name || '',
      recordData: record,
      recordMetadata: []
    }))
  });
},
    }),
    {
      name: 'globalChatStore',
      storage: createJSONStorage(() => localStorage)
    }
  )
  
)