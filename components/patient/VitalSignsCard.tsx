'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CardTitle } from './CardComponents';

interface VitalSign {
  id: string;
  patient_id: string;
  type: string;
  value: string;
  timestamp: string;
}

interface VitalSignsCardProps {
  vitalSigns: VitalSign[];
}

export function VitalSignsCard({ vitalSigns }: VitalSignsCardProps) {
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
                  {new Date(vitalSign.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
