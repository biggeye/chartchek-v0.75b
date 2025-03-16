import { pdf } from '@react-pdf/renderer';
import { BioPsychSocialAssessment } from '../../../../types/pdf/biopsychsocialassessment';
import BioPsychSocialTemplate from '../../../../components/dynamicForms/pdf/biopsychsocialassessment-template';
import { Document } from '../../../../types/store/document';
import React from 'react';
import { useDocumentStore } from '../../../../store/documentStore';

/**
 * Generates a PDF from BioPsychSocial Assessment form data and returns the blob and URL
 * @param formData The form data to generate the PDF from
 * @returns Object containing the blob and URL for the generated PDF
 */
export const generateBioPsychSocialPDF = async (
  formData: BioPsychSocialAssessment['patient']
): Promise<{ blob: Blob; url: string }> => {
  try {
    console.log('[pdfGenerator] Generating PDF from form data:', formData);
    
    // Generate PDF - BioPsychSocialTemplate already includes the Document component
    const blob = await pdf(
      <BioPsychSocialTemplate patientData={formData} />
    ).toBlob();
    
    // Create a preview URL
    const pdfURL = URL.createObjectURL(blob);
    console.log('[pdfGenerator] PDF preview URL created');
    
    return { blob, url: pdfURL };
  } catch (error) {
    console.error('[pdfGenerator] Error generating PDF:', error);
    throw error;
  }
};

/**
 * Uploads a PDF blob to the document store
 * @param blob The PDF blob to upload
 * @param uploadDocument The document upload function from documentStore
 * @returns The uploaded document or null if upload failed
 */
export const uploadPDF = async (
  blob: Blob,
  uploadAndProcessDocument: (file: File) => Promise<Document | null>
): Promise<Document | null> => {
  try {
    // Create a file from the blob
    const file = new File([blob], `BPSA-${Date.now()}.pdf`, { type: 'application/pdf' });
    console.log('[pdfGenerator] Uploading PDF:', file);
    
    // Upload the file
    const uploadResponse = await uploadAndProcessDocument(file);
    
    if (uploadResponse !== null) {
      console.log('[pdfGenerator] PDF uploaded successfully:', uploadResponse);
      return uploadResponse;
    } else {
      console.error('[pdfGenerator] Failed to upload PDF.');
      return null;
    }
  } catch (error) {
    console.error('[pdfGenerator] Error uploading PDF:', error);
    throw error;
  }
};

/**
 * Generates and uploads a PDF from BioPsychSocial Assessment form data
 * @param formData The form data to generate the PDF from
 * @param uploadDocument The document upload function from documentStore
 * @param callbacks Optional callback functions for different stages of the process
 * @returns Object containing the blob, URL, and uploaded document
 */
export const generateAndUploadPDF = async (
  formData: BioPsychSocialAssessment['patient'],
  uploadDocument: (file: File) => Promise<Document | null>,
  callbacks?: {
    onSuccess?: (document: Document, url: string) => void;
    onError?: (error: unknown) => void;
    onComplete?: () => void;
  }
): Promise<{ blob: Blob; url: string; document: Document | null }> => {
  try {
    // Generate PDF
    const { blob, url } = await generateBioPsychSocialPDF(formData);
    
    // Upload PDF
    const document = await uploadPDF(blob, uploadDocument);
    
    // Call success callback if provided
    if (document && callbacks?.onSuccess) {
      callbacks.onSuccess(document, url);
    }
    
    return { blob, url, document };
  } catch (error) {
    // Call error callback if provided
    if (callbacks?.onError) {
      callbacks.onError(error);
    }
    throw error;
  } finally {
    // Call complete callback if provided
    if (callbacks?.onComplete) {
      callbacks.onComplete();
    }
  }
};

/**
 * Cleans up a PDF URL by revoking the object URL
 * @param url The URL to clean up
 */
export const cleanupPDFUrl = (url: string | null): void => {
  if (url) {
    URL.revokeObjectURL(url);
    console.log('[pdfGenerator] Revoked object URL');
  }
};
