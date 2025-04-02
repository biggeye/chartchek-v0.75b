'use client';

import { Menu } from '@headlessui/react';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import { PatientBasicInfo } from '@/types/chartChek/kipuAdapter';
import Link from 'next/link';

interface PatientListProps {
  patients: PatientBasicInfo[];
  currentFacilityId: number;
  onSelectPatient?: (patientId: string) => void;
}

// Define patient status types and their styling
const PATIENT_STATUSES = {
  'Active': 'text-green-700 bg-green-50 ring-green-600/20',
  'Inactive': 'text-gray-600 bg-gray-50 ring-gray-500/10',
  'Discharged': 'text-yellow-800 bg-yellow-50 ring-yellow-600/20',
};

// Helper function to combine class names
const classNames = (...classes: (string | boolean | undefined)[]) => 
  classes.filter(Boolean).join(' ');

// Patient action menu component
const PatientActionMenu = ({ patient }: { patient: PatientBasicInfo }) => {
  const patientId = patient.patientId || patient.mrn;
  const patientName = `${patient.firstName} ${patient.lastName}`;
  
  const menuItems = [
    {
      label: 'Edit',
      href: `/protected/patients/${patientId}/edit`,
    },
    {
      label: 'Schedule',
      href: `/protected/patients/${patientId}/appointments/new`,
    },
    {
      label: 'Evaluate',
      href: `/protected/patients/${patientId}/evaluations/new`,
    },
  ];

  return (
    <Menu as="div" className="relative flex-none">
      <Menu.Button className="-m-2.5 block p-2.5 text-gray-500 hover:text-gray-900">
        <span className="sr-only">Open options</span>
        <EllipsisVerticalIcon aria-hidden="true" className="h-5 w-5" />
      </Menu.Button>
      <Menu.Items className="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
        {menuItems.map((item) => (
          <Menu.Item key={item.label}>
            {({ active }) => (
              <Link
                href={item.href}
                className={classNames(
                  active ? 'bg-gray-50' : '',
                  'block px-3 py-1 text-sm/6 text-gray-900'
                )}
              >
                {item.label}<span className="sr-only">, {patientName}</span>
              </Link>
            )}
          </Menu.Item>
        ))}
      </Menu.Items>
    </Menu>
  );
};

// Patient list item component
const PatientListItem = ({ 
  patient, 
  onSelectPatient 
}: { 
  patient: PatientBasicInfo, 
  onSelectPatient?: (patientId: string) => void 
}) => {
  const status = patient.status || 'Active';
  const patientId = patient.patientId || patient.mrn;
  
  return (
    <li
      key={`patient-${patientId || `${patient.firstName}-${patient.lastName}`}`}
      className="flex items-center justify-between gap-x-6 py-5"
      onClick={() => patientId && onSelectPatient?.(patientId)}
      style={{ cursor: onSelectPatient ? 'pointer' : 'default' }}
    >
      <div className="flex-1">
        <div className="flex items-start gap-x-3">
          <p className="text-sm/6 font-semibold text-gray-900">
            {patient.firstName} {patient.lastName}
          </p>
          <p
            className={classNames(
              PATIENT_STATUSES[status as keyof typeof PATIENT_STATUSES] || PATIENT_STATUSES['Active'],
              'mt-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset'
            )}
          >
            {status}
          </p>
        </div>
        <div className="mt-1 flex items-center gap-x-2 text-xs/5 text-gray-500">
          <p className="whitespace-nowrap">MRN: {patient.mrn || 'N/A'}</p>
          <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
            <circle r={1} cx={1} cy={1} />
          </svg>
          <p className="whitespace-nowrap">DOB: {patient.dateOfBirth || 'N/A'}</p>
          <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
            <circle r={1} cx={1} cy={1} />
          </svg>
          <p className="truncate">Gender: {patient.gender || 'N/A'}</p>
        </div>
      </div>
      <div className="flex flex-none items-center gap-x-4">
        <Link
          href={`/protected/patients/${patientId}`}
          className="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block"
        >
          View patient<span className="sr-only">, {patient.firstName} {patient.lastName}</span>
        </Link>
        <PatientActionMenu patient={patient} />
      </div>
    </li>
  );
};

export default function PatientList({ patients, currentFacilityId, onSelectPatient }: PatientListProps) {
  if (!patients || !Array.isArray(patients) || patients.length === 0) {
    return <div className="text-center py-8 text-gray-500">No patients available</div>;
  }
  
  return (
    <ul role="list" className="overflow-y-auto">
      {patients.map((patient) => (
        <PatientListItem 
          key={patient.patientId || patient.mrn || `${patient.firstName}-${patient.lastName}`}
          patient={patient} 
          onSelectPatient={onSelectPatient} 
        />
      ))}
    </ul>
  );
}