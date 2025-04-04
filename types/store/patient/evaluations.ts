import { KipuPatientEvaluation } from '@/types/chartChek/kipuAdapter';

export interface KipuEvaluationsState {
  // UI State
  isLoadingEvaluations: boolean;
  error: string | null;

  // Patient Evaluations
  patientEvaluations: KipuPatientEvaluation[];
  selectedPatientEvaluation: KipuPatientEvaluation | null;

  // Actions - Patient Evaluations
  fetchPatientEvaluations: (patientId?: string | undefined, options?: { 
    page?: number; 
    per?: number; 
    startDate?: string; 
    endDate?: string; 
    completedOnly?: boolean; 
  } | undefined) => Promise<void>

  selectPatientEvaluation: (id: KipuPatientEvaluation) => Promise<any>
  
  clearSelectedPatientEvaluation: () => void;
  
}