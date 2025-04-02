'use client';

import { useEffect, useState } from 'react';
// Remove this import since we're moving away from context
// import { usePatient } from '@/lib/contexts/PatientProvider';
import { useFacilityStore } from '@/store/patient/facilityStore';
import { usePatientStore } from '@/store/patient/patientStore';
import { PatientSearch } from '@/components/patient/PatientSearch';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';



export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ start: string | null; end: string | null }>({ 
    start: null, 
    end: null 
  });
  const [isClientReady, setIsClientReady] = useState(false);
  // Replace PatientContext with PatientStore
  const {
    currentPatient,
    isPatientContextEnabled,
    setIsLoadingPatients,
    isLoadingPatients,
    error,
    patients,
    fetchPatientsCensusByFacility,
    fetchPatientsAdmissionsByFacility
  } = usePatientStore();

  // Use facility store for facility operations
  const { currentFacilityId } = useFacilityStore();

  const router = useRouter();


  useEffect(() => {
    setIsClientReady(true);
  }, []);

  // Then handle data fetching in a separate effect that depends on isClientReady
  // In patients/page.tsx, update the useEffect for the toggle:
  // Add console logs to track state changes


  useEffect(() => {
    const loadPatients = async () => {
    if (!isClientReady || !currentFacilityId) return;
    
    setIsLoadingPatients(true);
    
    const fetchFunction = await fetchPatientsAdmissionsByFacility;
      
    fetchFunction(currentFacilityId)
      .finally(() => setIsLoadingPatients(false));
    };
    loadPatients();
  }, [currentFacilityId, isClientReady, fetchPatientsAdmissionsByFacility]);
  

  if (!isClientReady) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-40">
        <div className="spinner"></div>
      </div>
    );
  }

  // Filter patients based on search query
  const filteredPatients = !patients ? [] : 
    patients.filter(patient => {
      // First filter by facility
      if (patient.facilityId !== currentFacilityId) return false;
      
      // Then filter by search query
      const matchesSearch = searchQuery.trim() === '' || 
        (patient.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         patient.lastName?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Then filter by date range if applicable
      let matchesDateRange = true;
      if (dateRange.start || dateRange.end) {
        const admissionDate = patient.admissionDate ? new Date(patient.admissionDate) : null;
        if (!admissionDate) return false;
        
        if (dateRange.start) {
          const startDate = new Date(dateRange.start);
          if (admissionDate < startDate) matchesDateRange = false;
        }
        
        if (dateRange.end) {
          const endDate = new Date(dateRange.end);
          if (admissionDate > endDate) matchesDateRange = false;
        }
      }
      
      return matchesSearch && matchesDateRange;
    });

  // Handle patient selection
  const handlePatientSelect = async (patientId: string) => {
    router.push(`/protected/patients/${patientId}`);
  };


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-2">
        
      
          <h1 className="text-2xl font-bold">Patients</h1>
          <PatientSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />
     
      </div>


      {/* Patient list */}
      {isLoadingPatients ? (
        <div className="flex justify-center items-center h-40">
          <div className="spinner"></div>
        </div>
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