'use client';

import { create } from 'zustand';
import { PatientStore, PatientContextOptions, DEFAULT_PATIENT_CONTEXT_OPTIONS } from '@/types/store/patient';
import { PatientBasicInfo, KipuPatientEvaluation, PatientVitalSign } from '@/types/kipu';
import { createClient } from '@/utils/supabase/client';
import { chatStore } from '@/store/chatStore';
import { parsePatientId } from '@/lib/kipu/auth/config';

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
  currentPatientEvaluations: [],
  selectedPatientEvaluations: [],
  currentPatientVitalSigns: [],
  selectedPatientVitalSigns: [],
  selectedPatientAppointments: [],
  allPatientEvaluations: [],
  isPatientContextEnabled: false,
  selectedContextOptions: DEFAULT_PATIENT_CONTEXT_OPTIONS,
  contextOptions: DEFAULT_PATIENT_CONTEXT_OPTIONS,
  isLoading: false,
  isLoadingPatients: false,
  isLoadingEvaluations: false,
  isLoadingVitalSigns: false,
  isLoadingAppointments: false,
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

  // Set evaluations
  setPatientEvaluations: (evaluations: KipuPatientEvaluation[]) => set({ evaluations }),

  // Set vital signs
  setVitalSigns: (vitalSigns: PatientVitalSign[]) => set({ vitalSigns }),

  // Set all patient evaluations
  setAllPatientEvaluations: (evaluations: KipuPatientEvaluation[]) => set({ allPatientEvaluations: evaluations }),

  // Set context options
  setPatientContextOptions: (options: Partial<PatientContextOptions>) => set({
    contextOptions: {
      ...get().contextOptions,
      ...options
    }
  }),

  // Update patient context options
  updatePatientContextOptions: (options: PatientContextOptions) => {
    set({ contextOptions: options });

    // If patient context is enabled, update the chat context
    if (get().isPatientContextEnabled && get().currentPatient) {
      const patient = get().currentPatient;
      if (patient) {
        chatStore.getState().updateChatContext({
          patientId: patient.patientId,
          patientName: `${patient.firstName} ${patient.lastName}`
        });
      }
    }
  },

  // Set loading state
  setLoading: (isLoading: boolean) => set({ isLoading }),

  // Set error state
  setError: (error: string | null) => set({ error }),

  /*
  _____________FETCH_________
  */
  // Fetch all patients
  // Standardized fetch functions for patientStore

  fetchPatientsAdmissionsByFacility: async (facilityId: number, page?: number, limit?: number, startDate?: string, endDate?: string) => {
    set({ isLoadingPatients: true, error: null });
    try {
      if (!page) {
        page = 1;
      }
      if (!limit) {
        limit = 20;
      }
      if (!startDate) {
        startDate = '01-01-1990';
      }
      if (!endDate) {
        endDate = '12-30-2030';
      }
      const response = await fetch(`/api/kipu/patients/admissions?facilityId=${facilityId}`); // Fixed query parameter
      const result = await response.json();
      const facilityPatients = result.data.patients;
      set({ patients: facilityPatients, isLoadingPatients: false });
      return facilityPatients; // Return the patients array to match the type
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch patients', 
        isLoadingPatients: false 
      });
      return []; // Return empty array on error to match the return type
    }
  },

  fetchPatientsCensusByFacility: async (facilityId: number, page?: number, limit?: number) => {
    set({ isLoadingPatients: true, error: null });
    try {
      // Call your existing service layer
      if (!page) {
        page = 1;
      }
      if (!limit) {
        limit = 20;
      }
      const response = await fetch(`/api/kipu/patients/census?page=${page}&limit=${limit}`); // Fixed query parameter
      const result = await response.json();
      const facilityPatients = result.data.patients;
      console.log('[patientStore.ts] facilityPatients: ', facilityPatients  );
      set({ patients: facilityPatients, isLoadingPatients: false });
      return facilityPatients; // Return the patients array to match the type
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch patients', 
        isLoadingPatients: false 
      });
      return []; // Return empty array on error to match the return type
    }
  },

  // Fetch all patients
  fetchPatients: async (facilityId: number) => {
    try {
      set({ isLoading: true, error: null });

      // Add the facilityId to the API request
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
    } catch (error) {
      console.error('Error fetching patients:', error);
      set({ isLoading: false, error: error instanceof Error ? error.message : 'Unknown error' });
      return [];
    }
  },

  // Fetch a single patient by ID
  fetchPatientById: async (patientId: string) => {
    try {
      set({ isLoading: true, error: null });
      const encodedId = encodePatientIdForUrl(patientId);
      const response = await fetch(`/api/kipu/patients/${encodedId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch patient: ${response.statusText}`);
      }

      const result = await response.json();
      const patient = result.success && result.data ? result.data : null;

      if (patient) {
        set({ selectedPatient: patient, currentPatient: patient, isLoading: false });
      } else {
        set({ isLoading: false });
      }

      return patient;
    } catch (error) {
      console.error('Error fetching patient by ID:', error);
      set({ isLoading: false, error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  },

// In patientStore.ts - update fetchPatientEvaluations
// In patientStore.ts - modify fetchPatientEvaluations
fetchPatientEvaluations: async (patientId: string) => {
  try {
    set({ isLoadingEvaluations: true, error: null });
    const encodedId = await encodePatientIdForUrl(patientId); // Use isLoadingEvaluations instead of isLoading
    const response = await fetch(`/api/kipu/patients/${encodedId}/evaluations`);

    console.log('[patientStore] fetchPatientEvaluations: ', response)
    if (!response.ok) {
      throw new Error(`Failed to fetch evaluations: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    const evaluations = result.patient_evaluations || [];
    
    // Set only the evaluations-related state, don't touch other state
    set({ 
      currentPatientEvaluations: evaluations, 
      isLoadingEvaluations: false 
    });
    
    return evaluations;
  } catch (error) {
    console.error('Error fetching patient evaluations:', error);
    set({ 
      isLoadingEvaluations: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      currentPatientEvaluations: [] 
    });
    return [];
  }
},

  // Fetch a specific evaluation
  fetchPatientEvaluation: async (evaluationId: string) => {
    try {
      set({ isLoadingEvaluations: true, error: null });
      const response = await fetch(`/api/kipu/patient_evaluations/${evaluationId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch evaluation: ${response.statusText}`);
      }

      const result = await response.json();
      const evaluation = result.success && result.data ? result.data : null;

      set({ isLoading: false });
      return evaluation;
    } catch (error) {
      console.error(`Error fetching evaluation ${evaluationId}:`, error);
      set({ isLoading: false, error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  },

  // Fetch all evaluations across patients
  fetchAllPatientEvaluations: async (options = {}) => {
    try {
      set({ isLoadingEvaluations: true, error: null });

      // Build query parameters
      const queryParams = new URLSearchParams({
        page: '1',
        per: '20'
      });

      // Add any options as query parameters
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(`/api/kipu/patient_evaluations?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch all evaluations: ${response.statusText}`);
      }

      const result = await response.json();
      const evaluations = result.success && result.data ? result.data : [];

      set({ allPatientEvaluations: evaluations, isLoading: false });
      return evaluations;
    } catch (error) {
      console.error('Error fetching all evaluations:', error);
      set({ isLoading: false, error: error instanceof Error ? error.message : 'Unknown error' });
      return [];
    }
  },

// In patientStore.ts - update fetchPatientVitalSigns
fetchPatientVitalSigns: async (patientId: string) => {
  try {
    set({ isLoadingVitalSigns: true, error: null });
    const encodedId = encodePatientIdForUrl(patientId);
    const response = await fetch(`/api/kipu/patients/${encodedId}/vital-signs`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch vital signs: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Raw vital signs data:", result);
    
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
    
    console.log("Transformed vital signs:", transformedVitalSigns);
    
    set({ 
      currentPatientVitalSigns: transformedVitalSigns, 
      isLoadingVitalSigns: false 
    });
    
    return transformedVitalSigns;
  } catch (error) {
    console.error('Error fetching patient vital signs:', error);
    set({ 
      isLoadingVitalSigns: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      currentPatientVitalSigns: []
    });
    return [];
  }
},

  // Fetch patient with all details
  // Fetch patient with all details
  fetchPatientWithDetails: async (patientId: string) => {
    try {
      set({ isLoading: true, error: null });

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
        selectedPatientEvaluations: evaluations,
        currentPatientEvaluations: evaluations,
        selectedPatientVitalSigns: vitalSigns,
        currentPatientVitalSigns: vitalSigns,
        isLoading: false
      });

      return patientWithDetails;
    } catch (error) {
      console.error('Error fetching patient with details:', error);
      set({ isLoading: false, error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  },

  // Add these functions to your store implementation before the closing }));

  // Set patient context enabled state
  setPatientContextEnabled: (enabled: boolean) => {
    set({ isPatientContextEnabled: enabled });

    // If disabling, clear the context
    if (!enabled) {
      get().clearPatientContext();
    }
  },

  // Clear the entire patient store
  clearPatientStore: () => {
    set({
      patients: [],
      currentPatientId: null,
      currentPatient: null,
      selectedPatient: null,
      evaluations: [],
      vitalSigns: [],
      currentPatientEvaluations: [],
      selectedPatientEvaluations: [],
      currentPatientVitalSigns: [],
      selectedPatientVitalSigns: [],
      selectedPatientAppointments: [],
      allPatientEvaluations: [],
      isPatientContextEnabled: false,
      selectedContextOptions: DEFAULT_PATIENT_CONTEXT_OPTIONS,
      contextOptions: DEFAULT_PATIENT_CONTEXT_OPTIONS,
      isLoading: false,
      isLoadingEvaluations: false,
      isLoadingVitalSigns: false,
      error: null
    });
  },

  // Clear just the patient context
  clearPatientContext: () => {
    set({
      isPatientContextEnabled: false,
      selectedContextOptions: DEFAULT_PATIENT_CONTEXT_OPTIONS,
      contextOptions: DEFAULT_PATIENT_CONTEXT_OPTIONS
    });

    // Also clear the chat context if it exists
    if (chatStore.getState().updateChatContext) {
      chatStore.getState().updateChatContext({
        patientId: null,
        patientName: null
      });
    }
  },



}));

export const initPatientStoreSubscriptions = () => {
  // Subscribe to changes in the patient store
  const unsubscribe = usePatientStore.subscribe(
    (state, prevState) => {
      const currentPatientId = state.currentPatientId;
      const prevPatientId = prevState.currentPatientId;

      // Only proceed if the ID has changed
      if (currentPatientId !== prevPatientId && currentPatientId) {
        const currentPatient = state.currentPatient;
        // Only fetch if we don't already have this patient loaded
        if (!currentPatient || currentPatient.patientId !== currentPatientId) {
          usePatientStore.getState().fetchPatientWithDetails(currentPatientId);
        }
      }
    }
  );
  return unsubscribe; // Return the unsubscribe function
};