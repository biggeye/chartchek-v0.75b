// types/kipu/evaluations.ts
import { Casefile } from './index';

/**
 * KIPU Evaluation Item
 * 
 * Represents a single field/question in a KIPU evaluation form
 */
export interface KipuEvaluationItem {
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
/**
 * KIPU Evaluation Location
 * 
 * Represents a location where an evaluation can be administered
 */
export interface KipuEvaluationLocation {
  location_id: number;
  location_name: string;
}

/**
 * KIPU Evaluation
 * 
 * Represents a full evaluation form in the KIPU system
 */
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

/**
 * KIPU Patient Evaluation
 * 
 * Represents an instance of an evaluation for a specific patient
 */
export interface KipuPatientEvaluation {
    id: number;
    evaluation_id: number;
    patient_id: string;
    casefile_id: Casefile;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
    completed_by: string | null;
    status: 'incomplete' | 'complete' | 'in_progress';
    evaluation_data: Record<string, any>;
    evaluation_name: string;
    evaluation_version_id: number;
  }
  
  /**
   * KIPU Evaluations Response
   */
  export interface KipuEvaluationsResponse {
    pagination: {
      current_page: string;
      total_pages: string;
      records_per_page: string;
      total_records: string;
    };
    evaluations: KipuEvaluation[];
  }
  
  /**
   * KIPU Patient Evaluations Response
   */
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
 * KIPU Evaluation Response
 * 
 * Response from the GET /evaluations/{id} endpoint
 */
export interface KipuEvaluationResponse {
    success: boolean;
    data: {
      evaluation: KipuEvaluation;
    };
  }
  
  /**
   * KIPU Patient Evaluation Response
   * 
   * Response from the GET /patient_evaluations/{id} endpoint
   */
  export interface KipuPatientEvaluationResponse {
    success: boolean;
    data: {
      patient_evaluation: KipuPatientEvaluation;
    };
  }
  
  /**
   * Application-specific Patient Evaluation
   */
  export interface PatientEvaluation {
    id: number;
    evaluationId: number;
    patientId: string;
    casefileId: Casefile;
    createdAt: string;
    updatedAt: string;
    completedAt: string | null;
    completedBy: string | null;
    status: 'incomplete' | 'complete' | 'in_progress';
    data: Record<string, any>;
    evaluationName: string;
    evaluationVersionId: number;
  }
/**
 * Application-specific Evaluation Item
 */
export interface EvaluationItem {
  id: number;
  fieldType: string;
  name: string;
  label: string;
  enabled: boolean;
  optional: boolean;
  evaluationId: number;
  defaultValue: string;
  dividerBelow: boolean;
  rule: string;
  placeholder: string;
  parentItemId: null | number;
  conditions: string;
  cssStyle: string;
  recordNames?: Record<string, string>;
  options?: Array<{
    value: string;
    label: string;
    points?: number;
  }>;
}

/**
 * Application-specific Evaluation
 */
export interface Evaluation {
  id: number;
  name: string;
  enabled: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  requireSignature: boolean;
  evaluationType: string;
  locations: Array<{
    id: number;
    name: string;
  }>;
  items: EvaluationItem[];
}