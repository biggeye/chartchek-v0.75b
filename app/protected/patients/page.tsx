'use client';

import { useEffect, useState } from 'react';
import { usePatient } from '@/lib/contexts/PatientProvider';
import { PatientSearch } from '@/components/patient/PatientSearch';
import PatientList from '@/components/patient/PatientList';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

// Define patient status types and their styling
const patientStatuses = {
  'Active': 'text-green-700 bg-green-50 ring-green-600/20',
  'Inactive': 'text-gray-600 bg-gray-50 ring-gray-500/10',
  'Discharged': 'text-yellow-800 bg-yellow-50 ring-yellow-600/20',
};


export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isClientReady, setIsClientReady] = useState(false);

  // Use the PatientContext instead of direct store access
  const {
    setFacility,
    currentFacilityId,
    patients,
    isLoading,
    error
  } = usePatient();

  const router = useRouter();

  // Set client ready state after hydration
  useEffect(() => {
    setIsClientReady(true);
    setFacility(currentFacilityId);
  }, []);


  // Filter patients based on search query
  const filteredPatients = !patients ? [] : searchQuery.trim() === ''
  ? patients
  : patients.filter(patient =>
      patient && 
      `${patient.firstName || ''} ${patient.lastName || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (patient.patientId && patient.patientId.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Patients</h1>
        <PatientSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={`loading-${i}`} className="py-4">
              <Skeleton className="h-6 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-red-500">
          Error loading patients: {error}
        </div>
      ) : (
        <PatientList
          patients={filteredPatients}
          currentFacilityId={currentFacilityId}
          onSelectPatient={(patientId: string) => {
            router.push(`/protected/patients/${patientId}`);
          }}
        />
      )}
    </div>
  );
}