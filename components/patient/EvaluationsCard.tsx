'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CardTitle } from './CardComponents';

interface Evaluation {
  id: string;
  patient_id: string;
  evaluation_type: string;
  notes: string;
  created_at: string;
}

interface EvaluationsCardProps {
  evaluations: Evaluation[];
  onNewEvaluation?: () => void;
}

export function EvaluationsCard({ evaluations, onNewEvaluation }: EvaluationsCardProps) {
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
                <div className="font-medium">{evaluation.evaluation_type}</div>
                <p className="text-sm text-muted-foreground">
                  {new Date(evaluation.created_at).toLocaleDateString()}
                </p>
                <p className="text-sm mt-1 line-clamp-2">{evaluation.notes}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
