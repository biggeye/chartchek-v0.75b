'use client';
import { useState } from 'react';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import BioPsychSocialTemplate from '@/components/dynamicForms/pdf/biopsychsocialassessment-template';
import { usePDFStore } from '@/store/pdfStore';
import BioPsychSocialAssessmentForm from '@/components/dynamicForms/pdf/BioPsychSocialAssessment-form';

export default function PDFGeneratorPage() {
  const { data } = usePDFStore();
  const [showPDF, setShowPDF] = useState(false);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">BioPsychSocial Assessment</h1>
      <div className="flex justify-end">
        <button
          className="btn btn-primary"
          onClick={() => setShowPDF(!showPDF)}
        >
          {showPDF ? 'Edit' : 'View PDF'}
        </button>
      </div>
{showPDF ? (<><PDFViewer width="100%" height="600px">
        <BioPsychSocialTemplate patientData={data} />
      </PDFViewer>

      <div className="mt-4">
        <PDFDownloadLink
          document={<BioPsychSocialTemplate patientData={data} />}
          fileName="BioPsychSocialAssessment.pdf"
          className="btn btn-primary"
        >
          {({ loading }) => (loading ? 'Generating...' : 'Download PDF')}
        </PDFDownloadLink>
      </div></>) : (
        <>
        <BioPsychSocialAssessmentForm />
        </>
      )}
      
    </div>
  );
}
