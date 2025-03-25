# PDF Generation System Documentation

This document provides a comprehensive guide to the PDF generation system in the ChartChek application. It explains how to add new form types to the system and how the various components interact.

## System Overview

The PDF generation system is designed to be flexible and extensible, allowing for the easy addition of new form types. The system consists of the following components:

1. **Form Definitions**: Located in `lib/services/functions/forms/formDefinitions.ts`, these define the structure and fields for each form type.
2. **PDF Templates**: Located in `components/dynamicForms/pdf/template`, these React components define how each form type is rendered as a PDF.
3. **Type Definitions**: Located in `types/pdf`, these TypeScript interfaces define the data structure for each form type.
4. **PDF Generator**: Located in `lib/services/functions/forms/pdfGenerator.tsx`, this provides the core functionality for generating PDFs from form data.
5. **PDF Store**: Located in `store/pdfStore.ts`, this Zustand store manages the form data for all form types.
6. **API Endpoints**: Located in `app/api/pdf`, these handle PDF generation requests from the client.
7. **UI Components**: Located in `components/dynamicForms/pdf/ui`, these provide the user interface for editing form data.

## Adding a New Form Type

To add a new form type to the system, follow these steps:

### 1. Define the Form in formDefinitions.ts

First, add your new form definition to `lib/services/functions/forms/formDefinitions.ts`. This should include all the fields and sections that make up the form.

Example:
```typescript
export const newFormDefinition = {
  id: 'new_form',
  name: 'New Form',
  sections: [
    {
      id: 'section_1',
      name: 'Section 1',
      fields: [
        {
          id: 'field_1',
          name: 'Field 1',
          type: 'text',
          required: true,
        },
        // Add more fields as needed
      ],
    },
    // Add more sections as needed
  ],
};
```

### 2. Create Type Definitions

Create a new TypeScript file in the `types/pdf` directory to define the data structure for your new form type.

Example (`types/pdf/newform.ts`):
```typescript
export interface NewForm {
  patient: {
    field1: string;
    field2: string;
    // Add more fields as needed
  };
}
```

### 3. Update the FormType in pdfGenerator.tsx

Add your new form type to the `FormType` union type in `lib/services/functions/forms/pdfGenerator.tsx`:

```typescript
export type FormType = 'bio_psych_social_assessment' | 'patient_intake' | 'new_form';
```

Also, update the `FormData` type to include your new form type:

```typescript
export type FormData = 
  | { type: 'bio_psych_social_assessment', data: BioPsychSocialAssessment['patient'] }
  | { type: 'patient_intake', data: PatientIntake['patient'] }
  | { type: 'new_form', data: NewForm['patient'] };
```

### 4. Create a PDF Template

Create a new React component in the `components/dynamicForms/pdf/template` directory to define how your form should be rendered as a PDF.

Example (`components/dynamicForms/pdf/template/NewForm-template.tsx`):
```tsx
import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { NewForm } from '@/types/pdf/newform';

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  // Add more styles as needed
});

// Define the template component
interface NewFormTemplateProps {
  patientData: NewForm['patient'];
}

const NewFormTemplate: React.FC<NewFormTemplateProps> = ({ patientData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View>
        <Text>New Form</Text>
        {/* Render form fields */}
        <Text>{patientData.field1}</Text>
        <Text>{patientData.field2}</Text>
        {/* Add more fields as needed */}
      </View>
    </Page>
  </Document>
);

export default NewFormTemplate;
```

### 5. Update the PDF Generator

Update the `generatePDF` function in `lib/services/functions/forms/pdfGenerator.tsx` to handle your new form type:

```typescript
// In the renderTemplate function
const renderTemplate = (formData: FormData) => {
  switch (formData.type) {
    case 'bio_psych_social_assessment':
      return <BioPsychSocialTemplate patientData={formData.data} />;
    case 'patient_intake':
      return <PatientIntakeTemplate patientData={formData.data} />;
    case 'new_form':
      return <NewFormTemplate patientData={formData.data} />;
    default:
      throw new Error(`Unsupported form type: ${formData.type}`);
  }
};
```

### 6. Update the PDF Store

Update the `pdfStore.ts` file to include default data and handling for your new form type:

```typescript
// Add import for your new form type
import type { NewForm } from '@/types/pdf/newform';

// Add type definition
type NewFormData = NewForm['patient'];

// Update FormDataType
export type FormDataType = BPSAData | PatientIntakeData | NewFormData;

// Add default data
const defaultNewFormData: NewFormData = {
  field1: '',
  field2: '',
  // Initialize all fields with default values
};

// Update the store state interface
interface PDFStore {
  // ...existing properties
  formData: {
    bio_psych_social_assessment: BPSAData;
    patient_intake: PatientIntakeData;
    new_form: NewFormData;
  };
  // ...existing methods
}

// Update the store initialization
export const usePDFStore = create<PDFStore>((set, get) => ({
  // ...existing properties
  formData: {
    bio_psych_social_assessment: defaultBPSAData,
    patient_intake: defaultPatientIntakeData,
    new_form: defaultNewFormData,
  },
  // ...existing methods
}));
```

### 7. Update the API Endpoint

Ensure the API endpoint in `app/api/pdf/generate/route.tsx` can handle your new form type:

```typescript
// Add your new form type to the validation
if (!formType || !['bio_psych_social_assessment', 'patient_intake', 'new_form'].includes(formType)) {
  return NextResponse.json(
    { error: 'Invalid form type. Must be one of: bio_psych_social_assessment, patient_intake, new_form' },
    { status: 400 }
  );
}

// Add filename generation for your new form type
if (formType === 'new_form') {
  const identifier = formData.field1 || 'Document';
  filename = `NewForm_${identifier}.pdf`;
}
```

### 8. Create a Form UI Component (Optional)

Create a new React component in the `components/dynamicForms/pdf/ui` directory to provide a user interface for editing your form data:

Example (`components/dynamicForms/pdf/ui/NewForm-form.tsx`):
```tsx
import React from 'react';
import { usePDFStore } from '@/store/pdfStore';

const NewFormForm: React.FC = () => {
  const { formData, updateFormData } = usePDFStore();
  const newFormData = formData.new_form;

  const handleChange = (field: string, value: string) => {
    updateFormData('new_form', field, value);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">New Form</h2>
      
      <div className="form-control">
        <label className="label">
          <span className="label-text">Field 1</span>
        </label>
        <input
          type="text"
          className="input input-bordered"
          value={newFormData.field1}
          onChange={(e) => handleChange('field1', e.target.value)}
        />
      </div>
      
      <div className="form-control">
        <label className="label">
          <span className="label-text">Field 2</span>
        </label>
        <input
          type="text"
          className="input input-bordered"
          value={newFormData.field2}
          onChange={(e) => handleChange('field2', e.target.value)}
        />
      </div>
      
      {/* Add more form fields as needed */}
    </div>
  );
};

export default NewFormForm;
```

### 9. Update the PDFGeneratorPage

Update the `app/protected/documents/pdf/page.tsx` file to include your new form type in the dropdown and form rendering:

```typescript
// Add mapping for your new form type
const formTypeToDisplayName: Record<FormType, string> = {
  'bio_psych_social_assessment': 'BioPsychSocial Assessment',
  'patient_intake': 'Patient Intake Form',
  'new_form': 'New Form'
};

const formTypeToFileName: Record<FormType, string> = {
  'bio_psych_social_assessment': 'BioPsychSocialAssessment.pdf',
  'patient_intake': 'PatientIntakeForm.pdf',
  'new_form': 'NewForm.pdf'
};

// Update the renderFormUI function
const renderFormUI = () => {
  switch (activeFormType) {
    case 'bio_psych_social_assessment':
      return <BioPsychSocialAssessmentForm />;
    case 'patient_intake':
      return <PatientIntakeForm />;
    case 'new_form':
      return <NewFormForm />;
    default:
      return <BioPsychSocialAssessmentForm />;
  }
};

// Add your new form type to the dropdown
<select 
  className="select select-bordered"
  value={activeFormType}
  onChange={(e) => {
    const newFormType = e.target.value as FormType;
    setFormType(newFormType);
    router.push(`?formType=${newFormType}`);
  }}
>
  <option value="bio_psych_social_assessment">BioPsychSocial Assessment</option>
  <option value="patient_intake">Patient Intake Form</option>
  <option value="new_form">New Form</option>
</select>
```

## Testing Your New Form Type

After completing the steps above, you should be able to:

1. Select your new form type from the dropdown in the PDF Generator page
2. Fill out the form using the UI component
3. View and download the generated PDF
4. Access the form via the API endpoint

## Troubleshooting

If you encounter issues with your new form type, check the following:

1. Ensure all imports are correct and point to the right files
2. Verify that all type definitions match the actual data structure
3. Check that the PDF template is correctly rendering all fields
4. Confirm that the form UI component is correctly updating the store
5. Test the API endpoint directly to ensure it's handling your form type correctly

## Best Practices

1. **Keep Templates Simple**: PDF templates should focus on layout and presentation, not complex logic
2. **Use Consistent Naming**: Follow the established naming conventions for files and components
3. **Type Safety**: Ensure all data structures are properly typed to catch errors early
4. **Test Thoroughly**: Test your new form type with various data inputs to ensure it handles all cases correctly
5. **Document Your Changes**: Update this documentation if you make significant changes to the system architecture
