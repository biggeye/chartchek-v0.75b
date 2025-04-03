'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEvaluationsStore } from '@/store/patient/evaluationsStore';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { KipuPatientEvaluationItem, KipuPatientEvaluation } from '@/types/chartChek/kipuEvaluations';
import { DocumentView } from '@/lib/DocumentView';

export default function EvaluationDetailPage() {
  // Hooks must be inside the component
  const params = useParams();
  const router = useRouter();
  const { fetchPatientEvaluationById, isLoadingEvaluations } = useEvaluationsStore();

  // State management
  const [evaluation, setEvaluation] = useState<KipuPatientEvaluation>({} as KipuPatientEvaluation);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const patientId = params.id as string;
  const evaluationId = parseInt(params.evaluationId as string, 10);

  useEffect(() => {
    async function loadEvaluation() {
      if (!patientId || !evaluationId) return;

      try {
        setLoading(true);
        const data = await fetchPatientEvaluationById(evaluationId);
        console.log("Evaluation data:", data);
        if (data) {
          setEvaluation(data);
        }
        setError(null);
      } catch (err) {
        console.error("Failed to load evaluation:", err);
        setError("Failed to load evaluation. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadEvaluation();
  }, [patientId, evaluationId, fetchPatientEvaluationById]);

  // Loading state
  if (loading || isLoadingEvaluations) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600">Error</h2>
            <p className="mt-2">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No evaluation found
  if (!evaluation) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Evaluation Not Found</h2>
            <p className="mt-2">The requested evaluation could not be found.</p>
            <Button
              onClick={() => router.back()}
              className="mt-4"
            >
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render evaluation details using DocumentView
  return (
    <Card>
      <CardContent className="pt-6">
        {evaluation && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">{evaluation.name || 'Evaluation Details'}</h2>
            {evaluation.patientEvaluationItems && (
              <DocumentView items={evaluation.patientEvaluationItems} />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}