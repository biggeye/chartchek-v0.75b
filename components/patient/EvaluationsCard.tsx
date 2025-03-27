'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CardTitle } from './CardComponents';
import { Skeleton } from '@/components/ui/skeleton';
import { PatientEvaluation } from '@/types/kipu/evaluations';

interface EvaluationsCardProps {
  adaptedEvaluations: PatientEvaluation[] | null | undefined;
  onNewEvaluation?: () => void;
}

export function EvaluationsCard({ adaptedEvaluations, onNewEvaluation }: EvaluationsCardProps) {
  // If evaluations is null or undefined, show loading state
  if (!adaptedEvaluations) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Evaluations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Recent Evaluations</span>
          {onNewEvaluation && (
            <Button
              color="purple"
              onClick={onNewEvaluation}
              className="flex items-center p-1 px-2 bg-purple-600 hover:bg-purple-700"
            >
              +
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {adaptedEvaluations.length === 0 ? (
          <p className="text-muted-foreground">No evaluations found</p>
        ) : (
          <div className="space-y-4">
            {adaptedEvaluations.map((e) => (
              <div key={e.id} className="border-b pb-4 last:border-0 last:pb-0">
                <div className="font-medium">{e.evaluationName}</div>
                <p className="text-sm text-muted-foreground">
                  {/* Use ISO format to avoid hydration errors */}
                  {e.createdAt ? new Date(e.createdAt).toISOString().split('T')[0] : 'Unknown date'}
                </p>
                <p className="text-sm mt-1 line-clamp-2">{e.evaluationItems}</p>
              </div>
            ))}
            <Link
              href={`/protected/patients/${adaptedEvaluations[0].patientId}/evaluations`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              See All
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
