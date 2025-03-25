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
    <div className="relative">
      <ActionBar
        title={title}
        showPdfPreview={showPdfPreview}
        setShowPdfPreview={setShowPdfPreview}
        items={items}
      />

      <div className="max-w-7xl mx-auto px-2 pb-10">
        {showPdfPreview && pdfPreviewUrl ? (
          <div className="p-6 bg-white rounded-2xl shadow-lg">
            <PDFPreview />
          </div>
        ) : (
          <DocumentView items={items} />
        )}
      </div>
    </div>
  );
}

export default KipuPatientEvaluationDocument;
