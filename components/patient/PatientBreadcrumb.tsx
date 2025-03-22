'use client';

import React from 'react';
import Breadcrumb from '@/components/ui/breadcrumb';
import { usePatientStore } from '@/store/patientStore';

interface PatientBreadcrumbProps {
  children: React.ReactNode;
  facilityId: string;
  patientId: string;
  activeTab?: 'overview' | 'evaluations' | 'appointments' | 'vitals' | 'orders';
}

export function PatientBreadcrumb({ 
  children, 
  facilityId, 
  patientId, 
  activeTab = 'overview' 
}: PatientBreadcrumbProps) {
  const { currentPatient } = usePatientStore();
  
  // Get patient name from store or use a placeholder
  const patientName = currentPatient 
    ? `${currentPatient.firstName || ''} ${currentPatient.lastName || ''}`.trim() || 'Patient Details'
    : 'Patient Details';

  // Create breadcrumb pages based on the active tab
  const breadcrumbPages = [
    { name: 'Patients', href: '/protected/patients', current: false },
    { name: patientName, href: `/protected/patients/${patientId}`, current: false },
  ];

  // Add the current tab to breadcrumbs if not overview
  if (activeTab !== 'overview') {
    const tabName = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
    breadcrumbPages.push({
      name: tabName,
      href: `/protected/patients/${patientId}/${activeTab}`,
      current: true
    });
  } else {
    breadcrumbPages[1].current = true;
  }

  return (
    <div className="container">
      <Breadcrumb pages={breadcrumbPages} />
      
      <div className="flex flex-col gap-4 py-4 mx-auto  ">
        {children}
      </div>
    </div>
  );
}
