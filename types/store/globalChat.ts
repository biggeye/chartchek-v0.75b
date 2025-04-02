import { LLMOption } from "@/lib/llm-service"
import { LLM_OPTIONS } from "@/lib/llm-service"
import { TrainingDataset } from "../training-datasets"
import { TRAINING_DATASETS } from "../training-datasets"
import { KipuPatientEvaluation } from "../chartChek/kipuEvaluations"

export interface AggregatedContext{
  recordId: string,
  recordType: string,
  recordName: string,
  recordData: any,
  recordMetadata: any[]
}

export interface GlobalChatState {
  // Patient state
  patients: Patient[]
  selectedPatient: Patient | null
  patientRecords: PatientRecord[]
  selectedRecords: PatientRecord[]
  isLoadingPatients: boolean
  isLoadingRecords: boolean
  aggregatedContext: AggregatedContext;

  // Document state
  documents: Document[]
  selectedDocuments: Document[]
  isLoadingDocuments: boolean

  // File upload state
  uploadFiles: UploadFile[]
  isUploading: boolean

  // Queue state
  queueItems: QueueItem[]

  // Chat state
  messages: {
    id: string
    role: "user" | "assistant" | "system"
    content: string
  }[]
  isGenerating: boolean
  currentMessage: string
  isFullScreen: boolean

  // LLM state
  availableModels: LLMOption[]
  selectedModel: LLMOption

  // Training datasets state
  availableTrainingDatasets: TrainingDataset[]
  selectedTrainingDataset: TrainingDataset

  // Patient actions
  fetchPatients: () => Promise<void>
  selectPatient: (patient: Patient | null) => void
  fetchPatientRecords: (patientId: string) => Promise<void>
  selectRecord: (record: PatientRecord) => void
  deselectRecord: (recordId: string) => void
  clearSelectedRecords: () => void

  // Document actions
  fetchDocuments: () => Promise<void>
  fetchDocumentsByCategory: (category: Document["category"]) => Promise<void>
  selectDocument: (document: Document) => void
  deselectDocument: (documentId: string) => void
  clearSelectedDocuments: () => void

  // File upload actions
  addFilesToUpload: (files: File[]) => void
  processUploadFiles: () => Promise<void>
  removeUploadFile: (fileId: string) => void
  clearUploadFiles: () => void

  // Queue actions
  addToQueue: (item: Omit<QueueItem, "id">) => void
  removeFromQueue: (itemId: string) => void
  clearQueue: () => void

  // Chat actions
  setCurrentMessage: (message: string) => void
  sendMessage: () => Promise<void>
  toggleFullScreen: () => void

  // LLM actions
  setSelectedModel: (model: LLMOption) => void

  // Training dataset actions
  setSelectedTrainingDataset: (dataset: TrainingDataset) => void
}

// Patient Types
export interface Patient {
  patientId: string;
  mrn?: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  status?: string;
  admissionDate?: string;
  dischargeDate?: string;
  facilityId?: string;
}

export interface PatientRecord {
  id: string
  patientId: string
  type: "appointment" | "patientEvaluation" | "order" | string
  date?: string
  title?: string
  provider?: string
  summary?: string
  patientEvaluation?: KipuPatientEvaluation
}

// Document Types
export interface Document {
  id: string
  name: string
  type: "pdf" | "docx" | "image" | "report"
  category: "clinical" | "administrative" | "billing"
  dateCreated: string
  size: number // in bytes
}

// File Upload Types
export interface UploadFile {
  id: string
  file: File

  progress: number
  status: "pending" | "uploading" | "success" | "error"
  name?: string
  error?: string
}

// Queue Item Types
export interface QueueItem {
  id: string
  type: "file" | "patient" | "document"
  name: string
  data: Patient | PatientRecord | Document | UploadFile | KipuPatientEvaluation
}
