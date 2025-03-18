'use client';

import { create } from 'zustand';
import { PatientBasicInfo } from '@/lib/kipu/types';
import { 
  listPatients, 
  getPatient, 
  getPatientEvaluations, 
  getPatientVitalSigns, 
  getPatientAppointments,
  getFacilityData
} from '@/lib/kipu/service/patient-service';
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
  
  // Fetch patients for a facility using KIPU API
  fetchPatients: async (facilityId: string): Promise<PatientBasicInfo[]> => {
    try {
      set({ isLoading: true, error: null });
      
      console.log('PatientStore - Fetching patients for facility:', facilityId);
      
      // Get patients from KIPU API
  const response = await listPatients(facilityId);
      
      console.log('PatientStore - API response:', {
        hasPatients: !!response.patients,
        patientsCount: response.patients?.length || 0,
        pagination: response.pagination
      });
      
      if (!response.patients || response.patients.length === 0) {
        console.log('PatientStore - No patients returned from API');
        set({
          patients: [],
          isLoading: false
        });
        return [];
      }
      
      // Log a sample patient to verify structure
      if (response.patients.length > 0) {
        console.log('PatientStore - Sample patient:', response.patients[0]);
      }
      
      set({
        patients: response.patients,
        isLoading: false
      });
      
      return response.patients;
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
      
      const patient = await getPatient(facilityId, patientId);
      
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
      const evaluations = await getPatientEvaluations(facilityId, patientId);
      
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
      const vitalSigns = await getPatientVitalSigns(facilityId, patientId);
      
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
      const appointments = await getPatientAppointments(facilityId, patientId);
      
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
  fetchPatientWithDetails: async (facilityId: string, patientId: string): Promise<{
    patient: any | null;
    evaluations: any[];
    vitalSigns: any[];
    appointments: any[];
  }> => {
    try {
      set({ isLoading: true, error: null });
      
      console.log(`PatientStore - Fetching patient details for facility: ${facilityId}, patient: ${patientId}`);
      
      // Fetch patient details
      const patient = await get().fetchPatient(facilityId, patientId);
      
      if (!patient) {
        console.error(`PatientStore - Patient not found: ${patientId}`);
        throw new Error('Patient not found');
      }
      
      console.log(`PatientStore - Successfully fetched patient: ${patient.first_name} ${patient.last_name}`);
      
      // Fetch related data in parallel
      console.log(`PatientStore - Fetching related data for patient: ${patientId}`);
      
      const [evaluations, vitalSigns, appointments] = await Promise.all([
        get().fetchPatientEvaluations(facilityId, patientId),
        get().fetchPatientVitalSigns(facilityId, patientId),
        get().fetchPatientAppointments(facilityId, patientId)
      ]);
      
      console.log(`PatientStore - Related data fetched:`, {
        evaluationsCount: evaluations.length,
        vitalSignsCount: vitalSigns.length,
        appointmentsCount: appointments.length
      });
      
      set({
        currentPatient: patient,
        currentPatientEvaluations: evaluations,
        currentPatientVitalSigns: vitalSigns,
        currentPatientAppointments: appointments,
        isLoading: false
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
        isLoading: false,
        currentPatient: null,
        currentPatientEvaluations: [],
        currentPatientVitalSigns: [],
        currentPatientAppointments: []
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
    set({ currentPatient: patient });
    
    // If patient context is enabled, update the chat context
    if (get().isPatientContextEnabled && patient) {
      // Update chat context
      const patientContext = get().buildPatientContextString();
      chatStore.getState().updatePatientContext(patientContext);
    } else if (get().isPatientContextEnabled && !patient) {
      // Clear patient context if no patient is selected
      get().clearPatientContext();
    }
  },
  
  // Enable or disable patient context
  setPatientContextEnabled: (enabled: boolean) => {
    set({ isPatientContextEnabled: enabled });
    
    // Update chat context based on the new setting
    if (enabled && get().currentPatient) {
      // Update chat context with patient info
      const patientContext = get().buildPatientContextString();
      chatStore.getState().updatePatientContext(patientContext);
    } else if (!enabled) {
      // Clear patient context
      get().clearPatientContext();
    }
  },
  
  // Update the selected context options and refresh chat context
  updatePatientContextOptions: (options: PatientContextOption[]) => {
    set({ selectedContextOptions: options });
    
    // Update chat context if patient context is enabled
    if (get().isPatientContextEnabled && get().currentPatient) {
      const patientContext = get().buildPatientContextString();
      chatStore.getState().updatePatientContext(patientContext);
    }
  },
  
  // Build a formatted patient context string based on selected options
  buildPatientContextString: () => {
    const { currentPatient, currentPatientEvaluations, currentPatientVitalSigns, 
            currentPatientAppointments, isPatientContextEnabled, selectedContextOptions } = get();
    
    if (!isPatientContextEnabled || !currentPatient) {
      return null;
    }
    
    let contextString = '### Patient Context\n';
    
    // Add basic patient info if selected
    const basicInfoOptions = selectedContextOptions.filter(opt => opt.category === 'basic');
    if (basicInfoOptions.length > 0) {
      contextString += '#### Basic Information\n';
      basicInfoOptions.forEach(option => {
        const value = option.value.split('.').reduce((obj, key) => obj && obj[key], currentPatient);
        if (value) {
          contextString += `- ${option.label}: ${value}\n`;
        }
      });
    }
    
    // Add evaluation info if selected
    const evaluationOptions = selectedContextOptions.filter(opt => opt.category === 'evaluation');
    if (evaluationOptions.length > 0 && currentPatientEvaluations.length > 0) {
      contextString += '\n#### Recent Evaluations\n';
      // Sort evaluations by date (newest first)
      const sortedEvaluations = [...currentPatientEvaluations]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3); // Only include the 3 most recent
      
      sortedEvaluations.forEach(evaluation => {
        contextString += `- ${evaluation.evaluation_type} (${new Date(evaluation.created_at).toLocaleDateString()})\n`;
        evaluationOptions.forEach(option => {
          const value = option.value.split('.').reduce((obj, key) => obj && obj[key], evaluation);
          if (value) {
            contextString += `  - ${option.label}: ${value}\n`;
          }
        });
      });
    }
    
    // Add vital signs if selected
    const vitalSignOptions = selectedContextOptions.filter(opt => opt.category === 'vitalSigns');
    if (vitalSignOptions.length > 0 && currentPatientVitalSigns.length > 0) {
      contextString += '\n#### Recent Vital Signs\n';
      // Sort vital signs by date (newest first)
      const sortedVitalSigns = [...currentPatientVitalSigns]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3); // Only include the 3 most recent
      
      sortedVitalSigns.forEach(vs => {
        contextString += `- Recorded on ${new Date(vs.created_at).toLocaleDateString()}\n`;
        vitalSignOptions.forEach(option => {
          const value = option.value.split('.').reduce((obj, key) => obj && obj[key], vs);
          if (value) {
            contextString += `  - ${option.label}: ${value}\n`;
          }
        });
      });
    }
    
    // Add appointments if selected
    const appointmentOptions = selectedContextOptions.filter(opt => opt.category === 'appointments');
    if (appointmentOptions.length > 0 && currentPatientAppointments.length > 0) {
      contextString += '\n#### Upcoming Appointments\n';
      // Sort appointments by date (soonest first)
      const sortedAppointments = [...currentPatientAppointments]
        .filter(apt => new Date(apt.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3); // Only include the 3 soonest
      
      sortedAppointments.forEach(apt => {
        contextString += `- ${apt.type} on ${new Date(apt.date).toLocaleDateString()}\n`;
        appointmentOptions.forEach(option => {
          const value = option.value.split('.').reduce((obj, key) => obj && obj[key], apt);
          if (value) {
            contextString += `  - ${option.label}: ${value}\n`;
          }
        });
      });
    }
    
    return contextString;
  },
  
  // Clear all patient context
  clearPatientContext: () => {
    // Update chat context to remove patient info
    chatStore.getState().updatePatientContext(null);
    
    // If we're disabling patient context entirely, update the state
    if (get().isPatientContextEnabled) {
      set({ isPatientContextEnabled: false });
    }
  }
}));

// Initialize facility subscription - moved to a function to avoid circular dependency
export function initPatientStoreSubscriptions() {
  // Subscribe to facility changes to automatically load patients when facility changes
  const unsubscribe = useFacilityStore.subscribe(
    (state) => {
      // When facility changes, load patients for that facility
      if (state.currentFacilityId) {
        const patientState = usePatientStore.getState();
        patientState.fetchPatients(state.currentFacilityId);
        
        // Clear current patient when facility changes
        patientState.setCurrentPatient(null);
      }
    }
  );
  
  return unsubscribe;
}

export const patientStore = usePatientStore;
