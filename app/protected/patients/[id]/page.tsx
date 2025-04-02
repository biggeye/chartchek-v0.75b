// app/protected/patients/[id]/page.tsx
"use client";

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { usePatientStore } from '@/store/patient/patientStore';
import { useEvaluationsStore } from '@/store/patient/evaluationsStore';

export default function PatientPage() {
  const { id: patientId } = useParams();
  const { currentPatient, isLoading, error } = usePatientStore();
  const { isLoadingEvaluations } = useEvaluationsStore();


  if (isLoading) {
    return <div className="p-4">Loading patient data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading patient data: {error}</div>;
  }


  return (
    <div className="space-y-6 p-4">

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Patient Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Demographics</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Name:</span> {currentPatient?.firstName} {currentPatient?.lastName}</p>
              <p><span className="font-medium">DOB:</span> {currentPatient?.dateOfBirth || 'Not available'}</p>
              <p><span className="font-medium">Gender:</span> {currentPatient?.gender}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Patient Information</h3>
            <div className="space-y-2">
              <p><span className="font-medium">MRN:</span>{currentPatient?.mrn}</p>
              {currentPatient?.status && <p><span className="font-medium">Status:</span> {currentPatient?.status || 'Unknown'}</p>}
              {currentPatient?.admissionDate && (
                <p><span className="font-medium">Admission Date:</span> {new Date(currentPatient?.admissionDate).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        </div>
      </div>



    </div>
  );
}