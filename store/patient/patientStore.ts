'use client';

import { create } from 'zustand';
import { PatientStore, PatientContextOptions, DEFAULT_PATIENT_CONTEXT_OPTIONS } from '@/types/store/patient';
import { PatientBasicInfo, PatientVitalSign, KipuPatientEvaluation } from '@/types/chartChek/kipuAdapter';
import { createClient } from '@/utils/supabase/client';
import { useGlobalChatStore } from '../chat/chatStore';
import { parsePatientId } from '@/lib/kipu/auth/config';
import { useEvaluationsStore } from './evaluationsStore';
// Import the evaluation type for conversion
import { KipuPatientEvaluation as KipuPatientEvaluationDetailed } from '@/types/kipu/evaluations';

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
  currentPatientId: null,
  currentPatient: null,
  selectedPatient: null,
  evaluations: [],
  vitalSigns: [],
  currentPatientVitalSigns: [],
  selectedPatientVitalSigns: [],
  isLoading: false,
  isLoadingPatients: false,
  isLoadingVitalSigns: false,
  error: null,

  /*
  _____________SET___________
  */
  // Set patients
  setPatients: (patients: PatientBasicInfo[]) => set({ patients }),

  // Set current patient ID
  setCurrentPatientId: (patientId: string | null) => {
    // Only update if the ID has changed
    if (patientId !== get().currentPatientId) {
      set({ currentPatientId: patientId });

      // If we have a new patient ID, fetch its details
      if (patientId) {
        get().fetchPatientById(patientId);
      } else {
        set({ currentPatient: null });
      }
    }
  },

  // Set current patient
  setCurrentPatient: (patient: PatientBasicInfo) => set({ currentPatient: patient }),

  // Set vital signs
  setVitalSigns: (vitalSigns: PatientVitalSign[]) => set({ vitalSigns }),

  setIsLoadingPatients: (isLoadingPatients: boolean) => set({ isLoadingPatients }),

  setIsLoadingVitalSigns: (isLoadingVitalSigns: boolean) => set({ isLoadingVitalSigns }),

  // Set loading state
  setLoading: (isLoading: boolean) => set({ isLoading }),

  // Set error state
  setError: (error: string | null) => set({ error }),

  // Clear patient store - ADDED MISSING METHOD
  clearPatientStore: () => {
    set({
      patients: [],
      currentPatientId: null,
      currentPatient: null,
      selectedPatient: null,
      vitalSigns: [],
      currentPatientVitalSigns: [],
      selectedPatientVitalSigns: [],
      isLoading: false,
      isLoadingPatients: false,
      isLoadingVitalSigns: false,
      error: null
    });
  },

  /*
  _____________FETCH_________
  */
  // Fetch patients by admission
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
      const response = await fetch(`/api/kipu/patients/census?page=${page}&limit=${limit}`);
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

  // Fetch all patients
  fetchPatients: async (facilityId: number) => {
    set({ isLoadingPatients: true, error: null });
    try {
      const response = await fetch(`/api/kipu/patients/census`);

      if (!response.ok) {
        throw new Error(`Failed to fetch patients: ${response.statusText}`);
      }

      const result = await response.json();
      const allPatients = result.data.patients;

      // Filter patients by facilityId in memory
      const filteredPatients = facilityId
        ? allPatients.filter((patient: PatientBasicInfo) =>
          patient.facilityId === facilityId)
        : allPatients;

      set({
        patients: filteredPatients,
        isLoading: false
      });

      return filteredPatients;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching patients:', error);
      set({ isLoading: false, error: errorMessage });
      return [];
    }
  },

  // Fetch a single patient by ID
  fetchPatientById: async (patientId: string) => {
    set({ isLoading: true, error: null });
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
        set({ selectedPatient: patient, currentPatient: patient, isLoading: false });
      } else {
        console.log('patientStore] fetch patient NOT successful');
        set({ isLoading: false });
      }

      return patient;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching patient by ID:', error);
      set({ isLoading: false, error: errorMessage });
      return null;
    }
  },


  // Fetch patient vital signs
  fetchPatientVitalSigns: async (patientId: string) => {
    set({ isLoadingVitalSigns: true, error: null });
    try {
      const encodedId = encodePatientIdForUrl(patientId);
      const response = await fetch(`/api/kipu/patients/${encodedId}/vitals`);
      if (!response.ok) {
        console.warn(`Failed to fetch vital signs: ${response.statusText}`);
      }

      const result = await response.json();

      // Transform the data to match VitalSign interface
      const transformedVitalSigns = result.vital_signs?.map((vs: any) => ({
        id: vs.id || `vs-${Date.now()}-${Math.random()}`,
        patient_id: patientId,
        type: vs.type || vs.vital_sign_type || '',
        value: vs.value || '',
        timestamp: vs.timestamp || vs.recorded_at || new Date().toISOString(),
        recordedAt: vs.recorded_at || vs.timestamp || new Date().toISOString(),
        interval_timestamp: vs.interval_timestamp || '',
        unit: vs.unit || '',
        notes: vs.notes || '',
        blood_pressure_systolic: vs.blood_pressure_systolic || null,
        blood_pressure_diastolic: vs.blood_pressure_diastolic || null,
        temperature: vs.temperature || null,
        pulse: vs.pulse || null,
        respirations: vs.respirations || null,
        o2_saturation: vs.o2_saturation || null,
        user_name: vs.user_name || vs.recorded_by || ''
      })) || [];

      set({
        currentPatientVitalSigns: transformedVitalSigns,
        isLoadingVitalSigns: false
      });

      return transformedVitalSigns;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('Error fetching patient vital signs:', error);
      set({
        isLoadingVitalSigns: false,
        error: errorMessage,
        currentPatientVitalSigns: []
      });
      return [];
    }
  },

  // Fetch patient with all details
  fetchPatientWithDetails: async (patientId: string) => {
    set({ isLoading: true, error: null });
    try {
      // First get the basic patient info
      const patient = await get().fetchPatientById(patientId);

      if (!patient) {
        throw new Error('Patient not found');
      }

      // Then fetch additional details in parallel
      const [evaluationsResponse, vitalsResponse] = await Promise.all([
        fetch(`/api/kipu/patients/${encodePatientIdForUrl(patientId)}/evaluations`),
        fetch(`/api/kipu/patients/${encodePatientIdForUrl(patientId)}/vitals`)
      ]);

      // Process evaluations
      let evaluations = [];
      if (evaluationsResponse.ok) {
        const evalResult = await evaluationsResponse.json();
        evaluations = evalResult.success && evalResult.data ? evalResult.data : [];
      }

      // Process vitals
      let vitalSigns = [];
      if (vitalsResponse.ok) {
        const vitalsResult = await vitalsResponse.json();
        vitalSigns = vitalsResult.success && vitalsResult.data ? vitalsResult.data : [];
      }

      // Construct the object according to PatientWithDetails interface
      const patientWithDetails = {
        patient,
        evaluations,
        vitalSigns
      };

      set({
        selectedPatientVitalSigns: vitalSigns,
        currentPatientVitalSigns: vitalSigns,
        isLoading: false
      });

      return patientWithDetails;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching patient with details:', error);
      set({ isLoading: false, error: errorMessage });
      return null;
    }
  },

  // Clear current patient
  clearCurrentPatient: () => {
    set({
      currentPatientId: null,
      currentPatient: null,
      currentPatientVitalSigns: [],
     }); 
    }
  }
))