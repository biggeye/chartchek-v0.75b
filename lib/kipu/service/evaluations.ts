/**
 * Evaluations Service
 * 
 * This service handles the retrieval and management of patient evaluations.
 * It uses Supabase as the primary storage mechanism with a local fallback for development.
 */

import { createClient } from '@/utils/supabase/client';
import path from 'path';
import fs from 'fs/promises';

/**
 * Interface for evaluation items within an evaluation
 */
export interface EvaluationItem {
  id: string;
  question: string;
  answer?: string;
}

/**
 * Interface for KIPU evaluations
 */
export interface KipuEvaluation {
  id: string | number;
  patient_id: string | number;
  facility_id: string | number;
  evaluation_type: string;
  evaluation_date: string;
  provider_id?: string | number;
  provider_name?: string;
  status: 'draft' | 'completed' | 'reviewed';
  items?: EvaluationItem[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Retrieves evaluations for a patient from a facility
 * 
 * @param facilityId - The ID of the facility
 * @param patientId - The ID of the patient
 * @returns Promise resolving to an array of evaluations
 */
export async function getPatientEvaluations(facilityId: string, patientId: string): Promise<KipuEvaluation[]> {
  try {
    // Try to get evaluations from Supabase first
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('patient_evaluations')
      .select('*')
      .eq('facility_id', facilityId)
      .eq('patient_id', patientId);
    
    if (error) {
      console.warn('Error fetching evaluations from Supabase:', error);
      // Fall back to local data
      return getLocalPatientEvaluations(facilityId, patientId);
    }
    
    if (data && data.length > 0) {
      return data as KipuEvaluation[];
    }
    
    // Fall back to local data if no evaluations found
    return getLocalPatientEvaluations(facilityId, patientId);
  } catch (error) {
    console.error('Error retrieving patient evaluations:', error);
    // Fall back to local data on error
    return getLocalPatientEvaluations(facilityId, patientId);
  }
}

/**
 * Retrieves evaluations from local JSON files (fallback method)
 * 
 * @param facilityId - The ID of the facility
 * @param patientId - The ID of the patient
 * @returns Promise resolving to an array of evaluations
 */
async function getLocalPatientEvaluations(facilityId: string, patientId: string): Promise<KipuEvaluation[]> {
  try {
    const filePath = path.join(process.cwd(), 'lib', 'kipu', 'facilities', `facility_${facilityId}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const facilityData = JSON.parse(fileContent);
    
    // Find evaluations for this patient
    const patientEvaluations = facilityData.data.evaluations?.filter(
      (evaluation: KipuEvaluation) => evaluation.patient_id.toString() === patientId
    ) || [];
    
    return patientEvaluations;
  } catch (error) {
    console.error('Error retrieving local patient evaluations:', error);
    return [];
  }
}

/**
 * Adds a new evaluation for a patient
 * 
 * @param facilityId - The ID of the facility
 * @param evaluation - The evaluation data to add
 * @returns Promise resolving to the added evaluation or null if failed
 */
export async function addPatientEvaluation(
  facilityId: string, 
  evaluation: Omit<KipuEvaluation, 'id' | 'created_at' | 'updated_at'>
): Promise<KipuEvaluation | null> {
  try {
    const supabase = createClient();
    
    // Prepare the data for insertion
    const newEvaluation = {
      ...evaluation,
      facility_id: facilityId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Insert the evaluation into Supabase
    const { data, error } = await supabase
      .from('patient_evaluations')
      .insert(newEvaluation)
      .select()
      .single();
    
    if (error) {
      console.error('Error adding evaluation to Supabase:', error);
      // Fall back to local storage
      return addLocalPatientEvaluation(facilityId, newEvaluation);
    }
    
    return data as KipuEvaluation;
  } catch (error) {
    console.error('Error adding patient evaluation:', error);
    return null;
  }
}

/**
 * Adds a new evaluation to local JSON files (fallback method)
 * 
 * @param facilityId - The ID of the facility
 * @param evaluation - The evaluation data to add
 * @returns Promise resolving to the added evaluation or null if failed
 */
async function addLocalPatientEvaluation(
  facilityId: string, 
  evaluation: Omit<KipuEvaluation, 'id'>
): Promise<KipuEvaluation | null> {
  try {
    const filePath = path.join(process.cwd(), 'lib', 'kipu', 'facilities', `facility_${facilityId}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const facilityData = JSON.parse(fileContent);
    
    // Generate a new ID for the evaluation
    const newId = Math.max(0, ...facilityData.data.evaluations.map((e: KipuEvaluation) => Number(e.id))) + 1;
    
    // Create the new evaluation
    const newEvaluation: KipuEvaluation = {
      ...evaluation,
      id: newId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Add the evaluation to the facility data
    facilityData.data.evaluations.push(newEvaluation);
    
    // Write the updated data back to the file
    await fs.writeFile(filePath, JSON.stringify(facilityData, null, 2), 'utf-8');
    
    return newEvaluation;
  } catch (error) {
    console.error('Error adding local patient evaluation:', error);
    return null;
  }
}

/**
 * Updates an existing evaluation
 * 
 * @param facilityId - The ID of the facility
 * @param evaluationId - The ID of the evaluation to update
 * @param updates - The updates to apply to the evaluation
 * @returns Promise resolving to the updated evaluation or null if failed
 */
export async function updatePatientEvaluation(
  facilityId: string,
  evaluationId: string | number,
  updates: Partial<KipuEvaluation>
): Promise<KipuEvaluation | null> {
  try {
    const supabase = createClient();
    
    // Prepare the update data
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    // Update the evaluation in Supabase
    const { data, error } = await supabase
      .from('patient_evaluations')
      .update(updateData)
      .eq('id', evaluationId)
      .eq('facility_id', facilityId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating evaluation in Supabase:', error);
      // Fall back to local storage
      return updateLocalPatientEvaluation(facilityId, evaluationId, updateData);
    }
    
    return data as KipuEvaluation;
  } catch (error) {
    console.error('Error updating patient evaluation:', error);
    return null;
  }
}

/**
 * Updates an existing evaluation in local JSON files (fallback method)
 * 
 * @param facilityId - The ID of the facility
 * @param evaluationId - The ID of the evaluation to update
 * @param updates - The updates to apply to the evaluation
 * @returns Promise resolving to the updated evaluation or null if failed
 */
async function updateLocalPatientEvaluation(
  facilityId: string,
  evaluationId: string | number,
  updates: Partial<KipuEvaluation>
): Promise<KipuEvaluation | null> {
  try {
    const filePath = path.join(process.cwd(), 'lib', 'kipu', 'facilities', `facility_${facilityId}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const facilityData = JSON.parse(fileContent);
    
    // Find the evaluation to update
    const evaluationIndex = facilityData.data.evaluations.findIndex(
      (e: KipuEvaluation) => e.id.toString() === evaluationId.toString()
    );
    
    if (evaluationIndex === -1) {
      console.error(`Evaluation with ID ${evaluationId} not found in facility ${facilityId}`);
      return null;
    }
    
    // Update the evaluation
    const updatedEvaluation = {
      ...facilityData.data.evaluations[evaluationIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    facilityData.data.evaluations[evaluationIndex] = updatedEvaluation;
    
    // Write the updated data back to the file
    await fs.writeFile(filePath, JSON.stringify(facilityData, null, 2), 'utf-8');
    
    return updatedEvaluation;
  } catch (error) {
    console.error('Error updating local patient evaluation:', error);
    return null;
  }
}

/**
 * Retrieves a single evaluation by ID
 * 
 * @param facilityId - The ID of the facility
 * @param evaluationId - The ID of the evaluation
 * @returns Promise resolving to the evaluation or null if not found
 */
export async function getPatientEvaluation(
  facilityId: string,
  evaluationId: string | number
): Promise<KipuEvaluation | null> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('patient_evaluations')
      .select('*')
      .eq('id', evaluationId)
      .eq('facility_id', facilityId)
      .single();
    
    if (error) {
      console.warn('Error fetching evaluation from Supabase:', error);
      // Fall back to local data
      return getLocalPatientEvaluation(facilityId, evaluationId);
    }
    
    return data as KipuEvaluation;
  } catch (error) {
    console.error('Error retrieving patient evaluation:', error);
    // Fall back to local data on error
    return getLocalPatientEvaluation(facilityId, evaluationId);
  }
}

/**
 * Retrieves a single evaluation from local JSON files (fallback method)
 * 
 * @param facilityId - The ID of the facility
 * @param evaluationId - The ID of the evaluation
 * @returns Promise resolving to the evaluation or null if not found
 */
async function getLocalPatientEvaluation(
  facilityId: string,
  evaluationId: string | number
): Promise<KipuEvaluation | null> {
  try {
    const filePath = path.join(process.cwd(), 'lib', 'kipu', 'facilities', `facility_${facilityId}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const facilityData = JSON.parse(fileContent);
    
    // Find the evaluation
    const evaluation = facilityData.data.evaluations?.find(
      (e: KipuEvaluation) => e.id.toString() === evaluationId.toString()
    );
    
    return evaluation || null;
  } catch (error) {
    console.error('Error retrieving local patient evaluation:', error);
    return null;
  }
}