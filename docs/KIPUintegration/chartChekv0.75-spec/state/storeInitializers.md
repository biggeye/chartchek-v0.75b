# Store Initializers Specification

This document outlines the functionality and integration of the `storeInitializers` module (located at `/store/storeInitializers.ts`). The module is responsible for initializing cross-store subscriptions and ensuring that facility data is loaded when the client application starts.

---

## Overview

The `storeInitializers` module serves two primary purposes:

1. **Initializing Cross-Store Subscriptions:**  
   It sets up subscriptions between various Zustand stores (such as `documentStore` and `patientStore`) to react to changes in facility data. This ensures that dependent stores are automatically updated when facility information changes.

2. **Initializing Facility Data:**  
   It checks if facility data has already been loaded and, if not, fetches it from the API to ensure that the application has access to the necessary facility information.

---

## Key Functions

### 1. `initializeStoreSubscriptions()`

- **Purpose:**  
  Sets up cross-store subscriptions to handle updates across the application.
  
- **Behavior:**
  - Calls `initDocumentStoreSubscriptions()` to subscribe the Document Store to facility changes.
  - Calls `initPatientStoreSubscriptions()` to subscribe the Patient Store to facility changes.
  - Returns a cleanup function that, when called, will unsubscribe both subscriptions.
  
- **Usage:**  
  This function should be called in a client component after all stores are loaded to ensure that any changes (e.g., facility updates) are propagated to dependent stores.

### 2. `initializeFacilityData()`

- **Purpose:**  
  Ensures facility data is loaded from the API if it is not already present in the `facilityStore`.
  
- **Behavior:**
  - Checks if the code is executing on the client side.
  - Dynamically imports the `facilityStore` to avoid circular dependencies.
  - Retrieves the current facility data from the store.
  - If the facilities list is empty, it calls `fetchFacilities()` to load the data.
  
- **Usage:**  
  This function should be called during the application initialization phase to ensure that facility-related data is available for subsequent operations.

---

## Example Usage

Below is an example of how you might integrate the store initializers in a client component:

```typescript
import { useEffect } from 'react';
import { initializeStoreSubscriptions, initializeFacilityData } from '@/store/storeInitializers';

export default function AppInitializer() {
  useEffect(() => {
    // Initialize subscriptions and get cleanup function
    const unsubscribe = initializeStoreSubscriptions();
    
    // Initialize facility data if not already loaded
    initializeFacilityData();
    
    // Cleanup subscriptions on component unmount
    return () => {
      unsubscribe();
    };
  }, []);
  
  return null;
}
