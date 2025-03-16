'use client';

import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import BioPsychSocialTemplate from '@/components/dynamicForms/pdf/biopsychsocialassessment-template';
import { BioPsychSocialAssessment } from '@/types/pdf/biopsychsocialassessment';

interface GenerateBioPsychProps {
  patientData: BioPsychSocialAssessment['patient'];
}

export default function GenerateBioPsychPDFButton({ patientData }: GenerateBioPsychProps) {
  const handleGeneratePDF = async () => {
    try {
      // Create the React element
      const doc = <BioPsychSocialTemplate patientData={patientData} />;
      
      // Generate the PDF blob in-browser
      const blob = await ReactPDF.pdf(doc).toBlob();
      
      // Create object URL to display or download
      const pdfURL = URL.createObjectURL(blob);
      
      // For immediate preview in a new tab:
      window.open(pdfURL, '_blank');
      
      // Or, if you want to download directly:
      // const link = document.createElement('a');
      // link.href = pdfURL;
      // link.download = `BioPsychSocial_${patientData.firstName}_${patientData.lastName}.pdf`;
      // document.body.appendChild(link);
      // link.click();
      // document.body.removeChild(link);
      
      // Clean up the URL object when done
      // setTimeout(() => URL.revokeObjectURL(pdfURL), 100);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <button
      onClick={handleGeneratePDF}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
    >
      Download PDF
    </button>
  );
}
