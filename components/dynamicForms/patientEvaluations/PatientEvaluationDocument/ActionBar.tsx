// components/dynamicForms/patientEvaluations/PatientEvaluationDocument/ActionBar.tsx
import { Button } from '@/components/ui/button';
import { FileText, Eye, ArrowLeft } from 'lucide-react';
import { useStreamStore } from '@/store/streamStore';
import { generatePDF } from '@/lib/forms/pdfGenerator';
import { useState } from 'react';

interface ActionBarProps {
  title: string;
  showPdfPreview: boolean;
  setShowPdfPreview: (state: boolean) => void;
  items: any[]; 
}

export default function ActionBar({ title, showPdfPreview, setShowPdfPreview, items }: ActionBarProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const pdfPreviewUrl = useStreamStore(state => state.pdfPreviewUrl);
  const setPdfPreviewUrl = useStreamStore(state => state.setPdfPreviewUrl);

  const handleGeneratePDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const formData = {
        type: 'PatientEvaluation' as const,
        data: { 
          title,
          items 
        }
      };
      const { url } = await generatePDF(formData);
      setPdfPreviewUrl(url);
      setShowPdfPreview(true);
    } catch (error) {
      console.error('PDF generation error:', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const toggleView = () => setShowPdfPreview(!showPdfPreview);

  return (
    <div className="sticky top-0 z-50 bg-white py-2 shadow-sm mb-6">
      <div className="max-w-7xl mx-auto px-2 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <div className="flex gap-2">
          <Button
            outline
            className="flex items-center gap-2 text-base px-4 py-2 shadow-md text-gray-800 border-gray-300 bg-white"
            onClick={handleGeneratePDF}
            disabled={isGeneratingPdf}
          >
            <FileText className="h-5 w-5 text-gray-800" />
            {isGeneratingPdf ? 'Generating...' : 'Generate PDF'}
          </Button>

          {pdfPreviewUrl && (
            <Button
              outline
              className="flex items-center gap-2 text-base px-4 py-2 shadow-md text-gray-800 border-gray-300 bg-white"
              onClick={toggleView}
            >
              {showPdfPreview ? (
                <>
                  <ArrowLeft className="h-5 w-5 text-gray-800" />
                  Back to Document
                </>
              ) : (
                <>
                  <Eye className="h-5 w-5 text-gray-800" />
                  View PDF
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
