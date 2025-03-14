'use client'

import { createContext, useContext, useEffect } from 'react';
import { usePatientStore } from '@/store/patientStore';
import { PatientBasicInfo } from '@/lib/kipu/types';

// Enhanced context type that wraps patientStore functionality
interface PatientContextType {
  // UI-specific state and methods
  isPatientContextEnabled: boolean;
  selectedFacilityId: string | null;
  
  // Wrapped methods from patientStore with enhanced functionality
  setFacility: (facilityId: string) => Promise<void>;
  selectPatient: (facilityId: string, patientId: string) => Promise<void>;
  clearSelection: () => void;
  togglePatientContext: () => void;
  
  // Convenience accessors that provide typed access to patientStore data
  currentPatient: any | null;
  patients: PatientBasicInfo[];
  patientEvaluations: any[];
  patientVitalSigns: any[];
  patientAppointments: any[];
  isLoading: boolean;
  error: string | null;
}

const PatientContext = createContext<PatientContextType | null>(null);

export const PatientProvider = ({ children }: { children: React.ReactNode }) => {
  // Get access to the patientStore
  const { 
    patients,
    currentPatient,
    currentPatientEvaluations,
    currentPatientVitalSigns,
    currentPatientAppointments,
    isPatientContextEnabled,
    isLoading,
    error,
    
    // Actions
    fetchPatients,
    fetchPatientWithDetails,
    setCurrentPatient,
    setPatientContextEnabled,
    clearPatientContext
  } = usePatientStore();
  
  // Local state for selected facility
  const selectedFacilityId = 'facility_1'; // Default facility, could be state if needed
  
  // Enhanced method: Set facility and load patients
  const setFacility = async (facilityId: string) => {
    try {
      await fetchPatients(facilityId);
    } catch (error) {
      console.error("Error setting facility:", error);
    }
  };
  
  // Enhanced method: Select a patient and load all their details
  const selectPatient = async (facilityId: string, patientId: string) => {
    try {
      await fetchPatientWithDetails(facilityId, patientId);
      setPatientContextEnabled(true);
    } catch (error) {
      console.error("Error selecting patient:", error);
    }
  };
  
  // Enhanced method: Clear current patient and disable context
  const clearSelection = () => {
    clearPatientContext();
  };
  
  // Enhanced method: Toggle patient context visibility
  const togglePatientContext = () => {
    setPatientContextEnabled(!isPatientContextEnabled);
  };
  
  // Load initial data from default facility on mount
  useEffect(() => {
    setFacility(selectedFacilityId);
  }, []);
  
  return (
    <PatientContext.Provider value={{
      // State
      isPatientContextEnabled,
      selectedFacilityId,
      currentPatient,
      patients,
      patientEvaluations: currentPatientEvaluations,
      patientVitalSigns: currentPatientVitalSigns,
      patientAppointments: currentPatientAppointments,
      isLoading,
      error,
      
      // Actions
      setFacility,
      selectPatient,
      clearSelection,
      togglePatientContext
    }}>
      {children}
    </PatientContext.Provider>
  );
};

export const usePatient = () => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatient must be used within a PatientProvider');
  }
  return context;
};