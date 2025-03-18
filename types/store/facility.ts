// Extend the existing facility types to include API key management
import { Facility, FacilityApiSettings as KipuFacilityApiSettings, FacilityApiSettingsDisplay } from '@/types/kipu';

// Re-export the FacilityApiSettings interface from KIPU types to maintain backward compatibility
export type FacilityApiSettings = KipuFacilityApiSettings;

export interface FacilityWithApiSettings extends Facility {
  api_settings?: FacilityApiSettingsDisplay;
}

// Update the FacilityStore interface to include API key management
export interface FacilityStoreExtended {
  facilities: Facility[];
  currentFacilityId: string | null;
  isLoading: boolean;
  error: string | null;
  
  setCurrentFacility: (facilityId: string) => void;
  fetchFacilities: () => Promise<Facility[]>;
  getCurrentFacility: () => Facility | null;
  changeFacilityWithContext: (facilityId: string) => Promise<void>;
  
  updateFacilityApiSettings: (facilityId: string, settings: FacilityApiSettings) => Promise<boolean>;
  getFacilityApiSettings: (facilityId: string) => Promise<FacilityApiSettings | null>;
}
