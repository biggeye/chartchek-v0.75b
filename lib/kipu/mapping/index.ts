/**
 * KIPU API Mapping Module
 * 
 * This module centralizes all mapping functions between KIPU API responses and our application's data structures.
 * It handles the terminology differences and field naming conventions between systems.
 */

import { Facility } from '@/types/kipu';
import { PatientBasicInfo } from '@/lib/kipu/types';

/**
 * Maps a KIPU location object to our Facility format
 * This function handles different field naming conventions between our app and KIPU API
 * 
 * @param kipuLocation - The location data from KIPU API
 * @returns Facility object with mapped fields
 */
export function mapKipuLocationToFacility(kipuLocation: any): Facility {
  if (!kipuLocation) {
    console.error('Attempted to map null or undefined KIPU location');
    return {
      id: '',
      name: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      status: 'inactive',
      buildings: []
    };
  }

  // Log the structure to help with debugging
  console.log('Mapping KIPU location:', {
    locationId: kipuLocation.location_id,
    hasName: !!kipuLocation.location_name,
    hasAddress: !!kipuLocation.address,
    hasBuildings: Array.isArray(kipuLocation.buildings) ? kipuLocation.buildings.length : 0
  });

  return {
    id: kipuLocation.location_id?.toString() || `facility-${Math.random().toString(36).substring(2, 9)}`,
    name: kipuLocation.location_name || 'Unnamed Facility',
    address: kipuLocation.address?.street || '',
    city: kipuLocation.address?.city || '',
    state: kipuLocation.address?.state || '',
    zip: kipuLocation.address?.zip || '',
    status: kipuLocation.enabled === false ? 'inactive' : 'active',
    buildings: Array.isArray(kipuLocation.buildings) 
      ? kipuLocation.buildings.map((building: any) => mapKipuBuildingToBuilding(building, kipuLocation.location_id))
      : []
  };
}

/**
 * Maps a KIPU building object to our Building format
 * 
 * @param kipuBuilding - The building data from KIPU API
 * @param facilityId - The ID of the parent facility
 * @returns Building object with mapped fields
 */
export function mapKipuBuildingToBuilding(kipuBuilding: any, facilityId?: string | number): any {
  if (!kipuBuilding) {
    return {
      id: '',
      name: '',
      facility_id: facilityId?.toString() || '',
      status: 'inactive'
    };
  }

  return {
    id: kipuBuilding.id?.toString() || '',
    name: kipuBuilding.name || '',
    facility_id: facilityId?.toString() || '',
    status: kipuBuilding.enabled === false ? 'inactive' : 'active'
  };
}

/**
 * Maps a KIPU patient object to our PatientBasicInfo format
 * This function handles different field naming conventions between our app and KIPU API
 * 
 * @param kipuPatient - The patient data from KIPU API
 * @returns PatientBasicInfo object with mapped fields
 */
export function mapKipuPatientToPatientBasicInfo(kipuPatient: any): PatientBasicInfo {
  if (!kipuPatient) {
    console.error('Attempted to map null or undefined KIPU patient');
    return {
      id: '',
      first_name: '',
      middle_name: '',
      last_name: '',
      dob: '',
      gender: '',
      mr_number: '',
      admission_date: '',
      discharge_date: '',
      casefile_id: '',
      contact: {
        email: '',
        phone: ''
      }
    };
  }

  // Log the structure to help with debugging
  console.log('Mapping KIPU patient:', {
    patientId: kipuPatient.id || kipuPatient.patient_id,
    hasName: !!kipuPatient.first_name && !!kipuPatient.last_name,
    hasDob: !!kipuPatient.dob,
    hasMrNumber: !!kipuPatient.mr_number,
    hasGender: !!kipuPatient.gender || !!kipuPatient.sex,
    hasContact: !!kipuPatient.contact || (!!kipuPatient.email || !!kipuPatient.phone)
  });

  return {
    id: kipuPatient.id || kipuPatient.patient_id || '',
    first_name: kipuPatient.first_name || kipuPatient.firstName || '',
    middle_name: kipuPatient.middle_name || kipuPatient.middleName || '',
    last_name: kipuPatient.last_name || kipuPatient.lastName || '',
    dob: kipuPatient.dob || kipuPatient.date_of_birth || '',
    gender: kipuPatient.gender || kipuPatient.sex || '',
    mr_number: kipuPatient.mr_number || kipuPatient.mrNumber || kipuPatient.medical_record_number || '',
    admission_date: kipuPatient.admission_date || kipuPatient.admissionDate || '',
    discharge_date: kipuPatient.discharge_date || kipuPatient.dischargeDate || '',
    casefile_id: kipuPatient.casefile_id || kipuPatient.casefileId || kipuPatient.id || '',
    contact: {
      email: kipuPatient.email || (kipuPatient.contact && kipuPatient.contact.email) || '',
      phone: kipuPatient.phone || (kipuPatient.contact && kipuPatient.contact.phone) || 
             kipuPatient.phone_number || (kipuPatient.contact && kipuPatient.contact.phone_number) || ''
    }
  };
}
