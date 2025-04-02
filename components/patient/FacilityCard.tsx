'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Users, FileText, ArrowRight } from 'lucide-react';
import { CardTitle, CardDescription, CardFooter } from './CardComponents';

interface FacilityCardProps {
  facility: {
    facility_id: string;
    name: string;
    address: string;
    phone?: string;
    email?: string;
    patients_count: number;
    documents_count: number;
  };
}

export function FacilityCard({ facility }: FacilityCardProps) {
  return (
    <Link 
      href={`/protected/facilities/${facility.facility_id}/patients`} 
      key={facility.facility_id}
      className="block transition-transform hover:scale-[1.02]"
    >
      <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">{facility.name}</CardTitle>
          <CardDescription>
            {facility.address}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center text-sm">
                <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                <span className="text-muted-foreground">Patients:</span>
              </div>
              <span className="font-medium">{facility.patients_count}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center text-sm">
                <FileText className="h-4 w-4 mr-1 text-muted-foreground" />
                <span className="text-muted-foreground">Documents:</span>
              </div>
              <span className="font-medium">{facility.documents_count}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">
            <span>View Details</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
