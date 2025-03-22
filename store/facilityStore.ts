'use client';

import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import { Facility, FacilityStore, Pagination } from '@/types/store/facility';
import { listFacilities } from '@/lib/kipu/service/facility-service';
import { memoizeAsync, memoizeAsyncWithExpiration } from '@/utils/memoization';
import { getCachedData, cacheKeys, cacheTTL } from '@/utils/cache/redis';
import { queryKeys } from '@/utils/react-query/config';
import { chatStore } from '@/store/chatStore';

// Initialize Supabase client
const supabase = createClient();

// Memoized facility service functions
const memoizedListFacilities = memoizeAsyncWithExpiration(
  listFacilities,
  5 * 60 * 1000, // 5 minutes TTL
  10 // Max cache size
);

// Create facility store with Zustand
export const useFacilityStore = create<FacilityStore>((set, get) => ({
  // Initial state
  facilities: [], 
  currentFacilityId: typeof window !== 'undefined' 
    ? localStorage.getItem('currentFacilityId') || null
    : null,
  pagination: null,
  isLoading: false,
  error: null,
  
  // Set facilities
  setDocuments: (facilities: Facility[]) => set({ facilities }),
  
  // Set current facility ID
  setCurrentFacilityId: (facilityId: string | null) => {
    // Only update if the ID has changed
    if (facilityId !== get().currentFacilityId) {
      set({ currentFacilityId: facilityId });

    }
  },
  
  // Change facility with context update
  changeFacilityWithContext: (facilityId: string | null) => {
    // First update the current facility ID
    get().setCurrentFacilityId(facilityId);
    localStorage.setItem('currentFacilityId', facilityId || '');
    set({ currentFacilityId: facilityId });
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
    return facilities.find(facility => facility.id === currentFacilityId) || null;
  },
  
  // Fetch facilities from KIPU API with multi-level caching
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
      
      // Try to get from cache or fetch fresh data
      const response = await getCachedData(
        cacheKey,
        async () => {
          // Use memoized function to reduce API calls
          return memoizedListFacilities(page, limit);
        },
        cacheTTL.MEDIUM
      );
      
      // Update store state with facilities and pagination
      if (response) {
        const facilities = response.facilities || [];
        
        // Determine which facility ID to use:
        // 1. Keep current ID if it exists and is valid
        // 2. Otherwise use the first facility as default
        let facilityId = currentId;
        
        // If current ID is null or not in the list of facilities, use first facility
        if (!facilityId || !facilities.some(f => String(f.id) === String(facilityId))) {
          facilityId = facilities.length > 0 ? String(facilities[0].id) : null;
          // Update localStorage with new ID if we're changing it
          if (facilityId && typeof window !== 'undefined') {
            localStorage.setItem('currentFacilityId', facilityId);
          }
        }
  
        set({
          facilities,
          pagination: response.pagination || null,
          currentFacilityId: facilityId,
          isLoading: false
        });
      }
      
      return response;
    } catch (error) {
      console.error('Error fetching facilities:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch facilities', 
        isLoading: false 
      });
      return null;
    }
  },
  
  // Clear facility store
  clearFacilityStore: () => {
    set({ 
      facilities: [], 
      currentFacilityId: null, 
      pagination: null, 
      isLoading: false, 
      error: null 
    });
  },
  
  // Invalidate facility cache
  invalidateFacilityCache: async () => {
    try {
      if (typeof window !== 'undefined') {
        const { QueryClient } = await import('@tanstack/react-query');
        const queryClient = new QueryClient();
        
        // Invalidate React Query cache for facilities
        queryClient.invalidateQueries({ queryKey: queryKeys.facilities.all() });
        
        // For server-side Redis cache, we would need to call an API endpoint
        // that would invalidate the Redis cache on the server
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
