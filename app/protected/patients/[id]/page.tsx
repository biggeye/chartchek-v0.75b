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
  // Ensure we properly decode the patient ID from the URL
  const encodedPatientId = params.id as string;
  const patientId = decodeURIComponent(encodedPatientId);
  
  const [isPatientContextBuilderOpen, setIsPatientContextBuilderOpen] = useState(false);
  const [isChartChekModalOpen, setIsChartChekModalOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
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
    console.log(`PatientDetailsPage - Rendering with patientId: ${patientId} (from URL: ${encodedPatientId}), facilityId: ${currentFacilityId}`);
    
    if (currentFacilityId && patientId) {
      console.log(`PatientDetailsPage - Fetching patient details for patient ${patientId} in facility ${currentFacilityId}`);
      
      // Collect debug info
      setDebugInfo({
        timestamp: new Date().toISOString(),
        patientId,
        encodedPatientId,
        facilityId: currentFacilityId
      });
      
      fetchPatientWithDetails(currentFacilityId, patientId)
        .then(result => {
          console.log('PatientDetailsPage - Patient details fetch result:', {
            hasPatient: !!result.patient,
            evaluationsCount: result.evaluations.length,
            vitalSignsCount: result.vitalSigns.length,
            appointmentsCount: result.appointments.length
          });
          
          // Update debug info
          setDebugInfo((prev: any) => ({
            ...prev,
            fetchResult: {
              hasPatient: !!result.patient,
              patientData: result.patient ? {
                id: result.patient.id,
                first_name: result.patient.first_name,
                last_name: result.patient.last_name
              } : null
            }
          }));
        })
        .catch(err => {
          console.error('PatientDetailsPage - Error fetching patient details:', err);
          setDebugInfo((prev: any) => ({
            ...prev,
            error: err.message
          }));
        });
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
          {debugInfo && (
            <div className="mt-8 p-4 border border-gray-200 rounded-md bg-gray-50">
              <h3 className="text-sm font-semibold mb-2">Debug Information (Loading)</h3>
              <pre className="text-xs overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
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
          {debugInfo && (
            <div className="mt-8 p-4 border border-gray-200 rounded-md bg-gray-50 text-left">
              <h3 className="text-sm font-semibold mb-2">Debug Information (Error)</h3>
              <pre className="text-xs overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
              <div className="mt-4">
                <h4 className="text-sm font-semibold">Current Store State:</h4>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify({
                    currentFacilityId,
                    patientId,
                    isLoading,
                    error
                  }, null, 2)}
                </pre>
              </div>
            </div>
          )}
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
      
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 border border-gray-200 rounded-md bg-gray-50">
          <h3 className="text-sm font-semibold mb-2">Debug Information (Success)</h3>
          <pre className="text-xs overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}