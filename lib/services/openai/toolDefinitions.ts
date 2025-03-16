// lib/services/openai/toolDefinitions.ts
import { BioPsychSocialAssessment } from "@/types/pdf/biopsychsocialassessment";

/**
 * OpenAI function definitions for use with the Assistant API
 * These definitions describe the structure and parameters of functions
 * that the assistant can call when appropriate.
 * 
 * Note: These are for reference only - the actual function definitions
 * are configured directly in the OpenAI Assistant settings.
 */
export const toolDefinitions = [
  {
    type: "function",
    function: {
      name: "BioPsychSocialAssessmentForm",
      description: "Form for collecting a bio-psychosocial assessment",
      parameters: {
        type: "object",
        required: [
          "firstName",
          "lastName",
          "dateOfBirth",
          "gender",
          "assessmentDate",
          "clinicianName",
          "presentingProblem",
          "psychiatricHistory",
          "medicalHistory",
          "substanceUseHistory",
          "socialHistory",
          "legalHistory",
          "employmentStatus",
          "educationalHistory"
        ],
        properties: {
          firstName: {
            type: "string",
            description: "Patient's first name"
          },
          lastName: {
            type: "string",
            description: "Patient's last name"
          },
          dateOfBirth: {
            type: "string",
            description: "Patient's date of birth in YYYY-MM-DD format"
          },
          gender: {
            type: "string",
            description: "Patient's gender identity"
          },
          assessmentDate: {
            type: "string",
            description: "Date of the assessment in YYYY-MM-DD format"
          },
          clinicianName: {
            type: "string",
            description: "Name of the clinician conducting the assessment"
          },
          presentingProblem: {
            type: "string",
            description: "Description of the presenting problem"
          },
          psychiatricHistory: {
            type: "string",
            description: "History of psychiatric treatment and diagnoses"
          },
          medicalHistory: {
            type: "string",
            description: "Relevant medical conditions and treatments"
          },
          substanceUseHistory: {
            type: "string",
            description: "History of substance use and current status"
          },
          socialHistory: {
            type: "string",
            description: "Document family relationships, living situation, and social support"
          },
          legalHistory: {
            type: "string",
            description: "Document any legal issues or involvement with the justice system"
          },
          employmentStatus: {
            type: "string",
            description: "Current employment status and history"
          },
          educationalHistory: {
            type: "string",
            description: "Highest level of education and any learning difficulties"
          }
        },
        additionalProperties: false
      }
    }
  }
];

/**
 * Helper function to get tool definitions for reference
 * Note: These definitions are for reference only and should match
 * what's configured in the OpenAI Assistant settings.
 */
export function getToolDefinitions() {
  return toolDefinitions;
}
