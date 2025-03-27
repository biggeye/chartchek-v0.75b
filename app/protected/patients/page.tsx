'use client';

import { useEffect, useState } from 'react';
// Remove this import since we're moving away from context
// import { usePatient } from '@/lib/contexts/PatientProvider';
import { useFacilityStore } from '@/store/facilityStore'; 
import { usePatientStore } from '@/store/patientStore';
import { PatientSearch } from '@/components/patient/PatientSearch';
import { useRouter } from 'next/navigation';

export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isClientReady, setIsClientReady] = useState(false);

  // Replace PatientContext with PatientStore
  const {
    currentPatient,
    isPatientContextEnabled,
    isLoading,
    error,
    patients,
    fetchPatientsCensusByFacility
  } = usePatientStore();

  // Use facility store for facility operations
  const { currentFacilityId } = useFacilityStore();
  
  const router = useRouter();

  // Set client ready state after hydration
  useEffect(() => {
    setIsClientReady(true);
    
    // Load patients for current facility
    if (currentFacilityId) {
      fetchPatientsCensusByFacility(currentFacilityId);
    }
  }, [currentFacilityId, fetchPatientsCensusByFacility]);

  // Filter patients based on search query
  const filteredPatients = !patients ? [] : searchQuery.trim() === ''
    ? patients.filter(patient => patient.facilityId === currentFacilityId)
    : patients.filter(patient => 
        (patient.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         patient.lastName?.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  // Handle patient selection
  const handlePatientSelect = async (patientId: string) => {
    
    router.push(`/protected/patients/${patientId}`);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Patients</h1>
      
      {/* Search bar */}
      <PatientSearch 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
      />
      
      {/* Patient list */}
      {isLoading ? (
        <p>Loading patients...</p>
      ) : error ? (
        <p className="text-red-500">Error: {error}</p>
      ) : filteredPatients.length === 0 ? (
        <p>No patients found.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {filteredPatients.map(patient => (
            <li 
              key={patient.patientId} 
              className="py-4 cursor-pointer hover:bg-gray-50"
              onClick={() => handlePatientSelect(patient.patientId)}
            >
              <div className="flex items-center">
                <div>
                  <p className="font-medium">{patient.lastName}, {patient.firstName}</p>
                  <p className="text-sm text-gray-500">DOB: {patient.dateOfBirth}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}