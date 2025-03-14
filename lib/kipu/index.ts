import facility1Data from './facilities/facility_1.json';
import facility2Data from './facilities/facility_2.json';
import { 
  FacilityData, 
  Facility, 
  PatientEvaluationItem, 
  PatientEvaluation,
  KipuEvaluation
} from './types';

/**
 * Fetches facility data by ID
 * @param facilityId - The facility ID to fetch data for
 * @returns Facility or null if facility not found
 */
export function getFacilityData(facilityId: string): Facility | null {
  try {
    let facilityData: Facility | null = null;
    
    // The rest of the function remains the same
    // ...

    
    // Try to load the corresponding facility JSON file
    if (facilityId === 'facility_1') {
      const patients1Count = facility1Data.data?.patients ? facility1Data.data.patients.length : 0;
      const documents1Count = 
        (facility1Data.data?.evaluations ? facility1Data.data.evaluations.length : 0) + 
        (facility1Data.data?.contacts ? facility1Data.data.contacts.length : 0);
      
      facilityData = {
        id: facility1Data.facility_id, // Add id to match Facility interface
        facility_id: facility1Data.facility_id,
        name: facility1Data.name,
        address: facility1Data.address,
        phone: facility1Data.phone,
        email: facility1Data.email,
        created_at: facility1Data.created_at,
        data: facility1Data.data as unknown as FacilityData, // Cast to FacilityData
        api_settings: facility1Data.api_settings || {
          kipu_api_key: '',
          kipu_api_endpoint: '',
          has_api_key_configured: false,
          updated_at: new Date().toISOString()
        },
        meta: {
          name: facility1Data.name,
          address: facility1Data.address,
          phone: facility1Data.phone,
          email: facility1Data.email,
          patients_count: patients1Count,
          documents_count: documents1Count
        }
      };
    } else if (facilityId === 'facility_2') {
      const patients2Count = facility2Data.data?.patients ? facility2Data.data.patients.length : 0;
      const documents2Count = 
        (facility2Data.data?.evaluations ? facility2Data.data.evaluations.length : 0) + 
        (facility2Data.data?.glucose_logs ? facility2Data.data.glucose_logs.length : 0);
      
      facilityData = {
        id: facility2Data.facility_id, // Add id to match Facility interface
        facility_id: facility2Data.facility_id,
        name: facility2Data.name,
        address: facility2Data.address,
        phone: facility2Data.phone,
        email: facility2Data.email,
        created_at: facility2Data.created_at,
        data: facility2Data.data as unknown as FacilityData, // Cast to FacilityData
        api_settings: facility2Data.api_settings || {
          kipu_api_key: '',
          kipu_api_endpoint: '',
          has_api_key_configured: false,
          updated_at: new Date().toISOString()
        },
        meta: {
          name: facility2Data.name,
          address: facility2Data.address,
          phone: facility2Data.phone,
          email: facility2Data.email,
          patients_count: patients2Count,
          documents_count: documents2Count
        }
      };
    }
    
    return facilityData;
  } catch (error) {
    console.error('Error fetching facility data:', error);
    return null;
  }
}


/**
 * List all available facilities
 * @returns Array of Facility objects
 */
export function listFacilities(): Facility[] {
  try {
    // Count patients and documents for facility 1
    const patients1Count = facility1Data.data?.patients ? facility1Data.data.patients.length : 0;
    const documents1Count = 
      (facility1Data.data?.evaluations ? facility1Data.data.evaluations.length : 0) + 
      (facility1Data.data?.contacts ? facility1Data.data.contacts.length : 0);
    
    // Count patients and documents for facility 2
    const patients2Count = facility2Data.data?.patients ? facility2Data.data.patients.length : 0;
    const documents2Count = 
      (facility2Data.data?.evaluations ? facility2Data.data.evaluations.length : 0) + 
      (facility2Data.data?.glucose_logs ? facility2Data.data.glucose_logs.length : 0);
    
    const facilities: Facility[] = [
      {
        id: facility1Data.facility_id,
        facility_id: facility1Data.facility_id,
        name: facility1Data.name,
        address: facility1Data.address,
        phone: facility1Data.phone,
        email: facility1Data.email,
        created_at: facility1Data.created_at,
        data: facility1Data.data as unknown as FacilityData,
        api_settings: facility1Data.api_settings || {
          kipu_api_key: '',
          kipu_api_endpoint: '',
          has_api_key_configured: false,
          updated_at: new Date().toISOString()
        },
        meta: {
          name: facility1Data.name,
          address: facility1Data.address,
          phone: facility1Data.phone,
          email: facility1Data.email,
          patients_count: patients1Count,
          documents_count: documents1Count
        }
      },
      {
        id: facility2Data.facility_id,
        facility_id: facility2Data.facility_id,
        name: facility2Data.name,
        address: facility2Data.address,
        phone: facility2Data.phone,
        email: facility2Data.email,
        created_at: facility2Data.created_at,
        data: facility2Data.data as unknown as FacilityData,
        api_settings: facility2Data.api_settings || {
          kipu_api_key: '',
          kipu_api_endpoint: '',
          has_api_key_configured: false,
          updated_at: new Date().toISOString()
        },
        meta: {
          name: facility2Data.name,
          address: facility2Data.address,
          phone: facility2Data.phone,
          email: facility2Data.email,
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
 * @param facilityId - Optional facility ID
 * @returns PatientEvaluation or null if not found
 */
export function fetchPatientEvaluation(evaluationId: string, facilityId?: string): PatientEvaluation | null {
  try {
    // Determine the data source based on whether a facility ID is provided
    let data: any;
    
    if (facilityId) {
      const facilityData = getFacilityData(facilityId);
      if (!facilityData) {
        console.error(`Facility not found for ID: ${facilityId}`);
        return null;
      }
      data = facilityData.data;
    } else {
      // Default to facility 1 if no ID provided
      data = facility1Data.data;
    }
    
    // Find the evaluation
    const evaluation = data.evaluations?.find((e: any) => e.id === evaluationId);
    if (!evaluation) {
      console.error(`Evaluation not found with ID: ${evaluationId}`);
      return null;
    }
    
    // Transform to PatientEvaluation interface
    const patientEvaluation: PatientEvaluation = {
      id: evaluation.id,
      patient_id: evaluation.patient_id,
      evaluation_type: evaluation.evaluation_type,
      notes: evaluation.notes || '',
      created_at: evaluation.created_at,
      status: evaluation.status || 'completed',
      items: evaluation.items || []
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
 * @param facilityId - Optional facility ID
 * @returns The created PatientEvaluation or null if creation failed
 */
export function createPatientEvaluation(
  evaluationData: Omit<PatientEvaluation, 'id' | 'created_at'>, 
  facilityId?: string
): PatientEvaluation | null {
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

/**
 * Get evaluations for a specific patient
 * @param facilityId - The facility ID
 * @param patientId - The patient ID
 * @returns Array of KipuEvaluation objects
 */
export function getPatientEvaluations(facilityId: string, patientId: string): KipuEvaluation[] {
  try {
    // Get the facility data
    const facility = getFacilityData(facilityId);
    if (!facility || !facility.data || !facility.data.evaluations) {
      return [];
    }
    
    // Filter evaluations for the specific patient
    return facility.data.evaluations.filter(
      (evaluation: any) => evaluation.patient_id.toString() === patientId
    ) as KipuEvaluation[];
  } catch (error) {
    console.error('Error getting patient evaluations:', error);
    return [];
  }
}

/**
 * Create or update a patient evaluation
 * @param evaluationData - The evaluation data
 * @param evaluationId - Optional ID for updating existing evaluation
 * @param facilityId - The facility ID
 * @returns The created or updated PatientEvaluation
 */
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
    // In a real app, this would update the database
    
    // For now, simulate a successful update
    return {
      id: evaluationId,
      ...evaluationData,
      created_at: timestamp,
      updated_at: timestamp
    };
  } else {
    // Create new evaluation
    const newId = `evaluation_${Date.now()}`;
    
    // In a real app, this would save to the database
    
    // Return the new evaluation
    return {
      id: newId,
      ...evaluationData,
      created_at: timestamp,
      status: evaluationData.status || 'draft'
    };
  }
}


/**
 * Get billing insights for facilities
 * @param facilityId - Optional facility ID to fetch specific insights
 * @returns Billing insights data
 */
export const getBillingInsights = async (facilityId?: string) => {
  const data = facilityId ? getFacilityData(facilityId)?.data : facility1Data.data;
  
  if (!data || !data.billing_data) {
    return {
      insurancePlans: [],
      totalDaysAuthorized: 0,
      daysRemaining: 0,
      upcomingReviews: [],
      outstandingPayments: 0,
      activeAppeals: 0,
      claimsToAppeal: 0
    };
  }
  
  return data.billing_data;
};

// Helper functions to get specific metrics
export const getMetrics = (facilityId?: string) => {
  const data = facilityId ? getFacilityData(facilityId)?.data : facility1Data.data;
  
  if (!data) {
    return {
      activeConversations: 0,
      insightsGenerated: 0,
      newMessages: 0,
      documentsAnalyzed: 0,
    };
  }
  
  return {
    activeConversations: data.group_sessions?.length || 0,
    insightsGenerated: data.evaluations?.length || 0,
    newMessages: data.appointments?.length || 0,
    documentsAnalyzed: data.consent_form_records?.length || 0,
  };
};

// Helper function to get patient data for stats
export const getPatientStats = (facilityId?: string) => {
  const data = facilityId ? getFacilityData(facilityId)?.data : facility1Data.data;
  
  if (!data || !data.patients) {
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
  
  // Get active patients count (not in vaults)
  const activePatients = data.patients.filter((p: any) => {
    // Check if vaults exist and has expected structure
    if (!data.vaults || !Array.isArray(data.vaults)) {
      return true; // Consider all patients active if vaults not defined
    }
    
    // Check if any vault references this patient
    return !data.vaults.some((v: any) => v.patient_id === p.id);
  }).length;
  
  return {
    totalPatients: data.patients.length,
    activePatients,
    newPatientsThisWeek: 0, // This would be calculated from creation dates in a real app
    // Additional stats that could be derived from the data
    patientsByGender: {
      male: data.patients.filter((p: any) => p.gender === 'male').length,
      female: data.patients.filter((p: any) => p.gender === 'female').length,
      other: data.patients.filter((p: any) => p.gender !== 'male' && p.gender !== 'female').length,
    }
  };
};

// Helper function to get document insights
export const getDocumentInsights = (facilityId?: string) => {
  const data = facilityId ? getFacilityData(facilityId)?.data : facility1Data.data;
  
  if (!data || !data.patients) {
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
  const data = facilityId ? getFacilityData(facilityId)?.data : facility1Data.data;
  
  if (!data) {
    return [];
  }
  
  const conversations = [];
  
  // Add group sessions if they exist
  if (data.group_sessions && Array.isArray(data.group_sessions)) {
    conversations.push(
      ...data.group_sessions.map((session: any) => ({
        id: session.id,
        title: session.session_name,
        lastMessage: 'Group session completed',
        date: new Date(session.session_date).toISOString(),
        type: 'group',
        unread: false,
      }))
    );
  }
  
  // Add appointments if they exist
  if (data.appointments && Array.isArray(data.appointments)) {
    conversations.push(
      ...data.appointments.map((appointment: any) => {
        const provider = data.providers?.find((p: any) => p.id === appointment.provider_id);
        return {
          id: appointment.id,
          title: `Appointment with ${provider?.name || 'Unknown Provider'}`,
          lastMessage: `Status: ${appointment.status}`,
          date: new Date(appointment.appointment_time).toISOString(),
          type: 'appointment',
          unread: appointment.status === 'scheduled',
        };
      })
    );
  }
  
  // Sort by date (newest first) and take top 5
  return conversations
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
};

/**
 * Get facility insights
 * @param facilityId - Optional facility ID to fetch specific insights
 * @returns Facility insights data
 */
export function getFacilityInsights(facilityId?: string) {
  try {
    // Get the data source
    let data: FacilityData | null = null;
    if (facilityId) {
      const facilityData = getFacilityData(facilityId);
      if (facilityData) {
        data = facilityData.data;
      }
    } else {
      // Default to facility 1
      data = facility1Data.data as unknown as FacilityData;
    }
    
    // If data has facility_insights, return it, otherwise return default values
    if (data && 'facility_insights' in data) {
      return data.facility_insights;
    }
    
    // Return default insights data
    return facility1Data.facility_insights;
  } catch (error) {
    console.error('Error getting facility insights:', error);
    return null;
  }
}

/**
 * Get compliance insights
 * @param facilityId - Optional facility ID to fetch specific insights
 * @returns Compliance insights data
 */
export function getComplianceInsights(facilityId?: string) {
  try {
    // Get the data source
    let data: FacilityData | null = null;
    if (facilityId) {
      const facilityData = getFacilityData(facilityId);
      if (facilityData) {
        data = facilityData.data;
      }
    } else {
      // Default to facility 1
      data = facility1Data.data as unknown as FacilityData;
    }
    
    // If data has compliance_data, return it, otherwise return default values
    if (data && 'compliance_data' in data) {
      return data.compliance_data;
    }
    
    // Return default compliance data
    return facility1Data.compliance_data;
  } catch (error) {
    console.error('Error getting compliance insights:', error);
    return null;
  }
}