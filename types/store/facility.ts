// Extend the existing facility types to include API key management
import { Facility } from '@/lib/kipu/types';

export interface FacilityApiSettings {
  kipu_api_key?: string;
  kipu_api_endpoint?: string;
  has_api_key_configured: boolean;
}

export interface FacilityWithApiSettings extends Facility {
  api_settings?: FacilityApiSettings;
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
