import { FormDefinition } from './formDefinitions';

/**
 * Creates a fallback form definition for an unknown form key
 * This allows graceful handling of cases where the assistant requests
 * a form that doesn't exist in the system yet
 * 
 * @param formKey The requested form key that wasn't found
 * @returns A FormDefinition object with fields for capturing form requirements
 */
export const createFallbackForm = (formKey: string): FormDefinition => {
  return {
    title: `Form Request: ${formKey}`,
    sections: [
      {
        title: "Form Information",
        fields: [
          { 
            label: "Requested Form", 
            type: "text", 
            name: "requestedForm"
          },
          { 
            label: "Description (What this form should contain)", 
            type: "textarea", 
            name: "formDescription"
          }
        ]
      },
      {
        title: "Form Structure",
        fields: [
          {
            label: "Form Sections",
            type: "textarea",
            name: "formSections"
          },
          {
            label: "Suggested Fields",
            type: "textarea",
            name: "suggestedFields"
          }
        ]
      },
      {
        title: "Form Submission",
        fields: [
          {
            label: "Notes",
            type: "textarea",
            name: "notes"
          },
          {
            label: "Priority",
            type: "select",
            name: "priority",
            options: ["Low", "Medium", "High", "Urgent"]
          }
        ]
      }
    ]
  };
};
