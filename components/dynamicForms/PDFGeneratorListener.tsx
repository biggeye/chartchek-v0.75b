'use client';

import React, { useEffect, useCallback } from 'react';
import { useStreamStore } from '@/store/streamStore';
import { useDocumentStore } from '@/store/documentStore';
import { generateAndUploadPDF, FormType } from '@/lib/services/functions/pdfGenerator';

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
      return null;
    }

    try {
      // Simplify the form data preparation
      const result = await generateAndUploadPDF(
        {
          type: formData.type as FormType,
          data: formData
        },
        uploadDocument,
        {
          // Use callbacks for cleaner flow control
          onComplete: () => setIsStreamingActive(false)
        }
      );

      if (result?.document && result.url) {
        setPdfPreviewUrl(result.url);
        console.log('[PDF Listener] PDF uploaded successfully');
        return result.url;
      }
    } catch (error) {
      console.error('[PDFGeneratorListener] Error:', error);
      setStreamError(error instanceof Error ? error.message : 'Error generating PDF');
      setIsStreamingActive(false);
    }
    return null;
  }, [formData, uploadDocument]);

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

  // No UI rendering needed
  return null;
};
