'use client'

import { useState, Fragment, useEffect } from 'react'
import { Transition, Tab } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { PatientBasicInfo } from '@/lib/kipu/types'
import { cn } from '@/lib/utils'
import { usePatientStore, PatientContextOption } from '@/store/patientStore'
import { 
  Dialog, 
  DialogContent, 
  DialogTitle,
  DialogHeader,
  DialogFooter
} from '@/components/ui/dialog'

type PatientContextBuilderDialogProps = {
  isOpen: boolean
  onClose: () => void
  onApply: (selectedOptions: PatientContextOption[]) => void
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
    updatePatientContextOptions
  } = usePatientStore();
  
  const [selectedOptions, setSelectedOptions] = useState<PatientContextOption[]>([])
  const [allOptions, setAllOptions] = useState<PatientContextOption[]>([])
  
  // Generate options based on available patient data
  const generateOptions = (): PatientContextOption[] => {
    const options: PatientContextOption[] = []

    // Basic patient info
    if (patient) {
      // Name and ID are always included by default, add other basic info
      if (patient.mr_number) {
        options.push({
          id: 'mr_number',
          label: 'Medical Record Number',
          value: patient.mr_number,
          category: 'basic'
        })
      }
      
      if (patient.dob) {
        options.push({
          id: 'dob',
          label: 'Date of Birth',
          value: patient.dob,
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
      
      if (patient.insurance) {
        options.push({
          id: 'insurance',
          label: 'Insurance',
          value: patient.insurance,
          category: 'basic'
        })
      }
    }
    
    // Evaluation data
    patientEvaluations.forEach((evaluation, index) => {
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
    })
    
    // Vital signs
    patientVitalSigns.forEach((vital, index) => {
      options.push({
        id: `vital_${index}`,
        label: `${vital.type}: ${vital.value} ${vital.unit}`,
        value: `${vital.type}: ${vital.value} ${vital.unit} (${vital.date})`,
        category: 'vitalSigns'
      })
    })
    
    // Appointments
    patientAppointments.forEach((appt, index) => {
      options.push({
        id: `appt_${index}`,
        label: `${appt.type} on ${appt.date}`,
        value: `${appt.type} appointment on ${appt.date} with ${appt.provider}`,
        category: 'appointments'
      })
    })
    
    return options
  }
  
  // Initialize options when patient data changes
  useEffect(() => {
    if (patient) {
      const options = generateOptions()
      setAllOptions(options)
      
      // Initialize with previously selected options if available
      if (selectedContextOptions.length > 0) {
        setSelectedOptions(selectedContextOptions)
      } else {
        // Default to basic patient info
        const basicOptions = options.filter(opt => opt.category === 'basic')
        setSelectedOptions(basicOptions)
      }
    }
  }, [patient, patientEvaluations, patientVitalSigns, patientAppointments, selectedContextOptions])
  
  const handleOptionToggle = (option: PatientContextOption) => {
    setSelectedOptions(prev => {
      const exists = prev.some(opt => opt.id === option.id)
      if (exists) {
        return prev.filter(opt => opt.id !== option.id)
      } else {
        return [...prev, option]
      }
    })
  }
  
  const handleApply = () => {
    // Update the store with selected options
    updatePatientContextOptions(selectedOptions)
    onApply(selectedOptions)
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
        
        {isLoading ? (
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
                            <Checkbox
                              id={option.id}
                              checked={selectedOptions.some(opt => opt.id === option.id)}
                              onChange={() => handleOptionToggle(option)}
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
                  <Tab.Panel className="rounded-xl bg-white p-3">
                    <div className="space-y-4">
                      {/* Evaluations */}
                      <div>
                        <h4 className="font-medium mb-2">Evaluations</h4>
                        <div className="space-y-2">
                          {allOptions
                            .filter(opt => opt.category === 'evaluation')
                            .map(option => (
                              <div key={option.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={option.id}
                                  checked={selectedOptions.some(opt => opt.id === option.id)}
                                  onChange={() => handleOptionToggle(option)}
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
                      </div>
                      
                      {/* Vital Signs */}
                      <div>
                        <h4 className="font-medium mb-2">Vital Signs</h4>
                        <div className="space-y-2">
                          {allOptions
                            .filter(opt => opt.category === 'vitalSigns')
                            .map(option => (
                              <div key={option.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={option.id}
                                  checked={selectedOptions.some(opt => opt.id === option.id)}
                                  onChange={() => handleOptionToggle(option)}
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
                      </div>
                      
                      {/* Appointments */}
                      <div>
                        <h4 className="font-medium mb-2">Appointments</h4>
                        <div className="space-y-2">
                          {allOptions
                            .filter(opt => opt.category === 'appointments')
                            .map(option => (
                              <div key={option.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={option.id}
                                  checked={selectedOptions.some(opt => opt.id === option.id)}
                                  onChange={() => handleOptionToggle(option)}
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
                      </div>
                    </div>
                  </Tab.Panel>
                </Tab.Panels>
              </Tab.Group>
            </div>
            
            <DialogFooter className="mt-6 flex justify-end space-x-2">
              <Button color="zinc" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleApply}>
                Apply
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
