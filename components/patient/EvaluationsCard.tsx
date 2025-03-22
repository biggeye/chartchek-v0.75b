'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CardTitle } from './CardComponents';
import { Skeleton } from '@/components/ui/skeleton';
import { PatientEvaluation } from '@/types/kipu';

interface EvaluationsCardProps {
  evaluations: PatientEvaluation[] | null | undefined;
  onNewEvaluation?: () => void;
}

export function EvaluationsCard({ evaluations, onNewEvaluation }: EvaluationsCardProps) {
  // If evaluations is null or undefined, show loading state
  if (!evaluations) {
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
        {evaluations.length === 0 ? (
          <p className="text-muted-foreground">No evaluations found</p>
        ) : (
          <div className="space-y-4">
            {evaluations.map((evaluation) => (
              <div key={evaluation.id} className="border-b pb-4 last:border-0 last:pb-0">
                <div className="font-medium">{evaluation.name}</div>
                <p className="text-sm text-muted-foreground">
                  {/* Use ISO format to avoid hydration errors */}
                  {evaluation.createdAt ? new Date(evaluation.createdAt).toISOString().split('T')[0] : 'Unknown date'}
                </p>
                <p className="text-sm mt-1 line-clamp-2">{evaluation.evaluationContent}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
