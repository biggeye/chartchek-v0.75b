'use client';

import { create } from 'zustand';
import { PatientStore, PatientContextOptions, DEFAULT_PATIENT_CONTEXT_OPTIONS } from '@/types/store/patient/patient';
import { PatientBasicInfo, PatientVitalSign, KipuPatientEvaluation } from '@/types/chartChek/kipuAdapter';
import { createClient } from '@/utils/supabase/client';
import { parsePatientId } from '@/lib/kipu/auth/config';
import { useEvaluationsStore } from './evaluationsStore';

// Import the evaluation type for conversion
import { KipuPatientEvaluation as KipuPatientEvaluationDetailed } from '@/types/chartChek/kipuAdapter';

// Initialize Supabase client
const supabase = createClient();

// Helper function to encode patient IDs properly
const encodePatientIdForUrl = (patientId: string): string => {
  try {
    const decodedId = decodeURIComponent(patientId);
    const { chartId, patientMasterId } = parsePatientId(decodedId);
    const formattedId = `${chartId}:${patientMasterId}`;
    return encodeURIComponent(formattedId);
  } catch (error) {
    console.error(`Error encoding patient ID ${patientId}:`, error);
    return encodeURIComponent(patientId);
  }
};

// Create patient store with Zustand
export const usePatientStore = create<PatientStore>((set, get) => ({
  // Initial state
  patients: [],
  selectedPatient: null,

  vitalSigns: [],
  currentPatientVitalSigns: [],

  isLoadingPatients: false,
  isLoadingVitalSigns: false,
  error: null,

  /*
  _____________FETCH_________
  */
  // Fetch patients by admission
  // Fetch all patients
  fetchPatients: async (facilityId?: number) => {
    set({ isLoadingPatients: true, error: null });
  
    try {
      if (facilityId) {
        // Reuse the existing function for facility-specific fetching
        return get().fetchPatientsAdmissionsByFacility(facilityId);
      }
      
      // Only run this code if no facilityId is provided (fallback)
      const response = await fetch(`/api/kipu/patients/admissions`);
      if (!response.ok) {
        throw new Error(`Failed to fetch patients: ${response.statusText}`);
      }
  
      const result = await response.json();
      const allPatients = result.data.patients;
  
      set({ patients: allPatients, isLoadingPatients: false });
      return allPatients;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching patients:', error);
      set({ isLoadingPatients: false, error: errorMessage });
      return [];
    }
  },
  fetchPatientsAdmissionsByFacility: async (facilityId: number, page = 1, limit = 20, startDate = '1990-01-01', endDate = '2030-01-01') => {
    set({ isLoadingPatients: true, error: null });
    try {
      const response = await fetch(`/api/kipu/patients/admissions?facilityId=${facilityId}`);
      const result = await response.json();
      const facilityPatients = result.data.patients;

      set({ patients: facilityPatients, isLoadingPatients: false });
      return facilityPatients;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch patients';
      set({
        error: errorMessage,
        isLoadingPatients: false
      });
      return [];
    }
  },
  // Fetch patients by census
  fetchPatientsCensusByFacility: async (facilityId: number, page = 1, limit = 20) => {
    set({ isLoadingPatients: true, error: null });
    try {
      const response = await fetch(`/api/kipu/patients/census?page=${page}&limit=${limit}&facilityId=${facilityId}`);
      const result = await response.json();
      const facilityPatients = result.data.patients;

      set({ patients: facilityPatients, isLoadingPatients: false });
      return facilityPatients;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch patients';
      set({
        error: errorMessage,
        isLoadingPatients: false
      });
      return [];
    }
  },

  // Fetch a single patient by ID
  fetchPatientById: async (patientId: string) => {
    set({ isLoadingPatients: true, error: null });
    try {
      const encodedId = encodePatientIdForUrl(patientId);
      const response = await fetch(`/api/kipu/patients/${encodedId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch patient: ${response.statusText}`);
      }

      const result = await response.json();
      const patient = result.success && result.data ? result.data : null;

      if (patient) {
        console.log('patientStore] fetch patient successful', patient);
        set({ selectedPatient: patient, isLoadingPatients: false });
      } else {
        console.log('patientStore] fetch patient NOT successful');
        set({ isLoadingPatients: false });
      }

      return patient;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching patient by ID:', error);
      set({ isLoadingPatients: false, error: errorMessage });
      return null;
    }
  },

  selectPatient: (patient: PatientBasicInfo) => {
    set({ selectedPatient: patient })
  },

  setPatients: (patients: PatientBasicInfo[]) => set({ patients }),

  setIsLoadingPatients: (isLoadingPatients: boolean) => set({ isLoadingPatients }),

  // Set error state
  setError: (error: string | null) => set({ error }),

  // Clear patient store - ADDED MISSING METHOD
  clearPatientStore: () => {
    set({
      patients: [],
      selectedPatient: null,
      isLoadingPatients: false,
      error: null
    });
  },

  // Clear current patient
  clearCurrentPatient: () => {
    set({
      selectedPatient: null,
    });
  }
}
))