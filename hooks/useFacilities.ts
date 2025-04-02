'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  listFacilities as listFacilitiesService,
  PaginatedFacilitiesResponse
} from '@/lib/kipu/service/facility-service';
import { queryKeys } from '@/utils/react-query/config';
import { Facility } from '@/types/chartChek/kipuAdapter';
import { useFacilityStore } from '@/store/facilityStore';

/**
 * Hook for fetching facilities list with React Query
 */
export function useFacilities(
  page = 1, 
  limit = 20, 
  status: 'active' | 'inactive' | 'all' = 'active',
  sort: 'name_asc' | 'name_desc' | 'created_at_asc' | 'created_at_desc' = 'name_asc'
) {
  const queryClient = useQueryClient();
  const facilityStore = useFacilityStore();
  
  const query = useQuery<PaginatedFacilitiesResponse, Error>({
    queryKey: queryKeys.facilities.list(page, limit, status, sort),
    queryFn: () => listFacilitiesService(page, limit, status, sort),
    // Use stale time of 5 minutes for facilities data
    staleTime: 5 * 60 * 1000
  });

  // Use useEffect to handle the onSuccess logic
  useEffect(() => {
    if (query.data?.facilities) {
      facilityStore.setDocuments(query.data.facilities);
    }
  }, [query.data, facilityStore]);

  return {
    ...query,
    // Convenience getter for facilities from the query data
    facilities: query.data?.facilities || []
  };
}



