// Extend the existing facility types to include API key management
import { Facility as KipuFacility, FacilityApiSettings as KipuFacilityApiSettings, FacilityApiSettingsDisplay } from '@/types/kipu';

// Re-export the Facility and FacilityApiSettings interfaces from KIPU types to maintain backward compatibility
export type Facility = KipuFacility;
export type FacilityApiSettings = KipuFacilityApiSettings;

export interface FacilityWithApiSettings extends Facility {
  api_settings?: FacilityApiSettingsDisplay;
}

// Pagination interface for facility listings
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Update the FacilityStore interface to include caching and memoization
export interface FacilityStore {
  // State
  facilities: Facility[];
  currentFacilityId: string | null;
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setDocuments: (facilities: Facility[]) => void;
  setCurrentFacilityId: (facilityId: string | null) => void;
  setPagination: (pagination: Pagination | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  changeFacilityWithContext: (facilityId: string | null) => void;
  
  // Data fetching with caching
  fetchFacilities: (page?: number, limit?: number) => Promise<any>;
  
  // Utilities
  getCurrentFacility: () => Facility | null;
  clearFacilityStore: () => void;
  invalidateFacilityCache: () => Promise<void>;
  
  // Legacy methods for backward compatibility
  updateFacilityApiSettings?: (facilityId: string, settings: FacilityApiSettings) => Promise<boolean>;
  getFacilityApiSettings?: (facilityId: string) => Promise<FacilityApiSettings | null>;
}
