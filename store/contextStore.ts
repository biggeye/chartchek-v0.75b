// store/contextStore.ts
'use client';

import { create } from 'zustand';
import { ContextStoreState, KipuPatientEvaluation } from '@/types/store/context';
import { PatientContext, ChatContext } from '@/types/store/chat';
import { useTemplateStore } from './templateStore'; // We'll need to create this

export const useContextStore = create<ContextStoreState>((set, get) => ({
  patientContext: null,
  chatContext: null,

  // --- CONTEXT MANAGEMENT ---
  updatePatientContext: (context: PatientContext | null) => set({ patientContext: context }),
  
  updateChatContext: (context: Partial<ChatContext>) => set((state) => ({
    chatContext: {
      ...state.chatContext,
      ...context
    }
  })),

  // --- CONTEXT BUILDING ---
  buildContextFromEvaluation: (evaluation: KipuPatientEvaluation) => {
    // Basic implementation that extracts key information from the evaluation
    const context = {
      evaluationId: evaluation.id,
      evaluationType: evaluation.type,
      patientId: evaluation.patient_id,
      timestamp: evaluation.created_at,
      data: evaluation.data || {}
    };

    // We could enhance this with more sophisticated extraction logic
    return context;
  },

  buildContextFromTemplate: (evaluation: KipuPatientEvaluation, templateId: string) => {
    try {
      // Get templates from the template store
      const templates = useTemplateStore.getState().templates;
      const template = templates.find(t => t.id === templateId);

      if (!template) {
        console.warn(`Template with ID ${templateId} not found`);
        // Fall back to basic context building
        return get().buildContextFromEvaluation(evaluation);
      }

      // Use the template to extract relevant fields
      const extractedContext = {};
      
      // This is where we'd implement the template-based extraction
      // For example, if the template defines fields of interest:
      if (template.fields && Array.isArray(template.fields)) {
        template.fields.forEach(field => {
          const fieldPath = field.path;
          const value = getNestedValue(evaluation, fieldPath);
          if (value !== undefined) {
            setNestedValue(extractedContext, fieldPath, value);
          }
        });
      }

      return {
        evaluationId: evaluation.id,
        evaluationType: evaluation.type,
        templateId: templateId,
        extractedData: extractedContext
      };
    } catch (error) {
      console.error('Error building context from template:', error);
      // Fall back to basic context building
      return get().buildContextFromEvaluation(evaluation);
    }
  }
}));

// Helper function to get a nested value using a path like "data.medical.conditions[0].name"
function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    
    // Handle array indexing like "conditions[0]"
    if (part.includes('[') && part.includes(']')) {
      const [arrayName, indexStr] = part.split('[');
      const index = parseInt(indexStr.replace(']', ''));
      
      if (!current[arrayName] || !Array.isArray(current[arrayName]) || index >= current[arrayName].length) {
        return undefined;
      }
      
      current = current[arrayName][index];
    } else {
      current = current[part];
    }
  }
  
  return current;
}

// Helper function to set a nested value using a path
function setNestedValue(obj: any, path: string, value: any): void {
  const parts = path.split('.');
  let current = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    
    // Handle array indexing
    if (part.includes('[') && part.includes(']')) {
      const [arrayName, indexStr] = part.split('[');
      const index = parseInt(indexStr.replace(']', ''));
      
      if (!current[arrayName]) {
        current[arrayName] = [];
      }
      
      if (!current[arrayName][index]) {
        current[arrayName][index] = {};
      }
      
      current = current[arrayName][index];
    } else {
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
  }
  
  const lastPart = parts[parts.length - 1];
  current[lastPart] = value;
}

export default useContextStore;