// store/kipuEvaluationsStore.ts
import { create } from 'zustand';
import { KipuPatientEvaluation } from '@/types/chartChek/evaluations';

interface KipuEvaluationsState {
  // UI State
  isLoadingEvaluations: boolean;
  error: string | null;

  // Patient Evaluations
  patientEvaluations: KipuPatientEvaluation[];
  selectedPatientEvaluation: KipuPatientEvaluation | null;

  // Actions - Patient Evaluations
  fetchPatientEvaluations: (patientId?: string, options?: any[]) => Promise<void>;
  fetchPatientEvaluationById: (id: number) => Promise<KipuPatientEvaluation>;
  clearSelectedPatientEvaluation: () => void;
}

export const useKipuEvaluationsStore = create<KipuEvaluationsState>((set) => ({
  // Initial state
  patientEvaluations: [],
  selectedPatientEvaluation: null,
  isLoadingEvaluations: false,
  error: null,



  fetchPatientEvaluations: async (patientId?: string, options?: {
    page?: number;
    per?: number;
    startDate?: string;
    endDate?: string;
    completedOnly?: boolean;
  }) => {
    set({ isLoadingEvaluations: true, error: null });
    try {
      // Build the URL with proper path
      const baseUrl = patientId
        ? `/api/kipu/patients/${patientId}/evaluations`
        : '/api/kipu/patient_evaluations'; // Fixed underscore

      // Add query parameters if provided
      const queryParams = new URLSearchParams();
      if (options?.page) queryParams.append('page', options.page.toString());
      if (options?.per) queryParams.append('per', options.per.toString());
      if (options?.startDate) queryParams.append('start_date', options.startDate);
      if (options?.endDate) queryParams.append('end_date', options.endDate);
      if (options?.completedOnly) queryParams.append('completed_only', 'true');

      const url = queryParams.toString() ? `${baseUrl}?${queryParams.toString()}` : baseUrl;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();

      if (data.patientEvaluations) {
        set({
          patientEvaluations: data.patientEvaluations,
        });
      } else {
        console.warn('Unexpected response format from evaluations API');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ error: `Failed to fetch patient evaluations: ${errorMessage}` });
      console.error('Error fetching patient evaluations:', error);
    } finally {
      set({ isLoadingEvaluations: false });
    }
  },
  fetchPatientEvaluationById: async (id: number) => {
    set({ isLoadingEvaluations: true, error: null });
    try {
      const response = await fetch(`/api/kipu/patient_evaluations/${id}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
  
      const data = await response.json();
      console.log('Fetched patient evaluation:', data);
      // Just return the data directly without expecting a specific format
      return data;
    } catch (error) {
      console.error('Error fetching patient evaluation:', error);
      set({ error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    } finally {
      set({ isLoadingEvaluations: false });
    }
  },
  clearSelectedPatientEvaluation: () => set({ selectedPatientEvaluation: null })
}));