'use client';

import React, { use } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

interface PatientLayoutProps {
  children: React.ReactNode;
  params: {
    facilityId: string;
    patientId: string;
  };
}

export default function PatientLayout({ children, params }: PatientLayoutProps) {
  // Use type assertion to help TypeScript understand the result of use()
  const unwrappedParams = use(params as any) as { facilityId: string; patientId: string };
  const { facilityId, patientId } = unwrappedParams;
  
  // In a real app, you would validate if the patient exists here
  // and call notFound() if they don't
  
  return (
    <div className="container">
      <div className="flex flex-col gap-4 py-4">
        <Tabs defaultValue="evaluations" className="w-full">
          <TabsList className="mb-4">
            <Link href={`/protected/facilities/${facilityId}/patients/${patientId}`} passHref>
              <TabsTrigger value="overview" asChild>
                <div>Overview</div>
              </TabsTrigger>
            </Link>
            <Link href={`/protected/facilities/${facilityId}/patients/${patientId}/evaluations`} passHref>
              <TabsTrigger value="evaluations" asChild>
                <div>Evaluations</div>
              </TabsTrigger>
            </Link>
            <Link href={`/protected/facilities/${facilityId}/patients/${patientId}/appointments`} passHref>
              <TabsTrigger value="appointments" asChild>
                <div>Appointments</div>
              </TabsTrigger>
            </Link>
            <Link href={`/protected/facilities/${facilityId}/patients/${patientId}/orders`} passHref>
              <TabsTrigger value="orders" asChild>
                <div>Orders</div>
              </TabsTrigger>
            </Link>
          </TabsList>
          {children}
        </Tabs>
      </div>
    </div>
  );
}
