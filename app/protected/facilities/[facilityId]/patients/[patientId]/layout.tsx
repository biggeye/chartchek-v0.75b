'use client';

import React, { use } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

interface PatientLayoutProps {
  children: React.ReactNode;
  params: Promise<{ facilityId: string; patientId: string }>;
}

export default function PatientLayout({ children, params }: PatientLayoutProps) {
  // use() unwraps the promise, so you get the actual params
  const { facilityId, patientId } = use(params);
  
  // You might add validation here (e.g., call notFound() if needed)
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
