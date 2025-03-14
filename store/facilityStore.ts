'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { listFacilities, getFacilityData } from '@/lib/kipu';
import { Facility } from '@/lib/kipu/types';

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
          
          // Get facilities from KIPU API
          const facilities = await listFacilities();
          
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
      }
    }),
    {
      name: 'facility-storage',
      partialize: (state) => ({ currentFacilityId: state.currentFacilityId })
    }
  )
);

export const facilityStore = useFacilityStore;
