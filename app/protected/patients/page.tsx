'use client';

import { useEffect, useState } from 'react';
import { usePatientStore } from '@/store/patientStore';
import { useFacilityStore } from '@/store/facilityStore';
import { PatientListItem } from '@/components/patient/PatientListItem';
import { PatientSearch } from '@/components/patient/PatientSearch';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Define a type that matches the PatientListItem component requirements
interface PatientListItemType {
  id: string;
  first_name: string;
  last_name: string;
  dob?: string;
  gender?: string;
  contact?: {
    email?: string;
    phone?: string;
  };
}

export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { patients, isLoading, error, fetchPatientsForCurrentFacility } = usePatientStore();
  const { currentFacilityId } = useFacilityStore();

  useEffect(() => {
    // Fetch patients when the component mounts or when the facility changes
    fetchPatientsForCurrentFacility();
  }, [currentFacilityId, fetchPatientsForCurrentFacility]);

  // Filter patients based on search query
  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || 
           (patient.id && patient.id.toString().includes(query)) ||
           (patient.mr_number && patient.mr_number.toString().includes(query));
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
                  id: patient.id || patient.mr_number || '',
                  first_name: patient.first_name,
                  last_name: patient.last_name,
                  dob: patient.dob
                  // Note: gender and contact are not in PatientBasicInfo type
                };
                
                return (
                  <div key={patient.id || `patient-${patient.mr_number}`}>
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