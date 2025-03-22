"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { usePatientStore } from '@/store/patientStore';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

// Import the correct components based on your UI library
// These imports should match what's used in other parts of your application
import { Button } from '@/components/ui/button';

export default function EvaluationDetailPage() {
  const params = useParams();
  const patientId = params.id as string;
  const evaluationId = params.evaluationId as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<any>(null);
  
  // For now, let's use a direct fetch until we update the store
  const fetchEvaluation = async (id: string) => {
    const response = await fetch(`/api/kipu/evaluations/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch evaluation: ${response.statusText}`);
    }
    return response.json();
  };
  
  useEffect(() => {
    const loadEvaluation = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await fetchEvaluation(evaluationId);
        if (result.success) {
          setEvaluation(result.data);
        } else {
          setError('Failed to load evaluation data');
        }
      } catch (err) {
        console.error('Error loading evaluation:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    if (evaluationId) {
      loadEvaluation();
    }
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
  
  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <div className="font-medium text-red-800">Error</div>
              <div className="text-red-700">{error}</div>
            </div>
          </div>
        </div>
        <Button className="mt-4">
          <Link href={`/protected/patients/${patientId}/evaluations`}>Back to Evaluations</Link>
        </Button>
      </div>
    );
  }
  
  if (!evaluation) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 my-4">
          <div className="flex items-start">
            <div>
              <div className="font-medium text-yellow-800">No Data</div>
              <div className="text-yellow-700">No evaluation data found for ID: {evaluationId}</div>
            </div>
          </div>
        </div>
        <Button className="mt-4">
          <Link href={`/protected/patients/${patientId}/evaluations`}>Back to Evaluations</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Evaluation Details</h1>
        <Button>
          <Link href={`/protected/patients/${patientId}/evaluations`}>Back to Evaluations</Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">{evaluation.title || 'Evaluation'}</h2>
          <p className="text-sm text-gray-500">
            ID: {evaluationId}
          </p>
        </CardHeader>
        <CardContent>
          {/* Display evaluation details based on the structure of your data */}
          {evaluation && Object.entries(evaluation).map(([key, value]) => {
            // Skip rendering complex nested objects directly
            if (typeof value === 'object' && value !== null) {
              return null;
            }
            
            return (
              <div key={key} className="py-2 border-b">
                <div className="font-medium">{key}</div>
                <div>{String(value)}</div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}