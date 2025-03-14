'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserCircle2, Calendar, FileText } from 'lucide-react';

interface PatientListItemProps {
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    dob?: string;
    gender?: string;
    contact?: {
      email?: string;
      phone?: string;
    };
  };
  facilityId: string;
}

export function PatientListItem({ patient, facilityId }: PatientListItemProps) {
  return (
    <div className="py-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">
            {patient.first_name} {patient.last_name}
          </div>
          <div className="flex space-x-4 text-sm text-muted-foreground mt-1">
            <div className="flex items-center">
              <UserCircle2 className="h-3.5 w-3.5 mr-1" />
              ID: {patient.id}
            </div>
            {patient.dob && (
              <div className="flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                DOB: {patient.dob}
              </div>
            )}
            {patient.gender && (
              <div>Gender: {patient.gender}</div>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <Link 
            href={`/protected/patients/${patient.id}`} 
            passHref
          >
            <Button className="btn-primary">
              <FileText className="h-4 w-4" />
              Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
