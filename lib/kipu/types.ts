/**
 * Kipu EMR System Type Definitions
 * 
 * These types reflect the data structures used in the Kipu EMR system
 * for behavioral health and substance abuse treatment facilities.
 */

export type Casefile = string; // Format: ^[0-9]+\:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$

export interface PatientBasicInfo {
  id?: string; // Added to match facility JSON structure
  casefile_id: Casefile;
  first_name: string;
  middle_name: string;
  last_name: string;
  dob: string;
  admission_date: string;
  discharge_date: string;
  mr_number: string;
}

export interface PatientOrderWithSchedules {
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
  fdb_data: any[];
  patient_order_items: any[];
}

export interface SettingsObject {
  Id: number;
  Code: string;
  Name?: string;
}

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

  export interface PatientEvaluationItemBase {
    id: string;
    name: string;
    evaluation_item_id: number;
    created_at: string;
    updated_at?: string; // Make this optional to match the child interface
    field_type: PatientEvaluationFieldType;
    label: string;
    optional: boolean;
    divider_below: boolean;
  }

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
  image: string;
  skip_validations: boolean;
}

export interface BloodPressure {
  systolic: string;
  diastolic: string;
}

export interface PatientEvaluationItem extends PatientEvaluationItemBase {
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
  date_of_change?: string | null;
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
  
  // CIWA-B fields
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
  
  // COWS fields
  cow_interval_label?: string;
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
  
  // Patient information
  marital_status?: string;
  locker?: string;
  occupation?: string;
  medications?: string;
  total_problems?: number;
  problems?: any[];
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
}

export interface FacilityData {
  patients?: any[];
  evaluations?: any[];
  contacts?: any[];
  glucose_logs?: any[];
  appointments?: any[];
  group_sessions?: any[];
  consent_form_records?: any[];
  vaults?: any[];
  vital_signs?: any[];
  providers?: any[];
  lab_results?: any[];
  patient_orders?: any[];
  medications?: any[];
  billing_data?: {
    insurancePlans: Array<{
      type: string;
      count: number;
    }>;
    totalDaysAuthorized: number;
    daysRemaining: number;
    upcomingReviews: Array<{
      patientName: string;
      date: string;
      reviewType: string;
    }>;
    outstandingPayments: number;
    activeAppeals: number;
    claimsToAppeal: number;
  };
  facility_insights?: {
    currentCensus: number;
    bedCapacity: number;
    occupancyRate: number;
    recentAdmissions: number;
    recentDischarges: number;
    upcomingAdmissions: number;
    staffOnDuty: number;
    patientToStaffRatio: string;
    alerts: string[];
  };
  compliance_data?: {
    documentationStatus: {
      complete: number;
      pending: number;
      overdue: number;
    };
    upcomingDeadlines: Array<{
      title: string;
      date: string;
    }>;
    staffCertifications: {
      current: number;
      expiringSoon: number;
      expired: number;
    };
    auditReadiness: Array<{
      name: string;
      score: number;
    }>;
  };
}

// Facility type matching the JSON structure
export interface Facility {
  id?: string; // Make id optional since it's not in the actual JSON data
  facility_id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  created_at: string;
  data: FacilityData;
  meta?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    patients_count?: number;
    documents_count?: number;
    [key: string]: any;
  };
}

// Kipu Evaluation Interface - moved from evaluations.ts
export interface KipuEvaluation {
  id: number | string; // Allow both number and string types for ID
  evaluation_type: string;
  created_at: string;
  updated_at?: string; // Make this optional to match component usage
  status: string;
  notes?: string;
  patient_id: number | string; // Allow both number and string types for patient_id
  user_id?: number; // Make optional
  user_name?: string; // Make optional
  form_data?: Record<string, any>; // Make optional
  provider_name?: string;
  items?: {
    id: string;
    question: string;
    answer?: string;
  }[];
}

export interface PatientEvaluationItem {
  id: string;
  evaluation_id: string;
  question: string;
  answer?: string;
  answer_type: 'text' | 'number' | 'checkbox' | 'radio' | 'select';
  options?: { value: string; label: string; }[];
  value: string;
  label: string;
  required: boolean;
  created_at: string;
  updated_at?: string;
}

export interface PatientEvaluation {
  id: string;
  patient_id: string;
  evaluation_type: string;
  notes: string;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  status: 'draft' | 'completed' | 'reviewed';
  items?: PatientEvaluationItem[];
}