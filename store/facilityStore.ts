// (store/facilityStore.ts)

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Facility } from '@/types/kipu';
import { UserApiSettings } from '@/types/store/user';
import { createClient } from '@/utils/supabase/client';
import { 
  listFacilities as listFacilitiesService, 
  getFacility as getFacilityService,
  updateFacility,
  PaginatedFacilitiesResponse
} from '@/lib/kipu/service/facility-service';

interface FacilityStore {
  // State
  facilities: Facility[];
  currentFacilityId: string | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  
  // Actions
  fetchFacilities: (page?: number, limit?: number) => Promise<Facility[]>;
  setCurrentFacility: (facilityId: string) => void;
  getCurrentFacility: () => Facility | null;
  changeFacilityWithContext: (facilityId: string) => Promise<void>;
  testKipuConnection: (facilityId: string) => Promise<{success: boolean; message: string}>;
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
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        pages: 0
      },
      
      // Fetch all available facilities
      fetchFacilities: async (page = 1, limit = 10): Promise<Facility[]> => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await listFacilitiesService(page, limit);
          console.log("facilityStore - Raw response from service:", response);
          
          // Extract facilities from the paginated response
          const facilities = response.facilities || [];
          console.log("facilityStore - Final facilities to be set in store:", facilities);
          
          // Update state with facilities and pagination
          set({ 
            facilities,
            pagination: response.pagination || {
              total: facilities.length,
              page,
              limit,
              pages: Math.ceil(facilities.length / limit)
            }
          });
         /* 
          if (facilities.length > 0) {
            // If no current facility is set, set the first one as current
            const { currentFacilityId } = get();
            if (!currentFacilityId || !facilities.find(f => f.id === currentFacilityId)) {
              get().setCurrentFacility(facilities[0].id);
            }
          }
          */
          return facilities;
        } catch (error) {
          console.error('Error fetching facilities:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to fetch facilities' });
          return [];
        } finally {
          set({ isLoading: false });
        }
      },
      
      // Set the current facility
      setCurrentFacility: (facilityId: string) => {
        set({ currentFacilityId: facilityId });
        
        // Also store in localStorage for persistence across page refreshes
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentFacilityId', facilityId);
        }
      },
      
      // Get the current facility object
      getCurrentFacility: () => {
        const { facilities, currentFacilityId } = get();
        
        if (!currentFacilityId) return null;
        
        return facilities.find(facility => facility.id === currentFacilityId) || null;
      },
      
      // Change facility and update related context
      changeFacilityWithContext: async (facilityId: string) => {
        const { setCurrentFacility } = get();
        
        // Set the new facility as current
        setCurrentFacility(facilityId);
        
        // Additional context updates can be added here
      },
      
      // Test KIPU connection
      testKipuConnection: async (facilityId: string): Promise<{success: boolean; message: string}> => {
        try {
          set({ isLoading: true });
          
          // Call the test connection API endpoint
          const response = await fetch(`/api/kipu/test-connection?facilityId=${facilityId}`);
          const result = await response.json();
          
          set({ isLoading: false });
          
          if (response.ok) {
            return { 
              success: true, 
              message: result.message || 'Successfully connected to KIPU API' 
            };
          } else {
            return { 
              success: false, 
              message: result.error || 'Failed to connect to KIPU API. Please check your credentials.' 
            };
          }
        } catch (error) {
          set({ isLoading: false });
          console.error('Error testing KIPU connection:', error);
          return { 
            success: false, 
            message: error instanceof Error ? error.message : 'Failed to test KIPU connection' 
          };
        }
      }
    }),
    {
      name: 'facility-storage',
      partialize: (state) => ({
        currentFacilityId: state.currentFacilityId,
      }),
    }
  )
);

export const facilityStore = useFacilityStore;
