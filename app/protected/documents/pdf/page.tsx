'use client';
import { useState } from 'react';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import BioPsychSocialTemplate from '@/components/dynamicForms/pdf/template/BioPsychSocialAssessment-template';
import PatientIntakeTemplate from '@/components/dynamicForms/pdf/template/PatientIntakeForm-template';
import { usePDFStore } from '@/store/pdfStore';
import BioPsychSocialAssessmentForm from '@/components/dynamicForms/pdf/ui/BPSA-form';
import { FormType } from '@/lib/services/functions/pdfGenerator';
import { useRouter, useSearchParams } from 'next/navigation';

// Form type to display name mapping
const formTypeToDisplayName: Record<FormType, string> = {
  'bio_psych_social_assessment': 'BioPsychSocial Assessment',
  'patient_intake': 'Patient Intake Form'
};

// Form type to file name mapping
const formTypeToFileName: Record<FormType, string> = {
  'bio_psych_social_assessment': 'BioPsychSocialAssessment.pdf',
  'patient_intake': 'PatientIntakeForm.pdf'
};

export default function PDFGeneratorPage() {
  const { currentFormType, formData, setFormType, getCurrentFormData } = usePDFStore();
  const [showPDF, setShowPDF] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get form type from URL query parameter or use the current form type from the store
  const formTypeParam = searchParams.get('formType') as FormType | null;
  const activeFormType = formTypeParam || currentFormType;
  
  // Set the form type in the store if it's different from the current form type
  if (formTypeParam && formTypeParam !== currentFormType) {
    setFormType(formTypeParam);
  }
  
  // Get the current form data
  const currentFormData = getCurrentFormData();
  
  // Function to render the appropriate template based on form type
  const renderPDFTemplate = () => {
    switch (activeFormType) {
      case 'bio_psych_social_assessment':
        return <BioPsychSocialTemplate patientData={formData.bio_psych_social_assessment} />;
      case 'patient_intake':
        return <PatientIntakeTemplate patientData={formData.patient_intake} />;
      default:
        return <BioPsychSocialTemplate patientData={formData.bio_psych_social_assessment} />;
    }
  };
  
  // Function to render the appropriate form UI based on form type
  const renderFormUI = () => {
    switch (activeFormType) {
      case 'bio_psych_social_assessment':
        return <BioPsychSocialAssessmentForm />;
      case 'patient_intake':
        // TODO: Create and import PatientIntakeForm component
        return <div className="p-4 bg-gray-100 rounded">
          <h2 className="text-lg font-semibold mb-4">Patient Intake Form</h2>
          <p className="text-gray-600">
            Patient Intake Form UI will be implemented here.
            For now, you can view the PDF preview to see the form template.
          </p>
        </div>;
      default:
        return <BioPsychSocialAssessmentForm />;
    }
  };
  
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">{formTypeToDisplayName[activeFormType]}</h1>
      
      <div className="flex justify-between mb-4">
        <div className="flex space-x-2">
          <select 
            className="select select-bordered"
            value={activeFormType}
            onChange={(e) => {
              const newFormType = e.target.value as FormType;
              setFormType(newFormType);
              router.push(`?formType=${newFormType}`);
            }}
          >
            <option value="bio_psych_social_assessment">BioPsychSocial Assessment</option>
            <option value="patient_intake">Patient Intake Form</option>
          </select>
        </div>
        
        <button
          className="btn btn-primary"
          onClick={() => setShowPDF(!showPDF)}
        >
          {showPDF ? 'Edit Form' : 'View PDF'}
        </button>
      </div>
      
      {showPDF ? (
        <>
          <PDFViewer width="100%" height="600px">
            {renderPDFTemplate()}
          </PDFViewer>

          <div className="mt-4">
            <PDFDownloadLink
              document={renderPDFTemplate()}
              fileName={formTypeToFileName[activeFormType]}
              className="btn btn-primary"
            >
              {({ loading }) => (loading ? 'Generating...' : 'Download PDF')}
            </PDFDownloadLink>
          </div>
        </>
      ) : (
        <>
          {renderFormUI()}
        </>
      )}
    </div>
  );
}
