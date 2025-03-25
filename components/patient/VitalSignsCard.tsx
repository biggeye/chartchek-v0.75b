'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CardTitle } from './CardComponents';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface VitalSign {
  id: string | number;
  patient_id: string;
  patientId?: string;
  type: string;
  value: string | number;
  timestamp?: string;
  recordedAt?: string;
  interval_timestamp?: string;
  unit?: string;
  notes?: string;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  temperature?: number;
  pulse?: number;
  respirations?: number;
  o2_saturation?: number;
  user_name?: string;
}

interface VitalSignsCardProps {
  adaptedVitalSigns: VitalSign[] | null | undefined;
}

export function VitalSignsCard({ adaptedVitalSigns }: VitalSignsCardProps) {
  // If vitalSigns is null or undefined, show loading state
  if (!adaptedVitalSigns) {
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
        {adaptedVitalSigns.length === 0 ? (
          <p className="text-muted-foreground">No vital signs recorded</p>
        ) : (
          <div className="space-y-4">
            {adaptedVitalSigns.map((vitalSign) => (
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
            <Link
              href={`/protected/patients/${adaptedVitalSigns[0].patient_id}/vitals`}
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
