'use client';

/**
 * Filter patients based on search query
 */
export function filterPatients(patients: any[], searchQuery: string) {
  if (!searchQuery.trim()) {
    return patients;
  }
  
  const query = searchQuery.toLowerCase();
  
  return patients.filter(patient => {
    const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
    return fullName.includes(query) ||
           patient.id.toLowerCase().includes(query) ||
           (patient.contact?.email && patient.contact.email.toLowerCase().includes(query));
  });
}

/**
 * Format facility data for UI display
 */
export function formatFacilityForUI(facility: any) {
  return {
    facility_id: facility.facility_id,
    name: facility.name,
    address: facility.address,
    phone: facility.phone,
    email: facility.email,
    patients_count: facility.meta?.patients_count || 0,
    documents_count: facility.meta?.documents_count || 0
  };
}

/**
 * Format multiple facilities for UI display
 */
export function formatFacilitiesForUI(facilities: any[]) {
  return facilities.map(facility => formatFacilityForUI(facility));
}
