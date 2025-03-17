// store/pdfStore.ts
import { create } from 'zustand';
import type { BioPsychSocialAssessment } from '@/types/pdf/biopsychsocialassessment';
import type { PatientIntake } from '@/types/pdf/patientintake';
import { FormType } from '@/lib/services/functions/pdfGenerator';

// Define the different form data types
type BPSAData = BioPsychSocialAssessment['patient'];
type PatientIntakeData = PatientIntake['patient'];

// Define a union type for all form data types
export type FormDataType = BPSAData | PatientIntakeData;

// Define the store state
interface PDFStore {
  // Current form type
  currentFormType: FormType;
  // Form data for each form type
  formData: {
    bio_psych_social_assessment: BPSAData;
    patient_intake: PatientIntakeData;
  };
  // Legacy data field for backward compatibility
  data: BPSAData;
  // Actions
  setFormType: (formType: FormType) => void;
  updateFormData: <T extends FormType>(formType: T, field: string, value: any) => void;
  updateData: (field: keyof BPSAData, value: string) => void; // Legacy method
  resetFormData: (formType?: FormType) => void;
  resetData: () => void; // Legacy method
  // Selectors
  getCurrentFormData: () => FormDataType;
}

// Default data for each form type
const defaultBPSAData: BPSAData = {
  firstName: '',
  lastName: '',
  assessmentDate: '',
  clinicianName: '',
  dateOfBirth: '',
  gender: '',
  presentingProblem: '',
  psychiatricHistory: '',
  medicalHistory: '',
  socialHistory: '',
  substanceUseHistory: '',
  legalHistory: '',
  employmentStatus: '',
  educationalHistory: '',
  familyDynamics: '',
};

const defaultPatientIntakeData: PatientIntakeData = {
  fullName: '',
  dob: '',
  address: '',
  phone: '',
  email: '',
  emergencyContact: '',
  medications: '',
  allergies: '',
  diagnoses: '',
  symptoms: [],
};

// Create the store
export const usePDFStore = create<PDFStore>((set, get) => ({
  // Default to the BioPsychSocial Assessment form type
  currentFormType: 'bio_psych_social_assessment',
  
  // Initialize form data with defaults
  formData: {
    bio_psych_social_assessment: defaultBPSAData,
    patient_intake: defaultPatientIntakeData,
  },
  
  // Legacy data field for backward compatibility
  data: defaultBPSAData,
  
  // Set the current form type
  setFormType: (formType) => set({ currentFormType: formType }),
  
  // Update form data for a specific form type
  updateFormData: <T extends FormType>(formType: T, field: string, value: any) => set((state) => {
    // Create a new form data object with the updated field
    const updatedFormData = {
      ...state.formData,
      [formType]: {
        ...(state.formData[formType as keyof typeof state.formData] || {}),
        [field]: value,
      },
    };
    
    // If the current form type is bio_psych_social_assessment, also update the legacy data field
    const updatedData = formType === 'bio_psych_social_assessment' 
      ? { ...state.data, [field]: value }
      : state.data;
    
    return {
      formData: updatedFormData,
      data: updatedData,
    };
  }),
  
  // Legacy method for updating the BioPsychSocial Assessment data
  updateData: (field, value) => set((state) => {
    // Update both the legacy data field and the form data
    return {
      data: { ...state.data, [field]: value },
      formData: {
        ...state.formData,
        bio_psych_social_assessment: {
          ...state.formData.bio_psych_social_assessment,
          [field]: value,
        },
      },
    };
  }),
  
  // Reset form data for a specific form type or all form types
  resetFormData: (formType) => set((state) => {
    if (formType) {
      // Reset only the specified form type
      const updatedFormData = {
        ...state.formData,
        [formType]: formType === 'bio_psych_social_assessment' 
          ? defaultBPSAData 
          : defaultPatientIntakeData,
      };
      
      // If resetting bio_psych_social_assessment, also reset the legacy data field
      const updatedData = formType === 'bio_psych_social_assessment' 
        ? defaultBPSAData 
        : state.data;
      
      return {
        formData: updatedFormData,
        data: updatedData,
      };
    } else {
      // Reset all form types
      return {
        formData: {
          bio_psych_social_assessment: defaultBPSAData,
          patient_intake: defaultPatientIntakeData,
        },
        data: defaultBPSAData,
      };
    }
  }),
  
  // Legacy method for resetting the BioPsychSocial Assessment data
  resetData: () => set((state) => ({
    data: defaultBPSAData,
    formData: {
      ...state.formData,
      bio_psych_social_assessment: defaultBPSAData,
    },
  })),
  
  // Get the current form data based on the current form type
  getCurrentFormData: () => {
    const { currentFormType, formData } = get();
    return formData[currentFormType as keyof typeof formData] || {};
  },
}));
