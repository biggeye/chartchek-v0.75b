// lib/services/functions/pdfGenerator.tsx
import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { formDefinitions } from '@/lib/forms/formDefinitions';

export type FormType = keyof typeof formDefinitions;

export interface FormData {
  type: FormType;
  data: Record<string, any>;
}

export const generatePDF = async (formData: FormData): Promise<{ blob: Blob; url: string }> => {
  try {
    console.log(`[pdfGenerator] Generating PDF for form type: ${formData.type}`, formData);

    const templateModule = await import(
      `@/components/dynamicForms/pdf/template/${toPascalCase(formData.type)}-template`
    );
    const TemplateComponent = templateModule.default;

    let processedData = formData.data;

    // Explicit structured handling for KipuPatientEvaluation with matrix
    if (formData.type === 'PatientEvaluation') {
      processedData = {
        title: formData.data.title,
        items: formData.data.items.map((item: any) => ({
          id: item.id,
          field_type: item.field_type,
          label: item.label,
          description: item.description || null,
          value: item.value || null,
          records: item.records || null, // Preserve nested matrix records clearly
          divider_below: item.divider_below || false
        })),
      };
      console.log('[pdfGenerator] KipuPatientEvaluation structured data:', processedData);
    } else if (Array.isArray(processedData)) {
      const dataObject: Record<string, any> = {};
      processedData.forEach((field: any) => {
        if (field.name && field.value !== undefined) {
          dataObject[field.name] = field.value;
        } else if (field.label && field.value !== undefined) {
          const fieldName = field.label.toLowerCase().replace(/\s+/g, '');
          dataObject[fieldName] = field.value;
        }
      });
      processedData = dataObject;
    }

    const pdfBlob = await pdf(<TemplateComponent formData={processedData} />).toBlob();
    const pdfURL = URL.createObjectURL(pdfBlob);

    console.log(`[pdfGenerator] PDF generated successfully for form: ${formData.type}`);
    return { blob: pdfBlob, url: pdfURL };

  } catch (error) {
    console.error(`[pdfGenerator] Error generating PDF:`, error);
    throw error;
  }
};

const toPascalCase = (str: string) =>
  str.replace(/(^\w|_\w)/g, s => s.replace('_', '').toUpperCase());
