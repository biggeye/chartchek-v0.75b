// components/dynamicForms/patientEvaluations/PatientEvaluationDocument/index.tsx
import { useState } from 'react';
import ActionBar from './ActionBar';
import DocumentView from '../../../../lib/DocumentView';
import PDFPreview from '@/components/dynamicForms/pdf/PDFPreview';
import { useStreamStore } from '@/store/streamStore';

interface EvaluationItem {
  id: number;
  fieldType: string;
  label: string;
  dividerBelow: boolean;
  value?: string | null;
  [key: string]: any;
}

interface Props {
  items: EvaluationItem[] | any[];
  title?: string;
}

const KipuPatientEvaluationDocument = ({ items, title }: Props) => {
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const pdfPreviewUrl = useStreamStore((state) => state.pdfPreviewUrl);
 console.log(items);

return (
  <div className="overflow-hidden bg-gray-50 sm:rounded-lg">
    <ActionBar
      title={title || "Patient Evaluation"}
      showPdfPreview={showPdfPreview}
      setShowPdfPreview={setShowPdfPreview}
      items={items}
    />

    <div className="overflow-hidden bg-gray-50 sm:rounded-lg">
      {showPdfPreview && pdfPreviewUrl ? (

        <PDFPreview />

      ) : (

        <DocumentView evaluationItems={items} />
      )}
    </div>
  </div>
);
}

export default KipuPatientEvaluationDocument;
