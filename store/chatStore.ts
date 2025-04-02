import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { KipuPatientEvaluation } from "@/types/chartChek/kipuEvaluations"
import type { Patient, Document, UploadFile, QueueItem, PatientRecord } from "@/types/store/globalChat"
import { type TrainingDataset, TRAINING_DATASETS } from "@/types/training-datasets"
import { LLMOption, LLM_OPTIONS } from "@/lib/llm-service"
import { v4 as uuidv4 } from 'uuid'
import { useEvaluationsStore } from "./evaluationsStore"
import { usePatientStore } from "./patientStore"
import { KipuPatientEvaluationItem } from "@/types/chartChek/kipuAdapter"
import { GlobalChatState } from "@/types/store/globalChat"

export const useGlobalChatStore = create<GlobalChatState>()(
  devtools(
    (set, get) => ({
      // Initial state
      patients: [],
      selectedPatient: null,
      patientRecords: [],
      selectedRecords: [],
      isLoadingPatients: false,
      isLoadingRecords: false,
      aggregatedContext: [],

      documents: [],
      selectedDocuments: [],
      isLoadingDocuments: false,

      uploadFiles: [],
      isUploading: false,

      queueItems: [],

      messages: [],
      isGenerating: false,
      currentMessage: "",
      isFullScreen: false,

      availableModels: LLM_OPTIONS,
      selectedModel: LLM_OPTIONS[0], // Default to GPT-4o

      availableTrainingDatasets: TRAINING_DATASETS,
      selectedTrainingDataset: TRAINING_DATASETS[0], // Default to The Joint Commission

      // Patient actions
      fetchPatients: async () => {
        set({ isLoadingPatients: true })
        try {
          const response = await fetch(`/api/kipu/patients/census`)

          if (!response.ok) throw new Error('Failed to fetch patients')
          const data = await response.json()
          console.log('[use-chat-store] data: ', data)
          const patients = data.data.patients
          console.log('[use-chat-store] patients: ', patients)
          set({ patients: patients })
        } catch (error) {
          console.error('Error fetching patients:', error)
        } finally {
          set({ isLoadingPatients: false })
        }
      },

      selectPatient: (patient: Patient) => {
        set({ selectedPatient: patient })
        if (patient) {
          get().fetchPatientRecords(patient.patientId)
        }
      },

      fetchPatientRecords: async (patientId: string) => {
        set({ isLoadingRecords: true });
        try {
          // 1. Fetch patient details
          const patientStore = usePatientStore.getState();
          const patient = await patientStore.fetchPatientById(patientId);

          const evaluationsStore = useEvaluationsStore.getState();
          await evaluationsStore.fetchPatientEvaluations(patient?.patientId);
          const { patientEvaluations } = evaluationsStore;

          const patientRecords: PatientRecord[] = Array.isArray(patientEvaluations) && patientEvaluations.length > 0
            ? patientEvaluations.map(evaluation => ({
              id: String(evaluation.id),
              patientId: patientId,
              status: evaluation.status,
              type: evaluation.evaluationType,
              date: evaluation.createdAt || new Date().toISOString(),
              title: evaluation.name || `Evaluation ${evaluation.id}`,
              provider: evaluation.createdBy || undefined,
              summary: evaluation.evaluationContent || undefined,
              details: evaluation.patientEvaluationItems  // Store the original evaluation data
            })) : [];

          // 4. Set the records in our chat store
          set({ patientRecords });
        } catch (error) {
          console.error('Error fetching patient records:', error);
          set({ patientRecords: [] });
        } finally {
          set({ isLoadingRecords: false });
        }
      },
      // Fix for the selectRecord function
      selectRecord: (record: any) => {
        const { selectedRecords } = get()
        if (!selectedRecords.some((r) => r.id === record.id)) {
          set({ selectedRecords: [...selectedRecords, record] })

          // Add record to queue - fix the type issue
          get().addToQueue({
            type: "patient",
            name: `${record.title}`,
            // Ensure we never pass undefined by defaulting to empty array
            data: record.patientEvaluation?.patientEvaluationItems || []
          })
        }
      },

      // Fix for the deselectRecord function
      deselectRecord: (recordId) => {
        const { selectedRecords, queueItems } = get()
        set({
          selectedRecords: selectedRecords.filter((r) => String(r.id) !== String(recordId)),
        })

        // Remove from queue - fix the string/number comparison
        const queueItemId = queueItems.find(
          (item) =>
            item.type === "patient" &&
            "id" in item.data &&
            String(item.data.id) === String(recordId)
        )?.id

        if (queueItemId) {
          get().removeFromQueue(queueItemId)
        }
      },

      clearSelectedRecords: () => {
        set({ selectedRecords: [] })
      },

      // Document actions
      fetchDocuments: async () => {
        set({ isLoadingDocuments: true })
        try {
          const response = await fetch('/api/kipu/documents/list')
          if (!response.ok) throw new Error('Failed to fetch documents')
          const data = await response.json()
          set({ documents: data })
        } catch (error) {
          console.error('Error fetching documents:', error)
        } finally {
          set({ isLoadingDocuments: false })
        }
      },

      fetchDocumentsByCategory: async (category) => {
        set({ isLoadingDocuments: true })
        try {
          const response = await fetch(`/api/kipu/documents/list?category=${category}`)
          if (!response.ok) throw new Error(`Failed to fetch ${category} documents`)
          const data = await response.json()
          set({ documents: data })
        } catch (error) {
          console.error(`Error fetching ${category} documents:`, error)
        } finally {
          set({ isLoadingDocuments: false })
        }
      },

      selectDocument: (document) => {
        set((state) => ({
          selectedDocuments: [...state.selectedDocuments, document]
        }))
      },

      deselectDocument: (documentId) => {
        set((state) => ({
          selectedDocuments: state.selectedDocuments.filter(d => d.id !== documentId)
        }))
      },

      clearSelectedDocuments: () => {
        set({ selectedDocuments: [] })
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
            const formData = new FormData()
            formData.append('file', file.file)

            try {
              const response = await fetch('/api/openai/files', {
                method: 'POST',
                body: formData
              })

              if (!response.ok) throw new Error(`Failed to upload ${file.name}`)

              // Update file status to success
              set((state) => ({
                uploadFiles: state.uploadFiles.map(f =>
                  f.id === file.id ? { ...f, status: 'success', progress: 100 } : f
                )
              }))
            } catch (error) {
              console.error(`Error uploading ${file.name}:`, error)

              // Update file status to error
              set((state) => ({
                uploadFiles: state.uploadFiles.map(f =>
                  f.id === file.id ? { ...f, status: 'error' } : f
                )
              }))
            }
          }
        } finally {
          set({ isUploading: false })
        }
      },

      removeUploadFile: (fileId) => {
        set((state) => ({
          uploadFiles: state.uploadFiles.filter(f => f.id !== fileId)
        }))
      },

      clearUploadFiles: () => {
        set({ uploadFiles: [] })
      },
      // Queue actions
      addToQueue: (item) => {
        const newItem: QueueItem = {
          id: uuidv4(),
          ...item
        }

        set((state) => ({
          queueItems: [...state.queueItems, newItem]
        }))
      },

      removeFromQueue: (itemId) => {
        set((state) => ({
          queueItems: state.queueItems.filter(item => item.id !== itemId)
        }))
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
  selectedRecords: PatientRecord[], 
  selectedTrainingDataset: TrainingDataset
) => {
  set({ 
    aggregatedContext: {
      recordId: selectedRecords[0]?.id || '',
      recordType: selectedRecords[0]?.type || '',
      recordName: selectedRecords[0]?.title || '',
      recordData: selectedRecords,
      recordMetadata: []
    } 
  });
},
    })),)
{
  name: 'globalChatStore'
}