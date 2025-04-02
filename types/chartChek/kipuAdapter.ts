
export const KipuFieldTypes = [
  "auto_complete",
  "patient.admission_datetime",
  "patient.allergies",
  "patient.attendances",
  "patient.bed",
  "patient.bmi",
  "patient.brought_in_medication",
  "patient.diagnosis_code",
  "patient.diagnosis_code_current",
  "patient.diets",
  "patient.discharge_datetime",
  "patient.electronic_devices",
  "patient.employer",
  "patient.ethnicity",
  "patient.height_weight",
  "patient.height_weight_current",
  "patient.level_of_care_clinical",
  "patient.level_of_care_ur",
  "patient.locker",
  "patient.marital_status",
  "patient.medication_current",
  "patient.occupation",
  "patient.recurring_forms",
  "patient.vital_signs",
  "patient.orthostatic_vitals",
  "patient.ciwa_ar",
  "patient.ciwa_b",
  "patient.cows",
  "patient.ciwa_ar_current",
  "patient.ciwa_b_current",
  "patient.cows_current",
  "patient.vital_signs_current",
  "patient.orthostatic_vital_signs_current",
  "patient.glucose_log",
  "patient.drug_of_choice",
  "patient.toggle_mars_generation",
  "treatment_plan_column_titles",
  "treatment_plan_item",
  "create_evaluation",
  "image",
  "image_with_canvas",
  "matrix",
  "timestamp",
  "treatment_plan_master_plan",
  "patient.discharge_type",
  "treatment_plan_problem",
  "problem_list",
  "progress_note",
  "golden_thread_tag",
  "treatment_plan_goal",
  "treatment_plan_objective",
  "patient.anticipated_discharge_date",
  "patient.discharge_medications",
  "points_item",
  "title",
  "drop_down_list",
  "string",
  "check_box_first_value_none",
  "text",
  "radio_buttons",
  "check_box",
  "patient.medication_inventory",
  "points_total",
  "evaluation_start_and_end_time",
  "evaluation_datetime",
  "datestamp",
  "evaluation_name",
  "attachments",
  "evaluation_date",
  "evaluation_name_drop_down",
  "formatted_text",
  "conditional_question",
  "care_team.Primary_Therapist",
  "care_team.Case_Manager",
  "care_team.Peer_Support_Specialist",
  "care_team.Intake_Technician",
  "care_team.Peer_Support_Specialist_Swing",
  "care_team.Peer_Support_Specialist_Off_Day",
  "care_team.Other_Case_Manager",
  "care_team.Peer_Support",
  "care_team.intake_specialist",
  "care_team.",
  "care_team.Other_therapist",
  "drop_down_list",
  "evaluation_date",
  "evaluation_datetime",
  "evaluation_name",
  "formatted_text",
  "check_box",
  "text",
  "radio_buttons",
  "title",
  "string",
  "points_item",
  "points_total",
  "matrix"
] as const;

export type KipuFieldType = typeof KipuFieldTypes[number];
export interface KipuEvaluationItem {
  id: number;
  field_type: KipuFieldType;
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
  pre_populate_with_id: null | number;
  parent_item_id: null | string;
  conditions: string;
  label_width: string;
  item_group: string;
  show_string: string;
  show_string_css: string;
  matrix_default_records: null | number;
  css_style: string;
  image: string;
  skip_validations: boolean;
}

export interface KipuEvaluationLocation {
  location_id: number;
  location_name: string;
}

export interface KipuEvaluation {
  id: number;
  name: string;
  enabled: boolean;
  patient_process_id: number;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  only_one_per_patient: boolean;
  billable: boolean;
  available_on_portal: boolean;
  place_of_service: string;
  is_crm: boolean;
  locked: boolean;
  ancillary: boolean;
  rendering_provider: null | string;
  editable: boolean;
  require_signature: boolean;
  require_review_signature: boolean;
  signature_user_titles: Record<string, string>;
  review_signature_user_titles: Record<string, string>;
  force_all_staff_users_titles: boolean;
  force_all_review_users_titles: boolean;
  show_patient_header: boolean;
  load_manually: boolean;
  allow_tech_access: boolean;
  recurring: boolean;
  recurring_start_time: string;
  interval: null | string;
  evaluation_type: string;
  deleted: boolean;
  evaluation_content: string;
  billing_codes: {
    HCode: any[];
    CCode: any[];
    RCode: any[];
    Custom: any[];
  };
  billable_claim_format: string;
  evaluation_version_id: number;
  require_patient_signature: boolean;
  require_guarantor_signature: boolean;
  require_guardian_signature: boolean;
  is_required: boolean;
  show_completed_compressed_vertical: boolean;
  rendering_provider_setting_display_option_id: number;
  rendering_provider_autopop_option_id: number;
  primary_performing_provider_autopop_option_id: number;
  secondary_performing_provider_autopop_option_id: number;
  locations?: KipuEvaluationLocation[];
  evaluation_items?: KipuEvaluationItem[];
}

export interface KipuPatientEvaluationItem {
  id: string;
  name: string;
  evaluation_name?: string;
  evaluation_item_id: number;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
  field_type: KipuFieldType; // Expected enum value (e.g. one of 96 possible values)
  label: string;
  optional: boolean;
  divider_below: boolean;
  question?: string;
  answer?: string;
  description?: string;
  // Nullable datetime strings; they may be null or a valid datetime string.
  timestamp?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  duration?: string | null;
  record_names?: string;
  bed_name?: string;
  bmi?: string;
  primary_therapist?: string;
  assigned_on?: string | null; // Date string
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
  blood_pressure?: BloodPressure; // Object (structure not specified)
  respirations?: string;
  temperature?: string;
  pulse?: string;
  o2_saturation?: string;
  loc_label?: string;
  loc_value?: string;
  date_of_change?: string | null; // Date string
  transition_to_level_of_care?: string | null;
  blood_pressure_systolic_lying?: string;
  blood_pressure_diastolic_lying?: string;
  blood_pressure_systolic_sitting?: string;
  blood_pressure_diastolic_sitting?: string;
  blood_pressure_systolic_standing?: string;
  blood_pressure_diastolic_standing?: string;
  pulse_lying?: string;
  pulse_sitting?: string;
  pulse_standing?: string;
  ciwa_ar_interval_label?: string;
  ciwa_ar_interval?: string | null;
  ciwa_ar_agitation_label?: string;
  ciwa_ar_agitation?: string | null;
  ciwa_ar_anxiety_label?: string;
  ciwa_ar_anxiety?: string | null;
  ciwa_ar_auditory_disturbances_label?: string;
  ciwa_ar_auditory_disturbances?: string | null;
  ciwa_ar_clouding_of_sensorium_label?: string;
  ciwa_ar_clouding_of_sensorium?: string | null;
  ciwa_ar_headache_label?: string;
  ciwa_ar_headache?: string | null;
  ciwa_ar_nausea_label?: string;
  ciwa_ar_nausea?: string | null;
  ciwa_ar_paroxysmal_sweats_label?: string;
  ciwa_ar_paroxysmal_sweats?: string | null;
  ciwa_ar_tactile_disturbances_label?: string;
  ciwa_ar_tactile_disturbances?: string | null;
  ciwa_ar_tremor_label?: string;
  ciwa_ar_tremor?: string | null;
  ciwa_ar_visual_disturbances_label?: string;
  ciwa_ar_visual_disturbances?: string | null;
  score?: number;
  ciwa_b_interval_label?: string;
  ciwa_b_irritable_label?: string;
  ciwa_b_fatigued_label?: string;
  ciwa_b_tensed_label?: string;
  ciwa_b_difficulty_concentrating_label?: string;
  ciwa_b_loss_of_appetite_label?: string;
  ciwa_b_numbness_label?: string;
  ciwa_b_heart_racing_label?: string;
  ciwa_b_head_full_achy_label?: string;
  ciwa_b_muscle_ache_label?: string;
  ciwa_b_anxiety_label?: string;
  ciwa_b_upset_label?: string;
  ciwa_b_restful_sleep_label?: string;
  ciwa_b_enough_sleep_label?: string;
  ciwa_b_visual_disturbances_label?: string;
  ciwa_b_fearful_label?: string;
  ciwa_b_possible_misfortunes_label?: string;
  ciwa_b_sweating_agitation_label?: string;
  ciwa_b_tremors_label?: string;
  ciwa_b_feel_palms_label?: string;
  ciwa_b_interval?: string | null;
  ciwa_b_irritable?: string | null;
  ciwa_b_fatigued?: string | null;
  ciwa_b_tensed?: string | null;
  ciwa_b_difficulty_concentrating?: string | null;
  ciwa_b_loss_of_appetite?: string | null;
  ciwa_b_numbness?: string | null;
  ciwa_b_heart_racing?: string | null;
  ciwa_b_head_full_achy?: string | null;
  ciwa_b_muscle_ache?: string | null;
  ciwa_b_anxiety?: string | null;
  ciwa_b_upset?: string | null;
  ciwa_b_restful_sleep?: string | null;
  ciwa_b_enough_sleep?: string | null;
  ciwa_b_visual_disturbances?: string | null;
  ciwa_b_fearful?: string | null;
  ciwa_b_possible_misfortunes?: string | null;
  ciwa_b_sweating_agitation?: string | null;
  ciwa_b_tremors?: string | null;
  ciwa_b_feel_palms?: string | null;
  cow_interval_labe?: string;
  cow_pulse_rate_label?: string;
  cow_sweating_label?: string;
  cow_restlessness_label?: string;
  cow_pupil_size_label?: string;
  cow_bone_joint_ache_label?: string;
  cow_runny_nose_label?: string;
  cow_gi_upset_label?: string;
  cow_tremor_label?: string;
  cow_yawning_label?: string;
  cow_anxiety_irritability_label?: string;
  cow_gooseflesh_skin_label?: string;
  cow_interval?: string | null;
  cow_pulse_rate?: string | null;
  cow_sweating?: string | null;
  cow_restlessness?: string | null;
  cow_pupil_size?: string | null;
  cow_bone_joint_ache?: string | null;
  cow_runny_nose?: string | null;
  cow_gi_upset?: string | null;
  cow_tremor?: string | null;
  cow_yawning?: string | null;
  cow_anxiety_irritability?: string | null;
  cow_gooseflesh_skin?: string | null;
  marital_status?: string;
  locker?: string;
  occupation?: string;
  medications?: string;
  total_problems?: number;
  problems?: any[]; // Details not specified
  attendances_last_updated?: string;
  patient_attendances?: any[];
  patient_orders?: any[];
  glucose_logs?: any[];
  evaluations?: any[];
  eval_notes?: any[];
  titles?: any[];
  eval_treatment_plans?: any[];
  grouped_treatment_plans?: any[];
  inventories?: any[];
  drugs_of_choice?: any[];
  electronic_devices?: any[];
  brought_in_medications?: any[];
  allergies?: any[];
  records?: any[];
  notes?: any[];
  oneOf?: (boolean | string)[];
}

export interface KipuPatientEvaluation {
  id: string;
  name: string;
  status: string;
  patient_casefile_id: string; // Must follow the regex pattern: ^[0-9]+\:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$
  evaluation_id: number;
  patient_process_id?: number;
  created_at: string; // ISO datetime string
  created_by: string;
  updated_at: string; // ISO datetime string
  updated_by: string;
  require_signature: boolean;
  require_patient_signature: boolean;
  billable?: boolean;
  evaluation_type: string;
  evaluation_content: string;
  ancillary?: boolean;
  rendering_provider?: any;
  billable_claim_format: string;
  require_guarantor_signature: boolean;
  require_guardian_signature: boolean;
  is_crm: boolean;
  available_on_portal: boolean;
  place_of_service: string;
  billing_codes: any;
  signature_user_titles: string;
  review_signature_user_titles: string;
  master_treatment_plan_category: string;
  force_all_staff_users_titles: boolean;
  force_all_review_users_titles: boolean;
  evaluation_version_id: number;
  locked?: boolean;
  is_required: boolean;
  patient_evaluation_items: KipuPatientEvaluationItem[] | null;
}


// ________________________
export interface KipuEvaluationResponse {
  success: boolean;
  data: {
    evaluation: KipuEvaluation;
  };
}

export interface KipuPatientEvaluationResponse {
  success: boolean;
  data: {
    patient_evaluation: KipuPatientEvaluation;
  };
}

export interface KipuPatientEvaluationsResponse {
  pagination: {
    current_page: string;
    total_pages: string;
    records_per_page: string;
    total_records: string;
  };
  patient_evaluations: KipuPatientEvaluation[];
}










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
   * Raw KIPU Location data as returned by the API
   */
  export interface KipuLocation {
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
    id: number;
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
    enabled?: boolean;
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
    rendering_provider: string | null;
    billable_claim_format: string;
    require_guarantor_signature: boolean;
    require_guardian_signature: boolean;
    is_crm: boolean;
    available_on_portal: boolean;
    place_of_service: string;
    billing_codes: {
      HCode: any[];
      CCode: any[];
      RCode: any[];
      Custom: any[];
    };
    signature_user_titles: Record<string, string>;
    review_signature_user_titles: Record<string, string>;
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
    question?: string;
    answer?: string;
    answer_type: 'text' | 'number' | 'checkbox' | 'radio' | 'select';
    options?: { value: string; label: string; }[];
    required: boolean;
    created_at: string;
    updated_at: string;
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
  
  export interface KipuPatientEvaluation {
    id: string;
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
    ancillary?: boolean;
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
  
 