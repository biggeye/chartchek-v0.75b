import { Casefile } from '../kipu/index';

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


export interface KipuPatientEvaluationItem {
    id: number;
    name: string;
    evaluationName?: string;
    evaluationItemId: number;
    createdAt: string; // ISO datetime string
    updatedAt: string; // ISO datetime string
    fieldType: string; // Expected enum value (e.g. one of 96 possible values)
    label: string;
    optional: boolean;
    dividerBelow: boolean;
    description?: string;
    // Nullable datetime strings; they may be null or a valid datetime string.
    timestamp?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    duration?: string | null;
    recordNames?: string;
    // COWS fields (camelCase)
    cowIntervalLabel?: string;
    cowPulseRateLabel?: string;
    cowSweatingLabel?: string;
    cowRestlessnessLabel?: string;
    cowPupilSizeLabel?: string;
    cowBoneJointAcheLabel?: string;
    cowRunnyNoseLabel?: string;
    cowGiUpsetLabel?: string;
    cowTremorLabel?: string;
    cowYawningLabel?: string;
    cowAnxietyIrritabilityLabel?: string;
    cowGoosefleshSkinLabel?: string;
    cowInterval?: string | null;
    cowPulseRate?: string | null;
    cowSweating?: string | null;
    cowRestlessness?: string | null;
    cowPupilSize?: string | null;
    cowBoneJointAche?: string | null;
    cowRunnyNose?: string | null;
    cowGiUpset?: string | null;
    cowTremor?: string | null;
    cowYawning?: string | null;
    // Note: This is truncated as per the original interface
  }
  
  
  export interface KipuPatientEvaluation {
    id: number;
    name: string;
    status: string;
    patientCasefileId: string; // Must follow the regex pattern: ^[0-9]+\\:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$
    evaluationId: number;
    patientProcessId?: number;
    createdAt: string; // ISO datetime string
    createdBy: string;
    updatedAt: string; // ISO datetime string
    updatedBy: string;
    requireSignature: boolean;
    requirePatientSignature: boolean;
    billable: boolean;
    evaluationType: string;
    evaluationContent: string;
    ancillary: boolean;
    renderingProvider: boolean;
    billableClaimFormat: string;
    requireGuarantorSignature: boolean;
    requireGuardianSignature: boolean;
    isCrm: boolean;
    availableOnPortal: boolean;
    placeOfService: string;
    billingCodes: string;
    signatureUserTitles: string;
    reviewSignatureUserTitles: string;
    masterTreatmentPlanCategory: string;
    forceAllStaffUsersTitles: boolean;
    forceAllReviewUsersTitles: boolean;
    evaluationVersionId: number;
    locked: boolean;
    isRequired: boolean;
    patientEvaluationItems: KipuPatientEvaluationItem[];
  }
  
/*
____________________________________________
EVALUATION TEMPLATES
|                  |
|                  |
|                  |
|                  |
|                  |
--------------------
*/

export interface KipuEvaluationItemObject {
    id: number;
    fieldType: string;
    name: string;
    recordNames: string;
    columnNames: string;
    label: string;
    enabled: boolean;
    optional: boolean;
    evaluationId: number;
    defaultValue: string;
    dividerBelow: boolean;
    rule: string;
    placeholder: string;
    prePopulateWithId: number;
    parentItemId: string;
    conditions: string;
    labelWidth: string;
    itemGroup: string;
    showString: string;
    showStringCss: string;
    matrixDefaultRecords: number;
    cssStyle: string;
    image?: string;
    skipValidations?: boolean;
    question?: string;
    answer?: string;
  }
  
  export interface KipuEvaluation {
    id: number;
    name: string;
    status: string;
    patientCasefileId: string;
    evaluationId: number;
    patientProcessId: number;
    requireSignature: boolean;
    requirePatientSignature: boolean;
    billable: boolean;
    evaluationType: string;
    evaluationContent: string;
    ancillary: boolean;
    renderingProvider: null;
    billableClaimFormat: string;
    requireGuarantorSignature: boolean;
    requireGuardianSignature: boolean;
    isCrm: boolean;
    availableOnPortal: boolean;
    placeOfService: string;
    billingCodes: Record<string, any>;
    signatureUserTitles: Record<string, any>;
    reviewSignatureUserTitles: Record<string, any>;
    createdAt: string;
    createdBy: string;
    updatedAt: string;
    updatedBy: string;
    masterTreatmentPlanCategory: string;
    forceAllStaffUsersTitles: boolean;
    forceAllReviewUsersTitles: boolean;
    evaluationVersionId: number;
    locked: boolean;
    isRequired: boolean;
    patientEvaluationItems: Array<KipuEvaluationItemObject>;
    notes?: string;
    providerName?: string;
    patientId?: string;
    items?: Array<KipuEvaluationItemObject>;
  }