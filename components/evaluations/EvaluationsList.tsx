// components/evaluations/EvaluationsList.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { KipuEvaluation } from '@/lib/kipu/evaluations';

interface EvaluationsListProps {
  patientId: string;
  facilityId: string;
  onEdit: (evaluationId: string) => void;
  onNew: () => void;
}

export function EvaluationsList({ patientId, facilityId, onEdit, onNew }: EvaluationsListProps) {
  const [evaluations, setEvaluations] = useState<KipuEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvaluations = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/facilities/${facilityId}/patients/${patientId}/evaluations`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch evaluations');
        }

        const data = await response.json();
        setEvaluations(data.evaluations || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvaluations();
  }, [facilityId, patientId]);

  if (isLoading) {
    return <div className="text-center p-4">Loading evaluations...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md">
        Error: {error}
        <Button onClick={() => window.location.reload()} className="ml-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Patient Evaluations</h2>
        <Button onClick={onNew}>Add New Evaluation</Button>
      </div>

      {evaluations.length === 0 ? (
        <div className="text-center p-8 border rounded-md bg-gray-50">
          <p className="text-gray-500">No evaluations found for this patient.</p>
          <Button onClick={onNew} className="mt-4">
            Create First Evaluation
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evaluations.map((evaluation) => (
              <TableRow key={evaluation.id}>
                <TableCell>{evaluation.id}</TableCell>
                <TableCell>{evaluation.evaluation_type}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      evaluation.status === 'Completed'
                        ? 'bg-green-100 text-green-800'
                        : evaluation.status === 'In Progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {evaluation.status}
                  </span>
                </TableCell>
                <TableCell>
                  {new Date(evaluation.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>{evaluation.user_name}</TableCell>
                <TableCell className="text-right">
                <Button onClick={() => onEdit(evaluation.id.toString())} className="text-xs px-2 py-1">
  Edit
</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}