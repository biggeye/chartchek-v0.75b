  'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  PaperClipIcon,
  UserPlusIcon,
  XCircleIcon,
  ChatBubbleBottomCenterIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  DocumentIcon,
  AdjustmentsHorizontalIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { SendIcon, Loader2 } from 'lucide-react'
import { useDocumentStore } from '@/store/documentStore'
import { chatStore } from '@/store/chatStore'
import { useStreamStore } from '@/store/streamStore'
import { Document } from '@/types/store/document'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import * as Headless from '@headlessui/react'
import { Button } from '@/components/ui/button'
import { assistantRoster } from '@/lib/assistant/roster'
import DropdownMenu from '@/components/ui/dropdown-menu2'
import Image from 'next/image'
import { Transition } from '@headlessui/react'
import { DynamicPaginatedDocumentList } from '@/components/documents/DynamicPaginatedDocumentList'
import { usePatientStore } from '@/store/patientStore'
import { useFacilityStore } from '@/store/facilityStore'
import { PatientBasicInfo } from '@/lib/kipu/types'
import { PatientContextBuilderDialog } from '@/components/patient/PatientContextBuilderDialog'
import { useSidebarStore } from '@/store/sidebarStore'
import { XMarkIcon, UserIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

// Define a type for patient context options
type PatientContextOption = {
  id: string
  label: string
  value: string
  category: 'basic' | 'evaluation' | 'vitalSigns' | 'appointments'
}


export function GlobalChatInputArea() {
  // State management
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAttachFilesPanel, setShowAttachFilesPanel] = useState(false)
  const [showPatientPanel, setShowPatientPanel] = useState(false)
  const [showDocumentListPanel, setShowDocumentListPanel] = useState(false)
  const [patients, setPatients] = useState<PatientBasicInfo[]>([])
  const [documentPage, setDocumentPage] = useState(0)
  const [facilityId, setFacilityId] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const [selectedAssistantKey, setSelectedAssistantKey] = useState<string>(assistantRoster[0].key)
  const [isPatientContextBuilderOpen, setIsPatientContextBuilderOpen] = useState(false)
  const [selectedContextOptions, setSelectedContextOptions] = useState<PatientContextOption[]>([])
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  // Get sidebar collapsed state from store
  const { sidebarCollapsed } = useSidebarStore();

  // Auto-resize textarea function
  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = 'auto';
      // Set height based on scrollHeight (with a small buffer to avoid scrollbar flickering)
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 24)}px`;
    }
  };

  // Initialize textarea height on component mount and when message changes
  useEffect(() => {
    autoResizeTextarea();
  }, [message]);

  // Use stores - declare all store variables first before using them in effects
  // Chat store
  const {
    currentThread,
    sendMessage,
    transientFileQueue: storeFileQueue,
    addFileToQueue,
    removeFileFromQueue,
    setCurrentAssistantId,
    clearFileQueue,
    sendMessageWithFiles,
    createThread,
    activeRunStatus
  } = chatStore()

  // Streaming store
  const {
    isStreamingActive,
    startStream,
    cancelStream
  } = useStreamStore()

  // Sync isSubmitting state with isStreamingActive
  useEffect(() => {
    if (!isStreamingActive && isSubmitting) {
      setIsSubmitting(false);
    }
  }, [isStreamingActive, isSubmitting]);

  // Sync isSubmitting state with activeRunStatus
  useEffect(() => {
    if (activeRunStatus?.isActive) {
      setIsSubmitting(true);
    } else if (!isStreamingActive && !activeRunStatus?.isActive && isSubmitting) {
      setIsSubmitting(false);
    }
  }, [activeRunStatus, isStreamingActive, isSubmitting]);

  // Document store
  const {
    documents,
    isLoading: isDocumentsLoading,
    fetchDocumentsForCurrentFacility
  } = useDocumentStore()

  // Patient store
  const {
    isPatientContextEnabled,
    currentPatient,
    currentPatientEvaluations,
    currentPatientVitalSigns,
    currentPatientAppointments,
    setPatientContextEnabled,
    setCurrentPatient,
    clearPatientContext,
    fetchPatients,
    fetchPatientWithDetails
  } = usePatientStore()

  // Facility store
  const {
    getCurrentFacility
  } = useFacilityStore()

  // Current facility object
  const currentFacility = getCurrentFacility();

  // Extract facilityId from pathname if available
  useEffect(() => {
    const match = pathname.match(/\/facilities\/([^\/]+)/)
    if (match && match[1]) {
      setFacilityId(match[1])
    } else {
      // If no facility ID in the URL, use the current facility from the store
      const currentFacilityId = useFacilityStore.getState().currentFacilityId;
      if (currentFacilityId) {
        setFacilityId(currentFacilityId);
      }
    }
  }, [pathname])

  // Load patients if facilityId is available
  useEffect(() => {
    if (facilityId) {
      try {
        // Use patientStore to fetch patients for the current facility
        fetchPatients(facilityId).then(fetchedPatients => {
          setPatients(fetchedPatients)
        })
      } catch (error) {
        console.error('Error fetching patients:', error)
      }
    }
  }, [facilityId, fetchPatients])

  // Subscribe to facility changes
  useEffect(() => {
    // Set up subscription to facility store changes
    const unsubscribe = useFacilityStore.subscribe((state: any) => {
      const newFacilityId = state.currentFacilityId;
      if (newFacilityId && newFacilityId !== facilityId) {
        setFacilityId(newFacilityId);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [facilityId]);

  // Fetch documents on mount
  useEffect(() => {
    (async () => {
      try {
        await fetchDocumentsForCurrentFacility();
      } catch (error) {
        console.error('Failed to load documents:', error)
      }
    })()
  }, [fetchDocumentsForCurrentFacility, facilityId])

  // Reset document page when documents change
  useEffect(() => {
    setDocumentPage(0)
  }, [documents.length])

  // Event handlers
  const toggleAttachFilesPanel = () => {
    setShowAttachFilesPanel(!showAttachFilesPanel)
    setShowPatientPanel(false)
    setShowDocumentListPanel(false)
  }

  const togglePatientPanel = () => {
    setShowPatientPanel(!showPatientPanel)
    setShowAttachFilesPanel(false)
    setShowDocumentListPanel(false)
  }

  const toggleDocumentListPanel = () => {
    setShowDocumentListPanel(!showDocumentListPanel)
    setShowAttachFilesPanel(false)
    setShowPatientPanel(false)
  }

  const togglePatientContext = () => {
    setPatientContextEnabled(!isPatientContextEnabled)
    if (isPatientContextEnabled) {
      clearPatientContext()
      setSelectedContextOptions([])
    }
  }

  const selectPatient = async (patient: PatientBasicInfo) => {
    setCurrentPatient(patient)
    setPatientContextEnabled(true)
    setShowPatientPanel(false)

    // Load patient details for context builder
    if (facilityId) {
      // Use id property first, then fall back to casefile_id property for fetching details from Kipu
      await fetchPatientWithDetails(facilityId, patient.id || patient.casefile_id)
    }
  }

  const openPatientContextBuilder = () => {
    if (currentPatient && isPatientContextEnabled) {
      setIsPatientContextBuilderOpen(true)
    }
  }

  const handleContextBuilderApply = (options: PatientContextOption[]) => {
    setSelectedContextOptions(options)
    setIsPatientContextBuilderOpen(false)
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      try {
        const file = files[0]
        // Let the document store handle the entire file upload and processing
        const documentStore = useDocumentStore.getState();
        // Check if the method exists before calling it
        if (typeof documentStore.uploadAndProcessDocument === 'function') {
          const result = await documentStore.uploadAndProcessDocument(file);

          if (result) {
            console.log('Document uploaded and processed:', result)
            // Let chat store handle adding to queue
            addFileToQueue(result)
            setShowAttachFilesPanel(false)
          }
        } else {
          console.error('uploadAndProcessDocument method not available');
        }
      } catch (error) {
        console.error('File upload failed:', error)
      }
    }
  }

  const removeFile = (index: number) => {
    const fileToRemove = storeFileQueue[index]
    removeFileFromQueue(fileToRemove)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleCheckboxChange = (doc: Document) => {
    if (!doc.openai_file_id) {
      console.warn(`Document ${doc.file_name} has no OpenAI file id yet.`)
      return
    }

    if (storeFileQueue.some((f: Document) => f.document_id === doc.document_id)) {
      removeFileFromQueue(doc)
    } else {
      addFileToQueue(doc)
    }
  }

  // Determine if the current thread is active
  const isThreadActive =
    currentThread &&
    currentThread.tool_resources?.file_search?.vector_store_ids &&
    currentThread.tool_resources.file_search.vector_store_ids[0] !== 'temp-vector-store'

  // Get the current assistant ID based on the selected key
  const getCurrentAssistantId = (key: string): string => {
    const assistant = assistantRoster.find(a => a.key === key);
    if (!assistant || !assistant.assistant_id) {
      console.error(`No assistant found with key: ${key}`);
      return "asst_9RqcRDt3vKUEFiQeA0HfLC08"; // Default fallback
    }

    return assistant.assistant_id;
  };

  // Handle assistant change
  const handleAssistantChange = (key: string) => {
    setSelectedAssistantKey(key);
    const assistantId = getCurrentAssistantId(key);
    setCurrentAssistantId(assistantId);
    console.log(`Assistant changed to: ${key}`)
  };
  // Create dropdown items for the assistant selector
  const assistantDropdownItems = assistantRoster.map(assistant => ({
    label: assistant.name,
    onClick: () => handleAssistantChange(assistant.key)
  }));

  // Get the current assistant object
  const currentAssistant = assistantRoster.find(a => a.key === selectedAssistantKey);

  // Get the logo path based on the selected assistant
  const getAssistantLogoPath = (key: string): string | null => {
    switch (key) {
      case 'tjc':
        return '/ext-logos/tjc-logo.jpg';
      case 'dhcs':
        return '/ext-logos/dhcs-logo.png';
      default:
        return null;
    }
  };

  const assistantLogoPath = getAssistantLogoPath(selectedAssistantKey);

  const handleSubmit = async () => {
    if (isSubmitting || (!message.trim() && storeFileQueue.length === 0)) return;

    setIsSubmitting(true);

    try {
      // Get the assistant ID based on the selected key
      const assistantId = getCurrentAssistantId(selectedAssistantKey);

      if (!assistantId) {
        throw new Error('No assistant ID available. Please check your configuration.');
      }

      let messageContent = message.trim();
      let additionalInstructions = '';

      // Build patient context as additionalInstructions instead of embedding in message
      if (isPatientContextEnabled && currentPatient) {
        if (selectedContextOptions.length > 0) {
          // Create a properly formatted patient context with all selected data
          const patientHeader = `Patient Context: ${currentPatient.first_name} ${currentPatient.last_name} (ID: ${currentPatient.casefile_id})`;

          // Group options by category for better organization
          const categorizedOptions: Record<string, string[]> = {};

          selectedContextOptions.forEach(opt => {
            if (!categorizedOptions[opt.category]) {
              categorizedOptions[opt.category] = [];
            }
            categorizedOptions[opt.category].push(opt.value);
          });

          // Build context string with category headers
          const contextSections: string[] = [patientHeader];

          // Add Basic Info section
          if (categorizedOptions['basic'] && categorizedOptions['basic'].length > 0) {
            contextSections.push('--- Basic Information ---');
            contextSections.push(categorizedOptions['basic'].join('\n'));
          }

          // Add Evaluations section
          if (categorizedOptions['evaluation'] && categorizedOptions['evaluation'].length > 0) {
            contextSections.push('--- Evaluations ---');
            contextSections.push(categorizedOptions['evaluation'].join('\n'));
          }

          // Add Vital Signs section
          if (categorizedOptions['vitalSigns'] && categorizedOptions['vitalSigns'].length > 0) {
            contextSections.push('--- Vital Signs ---');
            contextSections.push(categorizedOptions['vitalSigns'].join('\n'));
          }

          // Add Appointments section
          if (categorizedOptions['appointments'] && categorizedOptions['appointments'].length > 0) {
            contextSections.push('--- Appointments ---');
            contextSections.push(categorizedOptions['appointments'].join('\n'));
          }

          additionalInstructions = contextSections.join('\n\n');

          console.log('Patient context being sent to the API:', additionalInstructions);
        } else {
          // Use basic patient info if no specific options were selected
          additionalInstructions = `Patient Context: ${currentPatient.first_name} ${currentPatient.last_name} (ID: ${currentPatient.casefile_id})`;
        }
      }

      // Delegate the message sending and file handling to the chat store
      const result = await chatStore.getState().sendMessageWithFiles(
        assistantId,
        messageContent,
        storeFileQueue
      );

      if (result.success) {
        // Start streaming the response with additionalInstructions
        if (result.threadId) {
          await useStreamStore.getState().startStream(
            result.threadId,
            assistantId,
            additionalInstructions
          );
        } else {
          console.error('No threadId returned from sendMessageWithFiles');
        }
      }

      // Clear the message input
      setMessage('');

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error submitting message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed bottom-0 z-1000 transition-all duration-300 ease-in-out right-0 left-0 w-full"
    >
      <div
        className="w-full px-2 sm:px-4 lg:px-6 flex justify-center"
      >
        <div
          className={`
            ${!isExpanded
              ? 'w-auto'
              : 'w-[95%] sm:w-[95%] md:w-[95%] lg:w-[90%] xl:w-[85%] max-w-7xl mx-auto'
            }
            mb-4
          `}
        >
          {!isExpanded ? (
            // When collapsed, only show the CHAT button with minimal width
            <div className="flex justify-center">
              <button
                onClick={() => setIsExpanded(true)}
                className="px-3 py-0.5 text-[10px] font-medium text-gray-500 hover:text-gray-700 bg-gray-100 rounded-sm shadow-sm"
              >
                CHAT
              </button>
            </div>
          ) : isStreamingActive ? (
            // When streaming is active, show a spinner for the entire component
            <div className="rounded-lg bg-gradient-to-b from-background to-background/90 shadow-lg ring-1 ring-gray-900/10 p-4">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                <span className="text-sm text-gray-600 font-medium">Processing...</span>
              </div>
            </div>
          ) : (
            // When expanded and not streaming, show the redesigned chat interface
            <div className="relative">
              {/* Tabs on top of input field */}
              <div className="flex items-center justify-between mb-0 px-0 relative z-10">
                {/* Left side with assistant selector in a tab */}
                <div className="flex items-center z-10">
                  <div className="flex items-center gap-0 bg-gray-100 rounded-t-lg px-2 py-1.5 border-2 border-gray-300 border-b-0">
                    {selectedAssistantKey === 'tjc' ? (
                      <div className="h-5 w-5 relative">
                        <Image
                          src="/ext-logos/tjc-logo-goldSymbol.jpg"
                          alt="TJC Logo"
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                      </div>
                    ) : assistantLogoPath ? (
                      <div className="h-5 w-5 relative">
                        <Image
                          src={assistantLogoPath}
                          alt={`${currentAssistant?.name} logo`}
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <ChatBubbleBottomCenterIcon className="h-5 w-5 text-gray-500" />
                    )}
                    {/* Custom positioned dropdown wrapper */}
                    <div className="relative">
                      <DropdownMenu
                        items={assistantDropdownItems}
                        triggerLabel={currentAssistant?.name || 'Select Assistant'}
                        className="text-sm font-medium text-gray-700 hover:text-gray-900"
                        position="top"
                        align="right"
                      />
                    </div>
                  </div>
                </div>

                {/* Centered HIDE button */}
                <button
                  onClick={() => setIsExpanded(false)}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-3 py-0.5 text-[10px] font-medium text-gray-500 hover:text-gray-700 bg-gray-100 rounded-sm shadow-sm"
                >
                  HIDE
                </button>

                {/* Right side with New conversation button in a tab */}
                <div className="flex items-center">
                  {/* New conversation button */}
                  <div className="bg-gray-100 rounded-t-lg px-1 py-1 border-2 border-gray-300 border-b-0">
                    <Button
                      onClick={async () => {
                        if (selectedAssistantKey) {
                          try {
                            // Get the actual OpenAI assistant ID using the getCurrentAssistantId function
                            const assistantId = getCurrentAssistantId(selectedAssistantKey);

                            // Create new thread with current assistant using the chatStore
                            const threadId = await chatStore.getState().createThread(assistantId);
                            console.log(`Created new thread: ${threadId}`);
                            // Thread state is already updated by the createThread function
                          } catch (error) {
                            console.error('Error creating new thread:', error);
                          }
                        }
                      }}
                      className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                      title="Start new conversation"
                    >
                      <PlusIcon className="h-5 w-5 text-gray-600" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Unified Context and Attachments Row - Only show when there's content */}
              {((isPatientContextEnabled && currentPatient) || storeFileQueue.length > 0) && (
                <div className="flex flex-wrap gap-2 px-3 py-2 border-x-2 border-t-2 border-gray-300 bg-gray-50">
                  {/* Patient Context Tag */}
                  {isPatientContextEnabled && currentPatient && (
                    <div className="flex items-center bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-xs group">
                      <UserIcon className="h-3 w-3 mr-1" />
                      <button 
                        onClick={openPatientContextBuilder}
                        className="font-medium mr-1 hover:underline focus:outline-none"
                      >
                        {currentPatient.first_name} {currentPatient.last_name}
                      </button>
                      <button
                        onClick={togglePatientContext}
                        className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                        aria-label="Remove patient context"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {/* Patient Context Options Tags */}
                  {isPatientContextEnabled && currentPatient && selectedContextOptions.length > 0 && (
                    <div className="flex items-center bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-xs">
                      <AdjustmentsHorizontalIcon className="h-3 w-3 mr-1" />
                      <button
                        onClick={openPatientContextBuilder}
                        className="font-medium hover:underline focus:outline-none"
                      >
                        {selectedContextOptions.length} details
                      </button>
                    </div>
                  )}

                  {/* Document Attachment Tags */}
                  {storeFileQueue.map((file, index) => (
                    <div 
                      key={'document_id' in file ? file.document_id : index} 
                      className="flex items-center bg-indigo-100 text-indigo-800 rounded-full px-3 py-1 text-xs"
                    >
                      <DocumentTextIcon className="h-3 w-3 mr-1" />
                      <span className="font-medium truncate max-w-[150px]">{file.file_name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="ml-1 text-indigo-600 hover:text-indigo-800 focus:outline-none"
                        aria-label="Remove file"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Main Input Area - Expanded to full width */}
              <div className="relative">
                <div
                  className={cn(
                    'flex w-full items-center rounded-lg rounded-t-none border-2 border-gray-300 bg-white px-3 py-2.5 shadow-sm',
                    isPatientContextEnabled && currentPatient && 'border-t-0',
                    isSubmitting && 'opacity-50'
                  )}
                >
                  {/* Action buttons - responsive implementation */}
                  <div className="flex-shrink-0 mr-2 pr-2 border-r flex items-center">
                    {/* Mobile dropdown menu */}
                    <div className="md:hidden relative z-[100]">
                      <button
                        type="button"
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-gray-50 hover:bg-gray-100"
                      >
                        <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-600" />

                      </button>

                      {showMobileMenu && (
                        <div className="absolute bottom-full left-0 mb-1 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none min-w-[180px] z-[100]">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                toggleAttachFilesPanel();
                                setShowMobileMenu(false);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                            >
                              <PaperClipIcon className="h-4 w-4 mr-2 text-gray-500" />
                              Attach files
                            </button>
                            <button
                              onClick={() => {
                                togglePatientPanel();
                                setShowMobileMenu(false);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                            >
                              <UserPlusIcon className="h-4 w-4 mr-2 text-gray-500" />
                              Patient context
                            </button>
                            <button
                              onClick={() => {
                                toggleDocumentListPanel();
                                setShowMobileMenu(false);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                            >
                              <DocumentIcon className="h-4 w-4 mr-2 text-gray-500" />
                              Browse documents
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Desktop individual buttons */}
                    <div className="hidden md:flex items-center">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={toggleAttachFilesPanel}
                          className="inline-flex items-center justify-center px-1 hover:text-blue-600"
                          aria-label="Attach files"
                        >
                          <PaperClipIcon className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="relative z-[100]">
                        <button
                          type="button"
                          onClick={togglePatientPanel}
                          className="inline-flex items-center justify-center px-1 hover:text-blue-600"
                          aria-label="Set patient context"
                        >
                          <UserPlusIcon className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={toggleDocumentListPanel}
                          className="inline-flex items-center justify-center px-1 hover:text-blue-600"
                          aria-label="Browse documents"
                        >
                          <DocumentIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <textarea
                    rows={1}
                    name="message"
                    id="message"
                    disabled={isSubmitting}
                    value={message}
                    ref={textareaRef}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      // Height will be auto-adjusted by the effect hook
                    }}
                    onKeyDown={handleKeyPress}
                    className="block flex-1 border-0 p-0 text-gray-900 focus:ring-0 sm:text-sm sm:leading-6 resize-none bg-transparent min-h-[24px] overflow-hidden"
                    placeholder="Type your message..."
                  />

                  {/* Right side send button */}
                  <div className="flex-shrink-0 ml-2 pl-2 border-l">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting || (!message.trim() && storeFileQueue.length === 0)}
                      className={cn(
                        'inline-flex items-center justify-center text-blue-600 hover:text-blue-800',
                        (isSubmitting || (!message.trim() && storeFileQueue.length === 0)) && 'opacity-50 cursor-not-allowed'
                      )}
                      aria-label="Send message"
                    >
                      <SendIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* File Attachment Modal */}
          <Headless.Transition
            show={showAttachFilesPanel}
            enter="transition duration-300 ease-out"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition duration-200 ease-in"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 flex items-center justify-center z-50">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-gray-500/30 backdrop-blur-sm"
                onClick={toggleAttachFilesPanel}
              />

              {/* Modal Content */}
              <Headless.Transition.Child
                enter="transition duration-300 ease-out"
                enterFrom="transform scale-50 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-200 ease-in"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-50 opacity-0"
              >
                <div className="relative bg-white rounded-xl shadow-xl w-[80vw] max-w-md max-h-[80vh] overflow-hidden flex flex-col">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">Attach Files</h2>
                    <button
                      onClick={toggleAttachFilesPanel}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-4 overflow-y-auto flex-grow">
                    <div className="flex flex-col items-center justify-center space-y-4 py-8">
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 w-full">
                        <div className="bg-gray-100 rounded-full p-4 mb-4">
                          <PaperClipIcon className="h-8 w-8 text-gray-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Upload files</h3>
                        <p className="text-sm text-gray-500 text-center max-w-xs mb-4">
                          Click to select or drag and drop a file
                        </p>
                        <input
                          type="file"
                          id="file"
                          ref={fileInputRef}
                          onChange={(e) => {
                            handleFileSelect(e);
                            toggleAttachFilesPanel();
                          }}
                          className="hidden"
                        />
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-2"
                        >
                          Choose File
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="border-t p-4 flex justify-between">
                    <Button
                      plain
                      onClick={toggleAttachFilesPanel}
                    >
                      Cancel
                    </Button>
                    <Button
                      plain
                      onClick={() => {
                        toggleDocumentListPanel();
                        toggleAttachFilesPanel();
                      }}
                    >
                      Browse Documents
                    </Button>
                  </div>
                </div>
              </Headless.Transition.Child>
            </div>
          </Headless.Transition>

          {/* Document List Modal */}
          <Headless.Transition
            show={showDocumentListPanel}
            enter="transition duration-300 ease-out"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition duration-200 ease-in"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 flex items-center justify-center z-50">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-gray-500/30 backdrop-blur-sm"
                onClick={toggleDocumentListPanel}
              />

              {/* Modal Content */}
              <Headless.Transition.Child
                enter="transition duration-300 ease-out"
                enterFrom="transform scale-50 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-200 ease-in"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-50 opacity-0"
              >
                <div className="relative bg-white rounded-xl shadow-xl w-[80vw] h-[80vh] max-w-4xl max-h-[80vh] sm:w-[80vw] md:w-[70vw] lg:w-[60vw] xl:w-[50vw] overflow-hidden flex flex-col">
                  {/* Modal Header */}
                  <div className="flex items-center p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">Document Library</h2>
                  </div>

                  {/* Modal Body */}
                  <div className="p-4 overflow-y-auto flex-grow">
                    {/* Use the new DynamicPaginatedDocumentList component */}
                    <DynamicPaginatedDocumentList
                      documents={documents}
                      isLoading={isDocumentsLoading}
                      onDocumentSelect={handleCheckboxChange}
                      selectedDocumentIds={storeFileQueue.map(file => 'document_id' in file ? file.document_id : '')}
                      className="h-full"
                      itemHeight={40}
                      minItemsPerPage={2}
                      containerPadding={60}
                    />
                  </div>

                  {/* Modal Footer */}
                  <div className="border-0.5 p-4 flex justify-end space-x-3">
                    <>
                      <Button
                        plain
                        onClick={() => {
                          // Clear all selections and file queue before closing
                          if (isThreadActive && currentThread) {
                            // For active threads, we would need to clear the thread files
                            // This would need implementation based on how thread files are managed
                          } else {
                            // For new chats, clear the file queue
                            clearFileQueue();
                          }
                          toggleDocumentListPanel();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        plain

                        onClick={toggleDocumentListPanel}
                      >
                        Save
                      </Button>
                    </>
                  </div>
                </div>
              </Headless.Transition.Child>
            </div>
          </Headless.Transition>

          {/* Patient Selection Modal */}
          <Headless.Transition
            show={showPatientPanel}
            enter="transition duration-300 ease-out"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition duration-200 ease-in"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 flex items-center justify-center z-50">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-gray-500/30 backdrop-blur-sm"
                onClick={togglePatientPanel}
              />

              {/* Modal Content */}
              <Headless.Transition.Child
                enter="transition duration-300 ease-out"
                enterFrom="transform scale-50 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-200 ease-in"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-50 opacity-0"
              >
                <div className="relative bg-white rounded-xl shadow-xl w-[80vw] max-w-md max-h-[80vh] overflow-hidden flex flex-col">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">Select Patient</h2>
                    <button
                      onClick={togglePatientPanel}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-4 overflow-y-auto flex-grow">
                    {patients.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No patients found</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {patients.map((patient: PatientBasicInfo) => (
                          <button
                            key={patient.id || patient.casefile_id || patient.mr_number}
                            onClick={() => {
                              selectPatient(patient);
                              togglePatientPanel();
                            }}
                            className="flex items-center w-full p-3 text-left rounded-md hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex-shrink-0 bg-gray-200 rounded-full p-2 mr-3">
                              <UserIcon className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{patient.first_name} {patient.last_name}</p>
                              {patient.mr_number && (
                                <p className="text-sm text-gray-500">MR# {patient.mr_number}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="border-t p-4 flex justify-end">
                    <Button
                      plain
                      onClick={togglePatientPanel}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Headless.Transition.Child>
            </div>
          </Headless.Transition>

          {/* Patient Context Builder Dialog */}
          <PatientContextBuilderDialog
            isOpen={isPatientContextBuilderOpen}
            onClose={() => setIsPatientContextBuilderOpen(false)}
            onApply={handleContextBuilderApply}
          />
        </div>
      </div>
    </div>
  )
}