//lib/forms/DynamicForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  formDefinitions,
  FormDefinition,
  FormSection,
  FormField,
} from '@/lib/forms/formDefinitions';
import { chatStore } from '@/store/chatStore';
import { useNewStreamingStore } from '@/store/newStreamStore';

interface DynamicFormProps {
  formKey: string;
}

const DynamicForm: React.FC<DynamicFormProps> = ({ formKey }) => {
  const [notFoundReported, setNotFoundReported] = useState(false);
  const form: FormDefinition | undefined = formDefinitions[formKey];
  
  // Initialize local state for form inputs.
  const [formData, setFormData] = useState<Record<string, any>>({
    // For the fallback form, pre-fill the requested form name
    requestedForm: !form ? formKey : undefined
  });

  // Log missing form definitions to help troubleshoot
  useEffect(() => {
    if (!form && !notFoundReported) {
      console.warn(`[DynamicForm] Form definition not found for key: "${formKey}". Using fallback form.`);
      setNotFoundReported(true);
    }
  }, [form, formKey, notFoundReported]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const updatedValue =
      type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev: Record<string, any>) => ({ ...prev, [name]: updatedValue }));
  };
  
  const activeForm = form

  return (
    <form className="dynamic-form">
      <h2>{activeForm.title}</h2>
      {!form && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
          <p className="font-medium">Form not found: "{formKey}"</p>
          <p className="text-sm">Please provide details about what this form should contain to help us create it.</p>
        </div>
      )}
      {activeForm.sections.map((section: FormSection, index: number) => (
        <fieldset key={index} className="form-section">
          <legend>{section.title}</legend>
          {section.fields.map((field: FormField, fieldIndex: number) => (
            <div key={fieldIndex} className="form-group">
              <label htmlFor={field.name}>{field.label}</label>
              {field.type === 'textarea' ? (
                <textarea
                  id={field.name}
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleChange}
                />
              ) : field.type === 'select' ? (
                <select 
                  id={field.name} 
                  name={field.name} 
                  value={formData[field.name] || ''}
                  onChange={handleChange}
                >
                  <option value="">Select an option</option>
                  {field.options?.map((option: string, idx: number) => (
                    <option key={idx} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <input
                  type="checkbox"
                  id={field.name}
                  name={field.name}
                  checked={formData[field.name] || false}
                  onChange={handleChange}
                />
              ) : field.type === 'date' ? (
                <input
                  type="date"
                  id={field.name}
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleChange}
                />
              ) : field.type === 'signature' ? (
                <div className="signature-input">
                  <input
                    type="text"
                    id={field.name}
                    name={field.name}
                    placeholder="Type name here to sign"
                    value={formData[field.name] || ''}
                    onChange={handleChange}
                  />
                </div>
              ) : (
                <input
                  type={field.type}
                  id={field.name}
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleChange}
                />
              )}
            </div>
          ))}
        </fieldset>
      ))}
      {/* Submit button would normally go here */}
      <div className="form-actions">
        <button type="button" className="btn btn-primary">
          Submit
        </button>
      </div>
    </form>
  );
};

export default DynamicForm;
