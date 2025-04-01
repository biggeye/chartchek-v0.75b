'use client'

import { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePatientStore } from '@/store/patientStore';
import { PatientBasicInfo } from '@/types/patient';

interface PatientSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (patient: PatientBasicInfo) => void;
  facilityId?: string;
}

export default function PatientSearchModal({
  isOpen,
  onClose,
  onSelect,
  facilityId
}: PatientSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { patients, fetchPatients, isLoading } = usePatientStore();
  
  useEffect(() => {
    if (isOpen && facilityId) {
      fetchPatients(facilityId);
    }
  }, [isOpen, facilityId, fetchPatients]);
  
  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[80vh] flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Select Patient</h2>
          </div>
          
          <div className="p-4">
            <Input
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-4"
            />
            
            <div className="overflow-y-auto max-h-[50vh]">
              {isLoading ? (
                <div className="text-center py-4">Loading patients...</div>
              ) : filteredPatients.length > 0 ? (
                <ul className="divide-y">
                  {filteredPatients.map((patient) => (
                    <li key={patient.patientId} className="py-2">
                      <button
                        onClick={() => onSelect(patient)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
                      >
                        {patient.firstName} {patient.lastName}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-4">No patients found</div>
              )}
            </div>
          </div>
          
          <div className="p-4 border-t flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}