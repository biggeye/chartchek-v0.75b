// types/store/context.ts
import { PatientContext, ChatContext } from './chat';

// Let's use a more generic type for now
export interface KipuPatientEvaluation {
  id: string;
  type: string;
  patient_id: string;
  created_at: string;
  updated_at: string;
  data: Record<string, any>; // This will hold the evaluation data
  [key: string]: any; // Allow for additional properties
}

export interface ContextStoreState {
  patientContext: PatientContext | null;
  chatContext: ChatContext | null;
  
  // --- CONTEXT MANAGEMENT ---
  updatePatientContext: (context: PatientContext | null) => void;
  updateChatContext: (context: Partial<ChatContext>) => void;
  
  // --- CONTEXT BUILDING ---
  buildContextFromEvaluation: (evaluation: KipuPatientEvaluation) => any;
  buildContextFromTemplate: (evaluation: KipuPatientEvaluation, templateId: string) => any;
}