// lib/stores/complianceStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Define the store's state types
export interface ComplianceFrameworkBasic {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

export interface ComplianceDocument {
  id: number;
  title: string;
  framework_id: number;
  document_type: string;
  source_url?: string;
  published_at?: string;
  uploaded_at: string;
}

export interface ComplianceSearchResult {
  id: number;
  document_id: number;
  framework_id: number;
  section_title: string;
  content: string;
  similarity: number;
  framework_name?: string;
  document_title?: string;
}

// Define the store's state
interface ComplianceState {
  // State
  frameworks: ComplianceFrameworkBasic[];
  searchResults: ComplianceSearchResult[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchFrameworks: () => Promise<void>;
  updateFrameworkPreference: (frameworkId: number, active: boolean) => Promise<void>;
  updateMultipleFrameworkPreferences: (frameworkIds: number[], active: boolean) => Promise<void>;
  searchCompliance: (query: string, frameworkIds?: number[]) => Promise<void>;
  clearSearchResults: () => void;
  reset: () => void;
}

// Create the store
export const useComplianceStore = create<ComplianceState>()(
  devtools(
    (set, get) => ({
      // Initial state
      frameworks: [],
      searchResults: [],
      isLoading: false,
      error: null,
      
      // Fetch all compliance frameworks with user preferences
      fetchFrameworks: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await fetch('/api/compliance/frameworks?includeUserPreferences=true');
          
          if (!response.ok) {
            throw new Error('Failed to fetch compliance frameworks');
          }
          
          const data = await response.json();
          set({ frameworks: data.frameworks, isLoading: false });
        } catch (error: any) {
          console.error('Error fetching compliance frameworks:', error);
          set({ 
            error: error.message || 'Failed to fetch compliance frameworks',
            isLoading: false 
          });
        }
      },
      
      // Update a single framework preference
      updateFrameworkPreference: async (frameworkId: number, active: boolean) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await fetch('/api/compliance/preferences', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ frameworkIds: [frameworkId], active })
          });
          
          if (!response.ok) {
            throw new Error('Failed to update framework preference');
          }
          
          // Update local state
          set(state => ({
            frameworks: state.frameworks.map(fw => 
              fw.id === frameworkId ? { ...fw, is_active: active } : fw
            ),
            isLoading: false
          }));
        } catch (error: any) {
          console.error('Error updating framework preference:', error);
          set({ 
            error: error.message || 'Failed to update framework preference',
            isLoading: false 
          });
        }
      },
      
      // Update multiple framework preferences at once
      updateMultipleFrameworkPreferences: async (frameworkIds: number[], active: boolean) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await fetch('/api/compliance/preferences', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ frameworkIds, active })
          });
          
          if (!response.ok) {
            throw new Error('Failed to update framework preferences');
          }
          
          // Update local state
          set(state => ({
            frameworks: state.frameworks.map(fw => 
              frameworkIds.includes(fw.id) ? { ...fw, is_active: active } : fw
            ),
            isLoading: false
          }));
        } catch (error: any) {
          console.error('Error updating framework preferences:', error);
          set({ 
            error: error.message || 'Failed to update framework preferences',
            isLoading: false 
          });
        }
      },
      
      // Search across compliance frameworks
      searchCompliance: async (query: string, frameworkIds?: number[]) => {
        try {
          set({ isLoading: true, error: null });
          
          // If no frameworkIds provided, use active frameworks from state
          const idsToUse = frameworkIds || get().frameworks
            .filter(fw => fw.is_active)
            .map(fw => fw.id);
          
          const response = await fetch('/api/compliance/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              query,
              frameworkIds: idsToUse,
              limit: 10,
              threshold: 0.65
            })
          });
          
          if (!response.ok) {
            throw new Error('Failed to search compliance data');
          }
          
          const data = await response.json();
          set({ searchResults: data.results, isLoading: false });
        } catch (error: any) {
          console.error('Error searching compliance data:', error);
          set({ 
            error: error.message || 'Failed to search compliance data',
            isLoading: false 
          });
        }
      },
      
      // Clear search results
      clearSearchResults: () => set({ searchResults: [] }),
      
      // Reset the store
      reset: () => set({ 
        frameworks: [],
        searchResults: [],
        isLoading: false,
        error: null
      })
    }),
    { name: 'compliance-store' }
  )
);
