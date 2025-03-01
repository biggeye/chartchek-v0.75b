// components/evaluations/EvaluationForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { fetchPatientEvaluation } from '@/lib/kipu';

// Type definitions based on the existing component
interface PatientEvaluationItem {
  id: string;
  question: string;
  answer_type: 'text' | 'checkbox' | 'radio' | 'select' | 'number'; // Added number type
  required: boolean;
  answer?: string;
  evaluation_id?: string;
  options?: { value: string; label: string }[];
}

interface PatientEvaluation {
  id: string;
  patient_id: string;
  evaluation_type: string;
  notes: string | ''; // Allow empty string
  status: string;
  created_at: string;
  items?: PatientEvaluationItem[];
}

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
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<PatientEvaluation | null>(null);
  const [evaluationItems, setEvaluationItems] = useState<PatientEvaluationItem[]>([]);

  // Form fields
  const [evaluationType, setEvaluationType] = useState('Initial Assessment');
  const [notes, setNotes] = useState('');
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  // Load existing evaluation if we're editing
  useEffect(() => {
    const fetchData = async () => {
      if (evaluationId) {
        setLoading(true);
        try {
          const evaluationData = fetchPatientEvaluation(evaluationId, facilityId);

          if (evaluationData) {
            setEvaluation(evaluationData);
            setEvaluationType(evaluationData.evaluation_type);
            setNotes(evaluationData.notes || '');

            // Initialize form values if items exist
            if (evaluationData.items && evaluationData.items.length > 0) {
              const initialValues: Record<string, any> = {};

              evaluationData.items.forEach(item => {
                initialValues[item.id] = item.answer || '';
              });

              setFormValues(initialValues);
              setEvaluationItems(evaluationData.items);
            }
          }
        } catch (error) {
          console.error('Error fetching evaluation:', error);
          setError('Failed to load evaluation data');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [evaluationId, facilityId]);

  const handleFormValueChange = (id: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const renderFormControl = (item: PatientEvaluationItem) => {
    switch (item.answer_type) {
      case 'text':
        return (
          <Input
            id={item.id}
            value={formValues[item.id] || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFormValueChange(item.id, e.target.value)}
            required={item.required}
            disabled={loading}
          />
        );
      case 'checkbox':
        return (
          <Checkbox
            id={item.id}
            checked={!!formValues[item.id]}
            onChange={(checked: boolean) => handleFormValueChange(item.id, checked)}
            disabled={loading}
          />
        );
      case 'radio':
      case 'select':
        return (
          <select
            id={item.id}
            value={formValues[item.id] || ''}
            onChange={(e) => handleFormValueChange(item.id, e.target.value)}
            className="w-full p-2 border rounded-md"
            required={item.required}
            disabled={loading}
          >
            <option value="">Select an option</option>
            {item.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!evaluationType) {
      setError('Please select an evaluation type');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare items with answers
      const items = evaluationItems.map(item => ({
        ...item,
        answer: formValues[item.id] !== undefined ? String(formValues[item.id]) : '',
        evaluation_id: evaluationId || '',
      }));

      // Create evaluation data
      const evaluationData = {
        patient_id: patientId,
        evaluation_type: evaluationType,
        notes: notes,
        status: 'Completed',
        items: items,
      };

      // API endpoint and method based on whether we're creating or updating
      const apiUrl = evaluationId
        ? `/api/facilities/${facilityId}/patients/${patientId}/evaluations/${evaluationId}`
        : `/api/facilities/${facilityId}/patients/${patientId}/evaluations`;

      const method = evaluationId ? 'PUT' : 'POST';

      const response = await fetch(apiUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(evaluationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save evaluation');
      }

      // Call the success callback to notify parent component
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error saving evaluation:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && evaluationId) {
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
            value={evaluationType}
            onChange={(e) => setEvaluationType(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
            disabled={loading}
          >
            <option value="">Select Evaluation Type</option>
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
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full min-h-[100px] p-2 border rounded-md"
            placeholder="Enter any additional notes here..."
            disabled={loading}
          />
        </div>

        {evaluationItems.length > 0 && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-medium">Form Questions</h3>
            {evaluationItems.map((item) => (
              <div key={item.id} className="space-y-2">
                <Label htmlFor={item.id}>
                  {item.question}
                  {item.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {renderFormControl(item)}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" onClick={onCancel} disabled={loading} className="bg-gray-100 hover:bg-gray-200 text-gray-800">
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : evaluationId ? 'Update Evaluation' : 'Create Evaluation'}
        </Button>
      </div>
    </form>
  );
}