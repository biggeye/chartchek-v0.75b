# Patient Store (Zustand) Specification

This document describes the `patientStore` (located at `/store/patientStore.ts`), which manages patient-related state, data fetching, and context for your application. The store is built using [Zustand](https://github.com/pmndrs/zustand) and leverages Supabase for API calls, along with integration with the `chatStore` for updating chat context based on patient information.

---

## Overview

The `patientStore` manages the following:

- **Patient Data:**
  - `patients`: List of basic patient information.
  - `currentPatientId`: Identifier of the currently selected patient.
  - `currentPatient` & `selectedPatient`: Detailed patient data.
  
- **Evaluations and Vital Signs:**
  - `evaluations`: Patient evaluations.
  - `vitalSigns`: Patient vital signs.
  - `currentPatientEvaluations` / `selectedPatientEvaluations`: Evaluations for the current or selected patient.
  - `currentPatientVitalSigns` / `selectedPatientVitalSigns`: Vital signs for the current or selected patient.
  - `allPatientEvaluations`: Aggregated evaluations across patients.

- **Context and Options:**
  - `isPatientContextEnabled`: Flag indicating whether patient context is active.
  - `selectedContextOptions` & `contextOptions`: Configuration options for patient context, with default values from `DEFAULT_PATIENT_CONTEXT_OPTIONS`.

- **Loading and Error States:**
  - Flags (`isLoading`, `isLoadingEvaluations`, `isLoadingVitals`, `isLoadingAppointments`) to indicate ongoing operations.
  - `error`: Holds error messages for display or logging.

---

## Key Functions and Actions

### 1. State Setters

- **`setPatients(patients: PatientBasicInfo[])`**  
  Sets the list of patients.

- **`setCurrentPatientId(patientId: string | null)`**  
  Updates the current patient ID.  
  - When a new patient ID is provided, it triggers a fetch of that patient's details.

- **`setCurrentPatient(patient: PatientBasicInfo | null)`**  
  Sets the detailed patient data as the current patient.

- **`setPatientEvaluations(evaluations: KipuPatientEvaluation[])`**  
  Stores evaluations for patients.

- **`setVitalSigns(vitalSigns: PatientVitalSign[])`**  
  Stores vital signs data.

- **`setAllPatientEvaluations(evaluations: KipuPatientEvaluation[])`**  
  Updates the aggregated evaluations across patients.

- **`setPatientContextOptions(options: Partial<PatientContextOptions>)`**  
  Merges provided options into existing patient context options.

- **`updatePatientContextOptions(options: PatientContextOptions)`**  
  Replaces context options and, if patient context is enabled and a patient is selected, updates the chat context with the patient's ID and name.

- **`setLoading(isLoading: boolean)`** and **`setError(error: string | null)`**  
  Update loading and error state flags.

### 2. Data Fetching Functions

- **`fetchPatients(facilityId: number)`**  
  Fetches all patients from `/api/kipu/patients`, optionally filtering by facility ID in memory.  
  - Updates `patients` and `isLoading` state.

- **`fetchPatientById(patientId: string)`**  
  Fetches detailed information for a single patient from `/api/kipu/patients/{patientId}`.  
  - Uses a helper function (`encodePatientIdForUrl`) to properly format the composite patient ID.
  - Updates `selectedPatient` and `currentPatient`.

- **`fetchPatientEvaluations(patientId: string)`**  
  Retrieves evaluations for a specific patient from `/api/kipu/patients/{patientId}/evaluations`.  
  - Updates `selectedPatientEvaluations` and `currentPatientEvaluations`.

- **`fetchPatientEvaluation(evaluationId: string)`**  
  Fetches a specific patient evaluation from `/api/kipu/patient_evaluations/{evaluationId}`.

- **`fetchAllPatientEvaluations(options?: object)`**  
  Retrieves evaluations across patients by constructing a query string from provided options.  
  - Updates `allPatientEvaluations`.

- **`fetchPatientVitalSigns(patientId: string)`**  
  Retrieves vital signs for a patient from `/api/kipu/patients/{patientId}/vitals`.  
  - Updates `selectedPatientVitalSigns` and `currentPatientVitalSigns`.

- **`fetchPatientWithDetails(patientId: string)`**  
  Combines fetching basic patient info, evaluations, and vital signs into a single function.  
  - Returns an object containing `patient`, `evaluations`, and `vitalSigns`.

### 3. Context and Store Management

- **`setPatientContextEnabled(enabled: boolean)`**  
  Enables or disables the patient context.  
  - If disabled, it clears the patient context.

- **`clearPatientStore()`**  
  Resets the patient store to its initial state.

- **`clearPatientContext()`**  
  Clears only the patient context options and updates the `chatStore` to remove patient context from the chat.

### 4. Helper Functions

- **`encodePatientIdForUrl(patientId: string)`**  
  Helper to properly format and encode a composite patient ID for URL usage.
  
- **Store Subscription (`initPatientStoreSubscriptions`)**  
  Subscribes to changes in `currentPatientId` and automatically fetches detailed data when the patient changes.

---

## Integration Points

- **Supabase:**  
  Used for authentication and fetching data from the KIPU API endpoints.

- **Chat Store Integration:**  
  When patient context is enabled or updated, the store calls `chatStore` functions to update the chat context with patient information (ID and name).

- **API Endpoints:**  
  The store calls endpoints such as `/api/kipu/patients`, `/api/kipu/patients/{patientId}`, `/api/kipu/patients/{patientId}/evaluations`, and `/api/kipu/patients/{patientId}/vitals`.

---

## Usage Example

Below is an example of how you might use the `patientStore` in your application:

```typescript
import { usePatientStore } from '@/store/patientStore';

// Set the current patient ID (triggers fetching of patient details)
usePatientStore.getState().setCurrentPatientId('chart123:patient456');

// Fetch evaluations for a patient
usePatientStore.getState().fetchPatientEvaluations('chart123:patient456')
  .then(evaluations => {
    console.log('Patient evaluations:', evaluations);
  })
  .catch(error => {
    console.error('Error fetching evaluations:', error);
  });

// Update patient context options and reflect in chat context
usePatientStore.getState().updatePatientContextOptions({
  facilityId: 101,
  showFullHistory: true,
  additionalNotes: 'Patient requires follow-up'
});

// Clear patient context if needed
usePatientStore.getState().clearPatientContext();
