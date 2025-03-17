// types/pdf/patientintake.ts

export type PatientIntake = {
  patient: {
    fullName: string;
    dob: string;
    address: string;
    phone: string;
    email: string;
    emergencyContact: string;
    medications: string;
    allergies: string;
    diagnoses: string;
    symptoms: string[];
  };
};
