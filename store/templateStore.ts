// store/templateStore.ts
import { create } from 'zustand';
import { ChartChekTemplate } from '@/types/store/templates';

interface TemplateState {
  templates: ChartChekTemplate[];
  currentTemplate: ChartChekTemplate | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTemplates: () => Promise<void>;
  fetchTemplate: (id: string) => Promise<ChartChekTemplate | null>;
  createTemplate: (template: ChartChekTemplate) => Promise<void>;
  saveTemplate: (template: ChartChekTemplate) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  importKipuEvaluation: (evaluationId: string) => Promise<ChartChekTemplate>;
  setCurrentTemplate: (template: ChartChekTemplate | null) => void;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  currentTemplate: null,
  templates: [],
  isLoading: false,
  error: null,

  setCurrentTemplate: (template: ChartChekTemplate | null) => {
    set({ currentTemplate: template });
  },

  fetchTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/admin/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      set({ templates: data, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchTemplate: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/admin/templates/${id}`);
      if (!response.ok) throw new Error('Failed to fetch template');
      const template = await response.json();
      
      // Set the currentTemplate in state
      set({ 
        currentTemplate: template, 
        isLoading: false 
      });
      
      return template;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return null;
    }
  },

  createTemplate: async (template: ChartChekTemplate) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });
      if (!response.ok) throw new Error('Failed to create template');
      const newTemplate = await response.json();
      set(state => ({
        templates: [...state.templates, newTemplate],
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  saveTemplate: async (template: ChartChekTemplate) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/admin/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });
      if (!response.ok) throw new Error('Failed to update template');
      const updatedTemplate = await response.json();
      set(state => ({
        templates: state.templates.map(t =>
          t.id === updatedTemplate.id ? updatedTemplate : t
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteTemplate: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/admin/templates/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete template');
      set(state => ({
        templates: state.templates.filter(t => t.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  importKipuEvaluation: async (evaluationId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/kipu/evaluations/${evaluationId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch KIPU evaluation: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'Failed to load evaluation template');
      }

      // Use the adapter to convert KIPU format to our template format
      const { adaptKipuEvaluationToTemplate } = await import('@/lib/forms/kipuEvaluationAdapter');
      const convertedTemplate = adaptKipuEvaluationToTemplate(data.data);

      // Update state with the new template
      set(state => ({
        ...state,
        currentTemplate: convertedTemplate,
        isLoading: false
      }));

      return convertedTemplate;
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false
      });
      throw error;
    }
  }
}));

export default useTemplateStore;