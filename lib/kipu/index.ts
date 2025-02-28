import mockData from './mock_db.json';

// Type definitions
export type KipuData = typeof mockData;
export type Patient = KipuData['patients'][0];
export type Appointment = KipuData['appointments'][0];
export type Provider = KipuData['providers'][0];
export type Insurance = KipuData['insurances'][0];
export type VitalSign = KipuData['vital_signs'][0];
export type Location = KipuData['locations'][0];
export type User = KipuData['users'][0];
export type Role = KipuData['roles'][0];
export type ConsentFormRecord = KipuData['consent_form_records'][0];
export type Allergen = KipuData['allergens'][0];
export type Allergy = KipuData['allergies'][0];
export type GlucoseLog = KipuData['glucose_logs'][0];
export type GroupSession = KipuData['group_sessions'][0];
export type PatientDiet = KipuData['patient_diets'][0];
export type PatientOrder = KipuData['patient_orders'][0];
export type ProgramHistory = KipuData['program_history'][0];

// Patient Evaluation types
export interface PatientEvaluationItem {
  id: string;
  evaluation_id: string;
  question: string;
  answer?: string;
  answer_type: 'text' | 'number' | 'checkbox' | 'radio' | 'select';
  options?: string[];
  required: boolean;
  created_at: string;
  updated_at?: string;
}

export interface PatientEvaluation {
  id: string;
  patient_id: string;
  evaluation_type: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  status: 'draft' | 'completed' | 'reviewed';
  items?: PatientEvaluationItem[];
}

// Facility types
export interface FacilityData {
  facility_id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  created_at: string;
  data: KipuData;
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

/**
 * Get the main Kipu mock data
 * @returns KipuData
 */
export function getKipuData(): KipuData {
  return mockData;
}

/**
 * Get facility data by facility ID
 * @param facilityId - The facility ID to fetch data for
 * @returns FacilityData or null if facility not found
 */
export function getFacilityData(facilityId: string): FacilityData | null {
  try {
    let facilityData: FacilityData | null = null;
    
    // Try to load the corresponding facility JSON file
    if (facilityId === 'facility_1') {
      const facility1 = require('./facilities/facility_1.json');
      const patients1Count = facility1.data?.patients ? facility1.data.patients.length : 0;
      const documents1Count = 
        (facility1.data?.evaluations ? facility1.data.evaluations.length : 0) + 
        (facility1.data?.contacts ? facility1.data.contacts.length : 0);
      
      facilityData = {
        facility_id: facility1.facility_id,
        name: facility1.name,
        address: facility1.address,
        phone: facility1.phone,
        email: facility1.email,
        created_at: facility1.created_at,
        data: facility1.data,
        meta: {
          name: facility1.name,
          address: facility1.address,
          phone: facility1.phone,
          email: facility1.email,
          patients_count: patients1Count,
          documents_count: documents1Count
        }
      };
    } else if (facilityId === 'facility_2') {
      const facility2 = require('./facilities/facility_2.json');
      const patients2Count = facility2.data?.patients ? facility2.data.patients.length : 0;
      const documents2Count = 
        (facility2.data?.evaluations ? facility2.data.evaluations.length : 0) + 
        (facility2.data?.glucose_logs ? facility2.data.glucose_logs.length : 0);
      
      facilityData = {
        facility_id: facility2.facility_id,
        name: facility2.name,
        address: facility2.address,
        phone: facility2.phone,
        email: facility2.email,
        created_at: facility2.created_at,
        data: facility2.data,
        meta: {
          name: facility2.name,
          address: facility2.address,
          phone: facility2.phone,
          email: facility2.email,
          patients_count: patients2Count,
          documents_count: documents2Count
        }
      };
    }
    
    return facilityData;
  } catch (error) {
    console.error('Error getting facility data:', error);
    return null;
  }
}

/**
 * List all available facilities
 * @returns Array of facility data objects
 */
export function listFacilities(): FacilityData[] {
  try {
    // Import the facility JSON files
    const facility1 = require('./facilities/facility_1.json');
    const facility2 = require('./facilities/facility_2.json');
    
    // Count patients and documents for facility 1
    const patients1Count = facility1.data?.patients ? facility1.data.patients.length : 0;
    const documents1Count = 
      (facility1.data?.evaluations ? facility1.data.evaluations.length : 0) + 
      (facility1.data?.contacts ? facility1.data.contacts.length : 0);
    
    // Count patients and documents for facility 2
    const patients2Count = facility2.data?.patients ? facility2.data.patients.length : 0;
    const documents2Count = 
      (facility2.data?.evaluations ? facility2.data.evaluations.length : 0) + 
      (facility2.data?.glucose_logs ? facility2.data.glucose_logs.length : 0);
    
    const facilities = [
      {
        facility_id: facility1.facility_id,
        name: facility1.name,
        address: facility1.address,
        phone: facility1.phone,
        email: facility1.email,
        created_at: facility1.created_at,
        data: facility1.data,
        meta: {
          name: facility1.name,
          address: facility1.address,
          phone: facility1.phone,
          email: facility1.email,
          patients_count: patients1Count,
          documents_count: documents1Count
        }
      },
      {
        facility_id: facility2.facility_id,
        name: facility2.name,
        address: facility2.address,
        phone: facility2.phone,
        email: facility2.email,
        created_at: facility2.created_at,
        data: facility2.data,
        meta: {
          name: facility2.name,
          address: facility2.address,
          phone: facility2.phone,
          email: facility2.email,
          patients_count: patients2Count,
          documents_count: documents2Count
        }
      }
    ];
    
    return facilities;
  } catch (error) {
    console.error('Error listing facilities:', error);
    return [];
  }
}

/**
 * Fetch a patient evaluation by ID
 * @param evaluationId - The evaluation ID to fetch
 * @param facilityId - Optional facility ID (if not provided, uses main mock DB)
 * @returns PatientEvaluation or null if not found
 */
export function fetchPatientEvaluation(evaluationId: string, facilityId?: string): PatientEvaluation | null {
  try {
    // Determine the data source based on whether a facility ID is provided
    let data: KipuData;
    
    if (facilityId) {
      const facilityData = getFacilityData(facilityId);
      if (!facilityData) {
        console.error(`Facility not found for ID: ${facilityId}`);
        return null;
      }
      data = facilityData.data;
    } else {
      data = getKipuData();
    }
    
    // Find the evaluation
    const evaluation = data.evaluations.find(e => e.id === evaluationId);
    if (!evaluation) {
      console.error(`Evaluation not found with ID: ${evaluationId}`);
      return null;
    }
    
    // Transform to PatientEvaluation interface
    const patientEvaluation: PatientEvaluation = {
      id: evaluation.id,
      patient_id: evaluation.patient_id,
      evaluation_type: evaluation.evaluation_type,
      notes: evaluation.notes,
      created_at: evaluation.created_at,
      status: 'completed',
      items: [] // In a real system, you would fetch evaluation items here
    };
    
    return patientEvaluation;
  } catch (error) {
    console.error(`Error fetching patient evaluation (${evaluationId}):`, error);
    return null;
  }
}

/**
 * Create a new patient evaluation
 * @param evaluationData - The evaluation data to create
 * @param facilityId - Optional facility ID (if not provided, uses main mock DB)
 * @returns The created PatientEvaluation or null if creation failed
 */
export function createPatientEvaluation(evaluationData: Omit<PatientEvaluation, 'id' | 'created_at'>, facilityId?: string): PatientEvaluation | null {
  try {
    // Generate an ID for the new evaluation
    const newId = `evaluation_${Date.now()}`;
    const createdAt = new Date().toISOString();
    
    // Create the new evaluation
    const newEvaluation: PatientEvaluation = {
      id: newId,
      ...evaluationData,
      created_at: createdAt,
      status: evaluationData.status || 'draft'
    };
    
    // In a real app, you would save this to your database
    // For our mock setup, we'll just log it
    console.log('Created new evaluation:', newEvaluation);
    
    return newEvaluation;
  } catch (error) {
    console.error('Error creating patient evaluation:', error);
    return null;
  }
}

// Helper functions to get specific metrics
export const getMetrics = (facilityId?: string) => {
  const data = facilityId ? getFacilityData(facilityId)?.data : getKipuData();
  
  if (!data) {
    return {
      activeConversations: 0,
      insightsGenerated: 0,
      newMessages: 0,
      documentsAnalyzed: 0,
    };
  }
  
  return {
    activeConversations: data.group_sessions.length,
    insightsGenerated: data.evaluations.length,
    newMessages: data.appointments.length,
    documentsAnalyzed: data.consent_form_records.length,
  };
};

// Helper function to get patient data for stats
export const getPatientStats = (facilityId?: string) => {
  const data = facilityId ? getFacilityData(facilityId)?.data : getKipuData();
  
  if (!data) {
    return {
      totalPatients: 0,
      activePatients: 0,
      newPatientsThisWeek: 0,
      patientsByGender: {
        male: 0,
        female: 0,
        other: 0,
      }
    };
  }
  
  // Define a type for vault items if they exist
  interface Vault {
    id: string;
    patient_id: string;
    // Add other vault properties as needed
  }
  
  // Get active patients count (not in vaults)
  // Use type guard to ensure vaults exists and has expected structure
  const activePatients = data.patients.filter(p => {
    // Check if vaults exist and has expected structure
    if (!data.vaults || !Array.isArray(data.vaults)) {
      return true; // Consider all patients active if vaults not defined
    }
    
    // Now TypeScript knows it's an array, check if any vault references this patient
    return !data.vaults.some((v: any) => v.patient_id === p.id);
  }).length;
  
  return {
    totalPatients: data.patients.length,
    activePatients,
    newPatientsThisWeek: 0, // This would be calculated from creation dates in a real app
    // Additional stats that could be derived from the data
    patientsByGender: {
      male: data.patients.filter(p => p.gender === 'male').length,
      female: data.patients.filter(p => p.gender === 'female').length,
      other: data.patients.filter(p => p.gender !== 'male' && p.gender !== 'female').length,
    }
  };
};

// Helper function to get document insights
export const getDocumentInsights = (facilityId?: string) => {
  const data = facilityId ? getFacilityData(facilityId)?.data : getKipuData();
  
  if (!data) {
    return [];
  }
  
  // Simulate document insights based on the mock data
  return [
    {
      id: '1',
      title: 'Patient Treatment Compliance',
      description: 'Analysis of treatment adherence across patients',
      date: new Date().toISOString(),
      category: 'Treatment',
      relevantPatients: data.patients.length,
    },
    {
      id: '2',
      title: 'Medication Effectiveness Review',
      description: 'Review of medication outcomes and side effects',
      date: new Date().toISOString(),
      category: 'Medication',
      relevantPatients: Math.floor(data.patients.length * 0.8),
    },
    {
      id: '3',
      title: 'Appointment No-Show Analysis',
      description: 'Patterns in missed appointments',
      date: new Date().toISOString(),
      category: 'Scheduling',
      relevantPatients: Math.floor(data.patients.length * 0.5),
    },
  ];
};

// Helper function to get recent conversations
export const getRecentConversations = (facilityId?: string) => {
  const data = facilityId ? getFacilityData(facilityId)?.data : getKipuData();
  
  if (!data) {
    return [];
  }
  
  // Create simulated conversations from group sessions and appointments
  return [
    ...data.group_sessions.map(session => ({
      id: session.id,
      title: session.session_name,
      lastMessage: 'Group session completed',
      date: new Date(session.session_date).toISOString(),
      type: 'group',
      unread: false,
    })),
    ...data.appointments.map(appointment => ({
      id: appointment.id,
      title: `Appointment with ${data.providers.find(p => p.id === appointment.provider_id)?.name || 'Unknown Provider'}`,
      lastMessage: `Status: ${appointment.status}`,
      date: new Date(appointment.appointment_time).toISOString(),
      type: 'appointment',
      unread: appointment.status === 'scheduled',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
};

// lib/kipu/index.ts - Add these functions if they don't exist


export async function createOrUpdatePatientEvaluation(
  evaluationData: Omit<PatientEvaluation, 'id' | 'created_at'>,
  evaluationId: string | undefined,
  facilityId: string
): Promise<PatientEvaluation> {
  // Get facility data
  const facilityData = getFacilityData(facilityId);
  if (!facilityData) {
    throw new Error('Facility not found');
  }
  
  const timestamp = new Date().toISOString();
  
  if (evaluationId) {
    // Update existing evaluation
    const evaluationIndex = facilityData.data.evaluations.findIndex(
      (e: any) => e.id === evaluationId
    );
    
    if (evaluationIndex === -1) {
      throw new Error('Evaluation not found');
    }
    
    // Update the evaluation
    const updatedEvaluation = {
      ...facilityData.data.evaluations[evaluationIndex],
      ...evaluationData,
      updated_at: timestamp,
      patient_evaluation_item_base: {},
      notes: evaluationData.notes || '' // Ensure notes is never undefined
    };

    facilityData.data.evaluations[evaluationIndex] = updatedEvaluation;
    
    // Save the updated facility data (in a real app, this would be an API call)
    // For testing, we're just updating the in-memory object
    
    return updatedEvaluation;
  } else {
    // Create new evaluation
const newEvaluation = {
  ...evaluationData,
  id: `eval_${Date.now()}`,
  created_at: timestamp,
  updated_at: timestamp,
  patient_evaluation_item_base: {},
  notes: evaluationData.notes || '' // Ensure notes is never undefined
};
    // Add to evaluations array
    facilityData.data.evaluations.push(newEvaluation);
    
    // Save the updated facility data (in a real app, this would be an API call)
    // For testing, we're just updating the in-memory object
    
    return newEvaluation;
  }
}