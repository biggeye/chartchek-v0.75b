// app/protected/patients/[id]/page.tsx
"use client";

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { usePatient } from '@/lib/contexts/PatientProvider';

export default function PatientPage() {
  const { id: patientId } = useParams();
  const { currentPatientFile, isLoading, error } = usePatient();
    


  if (isLoading) {
    return <div className="p-4">Loading patient data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading patient data: {error}</div>;
  }

  if (!currentPatientFile?.patient) {
    return <div className="p-4">No patient data available.</div>;
  }

  return (
    <div className="space-y-6 p-4">
 
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Patient Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Demographics</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Name:</span> {currentPatientFile?.patient.firstName} {currentPatientFile?.patient.lastName}</p>
              <p><span className="font-medium">DOB:</span> {currentPatientFile?.patient.dateOfBirth || 'Not available'}</p>
              <p><span className="font-medium">Gender:</span> {currentPatientFile?.patient.gender}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Patient Information</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Patient ID:</span> {patientId}</p>
              <p><span className="font-medium">Status:</span> {currentPatientFile?.patient.status || 'Active'}</p>
              {currentPatientFile?.patient.admissionDate && (
                <p><span className="font-medium">Admission Date:</span> {new Date(currentPatientFile?.patient.admissionDate).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        </div>
      </div>



    </div>
  );
}