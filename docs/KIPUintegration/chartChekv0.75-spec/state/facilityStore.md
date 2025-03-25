# Facility Store (Zustand) Specification

This document outlines the implementation and functionality provided by the `facilityStore` (located at `/store/facilityStore.ts`). The store is built using [Zustand](https://github.com/pmndrs/zustand) and is responsible for managing facility data, including the list of facilities, the currently selected facility, pagination, and error/loading states. It also integrates with Supabase for authentication and API calls, as well as with caching and React Query for performance optimizations.

---

## Overview

The `facilityStore` manages the following:

- **Facilities List:**  
  An array of facility records retrieved from the KIPU API.

- **Current Facility ID:**  
  The selected facility identifier, stored persistently (using `localStorage` on the client).

- **Pagination:**  
  Information about pagination (such as total items, current page, etc.) returned from the API.

- **Loading and Error States:**  
  Flags and messages to indicate asynchronous operation status and errors.

- **Integration with Other Stores:**  
  It interacts with the `chatStore` to update chat context when the facility changes.

- **Caching & Invalidation:**  
  Utilizes memoization and caching (including Redis and React Query) to reduce unnecessary API calls and improve performance.

---

## State Structure

The key state properties maintained in the store are:

- **`facilities`**:  
  An array of facility objects.

- **`currentFacilityId`**:  
  A number representing the ID of the currently selected facility.  
  - This value is initialized from `localStorage` if available.

- **`pagination`**:  
  An object containing pagination details (e.g., total items, current page, limit, total pages).

- **`isLoading`**:  
  A boolean indicating whether a fetch or other asynchronous operation is in progress.

- **`error`**:  
  A string holding an error message when operations fail.

---

## Key Functions and Actions

### 1. State Updaters

- **`setDocuments(facilities: Facility[])`**  
  Updates the list of facilities in the store.

- **`setCurrentFacilityId(facilityId: number)`**  
  Updates the currently selected facility ID.  
  - Also updates `localStorage` if running on the client.

- **`changeFacilityWithContext(facilityId: number)`**  
  Changes the current facility and updates related context in the `chatStore` to reflect the new facility.

- **`setPagination(pagination: Pagination | null)`**  
  Sets the pagination data.

- **`setLoading(isLoading: boolean)`**  
  Sets the loading state.

- **`setError(error: string | null)`**  
  Sets or clears the error state.

### 2. Facility Accessor

- **`getCurrentFacility(): Facility | undefined`**  
  Returns the facility object corresponding to the current facility ID from the list of facilities.

### 3. Fetching Facilities

- **`fetchFacilities(page?: number, limit?: number)`**  
  - **Purpose:**  
    Fetches facility data from the KIPU API using the `listFacilities` service.
  - **Details:**  
    - Uses memoization with a 5-minute TTL to reduce redundant API calls.
    - Leverages caching via Redis (if available) and updates the store state with the retrieved facilities and pagination data.
    - Ensures the current facility ID is valid—if not, defaults to the first facility in the list.
  - **Returns:**  
    The API response containing facilities and pagination details.

### 4. Cache Invalidation

- **`invalidateFacilityCache()`**  
  - **Purpose:**  
    Invalidates the cached facility data.
  - **Details:**  
    - Invalidates React Query cache for facilities.
    - Triggers a server-side API call to clear the Redis cache for facilities.
  
---

## Integration Points

- **Supabase:**  
  Used for authentication and as a backend client to fetch facility data.

- **API Service:**  
  The `listFacilities` function (from `/lib/kipu/service/facility-service.ts`) is used to retrieve facility information.

- **Memoization & Caching:**  
  Utilizes `memoizeAsyncWithExpiration` for API call memoization and functions like `getCachedData` for Redis caching.

- **React Query:**  
  Used for caching and managing facility-related queries on the client side.

- **Chat Store Integration:**  
  Updates chat context by calling functions in the `chatStore` when the facility changes.

---

## Usage Example

Below is an example of how you might interact with the `facilityStore` in your application:

```typescript
import { facilityStore } from '@/store/facilityStore';

// Fetch facilities (with pagination)
facilityStore.getState().fetchFacilities(1, 20)
  .then(response => {
    console.log('Facilities fetched:', response.facilities);
  })
  .catch(error => {
    console.error('Error fetching facilities:', error);
  });

// Update the current facility and update chat context
facilityStore.getState().changeFacilityWithContext(123);

// Retrieve the current facility object
const currentFacility = facilityStore.getState().getCurrentFacility();
console.log('Current facility:', currentFacility);
