'use client';

import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import { Facility, FacilityStore, Pagination } from '@/types/store/facility';
import { getCachedData, cacheKeys, cacheTTL } from '@/utils/cache/redis';
import { queryKeys } from '@/utils/react-query/config';
import { chatStore } from '@/store/chatStore';

// Initialize Supabase client
const supabase = createClient();

// Create facility store with Zustand
export const useFacilityStore = create<FacilityStore>((set, get) => ({
  // Initial state
  facilities: [],
  currentFacilityId: typeof window !== 'undefined' 
    ? Number(localStorage.getItem('currentFacilityId')) || 0 
    : 0,
  pagination: null,
  isLoading: false,
  error: null,

  // Set facilities
  setDocuments: (facilities: Facility[]) => set({ facilities }),

  // Set current facility ID
  setCurrentFacilityId: (facilityId: number) => {
    // Only update if the ID has changed
    if (facilityId !== get().currentFacilityId) {
      set({ currentFacilityId: facilityId });
      // Update localStorage when ID changes
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentFacilityId', String(facilityId));
      }
    }
  },

  // Change facility with context update
  changeFacilityWithContext: (facilityId: number) => {
    // First update the current facility ID
    get().setCurrentFacilityId(facilityId);
    
    // Update chat context with new facility ID
    const chatState = chatStore.getState();
    if (chatState.updateChatContext) {
      chatState.updateChatContext({
        facilityId: facilityId
      });
    }
  },

  // Set pagination
  setPagination: (pagination: Pagination | null) => set({ pagination }),

  // Set loading state
  setLoading: (isLoading: boolean) => set({ isLoading }),

  // Set error state
  setError: (error: string | null) => set({ error }),

  // Get current facility
  getCurrentFacility: () => {
    const { facilities, currentFacilityId } = get();
    return facilities.find(f => Number(f.id) === currentFacilityId);
  },

  // Fetch facilities from KIPU API via server endpoint
  fetchFacilities: async (page = 1, limit = 20) => {
    set({ isLoading: true, error: null });
    
    try {
      // Get current user ID for cache key
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'anonymous';
      
      // Create cache key
      const cacheKey = cacheKeys.facilities.list(userId);
      
      // Save the current facility ID before fetching
      const currentId = get().currentFacilityId;
      
      // Use server endpoint instead of direct KIPU service call
      const response = await fetch(`/api/kipu/facilities?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch facilities: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update store with fetched data
      set({ 
        facilities: data.facilities || [], 
        pagination: data.pagination || null,
        isLoading: false 
      });
      
      // Restore selected facility or select first one if none is selected
      if (!currentId && data.facilities?.length > 0) {
        get().setCurrentFacilityId(data.facilities[0].id);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching facilities:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch facilities', 
        isLoading: false 
      });
      return null;
    }
  },

  // Invalidate facility cache
  invalidateFacilityCache: async () => {
    try {
      if (typeof window !== 'undefined') {
        const { QueryClient } = await import('@tanstack/react-query');
        const queryClient = new QueryClient();
        
        // Invalidate React Query cache for facilities
        queryClient.invalidateQueries({ queryKey: queryKeys.facilities.all() });
        
        // Call API endpoint to invalidate server-side cache
        await fetch('/api/cache/invalidate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pattern: 'facilities:*'
          }),
        });
      }
    } catch (error) {
      console.error('Error invalidating facility cache:', error);
    }
  }
}));

// Export the store
export const facilityStore = useFacilityStore;