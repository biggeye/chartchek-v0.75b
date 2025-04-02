// types/store/context.ts
import { PatientContext, ChatContext } from './legacyChat';
import { KipuPatientEvaluation } from '@/types/kipu/evaluations';

// Define inline for migration to /types/kipu/index.ts
interface PatientBasicInfo {
  patientId: string;
  firstName: string;
  lastName: string;
  age: number;
  gender?: string;
  insuranceProvider?: string;
  email?: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
}

export type PatientContextOptions = ContextItem;

export interface ContextItem {
  id: string;
  category: string;
  label: string;
  description?: string;
  source: 'basic' | 'evaluation' | 'vitals';
  evaluationId?: number;
  path?: string;
}

export interface ContextStoreState {
  // State properties
  patientContext: PatientContext | null;
  chatContext: ChatContext | null;
  contextOptions: ContextItem[];
  selectedContextOptions: ContextItem[];
  isContextEnabled: boolean;
  currentPatientContext: string | null;
  evaluationContext: any | null;
  
  // Context options management
  setContextOptions: (options: ContextItem[]) => void;
  toggleContextEnabled: () => void;
  setSelectedContextOptions: (options: ContextItem[]) => void;
  
  // Context management
  updatePatientContext: (context: PatientContext | null) => void;
  updateChatContext: (context: Partial<ChatContext>) => void;
  
  // Context building
  buildContextForPatient: (patient: PatientBasicInfo, selectedOptions: ContextItem[]) => string | null;
  buildContextFromEvaluation: (evaluation: KipuPatientEvaluation) => any;
  buildContextFromTemplate: (evaluation: KipuPatientEvaluation, templateId: string) => any;
  buildPatientContextInstructions: (patient: PatientBasicInfo, selectedOptions: ContextItem[]) => string;
  
  // Apply context
  applyContextOptions: (options: ContextItem[]) => ContextItem[];
}