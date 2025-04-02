'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRightIcon, HomeIcon, ArrowLeftIcon } from '@heroicons/react/20/solid';
import { usePatientStore } from '@/store/patient/patientStore';
import { cn } from '@/lib/utils';

interface PatientBreadcrumbProps {
  children: React.ReactNode;
  facilityId: number;
  patientId: string;
  activeTab?: 'overview' | 'evaluations' | 'appointments' | 'vitals' | 'orders';
}

export function PatientBreadcrumb({ 
  children, 
  facilityId, 
  patientId, 
  activeTab = 'overview' 
}: PatientBreadcrumbProps) {
  const { currentPatient } = usePatientStore.getState();
  
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
      current: true,
    });
  } else {
    // Mark the patient name as current if we're on the overview tab
    breadcrumbPages[1].current = true;
  }

  return (
    <div className="bg-white shadow">
      <div className="px-4 py-2 sm:px-6 lg:px-8">
        {/* Mobile view - Back button and current page */}
        <div className="flex items-center sm:hidden">
          <Link 
            href={breadcrumbPages.length > 2 ? breadcrumbPages[1].href : breadcrumbPages[0].href}
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" aria-hidden="true" />
            Back
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
            {breadcrumbPages[breadcrumbPages.length - 1].name}
          </span>
        </div>

        {/* Desktop view - Full breadcrumb */}
        <nav className="hidden sm:flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <div>
                <Link href="/protected/dashboard" className="text-gray-400 hover:text-gray-500">
                  <HomeIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  <span className="sr-only">Home</span>
                </Link>
              </div>
            </li>
            {breadcrumbPages.map((page, index) => (
              <li key={page.name} className="flex items-center">
                <ChevronRightIcon 
                  className="h-5 w-5 flex-shrink-0 text-gray-400" 
                  aria-hidden="true" 
                />
                <Link
                  href={page.href}
                  className={cn(
                    "ml-4 text-sm font-medium",
                    page.current 
                      ? "text-indigo-600 hover:text-indigo-700" 
                      : "text-gray-500 hover:text-gray-700"
                  )}
                  aria-current={page.current ? 'page' : undefined}
                >
                  {page.name}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      </div>
      
      {/* Content area */}
      <div className="px-4 py-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}