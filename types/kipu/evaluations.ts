// types/kipu/evaluations.ts
import { Casefile } from '../chartChek/kipuAdapter';

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
  id: number;
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
  blood_pressure?: Record<string, unknown>; // Object (structure not specified)
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
  id: number;
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
  billable: boolean;
  evaluation_type: string;
  evaluation_content: string;
  ancillary: boolean;
  rendering_provider: boolean;
  billable_claim_format: string;
  require_guarantor_signature: boolean;
  require_guardian_signature: boolean;
  is_crm: boolean;
  available_on_portal: boolean;
  place_of_service: string;
  billing_codes: string;
  signature_user_titles: string;
  review_signature_user_titles: string;
  master_treatment_plan_category: string;
  force_all_staff_users_titles: boolean;
  force_all_review_users_titles: boolean;
  evaluation_version_id: number;
  locked: boolean;
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








