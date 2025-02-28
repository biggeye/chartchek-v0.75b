// lib/kipu/evaluations.ts
import path from 'path';
import fs from 'fs/promises';

// Define evaluation types based on your schema
export interface KipuEvaluation {
  id: number;
  evaluation_type: string;
  created_at: string;
  updated_at: string;
  status: string;
  notes?: string;
  patient_id: number;
  user_id: number;
  user_name: string;
  form_data: Record<string, any>;
}

/**
 * Retrieves evaluations for a patient from a facility
 */
export async function getPatientEvaluations(facilityId: string, patientId: string): Promise<KipuEvaluation[]> {
  try {
    const filePath = path.join(process.cwd(), 'lib', 'kipu', 'facilities', `facility_${facilityId}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const facilityData = JSON.parse(fileContent);
    
    // Find evaluations for this patient
    const patientEvaluations = facilityData.data.evaluations?.filter(
        (evaluation: KipuEvaluation) => evaluation.patient_id.toString() === patientId   ) || [];
    
    return patientEvaluations;
  } catch (error) {
    console.error('Error retrieving patient evaluations:', error);
    return [];
  }
}

/**
 * Adds a new evaluation for a patient
 */
export async function addPatientEvaluation(
  facilityId: string, 
  evaluation: Omit<KipuEvaluation, 'id' | 'created_at' | 'updated_at'>
): Promise<KipuEvaluation | null> {
  try {
    const filePath = path.join(process.cwd(), 'lib', 'kipu', 'facilities', `facility_${facilityId}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const facilityData = JSON.parse(fileContent);
    
    // Create evaluations array if it doesn't exist
    if (!facilityData.data.evaluations) {
      facilityData.data.evaluations = [];
    }
    
    // Generate a new ID (typically the max existing ID + 1)
    const newId = facilityData.data.evaluations.length > 0
      ? Math.max(...facilityData.data.evaluations.map((e: KipuEvaluation) => e.id)) + 1
      : 1;
    
    // Create new evaluation with timestamps
    const timestamp = new Date().toISOString();
    const newEvaluation: KipuEvaluation = {
      ...evaluation,
      id: newId,
      created_at: timestamp,
      updated_at: timestamp
    };
    
    // Add to evaluations array
    facilityData.data.evaluations.push(newEvaluation);
    
    // Write back to file
    await fs.writeFile(filePath, JSON.stringify(facilityData, null, 2), 'utf-8');
    
    return newEvaluation;
  } catch (error) {
    console.error('Error adding patient evaluation:', error);
    return null;
  }
}

/**
 * Updates an existing evaluation
 */
export async function updatePatientEvaluation(
  facilityId: string,
  evaluationId: number,
  updates: Partial<KipuEvaluation>
): Promise<KipuEvaluation | null> {
  try {
    const filePath = path.join(process.cwd(), 'lib', 'kipu', 'facilities', `facility_${facilityId}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const facilityData = JSON.parse(fileContent);
    
    if (!facilityData.data.evaluations) {
      return null;
    }
    
    // Find the evaluation to update
    const evalIndex = facilityData.data.evaluations.findIndex(
      (e: KipuEvaluation) => e.id === evaluationId
    );
    
    if (evalIndex === -1) {
      return null;
    }
    
    // Update the evaluation
    facilityData.data.evaluations[evalIndex] = {
      ...facilityData.data.evaluations[evalIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    // Write back to file
    await fs.writeFile(filePath, JSON.stringify(facilityData, null, 2), 'utf-8');
    
    return facilityData.data.evaluations[evalIndex];
  } catch (error) {
    console.error('Error updating patient evaluation:', error);
    return null;
  }
}