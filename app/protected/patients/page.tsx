'use client';

import { useEffect, useState } from 'react';
import { usePatientStore } from '@/store/patientStore';
import { useFacilityStore } from '@/store/facilityStore';
import { PatientListItem } from '@/components/patient/PatientListItem';
import { PatientSearch } from '@/components/patient/PatientSearch';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { kipuGetPatients } from '@/lib/kipu/service/patient-service';

// Define a type that matches the PatientListItem component requirements
interface PatientListItemType {
  patientId: string;
  firstName: string;
  lastName: string;
  dob?: string;
  gender?: string;
  contact?: {
    email?: string;
    phone?: string;
  };
}

export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { patients, isLoading, error } = usePatientStore();
  const { currentFacilityId, fetchFacilities } = useFacilityStore();

  useEffect(() => {
    // Fetch facilities first
    fetchFacilities();
    // Fetch patients when the component mounts or when the facility changes
    console.log('currentFacilityId', currentFacilityId);
  }, []);

 // Remove this filtering since we're getting all patients now
// const patientsByFacility = patients.filter(patient => 
//   String(patient.facilityId) === String(currentFacilityId)
// );

// Just use all patients directly
const filteredPatients = patients.filter(patient => {
  const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
  const query = searchQuery.toLowerCase();
  
  // Enhanced search to include more fields
  return fullName.includes(query) || 
         (patient.patientId && patient.patientId.toString().toLowerCase().includes(query)) ||
         (patient.mrn && patient.mrn.toString().toLowerCase().includes(query)) ||
         (patient.gender && patient.gender.toLowerCase().includes(query));
});

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Patients</h1>
      
      <div className="mb-6">
        <PatientSearch 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <h2 className="text-xl font-semibold">Patient List</h2>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            // Loading state
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="py-4">
                  <Skeleton className="h-6 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : error ? (
            // Error state
            <div className="py-4 text-center text-red-500">
              <p>{error}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Please select a facility to view patients.
              </p>
            </div>
          ) : filteredPatients.length === 0 ? (
            // Empty state
            <div className="py-4 text-center text-muted-foreground">
              {searchQuery ? 'No patients match your search.' : 'No patients found.'}
            </div>
          ) : (
            // Patient list
            <div className="divide-y">
              {filteredPatients.map((patient) => {
                // Create a patient object that matches the PatientListItem component requirements
                const patientForList: PatientListItemType = {
                  patientId: patient.patientId || patient.mrn || '',
                  firstName: patient.firstName,
                  lastName: patient.lastName,
                  dob: patient.dateOfBirth,
                  gender: patient.gender,
                };
                
                return (
                  <div key={patient.patientId || patient.mrn || `patient-${patient.mrn}`}>
                    <PatientListItem 
                      patient={patientForList} 
                      facilityId={currentFacilityId || ''}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}