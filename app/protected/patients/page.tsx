'use client';

import { useEffect, useState } from 'react';
import { usePatient } from '@/lib/contexts/PatientProvider';
import { useFacilityStore } from '@/store/facilityStore'; 
import { usePatientStore } from '@/store/patientStore';// Add this
import { PatientSearch } from '@/components/patient/PatientSearch';
import { useRouter } from 'next/navigation';
// Other imports...

export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isClientReady, setIsClientReady] = useState(false);

  // Use the PatientContext for UI operations
  const {
    selectPatient,
    currentPatientFile,
    isPatientContextEnabled,
    togglePatientContext,
    isLoading,
    error
  } = usePatient();

  // Use facility store directly for facility operations
  const { currentFacilityId, setCurrentFacilityId } = useFacilityStore();
  
  // Use patient store directly for patient listing
  const { patients, fetchPatientsCensusByFacility } = usePatientStore();

  const router = useRouter();

  // Set client ready state after hydration
  useEffect(() => {
    setIsClientReady(true);
    
    // Load patients for current facility
    if (currentFacilityId) {
      fetchPatientsCensusByFacility(currentFacilityId);
    }
  }, []);

  // Filter patients based on search query
  const filteredPatients = !patients ? [] : searchQuery.trim() === ''
    ? patients
    : patients.filter(patient => 
        // Your existing filter logic
        (patient.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         patient.lastName?.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  // Handle patient selection
  const handlePatientSelect = async (patientId: string) => {
    await selectPatient(patientId);
    router.push(`/protected/patients/${patientId}`);
  };

  // Rest of your component...
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