# Service Layers

This document outlines the service layers implemented in the system. Each layer interacts with the KIPU API and provides specialized functionalities for evaluations, facilities, patients, user settings, and vital signs.

---

## 1. Evaluation Service

**Overview:**  
Handles interactions with the KIPU API for evaluation-related operations. It provides functions to list evaluation templates, retrieve evaluation details, and manage patient evaluations.

### Key Functions

#### **kipuListEvaluations**  
- **Description:** Lists all evaluation templates.  
- **Parameters:**
  - `credentials`: KIPU API credentials.
  - `page` (default: 1): Page number for pagination.
  - `per` (default: 20): Number of records per page.
- **Endpoint Format:**  
  `/api/evaluations?app_id={credentials.appId}&page={page}&per={per}`
- **Returns:** A promise that resolves to a KipuApiResponse containing the evaluations list.

---

#### **kipuGetEvaluationTemplate**  
- **Description:** Retrieves details for a specific evaluation template.  
- **Parameters:**
  - `evaluationId`: The ID of the evaluation template.
  - `credentials`: KIPU API credentials.
- **Endpoint Format:**  
  `/api/evaluations/{evaluationId}?app_id={credentials.appId}`
- **Returns:** A promise that resolves to a KipuApiResponse with the evaluation details.

---

#### **kipuListPatientEvaluations**  
- **Description:** Lists all patient evaluations with optional filtering and pagination.  
- **Parameters:**
  - `credentials`: KIPU API credentials.
  - `options` (optional):  
    - `evaluationId`: Filter by a specific evaluation.
    - `completedOnly`: Boolean flag to filter only completed evaluations.
    - `currentCensusOnly`: Boolean flag to filter by current census.
    - `startDate` & `endDate`: Date range filters.
    - `includeStranded`: Boolean flag.
    - `page` & `per`: Pagination parameters.
    - `patientProcessId`: Specific patient process identifier.
    - `evaluationContent`: Content type (`'standard' | 'notes' | 'treatment_plan'`).
- **Endpoint Format:**  
  `/api/patient_evaluations?app_id={credentials.appId}&...`
- **Returns:** A promise resolving to a KipuApiResponse with patient evaluations.

---

#### **kipuGetPatientEvaluation**  
- **Description:** Fetches detailed information for a specific patient evaluation.  
- **Parameters:**
  - `patientEvaluationId`: The patient evaluation ID.
  - `credentials`: KIPU API credentials.
  - `includeSettings` (default: false): Whether to include extended evaluation settings.
- **Endpoint Format:**  
  `/api/patient_evaluations/{patientEvaluationId}?app_id={credentials.appId}[&include_settings=true]`
- **Returns:** A promise that resolves to a KipuApiResponse.

---

#### **kipuGetPatientEvaluations (by Patient)**  
- **Description:** Retrieves patient evaluations for a specific patient.  
- **Parameters:**
  - `patientId`: The composite patient ID (contains both chartId and patientMasterId).
  - `credentials`: KIPU API credentials.
  - `options`: Similar optional filters as in **kipuListPatientEvaluations**.
- **Endpoint Format:**  
  `/api/patients/{chartId}/patient_evaluations?app_id={credentials.appId}&patient_master_id={patientMasterId}&...`
- **Returns:** A promise resolving to a KipuApiResponse with the evaluations list.

---

## 2. Facility Service

**Overview:**  
Manages facility-related operations by interfacing with the KIPU API. Functions include listing facilities, retrieving facility details, testing API connectivity, and enriching facility data with additional information.

### Key Functions

#### **listFacilities**  
- **Description:** Lists facilities available to the authenticated user with support for pagination and sorting.  
- **Parameters:**
  - `page` (default: 1): Page number.
  - `limit` (default: 20): Number of facilities per page.
  - `status` (default: 'active'): Filter by facility status.
  - `sort` (default: 'name_asc'): Sorting order.
- **Endpoint Format:**  
  `/api/kipu/facilities?status={status}&sort={sort}&page={page}&limit={limit}`
- **Returns:** A `PaginatedFacilitiesResponse` containing facilities and pagination info.

---

#### **kipuListFacilities**  
- **Description:** Direct call to the KIPU API to list facilities.  
- **Parameters:**
  - `credentials`: KIPU API credentials.
  - `includeBuildings` (default: true): Whether to include building data.
- **Endpoint Format:**  
  `/locations?app_id={credentials.appId}&include_buildings={includeBuildings}`
- **Returns:** A promise resolving to a KipuApiResponse.

---

#### **kipuGetFacility**  
- **Description:** Retrieves details of a specific facility using its KIPU location ID.  
- **Parameters:**
  - `facilityId`: The facility's KIPU ID.
  - `credentials`: KIPU API credentials.
- **Endpoint Format:**  
  `/locations/{facilityId}?app_id={credentials.appId}`
- **Returns:** A promise resolving to a KipuApiResponse.

---

#### **testKipuConnection**  
- **Description:** Tests the connection to the KIPU API for a specific facility.  
- **Parameters:**
  - `facilityId`: The ID of the facility to test.
- **Returns:** An object indicating success and a descriptive message.

---

#### **enrichFacilityWithData**  
- **Description:** Enriches a facility object with additional data such as patient census and bed occupancy, plus checks for API settings.  
- **Parameters:**
  - `facility`: The facility object.
  - `credentials`: KIPU API credentials.
- **Returns:** A promise that resolves to the enriched facility.

---

#### **fetchAndStoreFacilities**  
- **Description:** Fetches facilities from the KIPU API and updates the local facility store.  
- **Parameters:**
  - `credentials`: KIPU API credentials.
- **Returns:** A promise resolving to an array of facilities.

---

## 3. Patient Service

**Overview:**  
Facilitates patient data retrieval from the KIPU API. This layer supports fetching details for individual patients as well as listing multiple patients, and it employs caching to optimize repeated requests.

### Key Functions

#### **kipuGetPatient**  
- **Description:** Retrieves detailed information for a specific patient.  
- **Parameters:**
  - `patientId`: The composite patient ID.
  - `credentials`: KIPU API credentials.
  - `options` (optional):  
    - `phiLevel`: Privacy level (`'high' | 'medium' | 'low'`).
    - `insuranceDetail`: Detail version (e.g., `'v121'`).
    - `demographicsDetail`: Detail version.
    - `patientStatusDetail`: Detail version.
    - `patientContactsDetail`: Boolean flag for contacts detail.
- **Endpoint Format:**  
  `/api/patients/{chartId}?app_id={credentials.appId}&patient_master_id={patientMasterId}&phi_level={phiLevel}[&insurance_detail=...&demographics_detail=...&...]`
- **Returns:** A promise resolving to a KipuApiResponse with patient details.

---

#### **kipuGetPatients**  
- **Description:** Retrieves a list of patients using pagination and filtering by status.  
- **Parameters:**
  - `credentials`: KIPU API credentials.
  - `page` (default: 1): Page number.
  - `limit` (default: 20): Number of patients per page.
  - `status` (default: 'active'): Patient status filter.
- **Endpoint Format:**  
  `/api/patients?app_id={credentials.appId}&page={page}&limit={limit}&status={status}&phi_level=high`
- **Returns:** A promise resolving to a KipuApiResponse with the list of patients.

---

#### **memoizedGetPatient**  
- **Description:** A memoized (cached) version of the patient retrieval function to avoid duplicate API calls.  
- **Parameters:**
  - `patientId`: The ID of the patient.
- **Returns:** A promise resolving to patient data from the cache or via an API call.

---

#### **clearPatientCache**  
- **Description:** Clears the patient cache.  
- **Parameters:**
  - `patientId` (optional): Clears cache for a specific patient if provided; otherwise, clears the entire cache.

---

## 4. User Settings Service

**Overview:**  
Manages the storage and retrieval of user-specific KIPU API settings. This layer leverages Supabase for persistent storage and handles the configuration of KIPU credentials.

### Key Functions

#### **getUserApiSettings**  
- **Description:** Retrieves API settings for a given user.  
- **Parameters:**
  - `ownerId` (optional): The user's ID; defaults to the current authenticated user if not provided.
- **Returns:** A promise that resolves to a `UserApiSettings` object or `null` if settings are not found.

---

#### **updateUserApiSettings**  
- **Description:** Updates the API settings for a user.  
- **Parameters:**
  - `settings`: An object containing the API settings to update.
  - `ownerId` (optional): The user's ID; defaults to the current authenticated user.
- **Returns:** A promise that resolves to a boolean indicating the success of the update.

---

#### **getUserKipuCredentials**  
- **Description:** Retrieves the KIPU API credentials from the stored user API settings.  
- **Parameters:**
  - `ownerId` (optional): The user's ID.
- **Returns:** A promise resolving to a `KipuCredentials` object if configured, or `null`.

---

#### **getKipuCredentials**  
- **Description:** Obtains the current user’s KIPU credentials, falling back to development environment variables if in development mode.  
- **Parameters:**
  - `ownerId` (optional): The user's ID.
- **Returns:** A promise resolving to the KIPU credentials or `null` if not available.

---

## 5. Vitals Service

**Overview:**  
Handles retrieval of patient vital signs from the KIPU API. This service is designed to fetch and return detailed vital sign data with support for pagination.

### Key Functions

#### **kipuGetPatientVitalSigns**  
- **Description:** Retrieves the vital signs data for a specific patient.  
- **Parameters:**
  - `patientId`: The composite patient ID.
  - `credentials`: KIPU API credentials.
  - `page` (default: 1): Page number for pagination.
  - `limit` (default: 20): Number of records per page.
- **Endpoint Format:**  
  `/api/patients/{chartId}/vital_signs?app_id={credentials.appId}&patient_master_id={patientMasterId}&page={page}&limit={limit}`
- **Returns:** A promise that resolves to a KipuApiResponse with a `KipuVitalSignsResponse`.

---

#### **getPatientVitalSigns**  
- **Description:** Alias for **kipuGetPatientVitalSigns** to maintain naming consistency.
- **Returns:** Same as **kipuGetPatientVitalSigns**.

---

This document provides an overview and detailed specifications of each service layer in the system. Each section covers the purpose, key functions, endpoints, parameters, and return types for clarity and ease of maintenance.

Feel free to modify or extend this document as your system evolves.
