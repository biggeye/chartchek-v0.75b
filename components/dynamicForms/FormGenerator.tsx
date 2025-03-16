'use client';

import React, { useEffect } from 'react';
import { useStreamStore } from '@/store/streamStore';
import { useDocumentStore } from '@/store/documentStore';
import { generateAndUploadPDF, cleanupPDFUrl } from '@/lib/services/functions/forms/pdfGenerator';
import { BioPsychSocialAssessment } from '@/types/pdf/biopsychsocialassessment';

export default function PDFAutoGenerator() {
  const {
    formData,
    isFormProcessing,
    setStreamError,
    setPdfPreviewUrl,
    setIsStreamingActive
  } = useStreamStore();

  const { uploadDocument } = useDocumentStore();

  useEffect(() => {
    if (!isFormProcessing || !formData || Object.keys(formData).length === 0) return;

    const processPDF = async () => {
      try {
        console.log('[PDFAutoGenerator] Generating and uploading PDF...');
        
        const { url, document } = await generateAndUploadPDF(
          formData as BioPsychSocialAssessment['patient'],
          uploadDocument,
          {
            onSuccess: (doc, url) => {
              setPdfPreviewUrl(url);
              console.log('[PDFAutoGenerator] PDF uploaded successfully:', doc);
            },
            onError: (error) => {
              console.error('[PDFAutoGenerator] Error processing PDF:', error);
              setStreamError(error instanceof Error ? error.message : 'Failed to generate PDF');
            },
            onComplete: () => {
              useStreamStore.setState({ isFormProcessing: false, isStreamingActive: false });
            }
          }
        );

      } catch (error) {
        console.error('[PDFAutoGenerator] PDF process error:', error);
      }
    };

    processPDF();

    return () => {
      cleanupPDFUrl(useStreamStore.getState().pdfPreviewUrl);
    };
  }, [formData, isFormProcessing, setPdfPreviewUrl, setStreamError, uploadDocument]);

  return null;
}
