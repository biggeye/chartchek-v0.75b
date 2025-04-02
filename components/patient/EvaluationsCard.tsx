'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CardTitle } from './CardComponents';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

interface EvaluationsCardProps {
  adaptedEvaluations: any[] | null | undefined;
  onNewEvaluation?: () => void;
}

export function EvaluationsCard({ adaptedEvaluations, onNewEvaluation }: EvaluationsCardProps) {
  // If evaluations is null or undefined, show loading state
  const router = useRouter();
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
                <div className="font-medium">
                  <Button
                    variant="outline"
                    className="p-0 h-auto font-medium"
                    onClick={() => {
                      console.log("Evaluation data:", e);
                      // Check if patient_casefile_id exists and has the expected format
                      if (e.patientCasefileId) {
                        const patientId = e.patientCasefileId;
                        console.log("Extracted patient ID:", patientId);
                        router.push(`/protected/patients/${patientId}/evaluations/${e.id}`);
                      } else {
                        console.error("Missing patient_casefile_id for evaluation:", e);
                      }
                    }}
                  >
                    {e.name}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {/* Use ISO format to avoid hydration errors */}
                  {e.createdAt ? new Date(e.createdAt).toISOString().split('T')[0] : 'Unknown date'}
                </p>
              </div>
            ))}
            <Link
              href={`/protected/patients/${adaptedEvaluations[0].patientCasefileId}/evaluations`}
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
