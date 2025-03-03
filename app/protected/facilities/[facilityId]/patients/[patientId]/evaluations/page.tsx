'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { EvaluationsList } from '@/components/evaluations/EvaluationsList';
import { EvaluationForm } from '@/components/evaluations/EvaluationForm';
// In app/protected/facilities/[facilityId]/patients/[patientId]/evaluations/page.tsx
// Remove this import and only use the one from index.ts
import { KipuEvaluation } from '@/lib/kipu/types';
import { getPatientEvaluations } from '@/lib/kipu'; // Import the function to get mock data

export default function EvaluationsPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.patientId as string;
  const facilityId = params.facilityId as string;
  
  const [view, setView] = useState<'list' | 'new' | 'edit'>('list');
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);
  const [evaluations, setEvaluations] = useState<KipuEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch evaluations using the mock data system
  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        setIsLoading(true);
        // Use the mock data system instead of a fetch call
        const data = getPatientEvaluations(facilityId, patientId);
        // Add a small delay to simulate network request
        setTimeout(() => {
          setEvaluations(data);
          setIsLoading(false);
        }, 300);
      } catch (error) {
        console.error('Error fetching evaluations:', error);
        setIsLoading(false);
      }
    };

    fetchEvaluations();
  }, [patientId, facilityId]);

  const handleEditEvaluation = (evaluationId: string) => {
    setSelectedEvaluationId(evaluationId);
    setView('edit');
  };

  const handleNewEvaluation = () => {
    setView('new');
  };

  const handleCancel = () => {
    setView('list');
    setSelectedEvaluationId(null);
  };

  const handleSuccess = () => {
    // Refresh data from mock system
    const data = getPatientEvaluations(facilityId, patientId);
    setEvaluations(data);
    setView('list');
    setSelectedEvaluationId(null);
  };

  return (
    <div className="container mx-auto py-8">
      {view === 'list' && (
        <>
          {isLoading ? (
            <div className="text-center py-10">
              <p className="text-gray-500">Loading evaluations...</p>
            </div>
          ) : (
            <EvaluationsList 
              evaluations={evaluations}
              patientId={patientId}
              facilityId={facilityId}
              onEdit={handleEditEvaluation}
              onNew={handleNewEvaluation}
            />
          )}
        </>
      )}
      
      {view === 'new' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">New Evaluation</h2>
          <EvaluationForm
            patientId={patientId}
            facilityId={facilityId}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      )}
      
      {view === 'edit' && selectedEvaluationId && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Edit Evaluation</h2>
          <EvaluationForm
            patientId={patientId}
            facilityId={facilityId}
            evaluationId={selectedEvaluationId}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      )}
    </div>
  );
}