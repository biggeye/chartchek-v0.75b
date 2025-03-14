// store/pdfStore.ts
import { create } from 'zustand';
import type { BioPsychSocialAssessment } from '@/types/pdf/biopsychsocialassessment';

type PatientData = BioPsychSocialAssessment['patient'];

interface PDFStore {
  data: PatientData;
  updateData: (field: keyof PatientData, value: string) => void;
  resetData: () => void;
}

const defaultData: PatientData = {
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

export const usePDFStore = create<PDFStore>((set) => ({
  data: defaultData,
  updateData: (field, value) =>
    set((state) => ({ data: { ...state.data, [field]: value } })),
  resetData: () => set({ data: defaultData }),
}));
