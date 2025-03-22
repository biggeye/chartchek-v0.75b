'use client';

import { useEffect, useState } from 'react';
import { usePatientStore } from '@/store/patientStore';
import { useFacilityStore } from '@/store/facilityStore';
import { PatientBasicInfo } from '@/types/kipu';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export function PatientList() {
  const { patients, isLoading, error, fetchPatients } = usePatientStore();
  const { currentFacilityId, getCurrentFacility } = useFacilityStore();
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const currentFacility = getCurrentFacility();

  useEffect(() => {
    async function loadPatients() {
      if (!currentFacilityId) return;
      
      setLoadingState('loading');
      try {
          await fetchPatients(currentFacilityId);
        setLoadingState('success');
      } catch (err) {
        console.error('PatientList - Error loading patients:', err);
        setLoadingState('error');
      }
    }

    loadPatients();
  }, [currentFacilityId, fetchPatients]);

  function formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <h3 className="text-lg font-medium">Patients</h3>
        <p className="text-sm text-muted-foreground">
          {currentFacility ? `Patients at ${currentFacility.name}` : 'Please select a facility'}
        </p>
      </CardHeader>
      <CardContent>
        {!currentFacility ? (
          <div className="text-center py-8 text-muted-foreground">
            Please select a facility to view patients
          </div>
        ) : loadingState === 'loading' || isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : loadingState === 'error' || error ? (
          <div className="text-center py-8 text-destructive">
            Error loading patients: {error || 'Unknown error'}
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No patients found for this facility
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>MR Number</TableHead>
                <TableHead>DOB</TableHead>
                <TableHead>Admission</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient: PatientBasicInfo) => (
                <TableRow key={patient.patientId || patient.mrn}>
                  <TableCell className="font-medium">
                    {patient.firstName} {patient.lastName}
                  </TableCell>
                  <TableCell>{patient.mrn}</TableCell>
                  <TableCell>{formatDate(patient.dateOfBirth)}</TableCell>
                  <TableCell>{formatDate(patient.admissionDate)}</TableCell>
                  <TableCell>
                    <Badge className={patient.dischargeDate ? "bg-gray-100 text-gray-800" : "bg-green-100 text-green-800"}>
                      {patient.dischargeDate ? "Discharged" : "Active"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
