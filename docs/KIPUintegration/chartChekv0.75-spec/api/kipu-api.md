# KIPU API Specifications

This document provides an overview of the KIPU API endpoints for Evaluations, Facilities, Patient Evaluations, and Patients. It covers details such as endpoint paths, methods, descriptions, request parameters, response schemas, authentication requirements, and integration notes.

---

## 1. Evaluations Endpoints

### a. List Evaluations
- **Path:** `/api/kipu/evaluations`
- **Method:** GET
- **Description:** Lists evaluations with optional filtering parameters.
- **Request Query Parameters:**
  - `page` (integer, default: 1): Page number for pagination.
  - `limit` (integer, default: 20): Number of results per page.
  - `status` (string): Filter by evaluation status (e.g., 'completed', 'in_progress').
  - `evaluation_type` (string): Filter by evaluation type.
  - `from_date` (string): Filter evaluations from this date (ISO format).
  - `to_date` (string): Filter evaluations until this date (ISO format).
  - `completed_only` (boolean, default: false): Only return completed evaluations.
  - `patient_id` (string): Filter by patient ID (format: `chartId:patientMasterId`).
- **Response (Success):**
  - **Status Code:** 200  
  - **Content-Type:** `application/json`
  - **Schema:**  
    - `data`: Array of evaluation objects with properties such as:
      - `id`, `patient_id`, `evaluation_type`, `status`, `created_at`, `updated_at`, and optionally `completed_at`, `completed_by`
    - `pagination`: Object with properties:
      - `total`, `page`, `limit`, `total_pages`
- **Authentication:** Required (Supabase session + KIPU API credentials)
- **Integration Details:**
  - **Service Layer Function:** `kipuListEvaluations` (located in `/lib/kipu/service/evaluation-service.ts`)
  - **Store Integration:** Uses `/store/evaluation.ts` with actions like `fetchEvaluationsFromAPI` and state properties such as `evaluations`, `evaluationsLoading`, `evaluationsError`, `evaluationsPagination`
  - **Next.js Implementation:** API Route at `/app/api/kipu/evaluations/route.ts` and client components such as `/components/evaluations/EvaluationsList.tsx`

---

### b. Get Evaluation by ID
- **Path:** `/api/kipu/evaluations/{evaluationId}`
- **Method:** GET
- **Description:** Retrieves detailed information about a specific evaluation.
- **Request:**
  - **Path Parameter:**  
    - `evaluationId` (string): Evaluation ID to retrieve.
- **Response (Success):**
  - **Status Code:** 200  
  - **Content-Type:** `application/json`
  - **Schema:**  
    - Object with properties: `id`, `patient_id`, `evaluation_type`, `status`, `created_at`, `updated_at`, optionally `completed_at`, `completed_by`, plus additional fields like `content` and `metadata`
- **Authentication:** Required
- **Integration Details:**
  - **Service Layer Function:** `kipuGetEvaluation` (in `/lib/kipu/service/evaluation-service.ts`)
  - **Store Integration:** `/store/evaluation.ts` with actions like `fetchEvaluationFromAPI`
  - **Next.js Implementation:** API Route at `/app/api/kipu/evaluations/[evaluationId]/route.ts` and component `/components/evaluations/EvaluationDetail.tsx`

---

### c. Create Evaluation
- **Path:** `/api/kipu/evaluations`
- **Method:** POST
- **Description:** Creates a new evaluation for a patient.
- **Request Body Schema:**
  - **Required:**  
    - `patient_id` (string, composite format: `chartId:patientMasterId`)
    - `evaluation_type` (string)
  - **Optional:**  
    - `content` (object): Initial evaluation content.
    - `metadata` (object): Additional metadata.
- **Response (Success):**
  - **Status Code:** 201  
  - **Content-Type:** `application/json`
  - **Schema:**  
    - Object with properties such as `id`, `patient_id`, `evaluation_type`, `status`, `created_at`, `updated_at`
- **Authentication:** Required
- **Integration Details:**
  - **Service Layer Function:** `kipuCreateEvaluation`
  - **Store Integration:** `/store/evaluation.ts` with actions like `createEvaluationInAPI`
  - **Next.js Implementation:** API Route at `/app/api/kipu/evaluations/route.ts` and client component `/components/evaluations/NewEvaluationForm.tsx`

---

### d. Update Evaluation
- **Path:** `/api/kipu/evaluations/{evaluationId}`
- **Method:** PUT
- **Description:** Updates an existing evaluation.
- **Request:**
  - **Path Parameter:**  
    - `evaluationId` (string)
  - **Body Schema (Optional Fields):**  
    - `status` (string): New status.
    - `content` (object): Updated content.
    - `metadata` (object): Updated metadata.
- **Response (Success):**
  - **Status Code:** 200  
  - **Content-Type:** `application/json`
  - **Schema:**  
    - Object with updated evaluation details.
- **Authentication:** Required
- **Integration Details:**
  - **Service Layer Function:** `kipuUpdateEvaluation`
  - **Store Integration:** `/store/evaluation.ts` with actions like `updateEvaluationInAPI`
  - **Next.js Implementation:** API Route at `/app/api/kipu/evaluations/[evaluationId]/route.ts` and component `/components/evaluations/EvaluationForm.tsx`

---

## 2. Facilities Endpoints

### a. List Facilities
- **Path:** `/api/kipu/facilities`
- **Method:** GET
- **Description:** Lists all facilities (KIPU locations) available to the authenticated user.
- **Request Query Parameters:**
  - `page` (integer, default: 1): Page number for pagination.
  - `limit` (integer, default: 20): Number of facilities per page.
  - `status` (string, enum: ["active", "inactive", "all"], default: "active"): Filter by facility status.
  - `sort` (string, enum: ["name_asc", "name_desc", "created_at_asc", "created_at_desc"], default: "name_asc"): Sort order.
- **Headers:**  
  - Must include KIPU-specific headers (e.g., `Accept`, `Authorization`, `Date`) as defined by KIPU.
- **Response (Success):**
  - **Content-Type:** `application/json`
  - **Schema:**  
    - `facilities`: Array of facility objects with properties like `id`, `facility_id`, `name`, `status`, `buildings`, `meta`, `api_settings`
    - `pagination`: Object with `total`, `page`, `limit`, and `pages`
- **Authentication:** Required
- **Integration Details:**
  - **Service Layer:** Function to list facilities.
  - **Store Integration:** `/store/facility.ts`
  - **Next.js Implementation:** API Route at `/app/api/kipu/facilities/route.ts` and component `/components/FacilitySelector.tsx`

---

### b. Get Facility Details
- **Path:** `/api/kipu/facilities/{facility_id}`
- **Method:** GET
- **Description:** Retrieves detailed information about a specific facility.
- **Request:**
  - **Path Parameter:**  
    - `facility_id` (string)
- **Response (Success):**
  - **Content-Type:** `application/json`
  - **Schema:**  
    - Object with facility details such as `id`, `facility_id`, `name`, `status`, `buildings`, `details` (e.g., address, phone), `meta`, and `api_settings`
- **Authentication:** Required
- **Integration Details:**
  - **Service Layer:** Function to get facility details.
  - **Store Integration:** `/store/facility.ts`
  - **Next.js Implementation:** API Route at `/app/api/kipu/facilities/[facility_id]/route.ts`

---

### c. Get Facility API Settings
- **Path:** `/api/kipu/facilities/{facility_id}/api_settings`
- **Method:** GET
- **Description:** Retrieves API settings for a specific facility.
- **Request:**
  - **Path Parameter:**  
    - `facility_id` (string)
- **Response (Success):**
  - **Content-Type:** `application/json`
  - **Schema:**  
    - Object containing API settings properties (e.g., `facility_id`, `kipu_api_key`, `kipu_api_secret` (masked), `kipu_app_id`, `kipu_api_endpoint`, `has_api_key_configured`, `updated_at`)
- **Authentication:** Required
- **Integration Details:**
  - **Data Storage:** Stored in Supabase with a fallback to local JSON.
  - **Next.js Implementation:** API Route at `/app/api/kipu/facilities/[facility_id]/api_settings/route.ts` and component `/components/settings/FacilityApiSettings.tsx`

---

## 3. Patient Evaluations Endpoints

### a. List Patient Evaluations
- **Path:** `/api/kipu/patient_evaluations`
- **Method:** GET
- **Description:** Lists evaluations for patients based on query parameters.
- **Request Query Parameters:**
  - `evaluation_id` (string): Filter by a specific evaluation ID.
  - `completed_only` (boolean, default: false)
  - `current_census_only` (boolean, default: false)
  - `start_date` (string): ISO date format.
  - `end_date` (string): ISO date format.
  - `include_stranded` (boolean, default: false)
  - `page` (string, default: "1")
  - `per` (string, default: "20")
  - `patient_process_id` (string)
  - `evaluation_content` (string)
  - `patientId` (string): Composite patient ID (`chartId:patientMasterId`)
- **Response (Success):**
  - **Status Code:** 200  
  - Returns an array of patient evaluation objects.
- **Authentication:** Required
- **Integration Details:**
  - **Service Layer:** `kipuListPatientEvaluations` (in `/lib/kipu/service/evaluation-service.ts`)
  - **Store Integration:** `/store/patient.ts`
  - **Next.js Implementation:** API Route at `/app/api/kipu/patient_evaluations/route.ts`

---

### b. Get Patient Evaluation by ID
- **Path:** `/api/kipu/patient_evaluations/{id}`
- **Method:** GET
- **Description:** Retrieves a specific patient evaluation by its ID.
- **Request:**
  - **Path Parameter:**  
    - `id` (string): Evaluation ID.
- **Response (Success):**
  - **Status Code:** 200  
  - **Content-Type:** `application/json`
  - **Schema:**  
    - Object with properties: `id`, `patient_id`, `evaluation_type`, `status`, `created_at`, `updated_at`, `content`, `metadata`
- **Authentication:** Required
- **Integration Details:**
  - **Service Layer:** `kipuGetEvaluation` (from `/lib/kipu/service/evaluation-service.ts`)
  - **Store Integration:** `/store/patient.ts`
  - **Next.js Implementation:** API Route at `/app/api/kipu/patient_evaluations/[id]/route.ts`

---

## 4. Patients Endpoints

### a. List Patients
- **Path:** `/api/kipu/patients`
- **Method:** GET
- **Description:** Lists patients available to the authenticated user with optional filtering.
- **Request Query Parameters:**
  - `page` (integer, default: 1)
  - `limit` (integer, default: 20)
  - `search` (string): Search term for filtering by name or ID.
  - `status` (string): Filter by patient status (e.g., 'active', 'discharged').
  - `admission_date_start` (string): ISO date format.
  - `admission_date_end` (string): ISO date format.
- **Response (Success):**
  - **Status Code:** 200  
  - **Content-Type:** `application/json`
  - **Schema:**  
    - Object with `data`: Array of patient objects and `pagination` details.
- **Authentication:** Required
- **Integration Details:**
  - **Service Layer:** `kipuListPatients` (in `/lib/kipu/service/patient-service.ts`)
  - **Store Integration:** `/store/patient.ts`
  - **Next.js Implementation:** API Route at `/app/api/kipu/patients/route.ts`

---

### b. Get Patient by ID
- **Path:** `/api/kipu/patients/{patientId}`
- **Method:** GET
- **Description:** Retrieves detailed information about a specific patient.
- **Request:**
  - **Path Parameter:**  
    - `patientId` (string, composite format: `chartId:patientMasterId`)
- **Response (Success):**
  - **Status Code:** 200  
  - **Content-Type:** `application/json`
  - **Schema:**  
    - Object with patient details including `id`, `first_name`, `last_name`, `date_of_birth`, `gender`, `status`, `admission_date`, optionally `discharge_date`, plus additional fields such as `address`, `contact_info`, `insurance`, and `demographics`
- **Authentication:** Required
- **Integration Details:**
  - **Service Layer:** `kipuGetPatient` (in `/lib/kipu/service/patient-service.ts`)
  - **Store Integration:** `/store/patient.ts`
  - **Next.js Implementation:** API Route at `/app/api/kipu/patients/[patientId]/route.ts`

---

### c. Get Patient Vitals
- **Path:** `/api/kipu/patients/{patientId}/vitals`
- **Method:** GET
- **Description:** Retrieves vital signs for a specific patient.
- **Request:**
  - **Path Parameter:**  
    - `patientId` (string, composite format)
  - **Query Parameters:**
    - `page` (integer, default: 1)
    - `limit` (integer, default: 20)
    - `from_date` (string): ISO date format.
    - `to_date` (string): ISO date format.
- **Response (Success):**
  - **Status Code:** 200  
  - **Content-Type:** `application/json`
  - **Schema:**  
    - Array of vital signs objects with properties such as `id`, `patient_id`, `vital_type`, `value`, `unit`, `recorded_at`, `recorded_by`
- **Authentication:** Required
- **Integration Details:**
  - **Service Layer:** `kipuGetPatientVitals` (in `/lib/kipu/service/vitals-service.ts`)
  - **Store Integration:** `/store/patient.ts`
  - **Next.js Implementation:** API Route at `/app/api/kipu/patients/[patientId]/vitals/route.ts`

---

### d. Get Patient Evaluations
- **Path:** `/api/kipu/patients/{patientId}/evaluations`
- **Method:** GET
- **Description:** Retrieves evaluations for a specific patient.
- **Request:**
  - **Path Parameter:**  
    - `patientId` (string, composite format)
  - **Query Parameters:**
    - `page` (integer, default: 1)
    - `limit` (integer, default: 20)
    - `status` (string): Filter by evaluation status.
    - `from_date` (string): ISO date format.
    - `to_date` (string): ISO date format.
- **Response (Success):**
  - **Status Code:** 200  
  - Returns an array of evaluation objects.
- **Authentication:** Required
- **Integration Details:**
  - **Service Layer:** `kipuListPatientEvaluations` (in `/lib/kipu/service/evaluation-service.ts`)
  - **Store Integration:** `/store/patient.ts`
  - **Next.js Implementation:** API Route at `/app/api/kipu/patients/[patientId]/evaluations/route.ts`

---

### e. Get Patient Evaluation by ID
- **Path:** `/api/kipu/patients/{patientId}/evaluations/{evaluationId}`
- **Method:** GET
- **Description:** Retrieves a specific evaluation for a patient.
- **Request:**
  - **Path Parameters:**  
    - `patientId` (string, composite format)
    - `evaluationId` (string)
- **Response (Success):**
  - **Status Code:** 200  
  - **Content-Type:** `application/json`
  - **Schema:**  
    - Object with properties: `id`, `patient_id`, `evaluation_type`, `status`, `created_at`, `updated_at`, `content`, `metadata`
- **Authentication:** Required
- **Integration Details:**
  - **Service Layer:** `kipuGetPatientEvaluation` (in `/lib/kipu/service/evaluation-service.ts`)
  - **Store Integration:** `/store/patient.ts`
  - **Next.js Implementation:** API Route at `/app/api/kipu/patients/[patientId]/evaluations/[evaluationId]/route.ts`

---

## Architecture Notes

- **Layered Architecture:**  
  Endpoints follow a layered model: UI → Store → API → Service.
- **Authentication:**  
  All endpoints require a valid Supabase session combined with KIPU API credentials.
- **Composite IDs:**  
  Patient IDs use a composite format (`chartId:patientMasterId`) and are parsed accordingly.
- **Integration Details:**  
  Each endpoint includes integration notes covering service layer functions, state management via stores, and Next.js API route and component details.
- **Error Handling:**  
  Standardized error responses are provided with appropriate HTTP status codes (e.g., 400, 401, 403, 404, 500).

---

This document summarizes the KIPU API specifications across different service domains. Each endpoint is designed to ensure secure and efficient integration with KIPU, leveraging both Supabase for authentication and robust service layer implementations.
