// app/protected/patients/[id]/page.tsx
"use client";

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { usePatientStore } from '@/store/patientStore';
import { Button } from '@/components/ui/button';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PatientContextBuilderDialog } from '@/components/patient/PatientContextBuilderDialog';

export default function PatientPage() {
  const { id: patientId } = useParams();
  const { currentPatient, isLoading, error } = usePatientStore();
  
  const [isPatientContextEnabled, setIsPatientContextEnabled] = useState(false);
  const [isPatientContextBuilderOpen, setIsPatientContextBuilderOpen] = useState(false);
  const [isChartChekModalOpen, setIsChartChekModalOpen] = useState(false);

  const handleTogglePatientContext = () => {
    setIsPatientContextEnabled(!isPatientContextEnabled);
    if (!isPatientContextEnabled) {
      setIsPatientContextBuilderOpen(true);
    }
  };

  const handleClosePatientContextBuilder = () => {
    setIsPatientContextBuilderOpen(false);
  };

  const handleSavePatientContextOptions = () => {
    // Handle saving patient context options
    setIsPatientContextBuilderOpen(false);
  };

  const handleOpenChartChek = () => {
    setIsChartChekModalOpen(true);
  };

  const handleCloseChartChek = () => {
    setIsChartChekModalOpen(false);
  };

  if (isLoading) {
    return <div className="p-4">Loading patient data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading patient data: {error}</div>;
  }

  if (!currentPatient) {
    return <div className="p-4">No patient data available.</div>;
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-end gap-3 mb-4">
        <Button
        outline
          onClick={handleTogglePatientContext}

          className="flex items-center gap-2 text-sm py-1.5 px-3"
        >
          {isPatientContextEnabled ? "Disable Patient Context" : "Enable Patient Context"}
        </Button>
        
        <Button
          outline
          className="flex items-center gap-2 text-sm py-1.5 px-3"
          onClick={handleOpenChartChek}
        >
          <ChatBubbleLeftRightIcon className="h-5 w-5" />
          <span>Open ChartChek</span>
        </Button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Patient Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Demographics</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Name:</span> {currentPatient.firstName} {currentPatient.lastName}</p>
              <p><span className="font-medium">DOB:</span> {currentPatient.dateOfBirth || 'Not available'}</p>
              <p><span className="font-medium">Gender:</span> {currentPatient.gender}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Patient Information</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Patient ID:</span> {patientId}</p>
              <p><span className="font-medium">Status:</span> {currentPatient.status || 'Active'}</p>
              {currentPatient.admissionDate && (
                <p><span className="font-medium">Admission Date:</span> {new Date(currentPatient.admissionDate).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <PatientContextBuilderDialog
        isOpen={isPatientContextBuilderOpen}
        onClose={handleClosePatientContextBuilder}
        onApply={handleSavePatientContextOptions}
      />

      {/* ChartChek Modal */}
      <Dialog open={isChartChekModalOpen} onOpenChange={(open) => !open && handleCloseChartChek()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
              <span>ChartChek</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                Patient: {currentPatient.firstName} {currentPatient.lastName}
              </h3>
              
              {/* ChartChek content */}
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-500">
                  ChartChek functionality is being implemented. This modal will contain
                  AI-assisted chart review and analysis tools.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}