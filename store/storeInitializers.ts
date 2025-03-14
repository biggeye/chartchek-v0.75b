'use client';

import { initDocumentStoreSubscriptions } from './documentStore';
import { initPatientStoreSubscriptions } from './patientStore';

// This function initializes all cross-store subscriptions
// It should be called in a client component after all stores are loaded
export function initializeStoreSubscriptions() {
  // Initialize document store subscriptions to facility changes
  const unsubscribeDocumentStore = initDocumentStoreSubscriptions();
  
  // Initialize patient store subscriptions to facility changes
  const unsubscribePatientStore = initPatientStoreSubscriptions();

  // Return cleanup function
  return () => {
    // Clean up subscriptions when needed
    unsubscribeDocumentStore();
    unsubscribePatientStore();
  };
}

// Helper function to initialize facility-related data
export async function initializeFacilityData() {
  if (typeof window !== 'undefined') {
    // Dynamically import to avoid circular dependencies
    const { useFacilityStore } = require('./facilityStore');
    
    // Fetch facilities if not already loaded
    const { facilities, fetchFacilities } = useFacilityStore.getState();
    
    if (!facilities || facilities.length === 0) {
      await fetchFacilities();
    }
  }
}
