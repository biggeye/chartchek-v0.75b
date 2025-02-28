// /lib/forms/formDefinitions.ts

export interface FormField {
  label: string;
  type: string; // e.g., "text", "textarea", "select", "radio", "checkbox", "signature"
  name: string;
  options?: string[];
}

export interface FormSection {
  title: string;
  fields: FormField[];
}

export interface FormDefinition {
  title: string;
  sections: FormSection[];
}

export const formDefinitions: Record<string, FormDefinition> = {
  application_orientation_verification: {
    title: "Application and Orientation Verification Form",
    sections: [
      {
        title: "Initial Documents Received",
        fields: [
          { label: "Application/Resume", type: "text", name: "applicationResume" },
          { label: "Confidentiality Agreement", type: "text", name: "confidentialityAgreement" },
          { label: "Competency and Orientation", type: "text", name: "competencyOrientation" },
          { label: "Criminal Background Check", type: "text", name: "criminalBackgroundCheck" },
          { label: "Drug Screen Test", type: "text", name: "drugScreenTest" },
          { label: "Professional Reference Check", type: "text", name: "professionalReferenceCheck" },
          { label: "TB Test", type: "text", name: "tbTest" }
        ]
      },
      {
        title: "Orientation Documents Provided",
        fields: [
          { label: "Signatures on Employment Agreement", type: "text", name: "employmentAgreement" },
          { label: "Signatures on Job Description", type: "text", name: "jobDescription" },
          { label: "Completed W-4", type: "text", name: "w4" },
          { label: "Completed I-9", type: "text", name: "i9" },
          { label: "Provided Two Forms of Valid ID", type: "text", name: "validID" },
          { label: "Copies of Licensure and Certifications", type: "text", name: "licensures" }
        ]
      },
      {
        title: "Licensures and Certifications Received",
        fields: [
          { label: "Licensure/Certification 1", type: "text", name: "licensure1" },
          { label: "Licensure/Certification 2", type: "text", name: "licensure2" }
        ]
      }
    ]
  },
  orientation_checklist: {
    title: "Staff Orientation Checklist",
    sections: [
      {
        title: "Initial Orientation",
        fields: [
          { label: "Employee Name", type: "text", name: "employeeName" },
          { label: "Position", type: "text", name: "position" },
          { label: "Supervisor", type: "text", name: "supervisor" },
          { label: "Orientation Date", type: "date", name: "orientationDate" }
        ]
      },
      {
        title: "Facility Orientation",
        fields: [
          { label: "Tour of Facility", type: "checkbox", name: "facilityTour" },
          { label: "Emergency Exits", type: "checkbox", name: "emergencyExits" },
          { label: "Fire Extinguisher Locations", type: "checkbox", name: "fireExtinguishers" },
          { label: "First Aid Kit Location", type: "checkbox", name: "firstAidKit" },
          { label: "Staff Break Areas", type: "checkbox", name: "breakAreas" },
          { label: "Patient Common Areas", type: "checkbox", name: "commonAreas" }
        ]
      },
      {
        title: "Administrative Orientation",
        fields: [
          { label: "Employee Handbook Review", type: "checkbox", name: "handbookReview" },
          { label: "Policies and Procedures", type: "checkbox", name: "policiesProcedures" },
          { label: "HIPAA Training", type: "checkbox", name: "hipaaTraining" },
          { label: "Safety Protocols", type: "checkbox", name: "safetyProtocols" },
          { label: "Emergency Procedures", type: "checkbox", name: "emergencyProcedures" },
          { label: "Patient Rights", type: "checkbox", name: "patientRights" }
        ]
      },
      {
        title: "Job-Specific Training",
        fields: [
          { label: "Job Description Review", type: "checkbox", name: "jobDescription" },
          { label: "Documentation Requirements", type: "checkbox", name: "documentation" },
          { label: "Medication Administration (if applicable)", type: "checkbox", name: "medication" },
          { label: "Computer Systems Training", type: "checkbox", name: "computerTraining" },
          { label: "Communication Procedures", type: "checkbox", name: "communication" }
        ]
      },
      {
        title: "Certification",
        fields: [
          { label: "Staff Signature", type: "signature", name: "staffSignature" },
          { label: "Date", type: "date", name: "signatureDate" },
          { label: "Supervisor Signature", type: "signature", name: "supervisorSignature" },
          { label: "Date", type: "date", name: "supervisorDate" }
        ]
      }
    ]
  },
  application_orientation_form: {
    title: "Application and Orientation Form",
    sections: [
      {
        title: "Applicant Information",
        fields: [
          { label: "Applicant Name", type: "text", name: "applicantName" },
          { label: "Date", type: "date", name: "applicationDate" }
        ]
      },
      {
        title: "Orientation Details",
        fields: [
          { label: "Employee Handbook/Manual", type: "checkbox", name: "handbookReceived" },
          { label: "Personnel Policies and Procedures", type: "checkbox", name: "personnelPolicies" },
          { label: "Clinical Policies and Procedures", type: "checkbox", name: "clinicalPolicies" },
          { label: "Individual Crisis Response Procedures", type: "checkbox", name: "crisisResponse" },
          { label: "Emergency Procedures", type: "checkbox", name: "emergencyProcedures" },
          { label: "Mandatory Abuse Reporting", type: "checkbox", name: "abuseReporting" },
          { label: "Population Specific Information", type: "checkbox", name: "populationInfo" },
          { label: "Harassment Policy", type: "checkbox", name: "harassmentPolicy" },
          { label: "Non-Discrimination Policy", type: "checkbox", name: "nonDiscrimination" }
        ]
      }
    ]
  },
  intake_form_hp_dolorosa: {
    title: "Intake Form HP Dolorosa",
    sections: [
      {
        title: "Client Information",
        fields: [
          { label: "Patient Name", type: "text", name: "patientName" },
          { label: "MR#", type: "text", name: "mrNumber" },
          { label: "Date of Admission", type: "date", name: "admissionDate" },
          { label: "Referral Source", type: "text", name: "referralSource" },
          { label: "Insurance", type: "text", name: "insurance" }
        ]
      },
      {
        title: "Admission Checklist",
        fields: [
          { label: "Upload ID & Insurance Card", type: "checkbox", name: "uploadID" },
          { label: "Insurance Approval", type: "checkbox", name: "insuranceApproval" },
          { label: "Approval of Admit", type: "checkbox", name: "admitApproval" },
          { label: "Notify Intake", type: "checkbox", name: "notifyIntake" },
          { label: "Set up Admit Date & Time", type: "checkbox", name: "setupAdmit" },
          { label: "Send Staff Admit Email", type: "checkbox", name: "staffAdmitEmail" },
          { label: "Create Folder", type: "checkbox", name: "createFolder" }
        ]
      },
      {
        title: "Intake Checklist (Paperwork)",
        fields: [
          { label: "Peruse Face Sheet for Accuracy", type: "checkbox", name: "faceSheet" },
          { label: "Complete Intake Paperwork with Client (Kipu)", type: "checkbox", name: "intakeKipu" },
          { label: "Complete Intake Paperwork (Hardcopy)", type: "checkbox", name: "intakeHardcopy" },
          { label: "Fill Out ROI/Intake Consent", type: "checkbox", name: "roiConsent" },
          { label: "Pharmacy Release to Wellness Staff", type: "checkbox", name: "pharmacyRelease" },
          { label: "Emergency/Safety Call", type: "checkbox", name: "safetyCall" },
          { label: "Send AOB to Notary", type: "checkbox", name: "sendAOB" },
          { label: "Update Census", type: "checkbox", name: "updateCensus" }
        ]
      }
    ]
  },
  flu_declination: {
    title: "Flu Declination Form (2021-2022)",
    sections: [
      {
        title: "Flu Declination",
        fields: [
          { label: "Reason for Declination", type: "textarea", name: "declineReason" },
          { label: "Other Reason – Please Specify", type: "textarea", name: "otherReason" },
          { label: "Print Name", type: "text", name: "printName" },
          { label: "Department", type: "text", name: "department" },
          { label: "Signature", type: "signature", name: "signature" },
          { label: "Date", type: "date", name: "date" }
        ]
      }
    ]
  },
  suspected_adr_report: {
    title: "Suspected Adverse Drug Reaction Report Form",
    sections: [
      {
        title: "Patient Information",
        fields: [
          { label: "Patient Name", type: "text", name: "patientName" },
          { label: "MR#", type: "text", name: "mrNumber" },
          { label: "MD Notified", type: "checkbox", name: "mdNotified" }
        ]
      },
      {
        title: "Reaction Details",
        fields: [
          { label: "Suspected Drugs/Dosages Involved", type: "textarea", name: "drugsInvolved" },
          { label: "Onset of Reaction", type: "text", name: "reactionOnset" },
          { label: "Allergy History", type: "textarea", name: "allergyHistory" }
        ]
      },
      {
        title: "ADR Classification",
        fields: [
          { label: "Allergic", type: "checkbox", name: "allergic" },
          { label: "Ocular", type: "checkbox", name: "ocular" },
          { label: "Neurologic", type: "checkbox", name: "neurologic" },
          { label: "Cardiovascular", type: "checkbox", name: "cardiovascular" },
          { label: "Respiratory", type: "checkbox", name: "respiratory" },
          { label: "Gastrointestinal", type: "checkbox", name: "gastrointestinal" },
          { label: "Hepatic/Renal", type: "checkbox", name: "hepaticRenal" },
          { label: "Musculoskeletal", type: "checkbox", name: "musculoskeletal" },
          { label: "Skin", type: "checkbox", name: "skin" },
          { label: "Endocrine", type: "checkbox", name: "endocrine" }
        ]
      },
      {
        title: "Actions and Review",
        fields: [
          { label: "Action Taken", type: "textarea", name: "actionTaken" },
          { label: "Review by Clinical Pharmacist", type: "textarea", name: "clinicalReview" },
          { label: "Pharmacist Signature/Date", type: "signature", name: "pharmacistSignature" },
          { label: "Physician Signature/Date", type: "signature", name: "physicianSignature" }
        ]
      }
    ]
  },
  record_voluntary_admission: {
    title: "Record of Voluntary Admission/Consent to Care & Treatment/Agreement to Comply with Medical Care",
    sections: [
      {
        title: "Admission Consent",
        fields: [
          { label: "Client Name", type: "text", name: "clientName" },
          { label: "Admission Date", type: "date", name: "admissionDate" },
          { label: "Consent Text", type: "textarea", name: "consentText" }
        ]
      },
      {
        title: "Signatures",
        fields: [
          { label: "Client Signature", type: "signature", name: "clientSignature" },
          { label: "Staff Signature", type: "signature", name: "staffSignature" },
          { label: "Date", type: "date", name: "signatureDate" }
        ]
      }
    ]
  },
  length_of_stay_acknowledgement: {
    title: "Length of Stay Acknowledgement Form",
    sections: [
      {
        title: "Acknowledgement Details",
        fields: [
          { label: "Client Name", type: "text", name: "clientName" },
          { label: "Program Name", type: "text", name: "programName" },
          { label: "Length of Stay", type: "text", name: "lengthOfStay" },
          { label: "Acknowledgement Signature", type: "signature", name: "ackSignature" },
          { label: "Date", type: "date", name: "ackDate" }
        ]
      }
    ]
  },
  intake_checklist: {
    title: "Intake Checklist",
    sections: [
      {
        title: "Pre-Admission Checklist",
        fields: [
          { label: "Peruse Face Sheet for Accuracy", type: "checkbox", name: "faceSheet" },
          { label: "Complete Intake Paperwork with Client (Kipu)", type: "checkbox", name: "paperworkKipu" },
          { label: "Complete Intake Paperwork (Hardcopy)", type: "checkbox", name: "paperworkHardcopy" },
          { label: "Fill Out ROI/Intake Consent", type: "checkbox", name: "roiConsent" },
          { label: "Pharmacy Release to Wellness Staff", type: "checkbox", name: "pharmacyRelease" },
          { label: "Emergency/Safety Call", type: "checkbox", name: "safetyCall" },
          { label: "Send AOB to Notary", type: "checkbox", name: "sendAOB" },
          { label: "Update Census", type: "checkbox", name: "updateCensus" }
        ]
      }
    ]
  },
  competency_chef: {
    title: "Competency Evaluation - Chef",
    sections: [
      {
        title: "Chef Competency Evaluation",
        fields: [
          { label: "Staff Name", type: "text", name: "staffName" },
          { label: "Hire Date", type: "date", name: "hireDate" },
          { label: "Review Date", type: "date", name: "reviewDate" },
          { label: "Task", type: "text", name: "task" },
          { label: "Competency Level", type: "select", name: "competencyLevel", options: ["Needs Improvement", "Meets Criteria", "Exceeds Criteria"] },
          { label: "Staff Signature", type: "signature", name: "staffSignature" },
          { label: "Supervisor Signature", type: "signature", name: "supervisorSignature" }
        ]
      }
    ]
  },
  competency_tech: {
    title: "Competency Evaluation - Tech",
    sections: [
      {
        title: "Tech Competency Evaluation",
        fields: [
          { label: "Staff Name", type: "text", name: "staffName" },
          { label: "Hire Date", type: "date", name: "hireDate" },
          { label: "Review Date", type: "date", name: "reviewDate" },
          { label: "Task", type: "text", name: "task" },
          { label: "Competency Level", type: "select", name: "competencyLevel", options: ["Needs Improvement", "Meets Criteria", "Exceeds Criteria"] },
          { label: "Staff Signature", type: "signature", name: "staffSignature" },
          { label: "Supervisor Signature", type: "signature", name: "supervisorSignature" }
        ]
      }
    ]
  },
  orientation_chef: {
    title: "Orientation Form - Chef",
    sections: [
      {
        title: "Orientation for Chef",
        fields: [
          { label: "Date", type: "date", name: "orientationDate" },
          { label: "Checklist Confirmed", type: "checkbox", name: "checklistConfirmed" },
          { label: "Staff Signature", type: "signature", name: "staffSignature" }
        ]
      }
    ]
  },
  orientation_counselor: {
    title: "Orientation Form - Counselor",
    sections: [
      {
        title: "Orientation for Counselor",
        fields: [
          { label: "Date", type: "date", name: "orientationDate" },
          { label: "Checklist Confirmed", type: "checkbox", name: "checklistConfirmed" },
          { label: "Staff Signature", type: "signature", name: "staffSignature" }
        ]
      }
    ]
  },
  orientation_lvn: {
    title: "Orientation Form - LVN",
    sections: [
      {
        title: "Orientation for LVN",
        fields: [
          { label: "Date", type: "date", name: "orientationDate" },
          { label: "Checklist Confirmed", type: "checkbox", name: "checklistConfirmed" },
          { label: "Staff Signature", type: "signature", name: "staffSignature" }
        ]
      }
    ]
  },
  orientation_tech: {
    title: "Orientation Form - Tech",
    sections: [
      {
        title: "Orientation for Tech",
        fields: [
          { label: "Date", type: "date", name: "orientationDate" },
          { label: "Checklist Confirmed", type: "checkbox", name: "checklistConfirmed" },
          { label: "Staff Signature", type: "signature", name: "staffSignature" }
        ]
      }
    ]
  },
  task_list_joint_commission: {
    title: "Task List - Joint Commission",
    sections: [
      {
        title: "Task List",
        fields: [
          { label: "Task Description", type: "textarea", name: "taskDescription" },
          { label: "Due Date", type: "date", name: "dueDate" },
          { label: "Status", type: "select", name: "status", options: ["Pending", "Completed", "In Progress"] }
        ]
      }
    ]
  },
  patient_intake: {
    title: "Patient Intake Form",
    sections: [
      {
        title: "Patient Information",
        fields: [
          { label: "Full Name", type: "text", name: "fullName" },
          { label: "Date of Birth", type: "text", name: "dob" },
          { label: "Address", type: "textarea", name: "address" },
          { label: "Phone Number", type: "text", name: "phone" },
          { label: "Email", type: "text", name: "email" },
          { label: "Emergency Contact", type: "text", name: "emergencyContact" }
        ]
      },
      {
        title: "Medical History",
        fields: [
          { label: "Current Medications", type: "textarea", name: "medications" },
          { label: "Allergies", type: "textarea", name: "allergies" },
          { label: "Previous Diagnoses", type: "textarea", name: "diagnoses" },
          { label: "Current Symptoms", type: "select", name: "symptoms", options: ["Depression", "Anxiety", "Mood Swings", "Sleep Issues", "Other"] }
        ]
      }
    ]
  }
};
