'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CardTitle } from './CardComponents';
import { Skeleton } from '@/components/ui/skeleton';
import { PatientBasicInfo } from '@/types/kipu';


export function PatientInfoCard({ patient }: { patient: PatientBasicInfo }) {
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
        <CardTitle>{patient.fullName}{patient.status}</CardTitle>
      
      </CardHeader>
      <CardContent>
        <dl className="space-y-4">
          
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Date of Birth</dt>
            <dd>{patient.dateOfBirth || 'Not specified'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Primary Diagnosis</dt>
            <dd>{patient.primaryDiagnosis || 'Not specified'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Level of care</dt>
            <dd>{patient.levelOfCare || 'Not specified'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Next Level of Care</dt>
            <dd>{patient.nextLevelOfCare || 'Not specified'}: <span className="gray-800">  {patient.nextLevelOfCareDate || 'Not specified'}</span></dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
