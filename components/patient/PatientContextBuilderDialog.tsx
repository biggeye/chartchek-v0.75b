'use client'

import { useState, Fragment, useEffect } from 'react'
import { Transition, Tab } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { PatientBasicInfo } from '@/types/kipu'
import { cn } from '@/lib/utils'
import { usePatientStore } from '@/store/patientStore'
import { PatientContextOptions } from '@/types/store/patient'
import { 
  Dialog, 
  DialogContent, 
  DialogTitle,
  DialogHeader
} from '@/components/ui/dialog'

type PatientContextBuilderDialogProps = {
  isOpen: boolean
  onClose: () => void
  onApply: (selectedOptions: any[]) => void
}
interface ContextItem {
  id: string;
  label: string;
  value: string;
  category: string;
  title?: string;
}

export function PatientContextBuilderDialog({
  isOpen,
  onClose,
  onApply
}: PatientContextBuilderDialogProps) {
  // Get patient data from patientStore
  const {
    currentPatient: patient,
    currentPatientEvaluations: patientEvaluations,
    currentPatientVitalSigns: patientVitalSigns,
    currentPatientAppointments: patientAppointments,
    isLoading,
    selectedContextOptions,
    updatePatientContextOptions,
    fetchPatientEvaluations
  } = usePatientStore();
  
  const [selectedOptions, setSelectedOptions] = useState<ContextItem[]>([]);
  const [allOptions, setAllOptions] = useState<ContextItem[]>([])
  const [loadingEvaluations, setLoadingEvaluations] = useState(false)
  
  // Generate options based on available patient data
  const generateOptions = (): any[] => {
    const options: any[] = []

    // Basic patient info
    if (patient) {
      // Name and ID are always included by default, add other basic info
      if (patient.mrn) {
        options.push({
          id: 'mrn',
          label: 'Medical Record Number',
          value: patient.mrn,
          category: 'basic'
        })
      }
      
      if (patient.dateOfBirth) {
        options.push({
          id: 'dob',
          label: 'Date of Birth',
          value: patient.dateOfBirth,
          category: 'basic'
        })
      }
      
      if (patient.gender) {
        options.push({
          id: 'gender',
          label: 'Gender',
          value: patient.gender,
          category: 'basic'
        })
      }
      
  
    }
    
    // Evaluation data
    patientEvaluations.forEach((evaluation: any, index) => {
      if (evaluation.diagnosis) {
        options.push({
          id: `diagnosis_${index}`,
          label: `Diagnosis: ${evaluation.diagnosis}`,
          value: evaluation.diagnosis,
          category: 'evaluation'
        })
      }
      
      if (evaluation.assessment) {
        options.push({
          id: `assessment_${index}`,
          label: `Assessment: ${evaluation.assessment.substring(0, 30)}...`,
          value: evaluation.assessment,
          category: 'evaluation'
        })
      }

      if (evaluation.notes) {
        options.push({
          id: `notes_${index}`,
          label: `${evaluation.evaluationType}: ${evaluation.notes.substring(0, 30)}...`,
          value: `${evaluation.evaluationType}: ${evaluation.notes}`,
          category: 'evaluation'
        })
      }
    })
    
    // Vital signs
    patientVitalSigns.forEach((vital, index) => {
      options.push({
        id: `vital_${index}`,
        label: `${vital.type}: ${vital.value} ${vital.unit}`,
        value: `${vital.type}: ${vital.value} ${vital.unit} (${vital.recordedAt})`,
        category: 'vitalSigns'
      })
    })
    
    // Appointments
    patientAppointments.forEach((appt, index) => {
      options.push({
        id: `appt_${index}`,
        value: `${appt.type}: ${appt.startTime}`,
        title: appt.startTime,
        category: 'appointments'
      })
    })
    
    return options
  }

  useEffect(() => {
    // Load all available options
    const options = [
      // your options here
    ];
    setAllOptions(options);
    
    // Initialize with default options (basic patient info)
    const basicOptions = options.filter(opt => opt.category === 'basic');
    setSelectedOptions(basicOptions);
  }, []);
  
  // Load evaluations when dialog opens
  useEffect(() => {
    if (isOpen && patient) {
      const loadEvaluations = async () => {
        setLoadingEvaluations(true)
        try {
          // If we have a facility ID and patient ID, fetch evaluations
          if (patient.patientId) {
            await fetchPatientEvaluations(patient.patientId)
          }
        } catch (error) {
          console.error('Error loading evaluations:', error)
        } finally {
          setLoadingEvaluations(false)
        }
      }
      
      loadEvaluations()
    }
  }, [isOpen, patient, fetchPatientEvaluations])
  
  // Initialize options when patient data changes
  useEffect(() => {
    if (patient) {
      const options = generateOptions()
      setAllOptions(options)
      
      // Initialize with previously selected options if available
      if (selectedContextOptions?.items && selectedContextOptions.items.length > 0) {
        // Use the items array instead of the whole object
        setSelectedOptions(selectedContextOptions.items);
      
          } else {
        // Default to basic patient info
        const basicOptions = options.filter(opt => opt.category === 'basic')
        setSelectedOptions(basicOptions)
      }
    }
  }, [patient, patientEvaluations, patientVitalSigns, patientAppointments, selectedContextOptions])
  
  // Check if an option is selected
  const isOptionSelected = (optionId: string) => {
    return selectedOptions.some(opt => opt.id === optionId)
  }
  
  const handleOptionToggle = (option: any) => {
    console.log('Toggle option:', option.id, 'Current selected:', selectedOptions.map(o => o.id));
    
    setSelectedOptions(prev => {
      const exists = prev.some(opt => opt.id === option.id);
      
      if (exists) {
        console.log('Removing option:', option.id);
        return prev.filter(opt => opt.id !== option.id);
      } else {
        console.log('Adding option:', option.id);
        return [...prev, option];
      }
    });
  }
  
  const handleApply = () => {
    // Update the store with selected options
    // Convert our array of ContextItem to the expected PatientContextOptions format
    updatePatientContextOptions({
      // Map any relevant properties from selectedOptions to PatientContextOptions
      // For example, if you're using filterBy:
      filterBy: selectedOptions.map(opt => opt.id).join(',')
    });
    
    onApply(selectedOptions);
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Patient Context Builder</DialogTitle>
          <button
            type="button"
            className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
            onClick={onClose}
          >
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </DialogHeader>
        
        {isLoading || loadingEvaluations ? (
          <div className="mt-4 flex justify-center">
            <p>Loading patient data...</p>
          </div>
        ) : !patient ? (
          <div className="mt-4 text-center text-gray-500">
            No patient selected. Please select a patient first.
          </div>
        ) : (
          <>
            <div className="mt-4">
              <Tab.Group>
                <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1">
                  <Tab as={Fragment}>
                    {({ selected }) => (
                      <button
                        className={cn(
                          'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                          selected
                            ? 'bg-white shadow text-blue-700'
                            : 'text-gray-700 hover:bg-white/[0.12] hover:text-blue-700'
                        )}
                      >
                        Basic Info
                      </button>
                    )}
                  </Tab>
                  <Tab as={Fragment}>
                    {({ selected }) => (
                      <button
                        className={cn(
                          'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                          selected
                            ? 'bg-white shadow text-blue-700'
                            : 'text-gray-700 hover:bg-white/[0.12] hover:text-blue-700'
                        )}
                      >
                        Medical
                      </button>
                    )}
                  </Tab>
                </Tab.List>
                <Tab.Panels className="mt-2">
                  <Tab.Panel className="rounded-xl bg-white p-3">
                    <div className="space-y-2">
                      {allOptions
                        .filter(opt => opt.category === 'basic')
                        .map(option => (
                          <div key={option.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={option.id}
                              checked={isOptionSelected(option.id)}
                              onChange={() => handleOptionToggle(option)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label
                              htmlFor={option.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {option.label}
                            </label>
                          </div>
                        ))}
                    </div>
                  </Tab.Panel>
                  <Tab.Panel className="rounded-xl bg-white p-3 max-h-[300px] overflow-y-auto">
                    <div className="space-y-4">
                      {/* Evaluations */}
                      <div>
                        <h4 className="font-medium mb-2">Evaluations</h4>
                        <div className="space-y-2">
                          {allOptions
                            .filter(opt => opt.category === 'evaluation')
                            .length > 0 ? (
                            allOptions
                              .filter(opt => opt.category === 'evaluation')
                              .map(option => (
                                <div key={option.id} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={option.id}
                                    checked={isOptionSelected(option.id)}
                                    onChange={() => handleOptionToggle(option)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <label
                                    htmlFor={option.id}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {option.label}
                                  </label>
                                </div>
                              ))
                          ) : (
                            <div className="text-sm text-gray-500">No evaluations available</div>
                          )}
                        </div>
                      </div>
                      
                      {/* Vital Signs */}
                      <div>
                        <h4 className="font-medium mb-2">Vital Signs</h4>
                        <div className="space-y-2">
                          {allOptions
                            .filter(opt => opt.category === 'vitalSigns')
                            .length > 0 ? (
                            allOptions
                              .filter(opt => opt.category === 'vitalSigns')
                              .map(option => (
                                <div key={option.id} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={option.id}
                                    checked={isOptionSelected(option.id)}
                                    onChange={() => handleOptionToggle(option)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <label
                                    htmlFor={option.id}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {option.label}
                                  </label>
                                </div>
                              ))
                          ) : (
                            <div className="text-sm text-gray-500">No vital signs available</div>
                          )}
                        </div>
                      </div>
                      
                      {/* Appointments */}
                      <div>
                        <h4 className="font-medium mb-2">Appointments</h4>
                        <div className="space-y-2">
                          {allOptions
                            .filter(opt => opt.category === 'appointments')
                            .length > 0 ? (
                            allOptions
                              .filter(opt => opt.category === 'appointments')
                              .map(option => (
                                <div key={option.id} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={option.id}
                                    checked={isOptionSelected(option.id)}
                                    onChange={() => handleOptionToggle(option)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <label
                                    htmlFor={option.id}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {option.label}
                                  </label>
                                </div>
                              ))
                          ) : (
                            <div className="text-sm text-gray-500">No appointments available</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Tab.Panel>
                </Tab.Panels>
              </Tab.Group>
            </div>
            
            <div className="mt-6 flex justify-end gap-2 border-t border-gray-200 pt-4">
              <Button onClick={onClose} color="zinc">
                Cancel
              </Button>
              <Button onClick={handleApply} color="blue">
                Apply
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
