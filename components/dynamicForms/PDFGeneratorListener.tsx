'use client';

import React, { useEffect, useCallback } from 'react';
import { useStreamStore } from '@/store/chat/streamStore';
import { useDocumentStore } from '@/store/doc/documentStore';
import { generatePDF, FormType } from '@/lib/forms/pdfGenerator';
import PDFGenerationIndicator from '@/components/ui/PDFGenerationIndicator';

export const PDFGeneratorListener = () => {
  // Minimize store dependencies by selecting only what's needed
  const {
    formData,
    isFormProcessing,
    setStreamError,
    setPdfPreviewUrl,
    setIsStreamingActive
  } = useStreamStore();

  // Get only the uploadDocument function from documentStore
  const { uploadDocument } = useDocumentStore();

  // Memoize the PDF processing function to prevent it from changing on every render
  const processPDF = useCallback(async () => {
    if (!formData || Object.keys(formData).length === 0) {
      console.log('[PDFGeneratorListener] No form data available, skipping PDF generation');
      return null;
    }

    console.log('[PDFGeneratorListener] Processing PDF with form data:', formData);

    try {
      // Prepare the form data structure
      const pdfFormData = {
        type: formData.type as FormType,
        data: formData.data || formData
      };
      
      console.log('[PDFGeneratorListener] Prepared form data for PDF generation:', pdfFormData);
      
      // Generate and upload the PDF
      const result = await generatePDF(
        pdfFormData
      );

      if (result?.url) {
        setPdfPreviewUrl(result.url);
        console.log('[PDFGeneratorListener] PDF generated successfully');
        return result.url;
      }
    } catch (error) {
      console.error('[PDFGeneratorListener] Error:', error);
      setStreamError(error instanceof Error ? error.message : 'Error generating PDF');
      setIsStreamingActive(false);
    }
    return null;
  }, [formData, uploadDocument, setPdfPreviewUrl, setStreamError, setIsStreamingActive]);

  useEffect(() => {
    // Skip processing if conditions aren't met
    if (!isFormProcessing || !formData || Object.keys(formData).length === 0) {
      return;
    }

    let pdfUrl: string | null = null;

    // Process the PDF and store the URL
    processPDF().then(url => {
      pdfUrl = url;
    });

    // Cleanup function
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      setPdfPreviewUrl(null);
    };
  }, [isFormProcessing, processPDF]);

  // Return the loading indicator component
  return <PDFGenerationIndicator />;
};
