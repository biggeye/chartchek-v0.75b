'use client'
import { useContextStore } from '@/store/contextStore'
import { useState, Fragment, useEffect } from 'react'
import { Transition, Tab } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Dialog } from '@headlessui/react'
import { usePatientStore } from '@/store/patientStore'
import { Button } from '@/components/ui/button'
import { KipuPatientEvaluation } from '@/types/kipu'
import { useKipuEvaluationsStore } from '@/store/kipuEvaluationsStore'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

// Define ContextItem type since it can't be imported
interface ContextItem {
  id: string;
  label: string;
  description?: string;
  category: string;
  selected?: boolean;
}

interface PatientContextBuilderDialogProps {
  isOpen: boolean
  onClose: () => void
  onApply: (selectedOptions: ContextItem[]) => void
}

export function PatientContextBuilderDialog({
  isOpen,
  onClose,
  onApply
}: PatientContextBuilderDialogProps) {
  // Get stores and state
  const { 
    generateContextItems, 
    selectedContextItems, 
    setSelectedContextItems,
    patientContext, 
    isLoading, 
    error 
  } = useContextStore();
  
  const {
    currentPatient: patient,
    currentPatientVitalSigns: patientVitalSigns,
  } = usePatientStore();
  
  const { patientEvaluations, fetchPatientEvaluations } = useKipuEvaluationsStore();
  const [selectedOptions, setSelectedOptions] = useState<ContextItem[]>([]);
  const [allOptions, setAllOptions] = useState<ContextItem[]>([]);
  const [loadingEvaluations, setLoadingEvaluations] = useState(false);

  // Load all available options
  useEffect(() => {
    if (patient) {
      // Create context items array manually since the function returns void
      const items: ContextItem[] = [];
      generateContextItems(patient, patientEvaluations, patientVitalSigns);
      
      // Get items from the store instead
      const storeItems = useContextStore.getState().contextItems;
      setAllOptions(storeItems);
      
      // Initialize with current selected options or defaults
      setSelectedOptions(selectedContextItems.length > 0 
        ? selectedContextItems 
        : storeItems.filter((opt: ContextItem) => opt.category === 'basic'));
    }
  }, [patient, patientEvaluations, patientVitalSigns, generateContextItems, selectedContextItems]);
  
  // Load evaluations when dialog opens
  useEffect(() => {
    if (isOpen && patient?.patientId) {
      setLoadingEvaluations(true);
      
      // Fetch evaluations from KIPU
      const fetchEvals = async () => {
        try {
          await fetchPatientEvaluations(patient.patientId);
        } catch (error) {
          console.error('Error fetching evaluations:', error);
        } finally {
          setLoadingEvaluations(false);
        }
      };
      
      fetchEvals();
    }
  }, [isOpen, patient, fetchPatientEvaluations]);

  // Group options by category for tab display
  const groupedOptions = allOptions.reduce((acc, option) => {
    if (!acc[option.category]) {
      acc[option.category] = [];
    }
    acc[option.category].push(option);
    return acc;
  }, {} as Record<string, ContextItem[]>);

  // Check if an option is selected
  const isOptionSelected = (optionId: string) => {
    return selectedOptions.some(opt => opt.id === optionId);
  };
  
  const handleOptionToggle = (option: ContextItem) => {
    setSelectedOptions(prev => {
      const exists = prev.some(opt => opt.id === option.id);
      
      if (exists) {
        return prev.filter(opt => opt.id !== option.id);
      } else {
        return [...prev, option];
      }
    });
  };

  // Apply selected options
  const handleApply = () => {
    setSelectedContextItems(selectedContextItems);
    onApply(selectedOptions);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="div"
                  className="flex items-center justify-between"
                >
                  <h3 className="text-lg font-semibold leading-6 text-gray-900">
                    Patient Context Builder
                  </h3>
                  <button
                    type="button"
                    className="rounded-md text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </Dialog.Title>

                <div className="mt-4">
                  {loadingEvaluations ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : (
                    <Tab.Group>
                      <Tab.List className="flex space-x-1 rounded-lg bg-gray-100 p-1">
                        {Object.keys(groupedOptions).map((category) => (
                          <Tab
                            key={category}
                            className={({ selected }) =>
                              cn(
                                'w-full rounded-lg py-2 text-sm font-medium leading-5',
                                'ring-white ring-opacity-60 ring-offset-2 focus:outline-none',
                                selected
                                  ? 'bg-white shadow text-blue-700'
                                  : 'text-gray-700 hover:bg-white/[0.12] hover:text-blue-700'
                              )
                            }
                          >
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </Tab>
                        ))}
                      </Tab.List>
                      <Tab.Panels className="mt-2">
                        {Object.entries(groupedOptions).map(([category, options]) => (
                          <Tab.Panel
                            key={category}
                            className="rounded-lg bg-white p-3 focus:outline-none"
                          >
                            <div className="space-y-2">
                              {options.map((option: ContextItem) => (
                                <div key={option.id} className="flex items-center space-x-2">
                           <Checkbox
  id={option.id}
  checked={isOptionSelected(option.id)}
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
                        ))}
                      </Tab.Panels>
                    </Tab.Group>
                  )}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <Button
                    outline
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleApply}
                    disabled={selectedOptions.length === 0}
                  >
                    Apply
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}