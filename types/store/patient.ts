// Patient store types
import {
  PatientBasicInfo,
  KipuPatientEvaluation,
  PatientVitalSign,
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
  evaluations: KipuPatientEvaluation[];
  vitalSigns: PatientVitalSign[];
}

// Patient store state interface
// Patient store state interface
export interface PatientStore {
  // State
  patients: PatientBasicInfo[];
  currentPatientId: string | null;
  currentPatient: PatientBasicInfo | null;
  selectedPatient: PatientBasicInfo | null;  // Added
  evaluations: KipuPatientEvaluation[];
  vitalSigns: PatientVitalSign[];
  currentPatientEvaluations: KipuPatientEvaluation[];
  selectedPatientEvaluations: KipuPatientEvaluation[];  // Added
  currentPatientVitalSigns: PatientVitalSign[];
  selectedPatientVitalSigns: PatientVitalSign[];  // Added
  selectedPatientAppointments: any[];  // Added
  allPatientEvaluations: KipuPatientEvaluation[];
  isPatientContextEnabled: boolean;
  selectedContextOptions: PatientContextOptions;
  contextOptions: PatientContextOptions;
  isLoading: boolean;
  isLoadingEvaluations: boolean;  // Added
  isLoadingVitals: boolean;  // Added
  isLoadingAppointments: boolean;  // Added
  error: string | null;

  // Actions
  setPatients: (patients: PatientBasicInfo[]) => void;
  setCurrentPatientId: (patientId: string | null) => void;
  setCurrentPatient: (patient: PatientBasicInfo | null) => void;
  setPatientEvaluations: (evaluations: KipuPatientEvaluation[]) => void;
  setAllPatientEvaluations: (evaluations: KipuPatientEvaluation[]) => void;
  setVitalSigns: (vitalSigns: PatientVitalSign[]) => void;

  fetchPatients: (facilityId: number) => Promise<PatientBasicInfo[]>;
  fetchPatientById: (patientId: string) => Promise<PatientBasicInfo | null>;
  fetchPatientWithDetails: (patientId: string) => Promise<PatientWithDetails | null>;

  fetchPatientEvaluations: (patientId: string) => Promise<KipuPatientEvaluation[]>;
  fetchPatientEvaluation: (evaluationId: string) => Promise<KipuPatientEvaluation | null>;
  fetchAllPatientEvaluations: () => Promise<KipuPatientEvaluation[]>; // Added

  fetchPatientVitalSigns: (patientId: string, options?: { skipLoadingState?: boolean }) => Promise<PatientVitalSign[]>;

  setPatientContextEnabled: (enabled: boolean) => void;
  setPatientContextOptions: (options: Partial<PatientContextOptions>) => void;
  updatePatientContextOptions: (options: PatientContextOptions) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  clearPatientStore: () => void;
  clearPatientContext: () => void;
}