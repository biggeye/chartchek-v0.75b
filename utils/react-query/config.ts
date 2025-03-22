// In a new file: lib/react-query/config.ts
import { QueryClient } from '@tanstack/react-query';

/**
 * Global React Query client configuration
 * 
 * - staleTime: How long data remains fresh (in ms)
 * - gcTime: How long inactive data remains in cache (in ms)
 * - refetchOnWindowFocus: Whether to refetch when window regains focus
 * - retry: Number of retry attempts for failed queries
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
      refetchOnMount: true
    }
  }
});

/**
 * Query key factory to ensure consistent key structure across the application
 */
export const queryKeys = {
  facilities: {
    all: () => ['facilities'],
    list: (page?: number, limit?: number, status?: string, sort?: string) => 
      ['facilities', 'list', { page, limit, status, sort }],
    detail: (facilityId: string) => ['facilities', 'detail', facilityId]
  },
  patients: {
    all: () => ['patients'],
    list: (facilityId: string) => ['patients', 'list', facilityId],
    detail: (facilityId: string, patientId: string) => ['patients', 'detail', facilityId, patientId],
    evaluations: (facilityId: string, patientId: string) => 
      ['patients', 'evaluations', facilityId, patientId],
    vitalSigns: (facilityId: string, patientId: string) => 
      ['patients', 'vitalSigns', facilityId, patientId],
    appointments: (facilityId: string, patientId: string) => 
      ['patients', 'appointments', facilityId, patientId]
  },
  documents: {
    all: () => ['documents'],
    list: (facilityId?: string) => ['documents', 'list', facilityId],
    detail: (documentId: string) => ['documents', 'detail', documentId]
  },
  dashboard: {
    metrics: (facilityId: string) => ['dashboard', 'metrics', facilityId],
    patientStats: (facilityId: string) => ['dashboard', 'patientStats', facilityId],
    documentInsights: (facilityId: string) => ['dashboard', 'documentInsights', facilityId]
  }
};