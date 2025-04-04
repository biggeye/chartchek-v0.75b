'use client';

import { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { PatientBreadcrumb } from '@/components/patient/PatientBreadcrumb';
import { PatientInfoCard } from '@/components/patient/PatientInfoCard';
import { EvaluationsCard } from '@/components/patient/EvaluationsCard';
import { VitalSignsCard } from '@/components/patient/VitalSignsCard';
import { useFacilityStore } from '@/store/patient/facilityStore';
import { usePatientStore } from '@/store/patient/patientStore';
import { useEvaluationsStore } from '@/store/patient/evaluationsStore';

import { PatientVitalSign } from '@/types/chartChek/kipuAdapter';
import { KipuPatientEvaluation, KipuEvaluationItem } from '@/types/kipu/evaluations';
import { ScrollArea } from '@/components/ui/scroll-area';

type ActiveTabType = 'overview' | 'evaluations' | 'appointments' | 'vitals' | 'orders' | 'treatmentPlan';


// Create a unified type that works with both your store and components
type UnifiedEvaluation = {
    id: number;
    name: string;
    status: "incomplete" | "complete" | "in_progress";
    patientCasefileId: string;
    evaluationId: number;
    patientProcessId: number;
    createdAt: string;
    createdBy: string;
    updatedAt?: string;
    updatedBy?: string;
    completedAt?: string;
    completedBy?: string;
    evaluationName: string;
    evaluationVersionId: number;
    evaluationItems: KipuEvaluationItem[];
};

// Adapter functions to convert KIPU types to component expected types
const adaptVitalSigns = (vitalSignsData: PatientVitalSign[], limit?: number): any[] => {
    if (!vitalSignsData || !Array.isArray(vitalSignsData)) {
        return [];
    }

    // Map to the format expected by VitalSignsCard component
    const mappedData = vitalSignsData.map(vs => ({
        id: String(vs.id || ''),
        patient_id: String(vs.patientId || ''),
        type: vs.type || '',
        value: String(vs.value || ''),
        unit: vs.unit || '',
        recorded_at: vs.recordedAt || '',
        timestamp: vs.recordedAt || ''
    }));

    return limit ? mappedData.slice(0, limit) : mappedData;
};


export default function PatientLayout({ children }: { children: ReactNode }) {
    const {
        currentPatient,
        currentPatientVitalSigns,
        fetchPatientById,
        fetchPatientVitalSigns,
        isLoading,
        error
    } = usePatientStore();

    const {
        patientEvaluations,
        fetchPatientEvaluations,
        isLoadingEvaluations
    } = useEvaluationsStore();

    const params = useParams();
    const patientId = params.id as string;
    const pathname = usePathname();

    useEffect(() => {
        if (patientId) {
            fetchPatientById(patientId);
            fetchPatientEvaluations(patientId);
            fetchPatientVitalSigns(patientId);
        }
    }, [patientId, fetchPatientById, fetchPatientEvaluations, fetchPatientVitalSigns]);

    const facilityId = useFacilityStore(state => state.currentFacilityId);

    // Determine active tab based on the current pathname
    const getActiveTab = (): ActiveTabType => {
        if (pathname.includes('/evaluations')) return 'evaluations';
        if (pathname.includes('/vitals')) return 'vitals';
        if (pathname.includes('/treatment')) return 'treatmentPlan';
        return 'overview';
    };

    const activeTab: ActiveTabType = getActiveTab();

    const patientNavigation = [
        { name: 'Overview', href: `/protected/patients/${patientId}`, current: activeTab === 'overview' },
        { name: 'Treatment Plan', href: `/protected/patients/${patientId}/treatment`, current: activeTab === 'treatmentPlan' },
        { name: 'Evaluations', href: `/protected/patients/${patientId}/evaluations`, current: activeTab === 'evaluations' },
        { name: 'Vitals', href: `/protected/patients/${patientId}/vitals`, current: activeTab === 'vitals' },
    ];

    function classNames(...classes: string[]) {
        return classes.filter(Boolean).join(' ');
    }

    // Only show the dashboard on the overview page
    const showDashboard = activeTab === 'overview';

    // Adapt the data to the component expected formats
    const adaptedVitalSigns = adaptVitalSigns(currentPatientVitalSigns, 4);
    const adaptedEvaluations = patientEvaluations && patientEvaluations.length > 0 ? patientEvaluations.slice(0, 4) : [];
   
    return (
        <div className="flex flex-col">
            <PatientBreadcrumb
                facilityId={facilityId}
                patientId={patientId}
                activeTab={activeTab as any}
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
                    <ScrollArea className="h-full w-full overflow-y-auto mb-10">
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
                                            onClick={() => {
                                                fetchPatientById(patientId);
                                                fetchPatientEvaluations(patientId);
                                                fetchPatientVitalSigns(patientId);
                                            }}
                                            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                </div>
                            ) : showDashboard && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-6">
                                        {currentPatient && <PatientInfoCard patient={currentPatient} />}
                                    </div>
                                    <div className="space-y-6">
                                        {adaptedVitalSigns && <VitalSignsCard adaptedVitalSigns={adaptedVitalSigns} />}
                                        {isLoadingEvaluations ? (
                                        <div className="space-y-6">
                                        <div className="animate-pulse bg-gray-100 rounded-lg h-64"></div>
                                        <div className="animate-pulse bg-gray-100 rounded-lg h-64"></div>
                                    </div>
                                        ) : (
                                            <EvaluationsCard adaptedEvaluations={adaptedEvaluations as any} />
                                        )
                                        }
                                    </div>
                                </div>
                            )
                        }

                            {/* Render the child pages */}
                            {!showDashboard && children}
                        </div>
                    </ScrollArea>
                </div>
            </PatientBreadcrumb>
        </div>
    );
}