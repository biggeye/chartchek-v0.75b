'use client';

import React from 'react';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PatientTabsLayoutProps {
  children: React.ReactNode;
  facilityId: string;
  patientId: string;
  activeTab?: 'overview' | 'evaluations' | 'appointments' | 'orders';
}

export function PatientTabsLayout({ 
  children, 
  facilityId, 
  patientId, 
  activeTab = 'overview' 
}: PatientTabsLayoutProps) {
  return (
    <div className="container">
      <div className="flex flex-col gap-4 py-4">
        <Tabs defaultValue={activeTab} className="w-full">
          <TabsList className="mb-4">
            <Link href={`/protected/patients/${patientId}`} passHref>
              <TabsTrigger value="overview" asChild>
                <div>Overview</div>
              </TabsTrigger>
            </Link>
            <Link href={`/protected/patients/${patientId}/evaluations`} passHref>
              <TabsTrigger value="evaluations" asChild>
                <div>Evaluations</div>
              </TabsTrigger>
            </Link>
            <Link href={`/protected/patients/${patientId}/appointments`} passHref>
              <TabsTrigger value="appointments" asChild>
                <div>Appointments</div>
              </TabsTrigger>
            </Link>
            <Link href={`/protected/patients/${patientId}/orders`} passHref>
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
