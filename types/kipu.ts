/**
 * KIPU API Type Definitions
 * 
 * This file contains TypeScript interfaces for the KIPU API integration.
 * 
 * Naming Convention:
 * - Interfaces prefixed with "Kipu" represent raw data structures as returned by the KIPU API
 * - Interfaces without the "Kipu" prefix represent application-specific data structures
 * 
 * For each KIPU API type, there should be a corresponding application type that transforms
 * the snake_case properties to camelCase and adds any application-specific properties.
 * For types that only have one version currently, a placeholder for the other version is created.
 */

/**
 * KIPU API Credentials
 */
export interface KipuCredentials {
  username?: string;
  accessId: string;
  secretKey: string;
  appId: string; // Also referred to as recipient_id
  baseUrl: string;
  apiEndpoint?: string; // For direct API calls
}

/**
 * Application Credentials (placeholder)
 */
export interface Credentials {
  username: string;
  accessId: string;
  secretKey: string;
  appId: string;
  baseUrl: string;
  apiEndpoint?: string;
}

/**
 * KIPU API Response
 */
export interface KipuApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Application API Response (placeholder)
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Casefile type from KIPU EMR
 */
export type Casefile = string; // Format: ^[0-9]+\:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$

/**
 * Raw KIPU Patient data as returned by the API
 */
export interface KipuPatient {
  id: string;
  mrn?: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  status?: string;
  admission_date?: string;
  discharge_date?: string;
  facility_id?: string;
  // Add more fields as needed based on the API documentation
}

/**
 * Application Patient (transformed from KipuPatient)
 */
export interface Patient {
  id: string;
  mrn?: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  status?: string;
  admissionDate?: string;
  dischargeDate?: string;
  facilityId?: string;
}

/**
 * Raw Patient Basic Information from KIPU API
 */
export interface KipuPatientBasicInfo {
  id?: string;
  casefile_id: Casefile;
  first_name: string;
  middle_name?: string;
  last_name: string;
  dob: string;
  admission_date: string;
  discharge_date: string;
  mr_number: string;
  gender?: string;
  contact?: {
    email?: string;
    phone?: string;
  };
  email?: string;
  phone?: string;
}

/**
 * Application-specific Patient Basic Information
 */
export interface PatientBasicInfo {
  patientId: string;
  mrn?: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  status?: string;
  admissionDate?: string;
  dischargeDate?: string;
  facilityId: number;
  fullName?: string;
  age?: number;
  roomNumber?: string;
  primaryDiagnosis?: string;
  insuranceProvider?: string;
  dischargeType: string;
  sobrietyDate: string;
  insurances: object[];
  patient_statuses: object[];
  patient_contacts: object[];
  levelOfCare: string;
  nextLevelOfCare: string;
  nextLevelOfCareDate: string;
  program: string;
  bedName: string;
  roomName: string;
  buildingName: string;
  locationName: string;
}

/**
 * Raw KIPU Patient Appointment data as returned by the API
 */
export interface KipuPatientAppointment {
  id: number;
  start_time: string;
  end_time: string;
  subject: string;
  appointment_type: string;
  status: string;
  billable: boolean;
  all_day: boolean;
  recurring: boolean;
  upcoming_dates?: string[];
  patient_id: string;
  provider_name?: string;
  location?: string;
  notes?: string;
}

/**
 * Application-specific Patient Appointment
 */
export interface PatientAppointment {
  id: string;
  patientId: string;
  facilityId: number;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  type: string;
  provider?: string;
  providerName?: string;
  location?: string;
  notes?: string;
  appointmentType?: string;
  patient_id?: string | number;
}


/**
 * Raw KIPU Vital Sign data as returned by the API
 */
export interface KipuVitalSign {
  id: string | number;
  patient_id: number;
  type: string;
  value: string | number;
  interval_timestamp: string;
  unit?: string;
  notes?: string;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  temperature?: number;
  pulse?: number;
  respirations?: number;
  o2_saturation?: number;
  user_name?: string;
}

/**
 * Application-specific Patient Vital Sign
 */
export interface PatientVitalSign {
  id: string | number;
  patientId: string;
  patient_id?: number;
  facilityId?: string;
  recordedAt: string;
  recordedBy?: string;
  interval_timestamp?: string;
  type: string;
  value: string | number;
  unit?: string;
  notes?: string;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  temperature?: number;
  pulse?: number;
  respirations?: number;
  o2_saturation?: number;
  user_name?: string;
}

/**
 * Raw KIPU Paginated Patients Response
 */
export interface KipuPaginatedPatientsResponse {
  patients: KipuPatientBasicInfo[];
  pagination: {
    current_page: number;
    total_pages: number;
    records_per_page: number;
    total_records: number;
  };
}

/**
 * Application-specific Paginated Patients Response
 */
export interface PaginatedPatientsResponse {
  patients: PatientBasicInfo[];
  pagination: {
    currentPage: number;
    totalPages: number;
    recordsPerPage: number;
    totalRecords: number;
  };
}

/**
 * Raw KIPU Facility data as returned by the API
 */
export interface KipuFacility {
  id: string;
  name: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
}

/**
 * Application-specific Facility (corresponds to KIPU Location)
 */
export interface Facility {
  id: string;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  status?: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
  buildings?: Building[];
  data?: FacilityData;
  api_settings?: FacilityApiSettingsDisplay;
}



/**
 * Raw KIPU Document data as returned by the API
 */
export interface KipuDocument {
  id: string;
  patient_id: string;
  facility_id?: string;
  document_type: string;
  created_date: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  url?: string;
}

/**
 * Application-specific Document
 */
export interface Document {
  id: string;
  patientId: string;
  facilityId?: string;
  documentType: string;
  createdDate: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  url?: string;
}

/**
 * Facility API Settings
 * 
 * Represents the API settings for a facility, including credentials for KIPU integration.
 * Corresponds to the facility_api_settings table in Supabase.
 */
export interface FacilityApiSettings {
  id?: number | string;
  facility_id: string;
  kipu_access_id?: string;
  kipu_secret_key?: string;
  kipu_app_id?: string;
  kipu_base_url?: string;
  has_api_key_configured: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Simplified Facility API Settings for UI display
 * 
 * A subset of FacilityApiSettings used for display in the UI
 */
export interface FacilityApiSettingsDisplay {
  has_api_key_configured: boolean;
  updated_at?: string;
}

/**
 * Building within a Facility
 */
export interface Building {
  id: string;
  name: string;
  code?: string;
  address?: string;
  status?: 'active' | 'inactive';
  facility_id: number;
}

/**
 * Raw KIPU Patient Order data as returned by the API
 */
export interface KipuPatientOrder {
  id: number;
  name: string;
  medication: string;
  route: string;
  dosage_form: string;
  dispense_amount: string;
  refills: number;
  justification: string;
  no_substitutions: boolean;
  warnings: string;
  note: string;
  created_at: string;
  updated_at: string;
  mar_start_time: string;
  mar_end_time: string;
  user_name: string;
  user_id: number;
  discontinued: boolean;
  discontinue_reason: string;
  discontinued_timestamp: string;
  discontinued_user_name: string;
  discontinued_user_id: number;
  discontinue_physician_id: number;
  original_patient_order_id: number;
  instructed_by: string;
  ordered_by: string;
  instructed_via: string;
  medical_necessity_note: string;
  prn: boolean;
  erx: boolean;
  patient_id: number;
  canceled: boolean;
  canceled_timestamp: string;
  diagnosis_code: string;
  status: string;
  interaction_check_error: string;
  is_erx: boolean;
  is_prn: boolean;
  nurse_reviewed_by: string;
  nurse_reviewed_at: string;
  schedule_prn: boolean;
  fdb_data: KipuFdbData[];
}

/**
 * Application-specific Patient Order
 */
export interface PatientOrder {
  id: number | string;
  name: string;
  medication: string;
  route: string;
  dosageForm: string;
  dispenseAmount: string;
  refills: number;
  justification: string;
  noSubstitutions: boolean;
  warnings: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  marStartTime: string;
  marEndTime: string;
  userName: string;
  userId: number;
  discontinued: boolean;
  discontinueReason: string;
  discontinuedTimestamp: string;
  discontinuedUserName: string;
  discontinuedUserId: number;
  discontinuePhysicianId: number;
  originalPatientOrderId: number;
  instructedBy: string;
  orderedBy: string;
  instructedVia: string;
  medicalNecessityNote: string;
  prn: boolean;
  erx: boolean;
  patientId: number | string;
  canceled: boolean;
  canceledTimestamp: string;
  diagnosisCode: string;
  status: string;
  interactionCheckError: string;
  isErx: boolean;
  isPrn: boolean;
  nurseReviewedBy: string;
  nurseReviewedAt: string;
  schedulePrn: boolean;
  fdbData?: KipuFdbData[];
}

/**
 * Raw KIPU FDB Data for medication as returned by the API
 */
export interface KipuFdbData {
  id: number;
  medication_id: number;
  rxcui: string;
  ndc: string;
}

/**
 * Application-specific FDB Data
 */
export interface FdbData {
  id: number;
  medicationId: number;
  rxcui: string;
  ndc: string;
}

/**
 * Raw KIPU Patient Orders Paginated Response as returned by the API
 */
export interface KipuPatientOrdersResponse {
  pagination: {
    current_page: string;
    total_pages: string;
    records_per_page: string;
    total_records: string;
  };
  patient_orders: KipuPatientOrder[];
}

/**
 * Application-specific Patient Orders Response
 */
export interface PatientOrdersResponse {
  pagination: {
    currentPage: number;
    totalPages: number;
    recordsPerPage: number;
    totalRecords: number;
  };
  patientOrders: PatientOrder[];
}

/**
 * Raw KIPU Patient Order Detail Response as returned by the API
 * 
 * Response from the GET /patient_orders/{patient_order_id} endpoint
 * Contains detailed information about a specific patient order including schedules
 */
export interface KipuPatientOrderDetailResponse {
  patient_order: KipuPatientOrder;
  schedules?: Array<{
    id: number;
    patient_order_id: number;
    day_of_week?: string;
    time_of_day?: string;
    frequency?: string;
    frequency_unit?: string;
    start_date?: string;
    end_date?: string;
    created_at: string;
    updated_at: string;
    status: string;
  }>;
}

/**
 * Application-specific Patient Order Detail Response
 */
export interface PatientOrderDetailResponse {
  patientOrder: PatientOrder;
  schedules?: Array<{
    id: number;
    patientOrderId: number;
    dayOfWeek?: string;
    timeOfDay?: string;
    frequency?: string;
    frequencyUnit?: string;
    startDate?: string;
    endDate?: string;
    createdAt: string;
    updatedAt: string;
    status: string;
  }>;
}

/**
 * Raw KIPU Patient Order Query Parameters
 */
export interface KipuPatientOrderQueryParams {
  page?: number;
  per?: number;
  status?: 'canceled' | 'pending_order_review' | 'pending_discontinue_review' | 'reviewed';
  medication_name?: string;
  created_at_start_date?: string;
  created_at_end_date?: string;
  updated_at_start_date?: string;
  updated_at_end_date?: string;
  rxcui?: string;
  ndc?: string;
  patient_master_id?: string;
}

/**
 * Application-specific Patient Order Query Parameters
 */
export interface PatientOrderQueryParams {
  page?: number;
  per?: number;
  status?: 'canceled' | 'pending_order_review' | 'pending_discontinue_review' | 'reviewed';
  medication_name?: string;
  created_at_start_date?: string;
  created_at_end_date?: string;
  updated_at_start_date?: string;
  updated_at_end_date?: string;
  rxcui?: string;
  ndc?: string;
  patient_master_id?: string;
}

/**
 * Additional data associated with a Facility
 */
export interface FacilityData {
  beds?: {
    total: number;
    available: number;
    occupied: number;
  };
  staff?: {
    total: number;
    active: number;
  };
  patients?: {
    total: number;
    admitted: number;
    discharged: number;
  };
  insights?: {
    occupancy_rate?: number;
    avg_length_of_stay?: number;
    readmission_rate?: number;
    [key: string]: any;
  };
  metrics?: Record<string, any>;
}

/**
 * Blood Pressure measurement
 */
export interface BloodPressure {
  systolic: string;
  diastolic: string;
}

/**
 * Raw KIPU Consent Form Record Extended as returned by the API
 */
export interface KipuConsentFormRecordExtended {
  id: number;
  patient_casefile_id: Casefile;
  consent_form_id: number;
  name: string;
  complete: boolean;
  expires: boolean;
  expired: boolean;
  expiration_date: string | null;
  error?: string;
  fields?: Record<string, any>;
  content?: Record<string, any>;
}

/**
 * Application-specific Consent Form Record
 */
export interface ConsentFormRecordExtended {
  id: number;
  patient_casefile_id: Casefile;
  consent_form_id: number;
  name: string;
  complete: boolean;
  expires: boolean;
  expired: boolean;
  expiration_date: string | null;
  error?: string;
  fields?: Record<string, any>;
  content?: Record<string, any>;
}

/**
 * Settings Object
 */
export interface SettingsObject {
  Id: number;
  Code: string;
  Name?: string;
}

/**
 * Raw KIPU Patient Appointments Response as returned by the API
 */
export interface KipuPatientAppointmentsResponse {
  appointments?: Array<KipuPatientAppointment>;
  pagination?: {
    current_page: string;
    total_pages: string;
    records_per_page: string;
    total_records: string;
  };
}

/**
 * Application-specific Patient Appointments Response
 */
export interface PatientAppointmentsResponse {
  appointments?: Array<PatientAppointment>;
  pagination?: {
    currentPage: number;
    totalPages: number;
    recordsPerPage: number;
    totalRecords: number;
  };
}



/*
_____________________________________
EVALUATIONS
_____________________________________
*/
export interface KipuEvaluation {
  id: number;
  name: string;
  status: string;
  patient_casefile_id: string;
  evaluation_id: number;
  patient_process_id: number;
  require_signature: boolean;
  require_patient_signature: boolean;
  billable: boolean;
  evaluation_type: string;
  evaluation_content: string;
  ancillary: boolean;
  rendering_provider: null;
  billable_claim_format: string;
  require_guarantor_signature: boolean;
  require_guardian_signature: boolean;
  is_crm: boolean;
  available_on_portal: boolean;
  place_of_service: string;
  billing_codes: Record<string, any>;
  signature_user_titles: Record<string, any>;
  review_signature_user_titles: Record<string, any>;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  master_treatment_plan_category: string;
  force_all_staff_users_titles: boolean;
  force_all_review_users_titles: boolean;
  evaluation_version_id: number;
  locked: boolean;
  is_required: boolean;
  patient_evaluation_items: Array<KipuPatientEvaluationItem>;
  notes?: string;
  provider_name?: string;
  patient_id?: string;
  items?: Array<KipuEvaluationItemObject>;
}
export interface KipuEvaluationItemObject {
  id: number;
  field_type: string;
  name: string;
  record_names: string;
  column_names: string;
  label: string;
  enabled: boolean;
  optional: boolean;
  evaluation_id: number;
  default_value: string;
  divider_below: boolean;
  rule: string;
  placeholder: string;
  pre_populate_with_id: number;
  parent_item_id: string;
  conditions: string;
  label_width: string;
  item_group: string;
  show_string: string;
  show_string_css: string;
  matrix_default_records: number;
  css_style: string;
  image?: string;
  skip_validations?: boolean;
  question?: string;
  answer?: string;
}

export enum KipuPatientEvaluationFieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  SELECT = 'select',
  DATE = 'date',
  TIME = 'time',
  DATETIME = 'datetime',
  FILE = 'file',
  IMAGE = 'image',
  SIGNATURE = 'signature',
  DIVIDER = 'divider',
  HEADER = 'header',
  SUBHEADER = 'subheader',
  PARAGRAPH = 'paragraph',
  MATRIX = 'matrix',
  POINTS = 'points'
}

export interface KipuPatientEvaluation {
  id: number | string;
  name: string;
  status: string;
  patientCasefileId?: string;
  patientId?: string;
  billable?: boolean;
  placeOfService?: string;
  billingCodes?: Record<string, any>;
  requireSignature?: boolean;
  requirePatientSignature?: boolean;
  requireGuarantorSignature?: boolean;
  requireGuardianSignature?: boolean;
  availableOnPortal?: boolean;
  isCrm?: boolean;
  masterTreatmentPlanCategory?: any;
  forceAllReviewUsersTitles?: boolean;
  forceAllStaffUsersTitles?: boolean;
  reviewSignatureUserTitles?: Record<string, any>;
  signatureUserTitles?: Record<string, any>;
  locked?: boolean;
  isRequired?: boolean;
  evaluationVersionId?: any;
  ancillary?: any;
  billableClaimFormat?: any;
  rendering_provider?: any;
  evaluationId?: number;
  patientProcessId?: number;
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string | null;
  evaluationContent?: string; // Raw field from KIPU
  type?: string;
  evaluationType?: string; // Raw field from KIPU
  notes?: string;
  userId?: number;
  userName?: string;
  formData?: Record<string, any>;
  providerName?: string;
  items?: KipuPatientEvaluationItem[];
  evaluationItems?: Array<KipuPatientEvaluationItem>;
  renderingProvider?: any;
}

export interface KipuPatientEvaluationItemBase {
  id: string;
  name: string;
  evaluation_item_id: number;
  created_at: string;
  updated_at?: string;
  field_type: KipuPatientEvaluationFieldType;
  label: string;
  optional: boolean;
  divider_below: boolean;
}

export interface KipuPatientEvaluationItem {
  id: string;
  evaluation_id: string;
  question: string;
  answer?: string;
  answer_type: 'text' | 'number' | 'checkbox' | 'radio' | 'select';
  options?: { value: string; label: string; }[];
  required: boolean;
  created_at: string;
  updated_at?: string;
  evaluation_name?: string;
  description?: string;
  timestamp?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  duration?: string | null;
  record_names?: string;
  bed_name?: string;
  bmi?: string;
  primary_therapist?: string;
  assigned_on?: string | null;
  key?: string;
  diag_code?: string | null;
  diets?: string;
  other_restrictions?: string;
  discharge_type?: string;
  employer?: string;
  race?: string;
  ethnicity?: string;
  option_text?: string;
  points?: string;
  height?: number;
  weight?: number;
  height_units?: string;
  weight_units?: string;
  blood_pressure?: BloodPressure;
  respirations?: string;
  temperature?: string;
  pulse?: string;
  o2_saturation?: string;
  loc_label?: string;
  loc_value?: string;
}
