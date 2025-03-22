// Patient store types
import {
  PatientBasicInfo,
  PatientEvaluation,
  PatientVitalSign,
  PatientAppointment
} from '@/types/kipu';


// Patient context options for filtering and display
export interface PatientContextOptions {
  showInactive: boolean;
  sortBy: 'name' | 'date' | 'status';
  sortOrder: 'asc' | 'desc';
  filterBy: string;
}

// Default patient context options
export const DEFAULT_PATIENT_CONTEXT_OPTIONS: PatientContextOptions = {
  showInactive: false,
  sortBy: 'name',
  sortOrder: 'asc',
  filterBy: ''
};

// Response type for patient with all details
export interface PatientWithDetails {
  patient: PatientBasicInfo | null;
  evaluations: PatientEvaluation[];
//  vitalSigns: PatientVitalSign[];
//  appointments: PatientAppointment[];
}

// Patient store state interface
export interface PatientStore {
  // State
  patients: PatientBasicInfo[];
  currentPatientId: string | null;
  currentPatient: PatientBasicInfo | null;
  evaluations: PatientEvaluation[];
  vitalSigns: PatientVitalSign[];
  appointments: PatientAppointment[];
  contextOptions: PatientContextOptions;
  isLoading: boolean;
  error: string | null;

  // Patient context related properties
  currentPatientEvaluations: PatientEvaluation[];
  currentPatientVitalSigns: PatientVitalSign[];
  currentPatientAppointments: PatientAppointment[];
  isPatientContextEnabled: boolean;
  selectedContextOptions: PatientContextOptions;


  // Actions
  // Add to PatientStore interface
  updatePatientContextOptions: (options: PatientContextOptions) => void;
  setPatients: (patients: PatientBasicInfo[]) => void;
  setCurrentPatientId: (patientId: string | null, facilityId: number) => void;
  setCurrentPatient: (patient: PatientBasicInfo | null) => void;
  setEvaluations: (evaluations: PatientEvaluation[]) => void;
  setVitalSigns: (vitalSigns: PatientVitalSign[]) => void;
  setAppointments: (appointments: PatientAppointment[]) => void;
  setContextOptions: (options: Partial<PatientContextOptions>) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Data fetching with caching
  fetchPatients: (facilityId: string) => Promise<PatientBasicInfo[]>;
  fetchPatientById: (patientId: string) => Promise<PatientBasicInfo | null>;
  fetchPatientEvaluations: (patientId: string) => Promise<PatientEvaluation[]>;
  fetchPatientVitalSigns: (patientId: string) => Promise<PatientVitalSign[]>;
  fetchPatientAppointments: (patientId: string) => Promise<PatientAppointment[]>;
  fetchPatientWithDetails: (patientId: string) => Promise<PatientWithDetails | null>;
  fetchAllEvaluations: () => Promise<PatientEvaluation[]>;

  // Utilities
  clearPatientStore: () => void;
  clearPatientContext: () => void;
  setPatientContextEnabled: (enabled: boolean) => void;
}