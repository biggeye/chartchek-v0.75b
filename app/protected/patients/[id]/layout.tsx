'use client';

import { ReactNode, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { PatientBreadcrumb } from '@/components/patient/PatientBreadcrumb';
import { PatientInfoCard } from '@/components/patient/PatientInfoCard';
import { EvaluationsCard } from '@/components/patient/EvaluationsCard';
import { VitalSignsCard } from '@/components/patient/VitalSignsCard';
import { AppointmentsCard } from '@/components/patient/AppointmentsCard';
import { usePatientStore } from '@/store/patientStore';
import { useFacilityStore } from '@/store/facilityStore';
import { PatientVitalSign, KipuPatientEvaluation, PatientAppointment } from '@/types/kipu';
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


// Adapter functions to convert KIPU types to component expected types
const adaptVitalSigns = (vitalSignsData: any, limit?: number): VitalSign[] => {
    // Check if vitalSignsData is null or undefined
    if (!vitalSignsData) {
        console.warn('adaptVitalSigns received null or undefined data');
        return [];
    }

    // Handle both array and object with vital_signs property formats
    let vitalSigns = vitalSignsData;

    // If vitalSignsData has a 'vital_signs' property and it's an array, use that
    if (vitalSignsData.vital_signs && Array.isArray(vitalSignsData.vital_signs)) {
        vitalSigns = vitalSignsData.vital_signs;
    }

    // Check if vitalSigns is an array
    if (!Array.isArray(vitalSigns)) {
        console.warn('adaptVitalSigns: vital_signs is not an array:', vitalSigns);
        return [];
    }
    const mappedData = vitalSigns.map(vs => ({
        id: String(vs.id),
        patient_id: String(vs.patientId || ''),
        type: vs.type || '',
        value: String(vs.value || ''),
        timestamp: vs.recordedAt || ''
    }));

    // Return limited data if limit is provided
    return limit ? mappedData.slice(0, limit) : mappedData;
};

const adaptEvaluations = (evaluationsData: any, limit?: number): KipuPatientEvaluation[] => {
    // Check if evaluationsData is null or undefined
    if (!evaluationsData) {
        console.warn('adaptEvaluations received null or undefined data');
        return [];
    }

    // Handle both array and object with evaluations property formats
    let evaluations = evaluationsData;

    // If evaluationsData has an 'evaluations' property and it's an array, use that
    if (evaluationsData.evaluations && Array.isArray(evaluationsData.evaluations)) {
        evaluations = evaluationsData.evaluations;
    }

    // Check if evaluations is an array
    if (!Array.isArray(evaluations)) {
        console.warn('adaptEvaluations: evaluations is not an array:', evaluations);
        return [];
    }

    const mappedData = evaluations.map(evaluation => ({
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

    // Return limited data if limit is provided
    return limit ? mappedData.slice(0, limit) : mappedData;
};

export default function PatientLayout({ children }: { children: ReactNode }) {
    const params = useParams();
    const pathname = usePathname();
    const patientId = params.id as string;
    const facilityId = useFacilityStore.getState().currentFacilityId;
    // Determine active tab based on the current pathname
    const getActiveTab = (): ActiveTabType => {
        if (pathname.includes('/evaluations')) return 'evaluations';
        if (pathname.includes('/vitals')) return 'vitals';
        return 'overview';
    };

    const activeTab: ActiveTabType = getActiveTab();

    const patientNavigation = [
        { name: 'Overview', href: `/protected/patients/${patientId}`, current: activeTab === 'overview' },
        { name: 'Evaluations', href: `/protected/patients/${patientId}/evaluations`, current: activeTab === 'evaluations' },
        { name: 'Vitals', href: `/protected/patients/${patientId}/vitals`, current: activeTab === 'vitals' },
    ];

    const {
        currentPatient,
        currentPatientEvaluations,
        currentPatientVitalSigns,
        isLoading,
        error,
        fetchPatientWithDetails
    } = usePatientStore.getState();


    // Fetch patient data only once when the component mounts or patientId changes
    useEffect(() => {
        const fetchPatientDetails = async () => {
        await fetchPatientWithDetails(patientId);

        if (currentPatientEvaluations) {
            (adaptEvaluations(currentPatientEvaluations, 4)); // Limit to 4 items
        }
        if (currentPatientVitalSigns) {
            (adaptVitalSigns(currentPatientVitalSigns, 4)); // Limit to 4 items
        }
    };
    fetchPatientDetails();

    }, []);


    function classNames(...classes: string[]) {
        return classes.filter(Boolean).join(' ');
    }

    // Only show the dashboard on the overview page
    const showDashboard = activeTab === 'overview';

    // Adapt the KIPU data to the component expected formats
    // Ensure we always pass arrays (even empty ones) to the adapter functions
    const adaptedVitalSigns = adaptVitalSigns(currentPatientVitalSigns || [], 4);
    const adaptedEvaluations = adaptEvaluations(currentPatientEvaluations || [], 4);

    return (
        <div className="flex flex-col">
        
            <PatientBreadcrumb
                facilityId={facilityId}
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
                            {isLoading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-6">
                                        <div className="animate-pulse bg-gray-100 rounded-lg h-64"></div>
                                        <div className="animate-pulse bg-gray-100 rounded-lg h-64"></div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="animate-pulse bg-gray-100 rounded-lg h-64"></div>
                                        <div className="animate-pulse bg-gray-100 rounded-lg h-64"></div>
                                    </div>
                                </div>
                            ) : error ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="text-center">
                                        <h3 className="text-lg font-medium text-red-600">Error loading patient data</h3>
                                        <p className="mt-1 text-sm text-gray-500">{error}</p>
                                        <button
                                            onClick={() => fetchPatientWithDetails(patientId)}
                                            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                </div>
                            ) : showDashboard && currentPatient ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-6">
                                        <PatientInfoCard patient={currentPatient} />
                                        <VitalSignsCard adaptedVitalSigns={adaptedVitalSigns} />

                                    </div>
                                    <div className="space-y-6">
                                        <EvaluationsCard adaptedEvaluations={adaptedEvaluations} />
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