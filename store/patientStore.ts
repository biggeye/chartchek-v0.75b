'use client';

import { create } from 'zustand';
import { PatientStore, PatientContextOptions, PatientWithDetails, DEFAULT_PATIENT_CONTEXT_OPTIONS } from '@/types/store/patient';
import { PatientBasicInfo, PatientEvaluation, PatientVitalSign, PatientAppointment } from '@/types/kipu';
import { memoizeAsync, memoizeAsyncWithExpiration } from '@/utils/memoization';
import { getCachedData, cacheKeys, cacheTTL } from '@/utils/cache/redis';
import { queryKeys } from '@/utils/react-query/config';
import { createClient } from '@/utils/supabase/client';
import { chatStore } from '@/store/chatStore';

// Initialize Supabase client
const supabase = createClient();

// API functions that call our internal endpoints
const fetchPatientsFromAPI = async (page = 1, limit = 20) => {
  const response = await fetch(`/api/kipu/patients?page=${page}&limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch patients: ${response.statusText}`);
  }
  return response.json();
};

const fetchPatientByIdFromAPI = async (facilityId: string, patientId: string) => {
  const response = await fetch(`/api/kipu/patients/${patientId}?facilityId=${facilityId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch patient: ${response.statusText}`);
  }
  return response.json();
};

const fetchPatientEvaluationsFromAPI = async (facilityId: string, patientId: string) => {
  // Ensure patientId is properly encoded for the URL
  const decodedPatientId = decodeURIComponent(patientId);
  const encodedPatientId = encodeURIComponent(decodedPatientId);

  const response = await fetch(`/api/kipu/patients/${encodedPatientId}/evaluations?facilityId=${facilityId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch evaluations: ${response.statusText}`);
  }
  return response.json();
};

const fetchEvaluationFromAPI = async (evaluationId: string) => {
  const response = await fetch(`/api/kipu/evaluations/${evaluationId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch evaluation: ${response.statusText}`);
  }
  return response.json();
};

const fetchPatientVitalSignsFromAPI = async (facilityId: string, patientId: string) => {
  // Ensure patientId is properly encoded for the URL
  const decodedPatientId = decodeURIComponent(patientId);
  const encodedPatientId = encodeURIComponent(decodedPatientId);

  const response = await fetch(`/api/kipu/patients/${encodedPatientId}/vitals?facilityId=${facilityId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch vital signs: ${response.statusText}`);
  }
  return response.json();
};

const fetchPatientAppointmentsFromAPI = async (facilityId: string, patientId: string) => {
  // Ensure patientId is properly encoded for the URL
  const decodedPatientId = decodeURIComponent(patientId);
  const encodedPatientId = encodeURIComponent(decodedPatientId);

  const response = await fetch(`/api/kipu/patients/${encodedPatientId}/appointments?facilityId=${facilityId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch appointments: ${response.statusText}`);
  }
  return response.json();
};

// Memoized API functions with the same signatures as the original service functions
const memoizedListPatients = memoizeAsyncWithExpiration(
  fetchPatientsFromAPI,
  5 * 60 * 1000, // 5 minutes TTL
  10 // Max cache size
);

const memoizedGetPatient = memoizeAsyncWithExpiration(
  fetchPatientByIdFromAPI,
  5 * 60 * 1000,
  20
);

const memoizedGetPatientEvaluations = memoizeAsyncWithExpiration(
  fetchPatientEvaluationsFromAPI,
  5 * 60 * 1000,
  20
);

const memoizedGetPatientVitalSigns = memoizeAsyncWithExpiration(
  fetchPatientVitalSignsFromAPI,
  5 * 60 * 1000,
  20
);

const memoizedGetPatientAppointments = memoizeAsyncWithExpiration(
  fetchPatientAppointmentsFromAPI,
  5 * 60 * 1000,
  20
);

// Create patient store with Zustand
export const usePatientStore = create<PatientStore>((set, get) => ({
  // Initial state
  patients: [],
  currentPatientId: null,
  currentPatient: null,
  evaluations: [],
  vitalSigns: [],
  appointments: [],
  currentPatientEvaluations: [],
  currentPatientVitalSigns: [],
  currentPatientAppointments: [],
  isPatientContextEnabled: false,
  selectedContextOptions: DEFAULT_PATIENT_CONTEXT_OPTIONS,
  contextOptions: DEFAULT_PATIENT_CONTEXT_OPTIONS,
  isLoading: false,
  error: null,

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
  setCurrentPatient: (patient: PatientBasicInfo | null) => set({ currentPatient: patient }),

  // Set evaluations
  setEvaluations: (evaluations: PatientEvaluation[]) => set({ evaluations }),

  // Set vital signs
  setVitalSigns: (vitalSigns: PatientVitalSign[]) => set({ vitalSigns }),

  // Set appointments
  setAppointments: (appointments: PatientAppointment[]) => set({ appointments }),

  // Set context options
  setContextOptions: (options: Partial<PatientContextOptions>) => set({
    contextOptions: {
      ...get().contextOptions,
      ...options
    }
  }),

  // Update the updatePatientContextOptions function
  updatePatientContextOptions: (options: PatientContextOptions) => {
    set({ contextOptions: options });

    // If patient context is enabled, update the chat context
    if (get().isPatientContextEnabled && get().currentPatient) {
      // Get the current patient
      const patient = get().currentPatient;

      // Make sure patient is not null and use patientId instead of id
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
  // Fetch patients from API with multi-level caching
  fetchPatients: async () => {
    try {
      set({ isLoading: true, error: null });

      // Get context options with fallback to defaults
      const contextOptions = get().contextOptions || DEFAULT_PATIENT_CONTEXT_OPTIONS;
      const { showInactive, sortBy, sortOrder, filterBy } = contextOptions;

      // Fetch from API without facility filtering
      const result = await fetchPatientsFromAPI(1, 100);

      // Process the results
      let patients = result.patients || [];

      // Apply sorting if needed
      if (sortBy) {
        patients = [...patients].sort((a, b) => {
          const aValue = a[sortBy as keyof PatientBasicInfo];
          const bValue = b[sortBy as keyof PatientBasicInfo];

          if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
      }

      set({ patients, isLoading: false });
      return patients;
    } catch (error) {
      console.error('Error fetching patients:', error);
      set({ error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
      return [];
    }
  },

  fetchPatientById: async (patientId: string): Promise<PatientBasicInfo | null> => {
    try {
      set({ isLoading: true, error: null });

      // Make the request without facilityId parameter
      const response = await fetch(`/api/kipu/patients/${patientId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch patient: ${response.statusText}`);
      }

      const patient = await response.json();
      set({ currentPatient: patient });
      return patient;
    } catch (error) {
      console.error(`Error fetching patient ${patientId}:`, error);
      set({ error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAllEvaluations: async () => {
    set({ isLoading: true, error: null });

    try {
      // Get current user ID for caching
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Use the existing caching mechanism
      const cacheKey = cacheKeys.evaluations.list(userId);

      const evaluations = await getCachedData<PatientEvaluation[]>(
        cacheKey,
        async () => {
          const response = await fetch('/api/kipu/evaluations');

          if (!response.ok) {
            throw new Error('Failed to fetch evaluations');
          }

          const data = await response.json();
          return data.evaluations || [];
        },
        cacheTTL.MEDIUM // 5 minutes
      );
      set({
        evaluations,
        isLoading: false
      });
      return evaluations;
    } catch (error) {
      console.error('Error fetching all evaluations:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch evaluations',
        isLoading: false
      });
      return [];
    }
  },
  // Fetch patient evaluations with caching
  fetchPatientEvaluations: async (patientId: string) => {
    if (!patientId) return [];
    try {
      // Get current user ID for cache key
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'anonymous';
      // Create cache key
      const cacheKey = cacheKeys.patients.evaluations(userId, patientId);
      // Try to get from cache or fetch fresh data
      const evaluations = await getCachedData<PatientEvaluation[]>(
        cacheKey,
        async () => {
          const response = await fetch(`/api/kipu/patients/${patientId}/evaluations`);
          if (!response.ok) {
            throw new Error(`Failed to fetch evaluations: ${response.statusText}`);
          }
          const data = await response.json();
          // The API returns evaluations in the 'evaluations' field
          return data.evaluations || [];
        },
      );
      // Update the store with the fetched evaluations
      set({
        evaluations,
        currentPatientEvaluations: evaluations
      });
      return evaluations;
    } catch (error) {
      console.error(`Error fetching evaluations for patient ${patientId}:`, error);
      set({ error: error instanceof Error ? error.message : 'Unknown error' });
      return [];
    }
  },
  // Fetch patient vital signs with caching
  fetchPatientVitalSigns: async (patientId: string) => {
    if (!patientId) return [];

    try {
      // Get current user ID for cache key
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'anonymous';

      // Create cache key
      const cacheKey = cacheKeys.patients.vitalSigns(userId, patientId);

      // Try to get from cache or fetch fresh data
      const vitalSigns = await getCachedData<PatientVitalSign[]>(
        cacheKey,
        async () => {
          // Get the current facility ID
          const facilityId = get().currentPatient?.facilityId;
          if (!facilityId) {
            throw new Error('No facility ID available for patient');
          }

          // Call the API endpoint through our memoized function
          return memoizedGetPatientVitalSigns(facilityId.toString(), patientId);
        },
        cacheTTL.MEDIUM
      );

      // Update the vital signs
      if (vitalSigns) {
        set({ vitalSigns });
      }

      return vitalSigns || [];
    } catch (error) {
      console.error(`Error fetching vital signs for patient ${patientId}:`, error);
      return [];
    }
  },
  // Fetch patient appointments with caching
  fetchPatientAppointments: async (patientId: string) => {
    if (!patientId) return [];
    try {
      // Get current user ID for cache key
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'anonymous';
      // Create cache key
      const cacheKey = cacheKeys.patients.appointments(userId, patientId);
      // Try to get from cache or fetch fresh data
      const appointments = await getCachedData<PatientAppointment[]>(
        cacheKey,
        async () => {
          // Call the API endpoint through our memoized function
          return memoizedGetPatientAppointments(patientId);
        },
        cacheTTL.MEDIUM
      );
      // Update the appointments
      if (appointments) {
        set({ appointments });
      }

      return appointments || [];
    } catch (error) {
      console.error(`Error fetching appointments for patient ${patientId}:`, error);
      return [];
    }
  },
  // Update fetchPatientWithDetails to not require facilityId
  fetchPatientWithDetails: async (patientId: string) => {
    if (!patientId) {
      console.error('Missing patient ID for fetchPatientWithDetails');
      return null;
    }

    try {
      set({ isLoading: true, error: null });

      // Use the updated fetchPatientById that doesn't need facilityId
      const patient = await get().fetchPatientById(patientId);

      if (!patient) {
        set({ isLoading: false });
        return null;
      }

      // Fetch the additional details
      const [evaluations] = await Promise.all([
        get().fetchPatientEvaluations(patientId),
        //     get().fetchPatientVitalSigns(patientId),
        get().fetchPatientAppointments(patientId)
      ]);

      set({ isLoading: false });

      // Return the complete patient data structure
      return {
        patient,
        evaluations
      };
    } catch (error) {
      console.error(`Error in fetchPatientWithDetails for patient ${patientId}:`, error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch patient details'
      });
      return null;
    }
  },
  // Clear patient store
  clearPatientStore: () => {
    set({
      patients: [],
      currentPatientId: null,
      currentPatient: null,
      evaluations: [],
      vitalSigns: [],
      appointments: [],
      currentPatientEvaluations: [],
      currentPatientVitalSigns: [],
      currentPatientAppointments: [],
      isPatientContextEnabled: false,
      isLoading: false,
      error: null
    });
  },
  // Clear patient context
  clearPatientContext: () => {
    set({
      selectedContextOptions: DEFAULT_PATIENT_CONTEXT_OPTIONS,
      contextOptions: DEFAULT_PATIENT_CONTEXT_OPTIONS
    });

    // Also clear the chat context if it's enabled
    if (get().isPatientContextEnabled) {
      chatStore.getState().updateChatContext({});
    }
  },
  // Set patient context enabled state
  setPatientContextEnabled: (enabled: boolean) => {
    set({ isPatientContextEnabled: enabled });

    // If disabling, also clear the context
    if (!enabled) {
      chatStore.getState().updateChatContext({});
    }
  }
}));

/**
 * Initialize patient store subscriptions to facility changes
 * This function sets up a subscription to the facility store to fetch patient data
 * when the current facility changes
 */
export const initPatientStoreSubscriptions = () => {
  if (typeof window === 'undefined') {
    // Return a no-op function if not on client
    return () => { };
    // Import the facility store dynamically to avoid circular dependency
    const { useFacilityStore } = require('./facilityStore');

    const unsubscribe = useFacilityStore.subscribe((state: any) => {
      const currentFacilityId = state.currentFacilityId;
      if (currentFacilityId) {
        // Clear current patient data when facility changes
        usePatientStore.getState().clearPatientStore();
        // Fetch patients for the new facility
        usePatientStore.getState().fetchPatients(currentFacilityId);
      }
    });

    // Return unsubscribe function in case we need to clean up
    return unsubscribe;
  }

  // Return a no-op function if not on client
  return () => { };
};