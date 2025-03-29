'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useKipuEvaluationsStore } from '@/store/kipuEvaluationsStore';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { KipuPatientEvaluationItem, KipuPatientEvaluation } from '@/types/chartChek/evaluations';
import KipuPatientEvaluationDocument from '@/components/dynamicForms/patientEvaluations/PatientEvaluationDocument';
export default function EvaluationDetailPage() {
  // Hooks must be inside the component
  const params = useParams();
  const router = useRouter();
  const { fetchPatientEvaluationById, isLoadingEvaluations } = useKipuEvaluationsStore();

  // State management

  const [evaluation, setEvaluation] = useState<KipuPatientEvaluation>({} as KipuPatientEvaluation);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evaluationItems, setEvaluationItems] = useState<any>(null);

  const patientId = params.id as string;
  const evaluationId = parseInt(params.evaluationId as string, 10);

  // And update the useEffect to handle evaluation items properly
// Move this logic into the useEffect where you get the evaluation data
useEffect(() => {
  async function loadEvaluation() {
    if (!patientId || !evaluationId) return;

    try {
      setLoading(true);
      const data = await fetchPatientEvaluationById(evaluationId);
      console.log("Evaluation data:", data);
      if(data){
      setEvaluation(data);
      }
      // Set evaluation items here, when the data is loaded
  
      
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

// Remove the problematic code outside of useEffect
// if (evaluation) {
//   const evaluationItems = evaluation.evaluationItems;
//   setEvaluationItems(evaluationItems);
// }




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

  // Render evaluation details
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
     
            <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">{evaluation.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">
                  {evaluation.createdAt ? new Date(evaluation.createdAt).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            <div className="flex gap-2">
              <Button
                outline
                onClick={() => router.back()}
              >
                Back
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
        {evaluation && evaluation.patientEvaluationItems && (
            <div className="space-y-6">
 
                 <KipuPatientEvaluationDocument
                 items={evaluation.patientEvaluationItems}
                 title={evaluation.name} />
      
              
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}