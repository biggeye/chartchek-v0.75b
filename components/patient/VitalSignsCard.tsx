'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CardTitle } from './CardComponents';
import { Skeleton } from '@/components/ui/skeleton';

interface VitalSign {
  id: string;
  patient_id: string;
  type: string;
  value: string;
  timestamp: string;
}

interface VitalSignsCardProps {
  vitalSigns: VitalSign[] | null | undefined;
}

export function VitalSignsCard({ vitalSigns }: VitalSignsCardProps) {
  // If vitalSigns is null or undefined, show loading state
  if (!vitalSigns) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Vital Signs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Vital Signs</CardTitle>
      </CardHeader>
      <CardContent>
        {vitalSigns.length === 0 ? (
          <p className="text-muted-foreground">No vital signs recorded</p>
        ) : (
          <div className="space-y-4">
            {vitalSigns.map((vitalSign) => (
              <div key={vitalSign.id}>
                <div className="flex justify-between items-center">
                  <dt className="text-sm font-medium">{vitalSign.type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</dt>
                  <dd className="font-medium">{vitalSign.value}</dd>
                </div>
                <p className="text-xs text-muted-foreground">
                  {/* Use ISO format to avoid hydration errors */}
                  {vitalSign.timestamp ? 
                    `${new Date(vitalSign.timestamp).toISOString().split('T')[0]} at ${new Date(vitalSign.timestamp).toISOString().split('T')[1].substring(0, 5)}` 
                    : 'Unknown time'}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
