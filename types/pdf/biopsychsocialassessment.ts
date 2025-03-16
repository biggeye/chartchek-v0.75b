// types/pdf/biopsychsocialassessment.ts

export type BioPsychSocialAssessment = {
  patient: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    presentingProblem: string;
    psychiatricHistory: string;
    medicalHistory: string;
    socialHistory: string;
    substanceUseHistory: string;
    legalHistory: string;
    employmentStatus: string;
    educationalHistory: string;
    familyDynamics?: string;
    assessmentDate: string;
    clinicianName: string;
  };
};