'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserCircle2, Calendar, FileText } from 'lucide-react';

interface PatientListItemProps {
  patient: {
    patientId: string;
    firstName: string;
    lastName: string;
    dob?: string;
    gender?: string;
    contact?: {
      email?: string;
      phone?: string;
    };
  };
  facilityId: string;
}
// change patient.lastName to display just the first initial of the last name... but do that on the component level here
export function PatientListItem({ patient, facilityId }: PatientListItemProps) {
  return (
    <div className="py-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">
            {patient.firstName} {patient.lastName} 
          </div>
          <div className="flex space-x-4 text-sm text-muted-foreground mt-1">
            <div className="flex items-center">
              <UserCircle2 className="h-3.5 w-3.5 mr-1" />
              
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
            href={`/protected/patients/${patient.patientId}`} 
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
