// store/kipuEvaluationsStore.ts
import { create } from 'zustand';
import { KipuEvaluation, KipuPatientEvaluation } from '@/types/kipu/evaluations';

interface KipuEvaluationsState {
  // Evaluation Templates
  evaluationTemplates: KipuEvaluation[];
  selectedEvaluationTemplate: KipuEvaluation | null;
  
  // Patient Evaluations
  patientEvaluations: KipuPatientEvaluation[];
  selectedPatientEvaluation: KipuPatientEvaluation | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Actions - Evaluation Templates
  fetchEvaluationTemplates: () => Promise<void>;
  fetchEvaluationTemplateById: (id: number) => Promise<void>;
  clearSelectedEvaluationTemplate: () => void;
  
  // Actions - Patient Evaluations
  fetchPatientEvaluations: (patientId?: string) => Promise<void>;
  fetchPatientEvaluationById: (id: number) => Promise<void>;
  clearSelectedPatientEvaluation: () => void;
}

export const useKipuEvaluationsStore = create<KipuEvaluationsState>((set) => ({
  // Initial state
  evaluationTemplates: [],
  selectedEvaluationTemplate: null,
  patientEvaluations: [],
  selectedPatientEvaluation: null,
  isLoading: false,
  error: null,
  
  // Evaluation Templates actions
  fetchEvaluationTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/kipu/evaluation-templates');
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      
      const data = await response.json();
      
      if (data.success && data.data && data.data.evaluations) {
        set({ evaluationTemplates: data.data.evaluations });
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ error: `Failed to fetch evaluation templates: ${errorMessage}` });
      console.error('Error fetching evaluation templates:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  fetchEvaluationTemplateById: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/kipu/evaluation-templates/${id}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      
      const data = await response.json();
      
      if (data.success && data.data && data.data.evaluation) {
        set({ selectedEvaluationTemplate: data.data.evaluation });
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ error: `Failed to fetch evaluation template: ${errorMessage}` });
      console.error('Error fetching evaluation template:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  clearSelectedEvaluationTemplate: () => set({ selectedEvaluationTemplate: null }),
  
  // Patient Evaluations actions
  fetchPatientEvaluations: async (patientId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const url = patientId 
        ? `/api/kipu/patients/${patientId}/evaluations` 
        : '/api/kipu/patient-evaluations';
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      
      const data = await response.json();
      
      if (data.success && data.data && data.data.patient_evaluations) {
        set({ patientEvaluations: data.data.patient_evaluations });
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ error: `Failed to fetch patient evaluations: ${errorMessage}` });
      console.error('Error fetching patient evaluations:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  fetchPatientEvaluationById: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/kipu/patient-evaluations/${id}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      
      const data = await response.json();
      
      if (data.success && data.data && data.data.patient_evaluation) {
        set({ selectedPatientEvaluation: data.data.patient_evaluation });
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ error: `Failed to fetch patient evaluation: ${errorMessage}` });
      console.error('Error fetching patient evaluation:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  clearSelectedPatientEvaluation: () => set({ selectedPatientEvaluation: null })
}));