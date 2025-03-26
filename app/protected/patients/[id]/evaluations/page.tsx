// app/protected/patients/[id]/evaluations/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { usePatient } from '@/lib/contexts/PatientProvider';
import { KipuPatientEvaluation } from '@/types/kipu';

export default function KipuPatientEvaluationsPage() {
  const { id: patientId } = useParams<{ id: string }>();
  const [evaluations, setEvaluations] = useState<KipuPatientEvaluation[]>([]);
  
  const {
    currentPatientFile,
    isLoading,
    error
  } = usePatient();

  // Get evaluations from the context when it changes
  useEffect(() => {
    if (currentPatientFile?.evaluations) {
      setEvaluations(currentPatientFile.evaluations);
    }
  }, [currentPatientFile]);

  const evaluationStats = [
    { id: 1, name: 'Total Evaluations', value: evaluations.length },
    { id: 2, name: 'Completed', value: evaluations.filter(e => e.status === 'completed').length },
    { id: 3, name: 'In Progress', value: evaluations.filter(e => e.status === 'in_progress').length },
    { id: 4, name: 'Pending', value: evaluations.filter(e => e.status === 'pending').length },
  ];

  if (isLoading) {
    return <div className="p-4">Loading evaluations...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading evaluations: {error}</div>;
  }

  return (
    <div className="space-y-6 p-4">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Patient Evaluations</h2>
        
        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {evaluationStats.map((stat) => (
            <div key={stat.id} className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">{stat.name}</p>
              <p className="text-2xl font-semibold">{stat.value}</p>
            </div>
          ))}
        </div>
        
        {/* Evaluations list */}
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">All Evaluations</h3>
          {evaluations.length === 0 ? (
            <p className="text-gray-500">No evaluations available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {evaluations.map((evaluation) => (
                    <tr key={evaluation.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{evaluation.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          evaluation.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          evaluation.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {evaluation.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(evaluation.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {evaluation.updatedAt ? new Date(evaluation.updatedAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}