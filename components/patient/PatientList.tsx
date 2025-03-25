'use client';

import { Menu } from '@headlessui/react';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';

// Helper function to combine class names
function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

// Define patient status types and their styling
const patientStatuses = {
  'Active': 'text-green-700 bg-green-50 ring-green-600/20',
  'Inactive': 'text-gray-600 bg-gray-50 ring-gray-500/10',
  'Discharged': 'text-yellow-800 bg-yellow-50 ring-yellow-600/20',
};

interface PatientListProps {
  patients: any[];
  currentFacilityId: number;
  onSelectPatient?: (patientId: string) => void;
}

export default function PatientList({ patients, currentFacilityId, onSelectPatient }: PatientListProps) {
  if (!patients || !Array.isArray(patients)) {
    return <div>No patients available</div>;
  }
  
  
  return (
    <ul role="list" className="divide-y divide-gray-100">
      {patients.map((patient) => {
        // Determine patient status - this is a placeholder, replace with actual logic
        const status = patient.status || 'Active';

        return (
          <li
            key={`patient-${patient.patientId || patient.mrn || patient.firstName + patient.lastName}`}
            className="flex items-center justify-between gap-x-6 py-5"
            onClick={() => onSelectPatient?.(patient.patientId)}
            style={{ cursor: onSelectPatient ? 'pointer' : 'default' }}
          >
            <div className="min-w-0">
              <div className="flex items-start gap-x-3">
                <p className="text-sm/6 font-semibold text-gray-900">
                  {patient.firstName} {patient.lastName}
                </p>
                <p
                  className={classNames(
                    patientStatuses[status as keyof typeof patientStatuses] || patientStatuses['Active'],
                    'mt-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset'
                  )}
                >
                  {status}
                </p>
              </div>
              <div className="mt-1 flex items-center gap-x-2 text-xs/5 text-gray-500">
                <p className="whitespace-nowrap">
                  MRN: {patient.mrn || 'N/A'}
                </p>
                <svg viewBox="0 0 2 2" className="size-0.5 fill-current">
                  <circle r={1} cx={1} cy={1} />
                </svg>
                <p className="whitespace-nowrap">
                  DOB: {patient.dateOfBirth || 'N/A'}
                </p>
                <svg viewBox="0 0 2 2" className="size-0.5 fill-current">
                  <circle r={1} cx={1} cy={1} />
                </svg>
                <p className="truncate">Gender: {patient.gender || 'N/A'}</p>
              </div>
            </div>
            <div className="flex flex-none items-center gap-x-4">
              <a
                href={`/protected/patients/${patient.patientId || patient.mrn}`}
                className="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 ring-1 shadow-xs ring-gray-300 ring-inset hover:bg-gray-50 sm:block"
              >
                View patient<span className="sr-only">, {patient.firstName} {patient.lastName}</span>
              </a>
              <Menu as="div" className="relative flex-none">
                <Menu.Button className="-m-2.5 block p-2.5 text-gray-500 hover:text-gray-900">
                  <span className="sr-only">Open options</span>
                  <EllipsisVerticalIcon aria-hidden="true" className="size-5" />
                </Menu.Button>
                <Menu.Items
                  className="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-white py-2 ring-1 shadow-lg ring-gray-900/5 focus:outline-none"
                >
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href={`/protected/patients/${patient.patientId || patient.mrn}/edit`}
                        className={classNames(
                          active ? 'bg-gray-50' : '',
                          'block px-3 py-1 text-sm/6 text-gray-900'
                        )}
                      >
                        Edit<span className="sr-only">, {patient.firstName} {patient.lastName}</span>
                      </a>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href={`/protected/patients/${patient.patientId || patient.mrn}/appointments/new`}
                        className={classNames(
                          active ? 'bg-gray-50' : '',
                          'block px-3 py-1 text-sm/6 text-gray-900'
                        )}
                      >
                        Schedule<span className="sr-only">, {patient.firstName} {patient.lastName}</span>
                      </a>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href={`/protected/patients/${patient.patientId || patient.mrn}/evaluations/new`}
                        className={classNames(
                          active ? 'bg-gray-50' : '',
                          'block px-3 py-1 text-sm/6 text-gray-900'
                        )}
                      >
                        Evaluate<span className="sr-only">, {patient.firstName} {patient.lastName}</span>
                      </a>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Menu>
            </div>
          </li>
        );
      })}
    </ul>
  );
}