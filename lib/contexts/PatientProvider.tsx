'use client'

import { createContext, useContext, useEffect, useState } from 'react';
import { usePatientStore } from '@/store/patientStore';
import { useFacilityStore } from '@/store/facilityStore';
import { PatientBasicInfo, KipuPatientEvaluation, PatientVitalSign, PatientAppointment } from '@/types/kipu';

// Enhanced context type that wraps patientStore functionality
interface PatientContextType {
  // UI-specific state and methods
  isPatientContextEnabled: boolean;
  
  // Wrapped methods from patientStore with enhanced functionality
  setFacility: (facilityId: number) => Promise<void>;
  selectPatient: (patientId: string) => Promise<void>;
  clearSelection: () => void;
  togglePatientContext: () => void;
  
  // New methods for evaluations, vital signs, and appointments
  fetchEvaluations: (patientId: string) => Promise<KipuPatientEvaluation[]>;
  fetchVitalSigns: (patientId: string) => Promise<PatientVitalSign[]>;
  fetchAllEvaluations: () => Promise<KipuPatientEvaluation[]>;
  getEvaluationById: (evaluationId: string) => KipuPatientEvaluation | undefined;
  
  // Convenience accessors that provide typed access to patientStore data
  currentPatient: PatientBasicInfo | null;
  currentFacilityId: number;
  patients: PatientBasicInfo[];
  KipuPatientEvaluations: KipuPatientEvaluation[];
  patientVitalSigns: PatientVitalSign[];
   allEvaluations: KipuPatientEvaluation[];
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
    evaluations,
    isPatientContextEnabled,
    error,
    
    // Actions
    fetchPatients,
    fetchPatientWithDetails,
    fetchPatientEvaluations,
    fetchPatientVitalSigns,
    fetchAllPatientEvaluations,
    setCurrentPatient,
    setPatientContextEnabled,
    clearPatientContext,
    isLoadingEvaluations,
    isLoadingVitals,
    isLoading
  } = usePatientStore();
  
  // Get facility information from facilityStore
  const { currentFacilityId } = useFacilityStore();
  
  // Enhanced method: Set facility and load patients
  const setFacility = async (facilityId: number) => {
    try {
      // Pass an object with facilityId property instead of just the string
      await fetchPatients(facilityId);
    } catch (error) {
      console.error("Error setting facility:", error);
    }
  };
  
  // Enhanced method: Select a patient and load all their details
  const selectPatient = async (patientId: string) => {
    try {
      await fetchPatientWithDetails(patientId);
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
  
  // New method: Fetch evaluations for a specific patient
  const fetchEvaluations = async (patientId: string) => {
    try {
      return await fetchPatientEvaluations(patientId);
    } catch (error) {
      console.error("Error fetching evaluations:", error);
      return [];
    }
  };
  
  // New method: Fetch vital signs for a specific patient
  const fetchVitalSigns = async (patientId: string) => {
    try {
      return await fetchPatientVitalSigns(patientId);
    } catch (error) {
      console.error("Error fetching vital signs:", error);
      return [];
    }
  };
  
  
  // New method: Fetch all evaluations (not tied to a specific patient)
  const getAllEvaluations = async () => {
    try {
      return await fetchAllPatientEvaluations();
    } catch (error) {
      console.error("Error fetching all evaluations:", error);
      return [];
    }
  };
  
  // New method: Get a specific evaluation by ID
  const getEvaluationById = (evaluationId: string) => {
    // First check in current patient evaluations
    const patientEval = currentPatientEvaluations.find(evaluation => evaluation.id === evaluationId);
    if (patientEval) return patientEval;
    
    // Then check in all evaluations
    return evaluations.find(evaluation => evaluation.id === evaluationId);
  };

  
  return (
    <PatientContext.Provider value={{
      // State
      isPatientContextEnabled,
      currentFacilityId,
      currentPatient,
      patients,
      KipuPatientEvaluations: currentPatientEvaluations,
      patientVitalSigns: currentPatientVitalSigns,
      allEvaluations: evaluations,
      isLoading,
      error,
      
      // Actions
      setFacility,
      selectPatient,
      clearSelection,
      togglePatientContext,
      
      // New methods
      fetchEvaluations,
      fetchVitalSigns,
      fetchAllEvaluations: getAllEvaluations,
      getEvaluationById
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