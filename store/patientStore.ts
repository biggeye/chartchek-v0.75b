'use client';

import { create } from 'zustand';
import { PatientBasicInfo } from '@/lib/kipu/types';
import { getFacilityData } from '@/lib/kipu';

interface PatientStoreState {
  // State
  patients: PatientBasicInfo[];
  currentPatient: any | null;
  currentPatientEvaluations: any[];
  currentPatientVitalSigns: any[];
  currentPatientAppointments: any[];
  isPatientContextEnabled: boolean;
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
}

export const usePatientStore = create<PatientStoreState>((set, get) => ({
  // Initial state
  patients: [],
  currentPatient: null,
  currentPatientEvaluations: [],
  currentPatientVitalSigns: [],
  currentPatientAppointments: [],
  isPatientContextEnabled: false,
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
      
      const patients = facilityData.data.patients || [];
      
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
      
      // Find the patient
      const patient = facilityData.data.patients?.find(p => p.id === patientId) || null;
      
      if (!patient) {
        throw new Error('Patient not found');
      }
      
      // Get related data
      const evaluations = facilityData.data.evaluations?.filter(e => e.patient_id === patientId) || [];
      const vitalSigns = facilityData.data.vital_signs?.filter(v => v.patient_id === patientId) || [];
      const appointments = facilityData.data.appointments?.filter(a => a.patient_id === patientId) || [];
      
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
  
  // Set the current patient
  setCurrentPatient: (patient: any | null) => {
    set({
      currentPatient: patient,
      // Auto-enable patient context when selecting a patient
      isPatientContextEnabled: patient !== null
    });
  },
  
  // Enable/disable patient context
  setPatientContextEnabled: (enabled: boolean) => {
    set({ isPatientContextEnabled: enabled });
  },
  
  // Clear patient context
  clearPatientContext: () => {
    set({
      currentPatient: null,
      currentPatientEvaluations: [],
      currentPatientVitalSigns: [],
      currentPatientAppointments: [],
      isPatientContextEnabled: false
    });
  }
}));
