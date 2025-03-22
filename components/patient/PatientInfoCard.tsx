'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CardTitle } from './CardComponents';
import { Skeleton } from '@/components/ui/skeleton';

interface PatientInfoCardProps {
  patient: {
    id?: string;
    first_name?: string;
    last_name?: string;
    dob?: string;
    gender?: string;
    address?: string;
    contact?: {
      email?: string;
      phone?: string;
    };
  } | null | undefined;
}

export function PatientInfoCard({ patient }: PatientInfoCardProps) {
  // If patient is null or undefined, show loading state
  if (!patient) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient Information</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Date of Birth</dt>
            <dd>{patient.dob || 'Not specified'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Gender</dt>
            <dd>{patient.gender || 'Not specified'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Address</dt>
            <dd>{patient.address || 'Not specified'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Email</dt>
            <dd>{patient.contact?.email || 'Not specified'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
            <dd>{patient.contact?.phone || 'Not specified'}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
