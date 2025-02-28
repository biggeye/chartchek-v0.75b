// components/evaluations/EvaluationForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KipuEvaluation } from '@/lib/kipu/evaluations';

interface EvaluationFormProps {
  patientId: string;
  facilityId: string;
  evaluationId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EvaluationForm({
  patientId,
  facilityId,
  evaluationId,
  onSuccess,
  onCancel,
}: EvaluationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!!evaluationId);
  const [formData, setFormData] = useState({
    evaluation_type: 'Initial Assessment',
    notes: '',
    status: 'Completed',
    user_name: 'Current User',
    user_id: 1,
    form_data: {},
    patient_id: parseInt(patientId),
  });

  // Load existing evaluation if we're editing
  useEffect(() => {
    if (evaluationId) {
      const fetchEvaluation = async () => {
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
            throw new Error('Failed to fetch evaluation data');
          }

          const data = await response.json();
          const evaluation = data.evaluations.find(
            (e: KipuEvaluation) => e.id === parseInt(evaluationId)
          );

          if (evaluation) {
            // Populate the form with existing data
            setFormData({
              evaluation_type: evaluation.evaluation_type,
              notes: evaluation.notes || '',
              status: evaluation.status,
              user_name: evaluation.user_name,
              user_id: evaluation.user_id,
              form_data: evaluation.form_data || {},
              patient_id: evaluation.patient_id,
            });
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load evaluation');
        } finally {
          setIsLoading(false);
        }
      };

      fetchEvaluation();
    }
  }, [evaluationId, facilityId, patientId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const apiUrl = evaluationId
        ? `/api/facilities/${facilityId}/patients/${patientId}/evaluations/${evaluationId}`
        : `/api/facilities/${facilityId}/patients/${patientId}/evaluations`;

      const method = evaluationId ? 'PUT' : 'POST';

      const response = await fetch(apiUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save evaluation');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="text-center p-4">Loading evaluation data...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-800 rounded-md">{error}</div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="evaluation_type">Evaluation Type</Label>
          <select
            id="evaluation_type"
            name="evaluation_type"
            value={formData.evaluation_type}
            onChange={handleInputChange}
            className="w-full p-2 border rounded-md"
          >
            <option value="Initial Assessment">Initial Assessment</option>
            <option value="Follow-up Assessment">Follow-up Assessment</option>
            <option value="CIWA-Ar">CIWA-Ar</option>
            <option value="COWS">COWS</option>
            <option value="Mental Status Exam">Mental Status Exam</option>
          </select>
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Enter any additional notes here..."
            className="w-full min-h-[100px] p-2 border rounded-md"
          />
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="w-full p-2 border rounded-md"
          >
            <option value="Completed">Completed</option>
            <option value="In Progress">In Progress</option>
            <option value="Pending Review">Pending Review</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : evaluationId ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}