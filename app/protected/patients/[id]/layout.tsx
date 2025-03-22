'use client';

import { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { PatientBreadcrumb } from '@/components/patient/PatientBreadcrumb';
import { PatientInfoCard } from '@/components/patient/PatientInfoCard';
import { EvaluationsCard } from '@/components/patient/EvaluationsCard';
import { VitalSignsCard } from '@/components/patient/VitalSignsCard';
import { AppointmentsCard } from '@/components/patient/AppointmentsCard';
import { usePatientStore } from '@/store/patientStore';
import { useFacilityStore } from '@/store/facilityStore';
import { PatientVitalSign, PatientEvaluation, PatientAppointment } from '@/types/kipu';
import { ScrollArea } from '@/components/ui/scroll-area';

// Define the type for the active tab
type ActiveTabType = 'overview' | 'evaluations' | 'appointments' | 'vitals' | 'orders';

// Adapter interfaces for component props
interface VitalSign {
  id: string;
  patient_id: string;
  type: string;
  value: string;
  timestamp: string;
}



interface Appointment {
  id: string;
  patient_id: string;
  appointment_time: string;
  status: string;
  notes?: string;
}

// Adapter functions to convert KIPU types to component expected types
const adaptVitalSigns = (vitalSigns: PatientVitalSign[]): VitalSign[] => {
  return vitalSigns.map(vs => ({
    id: String(vs.id),
    patient_id: String(vs.patientId || ''),
    type: vs.type || '',
    value: String(vs.value || ''),
    timestamp: vs.recordedAt || ''
  }));
};

const adaptEvaluations = (evaluations: PatientEvaluation[]): PatientEvaluation[] => {
    return evaluations.map(evaluation => ({
      id: evaluation.id,
      name: evaluation.name || 'Unnamed Evaluation',
      status: evaluation.status || 'open',
      patientCasefileId: evaluation.patientCasefileId || '',
      evaluationId: evaluation.evaluationId,
      patientProcessId: evaluation.patientProcessId,
      createdAt: evaluation.createdAt || '',
      createdBy: evaluation.createdBy || 'Unknown',
      updatedAt: evaluation.updatedAt || '',
      updatedBy: evaluation.updatedBy || null,
      evaluationContent: evaluation.evaluationContent
    }));
  };

const adaptAppointments = (appointments: PatientAppointment[]): Appointment[] => {
  return appointments.map(appt => ({
    id: String(appt.id),
    patient_id: String(appt.patientId || ''),
    appointment_time: appt.startTime || '',
    status: appt.status || '',
    notes: appt.notes
  }));
};

export default function PatientLayout({ children }: { children: ReactNode }) {
    const params = useParams();
    const pathname = usePathname();
    const patientId = params.id as string;
    const { currentFacilityId } = useFacilityStore();
    
    // Determine active tab based on the current pathname
    const getActiveTab = (): ActiveTabType => {
        if (pathname.includes('/evaluations')) return 'evaluations';
        if (pathname.includes('/appointments')) return 'appointments';
        if (pathname.includes('/vitals')) return 'vitals';
        if (pathname.includes('/orders')) return 'orders';
        return 'overview';
    };
    
    const activeTab: ActiveTabType = getActiveTab();
    
    const patientNavigation = [
        { name: 'Overview', href: `/protected/patients/${patientId}`, current: activeTab === 'overview' },
        { name: 'Evaluations', href: `/protected/patients/${patientId}/evaluations`, current: activeTab === 'evaluations' },
        { name: 'Appointments', href: `/protected/patients/${patientId}/appointments`, current: activeTab === 'appointments' },
        { name: 'Vitals', href: `/protected/patients/${patientId}/vitals`, current: activeTab === 'vitals' },
        { name: 'Orders', href: `/protected/patients/${patientId}/orders`, current: activeTab === 'orders' },
    ];
    
    const { 
        currentPatient, 
        currentPatientEvaluations, 
        currentPatientVitalSigns, 
        currentPatientAppointments,
        isLoading, 
        error, 
        fetchPatientWithDetails
    } = usePatientStore();
    
    // Fetch patient data when the layout mounts
// In app/protected/patients/[id]/layout.tsx

useEffect(() => {
    if (patientId) {
      // No need to pass facilityId anymore
      fetchPatientWithDetails(patientId);
    }
  }, [patientId, fetchPatientWithDetails]);
    
    function classNames(...classes: string[]) {
        return classes.filter(Boolean).join(' ');
    }

    // Only show the dashboard on the overview page
    const showDashboard = activeTab === 'overview';

    // Adapt the KIPU data to the component expected formats
    const adaptedVitalSigns = currentPatientVitalSigns ? adaptVitalSigns(currentPatientVitalSigns) : [];
    const adaptedEvaluations = currentPatientEvaluations ? adaptEvaluations(currentPatientEvaluations) : [];
    const adaptedAppointments = currentPatientAppointments ? adaptAppointments(currentPatientAppointments) : [];

    return (
        <div className="flex flex-col">
            <PatientBreadcrumb
                facilityId={currentFacilityId || ''}
                patientId={patientId}
                activeTab={activeTab}
            >
                <div className="flex flex-row w-full">
                    {/* Sidebar Navigation */}
                    <nav aria-label="Sidebar" className="md:flex w-48 flex-shrink-0 pr-4 border-r border-gray-200 hidden">
                        <ul role="list" className="space-y-1 py-4">
                            {patientNavigation.map((item) => (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className={classNames(
                                            item.current ? 'bg-gray-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600',
                                            'group flex gap-x-3 rounded-md p-2 pl-3 text-sm font-semibold'
                                        )}
                                    >
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                    
                    {/* Main Content Area */}
                    <ScrollArea className="h-full w-full overflow-y-auto mb-20">
                    <div className="flex-1 pl-6 py-4">
                        {showDashboard ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-6">
                                    <PatientInfoCard patient={currentPatient} />
                                    <VitalSignsCard vitalSigns={adaptedVitalSigns} />
                                </div>
                                <div className="space-y-6">
                                    <EvaluationsCard evaluations={adaptedEvaluations} />
                                    <AppointmentsCard appointments={adaptedAppointments} />
                                </div>
                            </div>
                        ) : (
                            children
                        )}
                    </div>
                    </ScrollArea>
                </div>
            </PatientBreadcrumb>
        </div>
    );
}