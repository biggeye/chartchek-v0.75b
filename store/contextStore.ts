import { create } from 'zustand';
import { KipuPatientBasicInfo, PatientBasicInfo } from '@/types/kipu';
import { useDocumentStore } from './documentStore';
import { usePatientStore } from './patientStore';
import { useKipuEvaluationsStore } from './kipuEvaluationsStore';
import { KipuPatientEvaluation } from '@/types/chartChek/evaluations';
import { PatientVitalSign } from '@/types/kipu';

export type ContextItem = {
  id: string;
  label: string;
  description: string;
  category: string;
  selected?: boolean;
};

export type ContextCategory = {
  id: string;
  label: string;
  items: ContextItem[];
};

export type PatientContext = {
  patientInfo: any;
  medicalHistory?: string;
  medications?: string;
  allergies?: string;
  vitalSigns?: PatientVitalSign[];
  evaluations?: KipuPatientEvaluation[];
};

interface ContextStoreState {
  contextCategories: ContextCategory[];
  contextItems: ContextItem[];
  selectedContextItems: ContextItem[];
  patientContext: PatientContext | null; // Change from array to single object or null
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setContextCategories: (categories: ContextCategory[]) => void;
  setSelectedContextItems: (options: ContextItem[]) => void;
  setContextItem: (contextItem: ContextItem) => ContextItem | void; // i intend for this action to add to an array which is contextItems: ContextItem[]
  setPatientContext: (context: PatientContext | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  generateContextItems: (patient?: PatientBasicInfo, kipuPatientEvaluations?: KipuPatientEvaluation[], patientVitalSigns?: any[]) => void;
  buildContextForPatient: (patient: any, selectedOptions: ContextItem[]) => Promise<PatientContext>;
  preparePatientContext: (patient: PatientBasicInfo, selectedOptions: ContextItem[]) => Promise<PatientContext | null>;
  fetchPatientContextData: (patient: PatientBasicInfo, selectedOptions: ContextItem[]) => Promise<void>;
  clearContextStore: () => void;
}

// Default context categories
const defaultContextCategories: ContextCategory[] = [
  {
    id: 'basic',
    label: 'Basic Information',
    items: [
      {
        id: 'patientInfo',
        label: 'Patient Demographics',
        description: 'Basic patient information including name, age, gender, etc.',
        category: 'basic',
        selected: true
      }
    ]
  },
  {
    id: 'medical',
    label: 'Medical Information',
    items: [
      {
        id: 'medicalHistory',
        label: 'Medical History',
        description: 'Patient\'s medical history including diagnoses, procedures, etc.',
        category: 'medical',
        selected: false
      },
      {
        id: 'medications',
        label: 'Medications',
        description: 'Current and past medications',
        category: 'medical',
        selected: false
      },
      {
        id: 'allergies',
        label: 'Allergies',
        description: 'Known allergies and reactions',
        category: 'medical',
        selected: false
      },
      {
        id: 'vitalSigns',
        label: 'Vital Signs',
        description: 'Recent vital signs measurements',
        category: 'medical',
        selected: false
      }
    ]
  },
  {
    id: 'clinical',
    label: 'Clinical Information',
    items: [
      {
        id: 'evaluations',
        label: 'Evaluations',
        description: 'Recent clinical evaluations',
        category: 'clinical',
        selected: false
      }
    ]
  }
];

export const useContextStore = create<ContextStoreState>((set, get) => ({
  contextCategories: defaultContextCategories,
  contextItems: [] as ContextItem[],
  selectedContextItems: defaultContextCategories[0].items.filter(item => item.selected),
  patientContext: [],
  isLoading: false,
  error: null,


  
  setContextCategories: (categories) => {
    set({ contextCategories: categories });
  },
  setContextItem: (contextItem: ContextItem) => {
    set(state => ({
      contextItems: [...state.contextItems, contextItem]
    }));
    return contextItem;
  },
  setSelectedContextItems: (options) => {
    set({ selectedContextItems: options });
  },
  setPatientContext: (context) => {

    set({ patientContext: context });
  },
  setIsLoading: (isLoading) => {
    set({ isLoading });
  },
  setError: (error) => {
    set({ error });
  },

  generateContextItems: (patient?: PatientBasicInfo, kipuPatientEvaluations?: KipuPatientEvaluation[], patientVitalSigns?: any[]) => {

    const options: ContextItem[] = [];

    // Basic patient info
    if (patient) {
      // Name and ID are always included by default, add other basic info
      if (patient.mrn) {
        options.push({
          id: 'mrn',
          label: 'Medical Record Number',
          description: patient.mrn,
          category: 'basic'
        })
      }
  
      if (patient.dateOfBirth) {
        options.push({
          id: 'dob',
          label: 'Date of Birth',
          description: patient.dateOfBirth,
          category: 'basic'
        })
      }
      if (patient.status) {
        options.push({
          id: 'status',
          label: 'Status',
          description: patient.status,
          category: 'basic'
        });
      }
  
      if (patient.admissionDate) {
        options.push({
          id: 'admissionDate',
          label: 'Admission Date',
          description: patient.admissionDate,
          category: 'basic'
        });
      }
  
      if (patient.dischargeDate) {
        options.push({
          id: 'dischargeDate',
          label: 'Discharge Date',
          description: patient.dischargeDate,
          category: 'basic'
        });
      }
  
      if (patient.primaryDiagnosis) {
        options.push({
          id: 'primaryDiagnosis',
          label: 'Primary Diagnosis',
          description: patient.primaryDiagnosis,
          category: 'basic'
        });
      }
  
      if (patient.insuranceProvider) {
        options.push({
          id: 'insuranceProvider',
          label: 'Insurance Provider',
          description: patient.insuranceProvider,
          category: 'basic'
        });
      }
  
      if (patient.dischargeType) {
        options.push({
          id: 'dischargeType',
          label: 'Discharge Type',
          description: patient.dischargeType,
          category: 'basic'
        });
      }
  
      if (patient.sobrietyDate) {
        options.push({
          id: 'sobrietyDate',
          label: 'Sobriety Date',
          description: patient.sobrietyDate,
          category: 'basic'
        });
      }
  
      if (patient.levelOfCare) {
        options.push({
          id: 'levelOfCare',
          label: 'Level of Care',
          description: patient.levelOfCare,
          category: 'basic'
        });
      }
  
      if (patient.nextLevelOfCare) {
        options.push({
          id: 'nextLevelOfCare',
          label: 'Next Level of Care',
          description: patient.nextLevelOfCare,
          category: 'basic'
        });
      }
  
      if (patient.nextLevelOfCareDate) {
        options.push({
          id: 'nextLevelOfCareDate',
          label: 'Next Level of Care Date',
          description: patient.nextLevelOfCareDate,
          category: 'basic'
        });
      }
      if (patient.gender) {
        options.push({
          id: 'gender',
          label: 'Gender',
          description: patient.gender,
          category: 'basic'
        })
      }
    }
    if (kipuPatientEvaluations) {
   kipuPatientEvaluations?.forEach((evaluation: KipuPatientEvaluation, index: number) => {
        if (evaluation) {
          options.push({
            id: `evaluation_${index}`,
            label: `Evaluation: ${evaluation.name || 'Unnamed'}`,
            description: evaluation.name || 'Unnamed Evaluation',
            category: 'evaluation'
          });
        }
      });
    }
      if (patientVitalSigns) {
        patientVitalSigns.forEach((vital, index) => {
          options.push({
            id: `vital_${index}`,
            label: `${vital.type}: ${vital.description} ${vital.unit}`,
            description: `${vital.description} ${vital.unit}`,
            category: 'vitals'
          });
        });
      }

      return options;
  },

  buildContextForPatient: async (patient: any, selectedContextItems: ContextItem[]): Promise<PatientContext> => {
    if (!patient) return Promise.resolve({ patientInfo: 'No patient selected' });
    
    
    const context: PatientContext = {
      patientInfo: `Patient: ${patient.firstName} ${patient.lastName}, ${patient.age} years old, ${patient.gender || 'Gender not specified'}`
    };
    
    // Initialize empty sections for selected options
    selectedContextItems.forEach((option: ContextItem) => {
      switch (option.id) {
        case 'medicalHistory':
          context.medicalHistory = 'Loading medical history...';
          break;
        case 'medications':
          context.medications = 'Loading medications...';
          break;
        case 'allergies':
          context.allergies = 'Loading allergies...';
          break;
        case 'vitalSigns':
          context.vitalSigns = [];
          break;
        case 'clinical':
          context.evaluations = [];
          break;
      }
    });
    
    return Promise.resolve(context);
  },
  
  preparePatientContext: async (patient, selectedOptions) => {
    const { setIsLoading, setError, buildContextForPatient, fetchPatientContextData } = get();
    
    setIsLoading(true);
    setError(null);
    
    // Build initial context structure
    const context = buildContextForPatient(patient, selectedOptions);
    
    if (context) {
      // Fetch actual data for each selected option
      await get().fetchPatientContextData(patient, selectedOptions);
      
      // We don't need to update document store directly
      // Just update our local context
      set({ patientContext: context });
    }
    
    setIsLoading(false);
    return context;
  },  
  
  fetchPatientContextData: async (patient, selectedOptions) => {
    const patientStore = usePatientStore.getState();
    const kipuEvaluationsStore = useKipuEvaluationsStore.getState();
    const patientId = patient.patientId;
    
    // Parallel fetching of all selected data types using the appropriate stores
    const fetchPromises = selectedOptions.map(async (option) => {
      switch (option.id) {
        case 'medicalHistory':
          // If there's a store method for medical history, call it here
          // Example: await medicalHistoryStore.fetchMedicalHistory(patientId);
          break;
        case 'medications':
          // If there's a store method for medications, call it here
          // Example: await medicationsStore.fetchMedications(patientId);
          break;
        case 'allergies':
          // If there's a store method for allergies, call it here
          // Example: await allergiesStore.fetchAllergies(patientId);
          break;
        case 'vitalSigns':
          if (patientId && patientStore.fetchPatientVitalSigns) {
            await patientStore.fetchPatientVitalSigns(patientId);
          }
          break;
        case 'evaluations':
          if (patientId && kipuEvaluationsStore.fetchPatientEvaluations) {
            await kipuEvaluationsStore.fetchPatientEvaluations(patientId);
          }
          break;
      }
    });
    
    // Wait for all data to be fetched
    await Promise.all(fetchPromises);
    
    // Now update the context with the actual data from the stores
    const context = get().patientContext;
    if (context) {
      // Update context with actual data from the stores
      // This would format the data from the stores into readable text
      
      set({ patientContext: context });
    }
  },
  clearContextStore: () => {
    set({
      selectedContextItems: defaultContextCategories[0].items.filter(item => item.selected),
      patientContext: null,
      isLoading: false,
      error: null
    });
  },
}));