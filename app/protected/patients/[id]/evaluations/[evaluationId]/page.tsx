// pages/protected/patients/[id]/evaluations/[evaluationId].tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import KipuPatientEvaluationDocument from '@/components/dynamicForms/patientEvaluations/PatientEvaluationDocument';

import { KipuPatientEvaluation } from '@/types/kipu';

function formatDate(dateString: string) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// lib/utils/adapters.ts
export function adaptEvaluationItems(items: any[] | null | undefined): any[] {
  if (!items || !Array.isArray(items)) return [];
  return items.map(item => ({
    id: item.id || Math.random().toString(36).substring(2, 9),
    field_type: item.answer_type || item.field_type || 'text',
    label: item.question || item.label || item.name || 'Unnamed Field',
    value: item.answer || item.value || null,
    description: item.description || null,
    records: item.records || null,
    divider_below: item.divider_below || false
  }));
}


export default function EvaluationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;
  const evaluationId = params.evaluationId as string;

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<KipuPatientEvaluation | null>(null);

  const fetchEvaluationData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/kipu/patient_evaluations/${evaluationId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
      const data = await response.json();
      setEvaluation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluationData();
  }, [evaluationId]);

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="p-4">
        <div className={`border rounded-md p-4 my-4 ${error ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-start">
            <AlertCircle className={`h-5 w-5 mr-2 ${error ? 'text-red-500' : 'text-yellow-500'}`} />
            <div>
              <div className={`font-medium ${error ? 'text-red-800' : 'text-yellow-800'}`}>
                {error ? 'Error' : 'No Data'}
              </div>
              <div className={error ? 'text-red-700' : 'text-yellow-700'}>
                {error || `No evaluation data found for ID: ${evaluationId}`}
              </div>
            </div>
          </div>
        </div>
        <Button className="mt-4" onClick={() => router.push(`/protected/patients/${patientId}/evaluations`)}>
          Back to Evaluations
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{evaluation.name}</h1>
        <Button className="gray-800" onClick={() => router.push(`/protected/patients/${patientId}/evaluations`)}>
          Back to Evaluations
        </Button>
      </div>

      <Card>
        <CardHeader>
            <div className="text-sm text-gray-500">
            <p>ID: {evaluationId}</p>
            {evaluation.status && <p>Status: {evaluation.status}</p>}
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="overview" value={activeTab} onChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              {evaluation.notes && <TabsTrigger value="notes">Notes</TabsTrigger>}
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
             {evaluation.createdAt && <p><strong>Created At:</strong> {formatDate(evaluation.createdAt)}</p>}
              {evaluation.updatedAt && <p><strong>Updated At:</strong> {formatDate(evaluation.updatedAt)}</p>}
              {(evaluation.createdBy || evaluation.userName) && <p><strong>Created By:</strong> {evaluation.createdBy || evaluation.userName}</p>}
              {evaluation.updatedBy && <p><strong>Updated By:</strong> {evaluation.updatedBy}</p>}
            </TabsContent>

            <TabsContent value="details">
              <KipuPatientEvaluationDocument
                items={adaptEvaluationItems(evaluation.evaluationItems)}
                title={evaluation.name || 'Patient Evaluation'}
              />
            </TabsContent>

            {evaluation.notes && (
              <TabsContent value="notes">
                <div className="whitespace-pre-wrap">{evaluation.notes}</div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
