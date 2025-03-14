'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { usePatientStore } from '@/store/patientStore';
import { useFacilityStore } from '@/store/facilityStore';
import { PatientInfoCard } from '@/components/patient/PatientInfoCard';
import { EvaluationsCard } from '@/components/patient/EvaluationsCard';
import { VitalSignsCard } from '@/components/patient/VitalSignsCard';
import { AppointmentsCard } from '@/components/patient/AppointmentsCard';
import { PatientTabsLayout } from '@/components/patient/PatientTabsLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PatientContextBuilderDialog } from '@/components/patient/PatientContextBuilderDialog';
import { PatientContextOption } from '@/store/patientStore';
import Breadcrumb from '@/components/ui/breadcrumb';
import { ChartChekModal } from '@/components/patient/ChartChekModal';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

// Define Page interface for breadcrumb
interface Page {
  name: string;
  href: string;
  current: boolean;
}

export default function PatientDetailsPage() {
  const params = useParams();
  const patientId = params.id as string;
  const [isPatientContextBuilderOpen, setIsPatientContextBuilderOpen] = useState(false);
  const [isChartChekModalOpen, setIsChartChekModalOpen] = useState(false);
  
  const { 
    currentPatient, 
    currentPatientEvaluations, 
    currentPatientVitalSigns, 
    currentPatientAppointments,
    isLoading, 
    error, 
    fetchPatientWithDetails,
    isPatientContextEnabled,
    setPatientContextEnabled,
    updatePatientContextOptions,
    selectedContextOptions
  } = usePatientStore();
  
  const { currentFacilityId } = useFacilityStore();

  useEffect(() => {
    if (currentFacilityId && patientId) {
      fetchPatientWithDetails(currentFacilityId, patientId);
    }
  }, [currentFacilityId, patientId, fetchPatientWithDetails]);

  const handleTogglePatientContext = () => {
    if (!isPatientContextEnabled) {
      // If enabling, open the context builder dialog
      setIsPatientContextBuilderOpen(true);
    } else {
      // If disabling, just turn it off
      setPatientContextEnabled(false);
    }
  };

  const handleApplyContextOptions = (options: PatientContextOption[]) => {
    updatePatientContextOptions(options);
    setPatientContextEnabled(true);
    setIsPatientContextBuilderOpen(false);
  };

  const handleOpenChartChek = () => {
    setIsChartChekModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="space-y-6">
          <Skeleton className="h-8 w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !currentPatient) {
    return (
      <div className="container py-6">
        <div className="text-center text-red-500">
          <p>{error || 'Patient not found'}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please select a valid patient.
          </p>
        </div>
      </div>
    );
  }

  // Prepare patient data for the PatientInfoCard component
  const patientForInfoCard = {
    id: currentPatient.id || currentPatient.mr_number || '',
    first_name: currentPatient.first_name,
    last_name: currentPatient.last_name,
    dob: currentPatient.dob,
    gender: currentPatient.gender || 'Not specified',
    address: currentPatient.address || 'Not specified',
    contact: {
      email: currentPatient.email || 'Not specified',
      phone: currentPatient.phone || 'Not specified'
    }
  };

  // Prepare breadcrumb pages
  const breadcrumbPages: Page[] = [
    { name: 'Patients', href: '/protected/patients', current: false },
    { name: `${currentPatient.first_name} ${currentPatient.last_name}`, href: '#', current: true },
  ];

  return (
    <div className="container py-6">
      <Breadcrumb pages={breadcrumbPages} />
      
      <div className="flex justify-between items-center my-6">
        <h1 className="text-2xl font-bold">
          {currentPatient.first_name} {currentPatient.last_name}
        </h1>
        <div className="flex space-x-3">
          <Button
            onClick={handleOpenChartChek}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
            ChartChek
          </Button>
          <Button
            onClick={handleTogglePatientContext}
            color={isPatientContextEnabled ? "red" : "dark/zinc"}
          >
            {isPatientContextEnabled ? "Disable Patient Context" : "Enable Patient Context"}
          </Button>
        </div>
      </div>

      <PatientTabsLayout
        facilityId={currentFacilityId || ''}
        patientId={patientId}
        activeTab="overview"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <PatientInfoCard patient={patientForInfoCard} />
            <VitalSignsCard vitalSigns={currentPatientVitalSigns} />
          </div>
          <div className="space-y-6">
            <EvaluationsCard evaluations={currentPatientEvaluations} />
            <AppointmentsCard appointments={currentPatientAppointments} />
          </div>
        </div>
      </PatientTabsLayout>

      <PatientContextBuilderDialog
        isOpen={isPatientContextBuilderOpen}
        onClose={() => setIsPatientContextBuilderOpen(false)}
        onApply={handleApplyContextOptions}
      />

      <ChartChekModal
        isOpen={isChartChekModalOpen}
        onClose={() => setIsChartChekModalOpen(false)}
        patientId={patientId}
      />
    </div>
  );
}