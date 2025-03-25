// store/templateStore.ts
import { create } from 'zustand';
import { ChartChekTemplate } from '@/types/templates';

interface TemplateState {
  templates: ChartChekTemplate[];
  isLoading: boolean;
  error: string | null;
  fetchTemplates: () => Promise<void>;
  getTemplate: (id: string) => Promise<ChartChekTemplate | null>;
  createTemplate: (template: ChartChekTemplate) => Promise<void>;
  saveTemplate: (template: ChartChekTemplate) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: [],
  isLoading: false,
  error: null,
  
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
  
  getTemplate: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/admin/templates/${id}`);
      if (!response.ok) throw new Error('Failed to fetch template');
      const data = await response.json();
      set({ isLoading: false });
      return data;
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
  }
}));