'use client';

import { useEffect, useState, useCallback } from 'react';
import { useFacilityStore } from '@/store/facilityStore';
import { usePatientStore } from '@/store/patientStore';
import { useDocumentStore } from '@/store/documentStore';
import { Facility } from '@/lib/kipu/types';

/**
 * Custom hook for facility-related functionality
 * Provides access to the current facility and related data
 */
export function useFacility() {
  const { 
    facilities, 
    currentFacilityId, 
    fetchFacilities: fetchFacilitiesFromStore, 
    setCurrentFacility, 
    getCurrentFacility 
  } = useFacilityStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const patientStore = usePatientStore();
  const documentStore = useDocumentStore();

  // Wrap fetchFacilities in useCallback to prevent infinite re-renders
  const fetchFacilities = useCallback(async () => {
    setIsLoading(true);
    await fetchFacilitiesFromStore();
    setIsLoading(false);
  }, [fetchFacilitiesFromStore]);

  // Fetch facilities on component mount
  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  // Get current facility object
  const currentFacility = getCurrentFacility();

  /**
   * Change the current facility and load related data
   * @param facilityId - The ID of the facility to select
   */
  const changeFacility = async (facilityId: string) => {
    if (facilityId === currentFacilityId) return;
    
    setIsLoading(true);
    setCurrentFacility(facilityId);
    
    // Reset patient and document contexts when facility changes
    patientStore.clearPatientContext();
    
    // Pre-fetch data for the selected facility
    try {
      await patientStore.fetchPatients(facilityId);
      await documentStore.fetchDocuments(facilityId);
    } catch (error) {
      console.error('Error pre-fetching facility data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    facilities,
    currentFacilityId,
    currentFacility,
    isLoading,
    changeFacility,
    fetchFacilities
  };
}
