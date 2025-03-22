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
    console.log(`[pdfGenerator] Generating PDF for form type: ${formData.type}`, formData);
    
    const templateModule = await import(
      `@/components/dynamicForms/pdf/template/${toPascalCase(formData.type)}-template`
    );
    const TemplateComponent = templateModule.default;

    // Process form data if it's an array (from the OpenAI tool call)
    let processedData = formData.data;
    
    if (Array.isArray(processedData)) {
      console.log('[pdfGenerator] Form data is an array, processing...');
      const dataObject: Record<string, any> = {};
      
      // Convert array of field objects to a key-value object
      processedData.forEach((field: any) => {
        // Check for different possible structures
        if (field.name && field.value !== undefined) {
          dataObject[field.name] = field.value;
        } else if (field.label && field.value !== undefined) {
          // Some arrays might use label instead of name
          const fieldName = field.name || field.label.toLowerCase().replace(/\s+/g, '');
          dataObject[fieldName] = field.value;
        } else if (typeof field === 'object') {
          // If it's an object with direct key-value pairs
          Object.keys(field).forEach(key => {
            if (key !== 'type' && key !== 'label') {
              dataObject[key] = field[key];
            }
          });
        }
      });
      
      processedData = dataObject;
      console.log('[pdfGenerator] Processed form data:', processedData);
    }

    // Pass the processed data to the template
    const pdfBlob = await pdf(<TemplateComponent formData={processedData} />).toBlob();
    const pdfURL = URL.createObjectURL(pdfBlob);

    console.log(`[pdfGenerator] PDF generated successfully for form: ${formData.type}`);
    return { blob: pdfBlob, url: pdfURL };

  } catch (error) {
    console.error(`[pdfGenerator] Error generating PDF:`, error);
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
