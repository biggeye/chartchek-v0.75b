'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Breadcrumb from '@/components/ui/breadcrumb';
import { usePatientStore } from '@/store/patientStore';

interface PatientTabsLayoutProps {
  children: React.ReactNode;
  facilityId: string;
  patientId: string;
  activeTab?: 'overview' | 'evaluations' | 'appointments' | 'vitals';
}

export function PatientTabsLayout({ 
  children, 
  facilityId, 
  patientId, 
  activeTab = 'overview' 
}: PatientTabsLayoutProps) {
  const { currentPatient } = usePatientStore();
  const [patientName, setPatientName] = useState<string>('Patient Details');

  useEffect(() => {
    if (currentPatient) {
      setPatientName(`${currentPatient.first_name} ${currentPatient.last_name}`);
    }
  }, [currentPatient]);

  // Create breadcrumb pages based on the active tab
  const breadcrumbPages = [
    { name: 'Patients', href: '/protected/patients', current: false },
    { name: patientName, href: `/protected/patients/${patientId}`, current: activeTab === 'overview' },
  ];

  // Add the current tab to breadcrumbs if not overview
  if (activeTab !== 'overview') {
    const tabName = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
    breadcrumbPages.push({
      name: tabName,
      href: `/protected/patients/${patientId}/${activeTab}`,
      current: true
    });
  }

  return (
    <div className="container">
      {/* Only show breadcrumbs for non-overview tabs to avoid duplication */}
      {activeTab !== 'overview' && <Breadcrumb pages={breadcrumbPages} />}
      
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
            <Link href={`/protected/patients/${patientId}/vitals`} passHref>
              <TabsTrigger value="vitals" asChild>
                <div>Vital Signs</div>
              </TabsTrigger>
            </Link>
          </TabsList>
          {children}
        </Tabs>
      </div>
    </div>
  );
}
