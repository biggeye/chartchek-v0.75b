// lib/services/functions/pdfGenerator.tsx
import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { Document } from '@/types/store/document';
import { formDefinitions } from '@/lib/forms/formDefinitions';

// Generalized Types
export type FormType = keyof typeof formDefinitions;

export interface FormData {
  type: FormType;
  data: Record<string, any>;
}

// Universal PDF generator
export const generatePDF = async (formData: FormData): Promise<{ blob: Blob; url: string }> => {
  try {
    const templateModule = await import(
      `@/components/dynamicForms/pdf/template/${toPascalCase(formData.type)}-template`
    );
    const TemplateComponent = templateModule.default;

    const pdfBlob = await pdf(<TemplateComponent formData={formData.data} />).toBlob();
    const pdfURL = URL.createObjectURL(pdfBlob);

    console.log(`[pdfGenerator] PDF generated for form: ${formData.type}`);
    return { blob: pdfBlob, url: pdfURL };

  } catch (error) {
    console.error(`[pdfGenerator] Error generating PDF: ${(error as Error).message}`);
    throw error;
  }
};

// Upload PDF (Simplified)
export const generateAndUploadPDF = async (
  formData: FormData,
  uploadDocument: (file: File) => Promise<Document | null>,
  callbacks?: {
    onSuccess?: (document: Document, url: string) => void;
    onError?: (error: Error) => void;
    onComplete?: () => void;
  }
) => {
  try {
    const { blob, url } = await generatePDF(formData);
    const filename = getFileNameForFormType(formData);
    const file = new File([blob], filename, { type: 'application/pdf' });

    const document = await uploadDocument(file);
    if (!document) throw new Error("Upload failed");

    callbacks?.onSuccess?.(document, url);
    return { blob, url, document };

  } catch (error) {
    const typedError = error instanceof Error ? error : new Error(String(error));
    callbacks?.onError?.(typedError);
    throw typedError;
  } finally {
    callbacks?.onComplete?.();
  }
};

const getFileNameForFormType = (formData: FormData) =>
  `${formData.type}/${formData.type}-${Date.now()}.pdf`;

const toPascalCase = (str: string) =>
  str.replace(/(^\w|_\w)/g, s => s.replace('_', '').toUpperCase());
