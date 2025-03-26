'use client'

import { createContext, useContext, useState, useEffect } from 'react';
import { usePatientStore } from '@/store/patientStore';
import { useFacilityStore } from '@/store/facilityStore';
import { PatientBasicInfo, KipuPatientEvaluation, PatientVitalSign } from '@/types/kipu';

// Focus on UI-specific state and combined data
interface PatientContextType {
  // UI-specific state
  isPatientContextEnabled: boolean;
  togglePatientContext: () => void;
  
  // Aggregated patient data (the real value-add)
  currentPatientFile: PatientFile | null;
  
  // High-level UI operations
  selectPatient: (patientId: string) => Promise<void>;
  clearSelection: () => void;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
}

interface PatientFile {
  patient: PatientBasicInfo;
  evaluations: KipuPatientEvaluation[];
  vitalSigns: PatientVitalSign[];
  // Add other patient-related data as needed
}

const PatientContext = createContext<PatientContextType | null>(null);

export const PatientProvider = ({ children }: { children: React.ReactNode }) => {
  // Get data from stores
  const { currentFacilityId } = useFacilityStore();
  const { 
    currentPatient,
    currentPatientEvaluations,
    currentPatientVitalSigns,
    isPatientContextEnabled,
    error,
    
    // Only include the methods you actually need
    fetchPatientWithDetails,
    setPatientContextEnabled,
    clearPatientContext,
    isLoading
  } = usePatientStore();
  
  // Create the aggregated patient file
  const [currentPatientFile, setCurrentPatientFile] = useState<PatientFile | null>(null);
  
  // Update the patient file when relevant store data changes
  useEffect(() => {
    if (currentPatient && currentPatientEvaluations && currentPatientVitalSigns) {
      setCurrentPatientFile({
        patient: currentPatient,
        evaluations: currentPatientEvaluations,
        vitalSigns: currentPatientVitalSigns
      });
    } else {
      setCurrentPatientFile(null);
    }
  }, [currentPatient, currentPatientEvaluations, currentPatientVitalSigns]);
  
 // Enhanced method: Select a patient and load all their details
 const selectPatient = async (patientId: string) => {
  try {
    const patientDetails = await fetchPatientWithDetails(patientId);
    if (patientDetails) {
      // Map the returned object to match your PatientFile interface
      setCurrentPatientFile({
        patient: patientDetails.patient,
        evaluations: patientDetails.evaluations,
        vitalSigns: patientDetails.vitalSigns
      });
      setPatientContextEnabled(true);
    }
  } catch (error) {
    console.error("Error selecting patient:", error);
  }
};
  const togglePatientContext = () => {
    setPatientContextEnabled(!isPatientContextEnabled);
  };
  
  const clearSelection = () => {
    clearPatientContext();
  };
  
  return (
    <PatientContext.Provider value={{
      isPatientContextEnabled,
      currentPatientFile,
      selectPatient,
      clearSelection,
      togglePatientContext,
      isLoading,
      error
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