'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/20/solid';
import {
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { usePatientStore } from '@/store/patientStore';
import { KipuPatientEvaluation } from '@/types/kipu';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

// Update the Evaluation interface to match the KIPU API respons
// Simple spinner component
const Spinner = ({ className }: { className?: string }) => (
  <div className={`animate-spin rounded-full border-t-2 border-b-2 border-indigo-500 ${className}`}></div>
);

export default function KipuPatientEvaluationsPage() {
  const { id: patientId } = useParams<{ id: string }>();
  const { 
    currentPatientEvaluations, 
    isLoading, 
    error 
  } = usePatientStore();
  
  const [evaluations, setEvaluations] = useState<KipuPatientEvaluation[]>([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState<KipuPatientEvaluation | null>(null);

  const evaluationStats = [
    {
      id: 1,
      name: 'Total Evaluations',
      stat: evaluations.length.toString(),
      icon: ClipboardDocumentListIcon,
    },
    {
      id: 2,
      name: 'Completed Evaluations',
      stat: evaluations.filter(e => e.status !== 'open').length.toString(),
      icon: ClipboardDocumentCheckIcon,
    },
  ];

  // Process evaluations data from the store whenever it changes
  useEffect(() => {
    if (!currentPatientEvaluations) return;
    
    // No need to transform, just use the KipuPatientEvaluation objects directly
    setEvaluations(currentPatientEvaluations);
  }, [currentPatientEvaluations]);

  const handleEvaluationClick = (evaluation: KipuPatientEvaluation) => {
    // Instead of just setting the selected evaluation
    setSelectedEvaluation(evaluation);

    // Navigate to the evaluation detail page
  };

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div>
        <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {evaluationStats.map((item) => (
            <div
              key={item.id}
              className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:pt-6"
            >
              <dt>
                <div className="absolute rounded-md bg-indigo-500 p-3">
                  <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
              </dt>
              <dd className="ml-16 flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>

              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Evaluations List */}
      <div className="overflow-hidden bg-white shadow sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {isLoading ? (
            <li className="p-4 text-center">
              <Spinner className="h-8 w-8 mx-auto" />
              <p className="mt-2 text-sm text-gray-500">Loading evaluations...</p>
            </li>
          ) : error ? (
            <li className="p-4 text-center">
              <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-500" />
              <p className="mt-2 text-sm text-red-500">{error}</p>
            </li>
          ) : evaluations.length === 0 ? (
            <li className="p-4 text-center">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No evaluations found</p>
            </li>
          ) : (
            evaluations.map((evaluation) => (
              <li
                key={evaluation.id}
                className="relative flex items-center space-x-4 py-4 px-4"
              >
                <div className="min-w-0 flex-auto">
                  <div className="flex items-center gap-x-3">
                    <div className={classNames(
                      evaluation.status === 'open' ? 'bg-yellow-50' : 'bg-green-50',
                      'flex h-10 w-10 flex-none items-center justify-center rounded-lg'
                    )}>
                      <DocumentTextIcon
                        className={classNames(
                          evaluation.status === 'open' ? 'text-yellow-600' : 'text-green-600',
                          'h-6 w-6'
                        )}
                      />
                    </div>
                    <h2 className="min-w-0 text-sm font-semibold leading-6 text-gray-900">
                      <Link
                        href={`/protected/patients/${patientId}/evaluations/${evaluation.id}`}
                        className="block hover:bg-gray-50"
                      >
                        <button
                          onClick={() => handleEvaluationClick(evaluation)}
                          className="flex gap-x-2"
                        >
                          <span className="truncate">{evaluation.name}</span>
                          <span className="text-gray-400">/</span>
                          <span className="whitespace-nowrap">
                            ID: {evaluation.id}
                          </span>
                        </button>
                      </Link>
                    </h2>
                  </div>
                  <div className="mt-3 flex items-center gap-x-2.5 text-xs leading-5 text-gray-500">
                    <p className="truncate">Created by {evaluation.createdBy}</p>
                    <svg className="h-0.5 w-0.5 flex-none fill-gray-500" viewBox="0 0 2 2">
                      <circle cx={1} cy={1} r={1} />
                    </svg>
                    <p className="whitespace-nowrap">Created on {new Date(evaluation.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div
                  className={classNames(
                    evaluation.status === 'open' ? 'text-yellow-700 bg-yellow-50' : 'text-green-700 bg-green-50',
                    'rounded-full px-2 py-1 text-xs font-medium'
                  )}
                >
                  {evaluation.status}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}