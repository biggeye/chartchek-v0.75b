/**
 * KIPU API Type Definitions
 * 
 * This file contains TypeScript interfaces for the KIPU API integration.
 */

/**
 * KIPU API Credentials
 */
export interface KipuCredentials {
  username: string;
  accessId: string;
  secretKey: string;
  appId: string; // Also referred to as recipient_id
  baseUrl: string;
  apiEndpoint?: string; // For direct API calls
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
 * Casefile type from KIPU EMR
 */
export type Casefile = string; // Format: ^[0-9]+\:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$

/**
 * KIPU Patient
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
 * Patient Basic Information from KIPU API
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
}

/**
 * Patient Basic Information
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
  facilityId: string;
  // Additional fields for UI display
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
 * Patient Evaluation
 */
export interface PatientEvaluation {
  id: number;
  name: string;  // This is the title/name of the evaluation
  status: string;
  patientCasefileId: string;
  evaluationId: number;
  patientProcessId: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string | null;
  evaluationContent: string;
}

/**
 * Patient Vital Sign
 */
export interface PatientVitalSign {
  id: string;
  patientId: string;
  facilityId: string;
  recordedAt: string;
  recordedBy?: string;
  type: string;
  value: string | number;
  unit?: string;
  notes?: string;
}

/**
 * Patient Appointment
 */
export interface PatientAppointment {
  id: string;
  patientId: string;
  facilityId: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  type: string;
  provider?: string;
  location?: string;
  notes?: string;
}

/**
 * Paginated Patients Response
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
 * KIPU Facility
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
 * KIPU Patient Evaluation
 */
export interface KipuPatientEvaluation {
  id: string;
  patient_id: string;
  facility_id?: string;
  evaluation_type: string;
  evaluation_date: string;
  status: string;
  completed_by?: string;
  content?: Record<string, any>;
  // Add more fields as needed based on the API documentation
}

/**
 * KIPU Document
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
  // Add more fields as needed based on the API documentation
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
 * Facility (corresponds to KIPU Location)
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
 * Building within a Facility
 */
export interface Building {
  id: string;
  name: string;
  code?: string;
  address?: string;
  status?: 'active' | 'inactive';
  facility_id: string;
}

/**
 * KIPU Patient Order
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
 * KIPU FDB Data for medication
 */
export interface KipuFdbData {
  id: number;
  medication_id: number;
  rxcui: string;
  ndc: string;
}

/**
 * KIPU Patient Orders Paginated Response
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
 * Patient Order Query Parameters
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
 * Patient Evaluation Field Type
 */
export type PatientEvaluationFieldType = 
  | 'auto_complete' | 'patient.admission_datetime' | 'patient.allergies' 
  | 'patient.attendances' | 'patient.bed' | 'patient.bmi' 
  | 'patient.brought_in_medication' | 'patient.diagnosis_code' 
  | 'patient.diagnosis_code_current' | 'patient.diets' 
  | 'patient.discharge_datetime' | 'patient.electronic_devices' 
  | 'patient.employer' | 'patient.ethnicity' | 'patient.height_weight' 
  | 'patient.height_weight_current' | 'patient.level_of_care_clinical' 
  | 'patient.level_of_care_ur' | 'patient.locker' | 'patient.marital_status' 
  | 'patient.medication_current' | 'patient.occupation' | 'patient.recurring_forms' 
  | 'patient.vital_signs' | 'patient.orthostatic_vitals' | 'patient.ciwa_ar' 
  | 'patient.ciwa_b' | 'patient.cows' | 'patient.ciwa_ar_current' 
  | 'patient.ciwa_b_current' | 'patient.cows_current' | 'patient.vital_signs_current' 
  | 'patient.orthostatic_vital_signs_current' | 'patient.glucose_log' 
  | 'patient.drug_of_choice' | 'patient.toggle_mars_generation' 
  | 'treatment_plan_column_titles' | 'treatment_plan_item' | 'create_evaluation' 
  | 'image' | 'image_with_canvas' | 'matrix' | 'timestamp' 
  | 'treatment_plan_master_plan' | 'patient.discharge_type' 
  | 'treatment_plan_problem' | 'problem_list' | 'progress_note' 
  | 'golden_thread_tag' | 'treatment_plan_goal' | 'treatment_plan_objective' 
  | 'patient.anticipated_discharge_date' | 'patient.discharge_medications' 
  | 'points_item' | 'title' | 'drop_down_list' | 'string' 
  | 'check_box_first_value_none' | 'text' | 'radio_buttons' | 'check_box' 
  | 'patient.medication_inventory' | 'points_total' | 'evaluation_start_and_end_time' 
  | 'evaluation_datetime' | 'datestamp' | 'evaluation_name' | 'attachments' 
  | 'evaluation_date' | 'evaluation_name_drop_down' | 'formatted_text' 
  | 'conditional_question' | 'care_team.Primary_Therapist' | 'care_team.Case_Manager' 
  | 'care_team.Peer_Support_Specialist' | 'care_team.Intake_Technician' 
  | 'care_team.Peer_Support_Specialist_Swing' | 'care_team.Peer_Support_Specialist_Off_Day' 
  | 'care_team.Other_Case_Manager' | 'care_team.Peer_Support' | 'care_team.intake_specialist' 
  | 'care_team.' | 'care_team.Other_therapist';

/**
 * Patient Evaluation Item Base
 */
export interface PatientEvaluationItemBase {
  id: string;
  name: string;
  evaluation_item_id: number;
  created_at: string;
  updated_at?: string;
  field_type: PatientEvaluationFieldType;
  label: string;
  optional: boolean;
  divider_below: boolean;
}

/**
 * Patient Evaluation Item
 */
export interface KipuPatientEvaluationItem extends PatientEvaluationItemBase {
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

/**
 * Evaluation Item Object
 */
export interface EvaluationItemObject {
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
}

/**
 * Consent Form Record Extended
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
 * KIPU Evaluation
 */
export interface KipuEvaluation {
  id: number | string;
  evaluation_type: string;
  created_at: string;
  updated_at?: string;
  status: string;
  notes?: string;
  patient_id: number | string;
  user_id?: number;
  user_name?: string;
  form_data?: Record<string, any>;
  provider_name?: string;
  items?: {
    id: string;
    question: string;
    answer?: string;
  }[];
}

/**
 * Patient Evaluation Item
 */
export interface PatientEvaluationItem {
  id: string;
  evaluation_id: string;
  question: string;
  answer?: string;
  answer_type: 'text' | 'number' | 'checkbox' | 'radio' | 'select';
  options?: { value: string; label: string; }[];
  required: boolean;
  created_at: string;
  updated_at?: string;
}
