'use client';

import { create } from 'zustand';
import { PatientBasicInfo } from '@/lib/kipu/types';
import { getFacilityData } from '@/lib/kipu';
import { useFacilityStore } from './facilityStore';
import { chatStore } from './chatStore';

// Define a type for patient context options
export type PatientContextOption = {
  id: string;
  label: string;
  value: string;
  category: 'basic' | 'evaluation' | 'vitalSigns' | 'appointments';
};

interface PatientStoreState {
  // State
  patients: PatientBasicInfo[];
  currentPatient: any | null;
  currentPatientEvaluations: any[];
  currentPatientVitalSigns: any[];
  currentPatientAppointments: any[];
  isPatientContextEnabled: boolean;
  selectedContextOptions: PatientContextOption[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchPatients: (facilityId: string) => Promise<PatientBasicInfo[]>;
  fetchPatient: (facilityId: string, patientId: string) => Promise<any>;
  fetchPatientEvaluations: (facilityId: string, patientId: string) => Promise<any[]>;
  fetchPatientVitalSigns: (facilityId: string, patientId: string) => Promise<any[]>;
  fetchPatientAppointments: (facilityId: string, patientId: string) => Promise<any[]>;
  fetchPatientWithDetails: (facilityId: string, patientId: string) => Promise<{
    patient: any | null;
    evaluations: any[];
    vitalSigns: any[];
    appointments: any[];
  }>;
  setCurrentPatient: (patient: any | null) => void;
  setPatientContextEnabled: (enabled: boolean) => void;
  clearPatientContext: () => void;
  fetchPatientsForCurrentFacility: () => Promise<PatientBasicInfo[]>;
  updatePatientContextOptions: (options: PatientContextOption[]) => void;
  buildPatientContextString: () => string | null;
}

export const usePatientStore = create<PatientStoreState>((set, get) => ({
  // Initial state
  patients: [],
  currentPatient: null,
  currentPatientEvaluations: [],
  currentPatientVitalSigns: [],
  currentPatientAppointments: [],
  isPatientContextEnabled: false,
  selectedContextOptions: [],
  isLoading: false,
  error: null,
  
  // Fetch patients for a facility using KIPU data
  fetchPatients: async (facilityId: string): Promise<PatientBasicInfo[]> => {
    try {
      set({ isLoading: true, error: null });
      
      // Get facility data from KIPU
      const facilityData = getFacilityData(facilityId);
      
      if (!facilityData) {
        throw new Error('Facility not found');
      }
      
      const rawPatients = facilityData.data.patients || [];
      
      // Transform the raw patient data to ensure it matches the PatientBasicInfo interface
      const patients = rawPatients.map((patient: any) => ({
        ...patient,
        // Ensure patients have casefile_id or mr_number for unique keys
        casefile_id: patient.id || `casefile_${patient.id}`,
        mr_number: patient.id || `mr_${patient.id}`,
      }));
      
      set({
        patients,
        isLoading: false
      });
      
      return patients;
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      set({ 
        error: error.message || 'Failed to fetch patients',
        isLoading: false
      });
      return [];
    }
  },
  
  // Fetch patients for the currently selected facility
  fetchPatientsForCurrentFacility: async (): Promise<PatientBasicInfo[]> => {
    const facilityStore = useFacilityStore.getState();
    const currentFacilityId = facilityStore.currentFacilityId;
    
    if (!currentFacilityId) {
      console.log('No facility selected, cannot fetch patients');
      set({ 
        patients: [],
        error: 'No facility selected',
        isLoading: false
      });
      return [];
    }
    
    return get().fetchPatients(currentFacilityId);
  },
  
  // Fetch a single patient
  fetchPatient: async (facilityId: string, patientId: string): Promise<any> => {
    try {
      set({ isLoading: true, error: null });
      
      const facilityData = getFacilityData(facilityId);
      
      if (!facilityData) {
        throw new Error('Facility not found');
      }
      
      const patient = facilityData.data.patients?.find(p => p.id === patientId) || null;
      
      if (!patient) {
        throw new Error('Patient not found');
      }
      
      set({
        currentPatient: patient,
        isLoading: false
      });
      
      return patient;
    } catch (error: any) {
      console.error('Error fetching patient:', error);
      set({ 
        error: error.message || 'Failed to fetch patient',
        isLoading: false
      });
      return null;
    }
  },
  
  // Fetch patient evaluations
  fetchPatientEvaluations: async (facilityId: string, patientId: string): Promise<any[]> => {
    try {
      const facilityData = getFacilityData(facilityId);
      
      if (!facilityData) {
        throw new Error('Facility not found');
      }
      
      const evaluations = facilityData.data.evaluations?.filter(e => e.patient_id === patientId) || [];
      
      set({
        currentPatientEvaluations: evaluations
      });
      
      return evaluations;
    } catch (error: any) {
      console.error('Error fetching patient evaluations:', error);
      return [];
    }
  },
  
  // Fetch patient vital signs
  fetchPatientVitalSigns: async (facilityId: string, patientId: string): Promise<any[]> => {
    try {
      const facilityData = getFacilityData(facilityId);
      
      if (!facilityData) {
        throw new Error('Facility not found');
      }
      
      const vitalSigns = facilityData.data.vital_signs?.filter(v => v.patient_id === patientId) || [];
      
      set({
        currentPatientVitalSigns: vitalSigns
      });
      
      return vitalSigns;
    } catch (error: any) {
      console.error('Error fetching patient vital signs:', error);
      return [];
    }
  },
  
  // Fetch patient appointments
  fetchPatientAppointments: async (facilityId: string, patientId: string): Promise<any[]> => {
    try {
      const facilityData = getFacilityData(facilityId);
      
      if (!facilityData) {
        throw new Error('Facility not found');
      }
      
      const appointments = facilityData.data.appointments?.filter(a => a.patient_id === patientId) || [];
      
      set({
        currentPatientAppointments: appointments
      });
      
      return appointments;
    } catch (error: any) {
      console.error('Error fetching patient appointments:', error);
      return [];
    }
  },
  
  // Fetch patient with all related details in one call
  fetchPatientWithDetails: async (facilityId: string, patientId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const facilityData = getFacilityData(facilityId);
      
      if (!facilityData) {
        throw new Error('Facility not found');
      }
      
      // First try to find the patient using casefile_id (which is what we receive from UI)
      // If not found, try using it directly as id (internal Kipu ID)
      let patient = facilityData.data.patients?.find(p => p.casefile_id === patientId) || null;
      
      // If not found by casefile_id, try with direct id match
      if (!patient) {
        patient = facilityData.data.patients?.find(p => p.id === patientId) || null;
      }
      
      if (!patient) {
        throw new Error('Patient not found');
      }
      
      // Now that we have the patient, we can use the internal Kipu ID (patient.id)
      // to get all related data that references this ID
      const internalPatientId = patient.id;
      
      // Get related data using the internal ID
      const evaluations = facilityData.data.evaluations?.filter(e => e.patient_id === internalPatientId) || [];
      const vitalSigns = facilityData.data.vital_signs?.filter(v => v.patient_id === internalPatientId) || [];
      const appointments = facilityData.data.appointments?.filter(a => a.patient_id === internalPatientId) || [];
      
      // Update state
      set({
        currentPatient: patient,
        currentPatientEvaluations: evaluations,
        currentPatientVitalSigns: vitalSigns,
        currentPatientAppointments: appointments,
        isLoading: false,
        // Auto-enable patient context when fetching a patient
        isPatientContextEnabled: patient !== null
      });
      
      return {
        patient,
        evaluations,
        vitalSigns,
        appointments
      };
    } catch (error: any) {
      console.error('Error fetching patient with details:', error);
      set({ 
        error: error.message || 'Failed to fetch patient details',
        isLoading: false
      });
      
      return {
        patient: null,
        evaluations: [],
        vitalSigns: [],
        appointments: []
      };
    }
  },
  
  // Set the current patient and update context
  setCurrentPatient: (patient: any | null) => {
    set({ 
      currentPatient: patient,
      isPatientContextEnabled: !!patient
    });
    
    // If patient is being cleared, also clear context options
    if (!patient) {
      set({ selectedContextOptions: [] });
      
      // Update chat context
      chatStore.getState().updatePatientContext(null);
    }
  },
  
  // Enable or disable patient context
  setPatientContextEnabled: (enabled: boolean) => {
    set({ isPatientContextEnabled: enabled });
    
    // If disabling, clear the context in chat store
    if (!enabled) {
      chatStore.getState().updatePatientContext(null);
    } else {
      // If enabling, update the chat context with current patient
      const { currentPatient } = get();
      if (currentPatient) {
        const patientContext = get().buildPatientContextString();
        if (patientContext) {
          chatStore.getState().updatePatientContext(patientContext);
        }
      }
    }
  },
  
  // Update the selected context options and refresh chat context
  updatePatientContextOptions: (options: PatientContextOption[]) => {
    set({ selectedContextOptions: options });
    
    // Update chat context if patient context is enabled
    const { isPatientContextEnabled } = get();
    if (isPatientContextEnabled) {
      const patientContext = get().buildPatientContextString();
      if (patientContext) {
        chatStore.getState().updatePatientContext(patientContext);
      }
    }
  },
  
  // Build a formatted patient context string based on selected options
  buildPatientContextString: () => {
    const { currentPatient, selectedContextOptions, isPatientContextEnabled } = get();
    
    if (!isPatientContextEnabled || !currentPatient) {
      return null;
    }
    
    // Create a properly formatted patient context header
    const patientHeader = `Patient Context: ${currentPatient.first_name} ${currentPatient.last_name} (ID: ${currentPatient.casefile_id || currentPatient.id})`;
    
    // If no specific options selected, return just the header
    if (selectedContextOptions.length === 0) {
      return patientHeader;
    }
    
    // Group options by category for better organization
    const categorizedOptions: Record<string, string[]> = {};
    
    selectedContextOptions.forEach(opt => {
      if (!categorizedOptions[opt.category]) {
        categorizedOptions[opt.category] = [];
      }
      categorizedOptions[opt.category].push(opt.value);
    });
    
    // Build context string with category headers
    const contextSections: string[] = [patientHeader];
    
    // Add Basic Info section
    if (categorizedOptions['basic'] && categorizedOptions['basic'].length > 0) {
      contextSections.push('--- Basic Information ---');
      contextSections.push(categorizedOptions['basic'].join('\n'));
    }
    
    // Add Evaluations section
    if (categorizedOptions['evaluation'] && categorizedOptions['evaluation'].length > 0) {
      contextSections.push('--- Evaluations ---');
      contextSections.push(categorizedOptions['evaluation'].join('\n'));
    }
    
    // Add Vital Signs section
    if (categorizedOptions['vitalSigns'] && categorizedOptions['vitalSigns'].length > 0) {
      contextSections.push('--- Vital Signs ---');
      contextSections.push(categorizedOptions['vitalSigns'].join('\n'));
    }
    
    // Add Appointments section
    if (categorizedOptions['appointments'] && categorizedOptions['appointments'].length > 0) {
      contextSections.push('--- Appointments ---');
      contextSections.push(categorizedOptions['appointments'].join('\n'));
    }
    
    return contextSections.join('\n\n');
  },
  
  // Clear all patient context
  clearPatientContext: () => {
    set({
      currentPatient: null,
      currentPatientEvaluations: [],
      currentPatientVitalSigns: [],
      currentPatientAppointments: [],
      isPatientContextEnabled: false,
      selectedContextOptions: []
    });
    
    // Update chat context
    chatStore.getState().updatePatientContext(null);
  },
}));

// Initialize facility subscription - moved to a function to avoid circular dependency
export const initPatientStoreSubscriptions = () => {
  if (typeof window !== 'undefined') {
    // Only run on client-side
    // Import the facility store dynamically to avoid circular dependency
    const { useFacilityStore } = require('./facilityStore');
    
    const unsubscribe = useFacilityStore.subscribe((state: any) => {
      const currentFacilityId = state.currentFacilityId;
      if (currentFacilityId) {
        usePatientStore.getState().fetchPatientsForCurrentFacility();
      }
    });
    
    // Return unsubscribe function in case we need to clean up
    return unsubscribe;
  }
  
  // Return a no-op function if not on client
  return () => {};
};

export const patientStore = usePatientStore;
