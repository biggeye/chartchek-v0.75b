'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CardTitle } from './CardComponents';

interface PatientInfoCardProps {
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    dob?: string;
    gender?: string;
    address?: string;
    contact?: {
      email?: string;
      phone?: string;
    };
  };
}

export function PatientInfoCard({ patient }: PatientInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient Information</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Date of Birth</dt>
            <dd>{patient.dob}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Gender</dt>
            <dd>{patient.gender}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Address</dt>
            <dd>{patient.address}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Email</dt>
            <dd>{patient.contact?.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
            <dd>{patient.contact?.phone}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
