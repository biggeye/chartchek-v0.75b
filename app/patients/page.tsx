'use client';

import { useEffect } from 'react';
import { FacilitySelector } from '@/components/ui/facility-selector';
import { PatientList } from '@/components/patients/PatientList';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useFacilityStore } from '@/store/facilityStore';

export default function PatientsPage() {
  const { fetchFacilities } = useFacilityStore();

  // Load facilities on page load
  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Patient Management</h1>
      <p className="text-muted-foreground">
        Select a facility to view and manage patients
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium">Facility</h3>
              <p className="text-sm text-muted-foreground">
                Select a facility to view patients
              </p>
            </CardHeader>
            <CardContent>
              <FacilitySelector />
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-8">
          <PatientList />
        </div>
      </div>
    </div>
  );
}
