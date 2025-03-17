// (store/facilityStore.ts)

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Facility } from '@/lib/kipu/types';
import { FacilityApiSettings } from '@/types/store/facility';
import { createClient } from '@/utils/supabase/client';
import { 
  listFacilities as listFacilitiesService, 
  getFacility as getFacilityService,
  getFacilityApiSettings as getFacilityApiSettingsService,
  updateFacility
} from '@/lib/kipu/service/facility-service';

interface FacilityStore {
  // State
  facilities: Facility[];
  currentFacilityId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchFacilities: () => Promise<Facility[]>;
  setCurrentFacility: (facilityId: string) => void;
  getCurrentFacility: () => Facility | null;
  changeFacilityWithContext: (facilityId: string) => Promise<void>;
  updateFacilityApiSettings: (facilityId: string, settings: FacilityApiSettings) => Promise<boolean>;
  getFacilityApiSettings: (facilityId: string) => Promise<FacilityApiSettings | null>;
}

// Create the facility store with Zustand
export const useFacilityStore = create<FacilityStore>()(
  persist(
    (set, get) => ({
      // Initial state
      facilities: [],
      currentFacilityId: typeof window !== 'undefined' ? localStorage.getItem('currentFacilityId') : null,
      isLoading: false,
      error: null,
      
      // Fetch all available facilities
      fetchFacilities: async (): Promise<Facility[]> => {
        try {
          set({ isLoading: true, error: null });
          
          // Get facilities from KIPU service layer
          const response = await listFacilitiesService();
          const facilities = response.facilities;
          
          set({ 
            facilities,
            isLoading: false
          });
          
          // If no current facility is selected and we have facilities, select the first one
          const { currentFacilityId } = get();
          if (!currentFacilityId && facilities.length > 0) {
            get().setCurrentFacility(facilities[0].facility_id);
          }
          
          return facilities;
        } catch (error) {
          console.error('Error fetching facilities:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch facilities',
            isLoading: false
          });
          return [];
        }
      },
      
      // Set the current facility
      setCurrentFacility: (facilityId: string) => {
        set({ currentFacilityId: facilityId });
        
        // Store in localStorage for persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentFacilityId', facilityId);
        }
      },
      
      // Get the current facility object
      getCurrentFacility: () => {
        const { facilities, currentFacilityId } = get();
        
        if (!currentFacilityId) return null;
        
        return facilities.find(facility => facility.facility_id === currentFacilityId) || null;
      },
      
      // Change facility and update related context
      changeFacilityWithContext: async (facilityId: string) => {
        // Set the current facility
        get().setCurrentFacility(facilityId);
        
        // The actual data fetching for patients and documents will be handled by the
        // store subscriptions in storeInitializers.ts
      },
      
      // Update facility API settings
      updateFacilityApiSettings: async (facilityId: string, settings: FacilityApiSettings): Promise<boolean> => {
        try {
          set({ isLoading: true, error: null });
          
          // Create a Supabase client
          const supabase = createClient();
          
          try {
            // First try to update in Supabase
            const { error } = await supabase
              .from('facility_api_settings')
              .upsert({
                facility_id: facilityId,
                kipu_api_endpoint: settings.kipu_api_endpoint,
                kipu_api_key: settings.kipu_api_key,
                has_api_key_configured: settings.has_api_key_configured,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'facility_id'
              });
            
            if (error) {
              console.warn('Supabase update failed:', error.message);
            }
          } catch (supabaseError) {
            console.warn('Supabase error:', supabaseError);
          }
          
          // Update the facility using our service layer
          const updatedFacility = await updateFacility(facilityId, {
            api_settings: {
              kipu_api_key: settings.kipu_api_key,
              kipu_api_endpoint: settings.kipu_api_endpoint,
              has_api_key_configured: settings.has_api_key_configured,
              updated_at: new Date().toISOString()
            }
          });
          
          if (updatedFacility) {
            // Update the local state
            const updatedFacilities = get().facilities.map(facility => {
              if (facility.facility_id === facilityId) {
                return {
                  ...facility,
                  api_settings: settings
                };
              }
              return facility;
            });
            
            set({ 
              facilities: updatedFacilities,
              isLoading: false
            });
            
            return true;
          } else {
            throw new Error('Failed to update facility');
          }
        } catch (error) {
          console.error('Error updating facility API settings:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update facility API settings',
            isLoading: false
          });
          return false;
        }
      },
      
      // Get facility API settings
      getFacilityApiSettings: async (facilityId: string): Promise<FacilityApiSettings | null> => {
        try {
          set({ isLoading: true, error: null });
          
          // Get API settings from service layer
          const apiSettings = await getFacilityApiSettingsService(facilityId);
          
          set({ isLoading: false });
          
          return apiSettings;
        } catch (error) {
          console.error('Error fetching facility API settings:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch facility API settings',
            isLoading: false
          });
          return null;
        }
      }
    }),
    {
      name: 'facility-storage',
      partialize: (state) => ({
        currentFacilityId: state.currentFacilityId
      })
    }
  )
);

export const facilityStore = useFacilityStore;
