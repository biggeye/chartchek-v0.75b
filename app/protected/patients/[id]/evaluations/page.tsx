'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/20/solid';
import { ClipboardDocumentCheckIcon, ClipboardDocumentListIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { PaperClipIcon } from '@heroicons/react/20/solid';
import { useFacilityStore } from '@/store/facilityStore';
import { usePatientStore } from '@/store/patientStore';
import { PatientTabsLayout } from '@/components/patient/PatientTabsLayout';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface Evaluation {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  type: string;
  score?: number;
}

export default function PatientEvaluationsPage() {
  const { id: patientId } = useParams<{ id: string }>();
  const { getCurrentFacility } = useFacilityStore();
  const currentFacility = getCurrentFacility();
  const { currentPatient } = usePatientStore();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);

  const evaluationStats = [
    { 
      id: 1, 
      name: 'Total Evaluations', 
      stat: evaluations.length.toString(), 
      icon: ClipboardDocumentListIcon, 
      change: '+2', 
      changeType: 'increase' 
    },
    { 
      id: 2, 
      name: 'Completed Evaluations', 
      stat: evaluations.filter(e => e.status === 'completed').length.toString(), 
      icon: ClipboardDocumentCheckIcon, 
      change: '+1', 
      changeType: 'increase' 
    },
    { 
      id: 3, 
      name: 'Average Completion Time', 
      stat: '48 hours', 
      icon: DocumentTextIcon, 
      change: '-12 hours', 
      changeType: 'decrease' 
    },
  ];

  useEffect(() => {
    async function fetchEvaluations() {
      if (!patientId || !currentFacility) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/kipu/patients/${patientId}/evaluations?facilityId=${currentFacility.id}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching evaluations: ${response.status}`);
        }
        
        const data = await response.json();
        setEvaluations(data.evaluations || []);
      } catch (err) {
        console.error('Failed to fetch patient evaluations:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch evaluations');
      } finally {
        setLoading(false);
      }
    }
    
    fetchEvaluations();
  }, [patientId, currentFacility]);

  const handleEvaluationClick = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
  };

  const content = (
    <div className="space-y-8">
      {loading ? (
        <div className="p-4">Loading patient evaluations...</div>
      ) : error ? (
        <div className="p-4 text-red-500">Error: {error}</div>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-gray-900">
            {currentPatient ? `${currentPatient.first_name} ${currentPatient.last_name}'s Evaluations` : 'Patient Evaluations'}
          </h1>
          
          {/* Stats Overview */}
          <div>
            <h3 className="text-base font-semibold text-gray-900">Evaluation Statistics</h3>

            <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {evaluationStats.map((item) => (
                <div
                  key={item.id}
                  className="relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-12 shadow-sm sm:px-6 sm:pt-6"
                >
                  <dt>
                    <div className="absolute rounded-md bg-indigo-500 p-3">
                      <item.icon aria-hidden="true" className="h-6 w-6 text-white" />
                    </div>
                    <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
                  </dt>
                  <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                    <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>
                    <p
                      className={classNames(
                        item.changeType === 'increase' ? 'text-green-600' : 'text-red-600',
                        'ml-2 flex items-baseline text-sm font-semibold',
                      )}
                    >
                      {item.changeType === 'increase' ? (
                        <ArrowUpIcon aria-hidden="true" className="h-5 w-5 shrink-0 self-center text-green-500" />
                      ) : (
                        <ArrowDownIcon aria-hidden="true" className="h-5 w-5 shrink-0 self-center text-red-500" />
                      )}

                      <span className="sr-only"> {item.changeType === 'increase' ? 'Increased' : 'Decreased'} by </span>
                      {item.change}
                    </p>
                    <div className="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6">
                      <div className="text-sm">
                        <button 
                          onClick={() => {}} 
                          className="font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          View all<span className="sr-only"> {item.name} stats</span>
                        </button>
                      </div>
                    </div>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          
          {/* Evaluation Details */}
          {selectedEvaluation ? (
            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
              <div className="px-4 py-6 sm:px-6">
                <h3 className="text-base/7 font-semibold text-gray-900">{selectedEvaluation.title}</h3>
                <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">Evaluation details and results.</p>
              </div>
              <div className="border-t border-gray-100">
                <dl className="divide-y divide-gray-100">
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900">Evaluation Type</dt>
                    <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{selectedEvaluation.type}</dd>
                  </div>
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900">Status</dt>
                    <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                        selectedEvaluation.status === 'completed' 
                          ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20' 
                          : 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20'
                      }`}>
                        {selectedEvaluation.status}
                      </span>
                    </dd>
                  </div>
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900">Created Date</dt>
                    <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                      {new Date(selectedEvaluation.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900">Last Updated</dt>
                    <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                      {new Date(selectedEvaluation.updatedAt).toLocaleDateString()}
                    </dd>
                  </div>
                  {selectedEvaluation.score !== undefined && (
                    <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-900">Score</dt>
                      <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{selectedEvaluation.score}</dd>
                    </div>
                  )}
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm/6 font-medium text-gray-900">Attachments</dt>
                    <dd className="mt-2 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <ul role="list" className="divide-y divide-gray-100 rounded-md border border-gray-200">
                        <li className="flex items-center justify-between py-4 pr-5 pl-4 text-sm/6">
                          <div className="flex w-0 flex-1 items-center">
                            <PaperClipIcon aria-hidden="true" className="h-5 w-5 shrink-0 text-gray-400" />
                            <div className="ml-4 flex min-w-0 flex-1 gap-2">
                              <span className="truncate font-medium">{selectedEvaluation.title}_report.pdf</span>
                              <span className="shrink-0 text-gray-400">1.2mb</span>
                            </div>
                          </div>
                          <div className="ml-4 shrink-0">
                            <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                              Download
                            </a>
                          </div>
                        </li>
                      </ul>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg p-6">
              <h3 className="text-base/7 font-semibold text-gray-900">Evaluation List</h3>
              {evaluations.length > 0 ? (
                <ul className="mt-4 divide-y divide-gray-100">
                  {evaluations.map((evaluation) => (
                    <li 
                      key={evaluation.id} 
                      className="py-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleEvaluationClick(evaluation)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{evaluation.title}</p>
                          <p className="text-sm text-gray-500">{evaluation.type} • {new Date(evaluation.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                          evaluation.status === 'completed' 
                            ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20' 
                            : 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20'
                        }`}>
                          {evaluation.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-gray-500">No evaluations found for this patient.</p>
              )}
            </div>
          )}
          
          {selectedEvaluation && (
            <div className="mt-4">
              <button
                onClick={() => setSelectedEvaluation(null)}
                className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Back to Evaluation List
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <PatientTabsLayout
      facilityId={currentFacility?.id || ''}
      patientId={patientId as string}
      activeTab="evaluations"
    >
      {content}
    </PatientTabsLayout>
  );
}