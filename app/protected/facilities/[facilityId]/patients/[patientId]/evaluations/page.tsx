// app/protected/patients/[patientId]/evaluations/page.tsx
'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { EvaluationsList } from '@/components/evaluations/EvaluationsList';
import { EvaluationForm } from '@/components/evaluations/EvaluationForm';

export default function EvaluationsPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.patientId as string;
  const facilityId = '1'; // Hardcoded for this example, could come from context or params
  
  const [view, setView] = useState<'list' | 'new' | 'edit'>('list');
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);

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
    setView('list');
    setSelectedEvaluationId(null);
  };

  return (
    <div className="container mx-auto py-8">
      {view === 'list' && (
        <EvaluationsList 
          patientId={patientId}
          facilityId={facilityId}
          onEdit={handleEditEvaluation}
          onNew={handleNewEvaluation}
        />
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