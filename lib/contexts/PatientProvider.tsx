'use client'

import { createContext, useContext, useEffect, useState } from 'react';
import { usePatientStore } from '@/store/patientStore';
import { useFacilityStore } from '@/store/facilityStore';
import { PatientBasicInfo, PatientEvaluation, PatientVitalSign, PatientAppointment } from '@/types/kipu';

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
  
  // New methods for evaluations, vital signs, and appointments
  fetchEvaluations: (facilityId: string, patientId: string) => Promise<PatientEvaluation[]>;
  fetchVitalSigns: (facilityId: string, patientId: string) => Promise<PatientVitalSign[]>;
  fetchAppointments: (facilityId: string, patientId: string) => Promise<PatientAppointment[]>;
  fetchAllEvaluations: () => Promise<PatientEvaluation[]>;
  getEvaluationById: (evaluationId: string) => PatientEvaluation | undefined;
  
  // Convenience accessors that provide typed access to patientStore data
  currentPatient: PatientBasicInfo | null;
  patients: PatientBasicInfo[];
  patientEvaluations: PatientEvaluation[];
  patientVitalSigns: PatientVitalSign[];
  patientAppointments: PatientAppointment[];
  allEvaluations: PatientEvaluation[];
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
    evaluations,
    isPatientContextEnabled,
    isLoading,
    error,
    
    // Actions
    fetchPatients,
    fetchPatientWithDetails,
    fetchPatientEvaluations,
    fetchPatientVitalSigns,
    fetchPatientAppointments,
    fetchAllEvaluations,
    setCurrentPatient,
    setPatientContextEnabled,
    clearPatientContext
  } = usePatientStore();
  
  // Get facility information from facilityStore
  const { currentFacilityId, getCurrentFacility } = useFacilityStore();
  
  // Enhanced method: Set facility and load patients
  const setFacility = async (facilityId: string) => {
    try {
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
  
  // New method: Fetch appointments for a specific patient
  const fetchAppointments = async (patientId: string) => {
    try {
      return await fetchPatientAppointments(patientId);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      return [];
    }
  };
  
  // New method: Fetch all evaluations (not tied to a specific patient)
  const getAllEvaluations = async () => {
    try {
      return await fetchAllEvaluations();
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
  
  // Load initial data from current facility on mount and when facility changes
  useEffect(() => {
    if (currentFacilityId) {
      setFacility(currentFacilityId);
    }
  }, [currentFacilityId]);
  
  return (
    <PatientContext.Provider value={{
      // State
      isPatientContextEnabled,
      selectedFacilityId: currentFacilityId,
      currentPatient,
      patients,
      patientEvaluations: currentPatientEvaluations,
      patientVitalSigns: currentPatientVitalSigns,
      patientAppointments: currentPatientAppointments,
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
      fetchAppointments,
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