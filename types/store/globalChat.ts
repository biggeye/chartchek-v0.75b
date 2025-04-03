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

  selectedPatient: Patient | null
  selectedEvaluations: PatientRecord[]
  selectedDocuments: Document[]

  // Queue state
  queueItems: QueueItem[]
  uploadFiles: UploadFile[]
  isUploading: boolean

  aggregatedContext: AggregatedContext[];

  // Chat state
  assistantId: string
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

  // actions
  selectQueueItem: (record: any) => void
  deselectQueueItem: (record: any) => void
  clearQueue: () => void
  // File upload actions
  addFilesToUpload: (files: File[]) => void
  processUploadFiles: () => Promise<void>
  removeUploadFile: (fileId: string) => void
  clearUploadFiles: () => void



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
  queueId: string,
  id: string
  name: string
  type?: "file" | "patient" | "document"
  data?: Patient | PatientRecord | Document | UploadFile | KipuPatientEvaluation
}
