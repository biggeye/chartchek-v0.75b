// components/dynamicForms/patientEvaluations/PatientEvaluationDocument/index.tsx
import { useState } from 'react';
import ActionBar from './ActionBar';
import DocumentView from './DocumentView';
import PDFPreview from '@/components/dynamicForms/pdf/PDFPreview';
import { useStreamStore } from '@/store/streamStore';

interface EvaluationItem {
  id: number;
  field_type: string;
  label: string;
  divider_below: boolean;
  value?: string | null;
  [key: string]: any;
}

interface Props {
  items: EvaluationItem[];
  title?: string;
}

const KipuPatientEvaluationDocument = ({ items, title = "Patient Evaluation" }: Props) => {
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const pdfPreviewUrl = useStreamStore((state) => state.pdfPreviewUrl);
 

return (
  <div className="overflow-hidden bg-gray-50 sm:rounded-lg">
    <ActionBar
      title={title}
      showPdfPreview={showPdfPreview}
      setShowPdfPreview={setShowPdfPreview}
      items={items}
    />

    <div className="overflow-hidden bg-gray-50 sm:rounded-lg">
      {showPdfPreview && pdfPreviewUrl ? (

        <PDFPreview />

      ) : (
        <DocumentView items={items} />
      )}
    </div>
  </div>
);
}

export default KipuPatientEvaluationDocument;
