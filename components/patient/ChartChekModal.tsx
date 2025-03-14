'use client'

import { useState, useEffect, useRef } from 'react'
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PatientContextBuilderDialog } from '@/components/patient/PatientContextBuilderDialog'
import { usePatientStore, PatientContextOption } from '@/store/patientStore'
import { useFacilityStore } from '@/store/facilityStore'
import { chatStore } from '@/store/chatStore'
import { useStreamStore } from '@/store/streamStore'
import { assistantRoster } from '@/lib/assistant/roster'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChartChekModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
}

export function ChartChekModal({
  isOpen,
  onClose,
  patientId
}: ChartChekModalProps) {
  // State
  const [activeTab, setActiveTab] = useState<string>('chat')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPatientContextBuilderOpen, setIsPatientContextBuilderOpen] = useState(false)
  const [formattedPatientContext, setFormattedPatientContext] = useState<string>('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Get stores
  const { 
    currentPatient, 
    isPatientContextEnabled,
    setPatientContextEnabled,
    selectedContextOptions,
    updatePatientContextOptions
  } = usePatientStore()

  const { currentFacilityId } = useFacilityStore()

  const {
    currentThread,
    sendMessageWithFiles,
    createThread,
    setCurrentAssistantId
  } = chatStore()

  const {
    isStreamingActive,
    startStream
  } = useStreamStore()

  // Auto-resize textarea function
  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = 'auto'
      // Set height based on scrollHeight
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 24)}px`
    }
  }

  // Initialize textarea height on component mount and when message changes
  useEffect(() => {
    autoResizeTextarea()
  }, [message])

  // Ensure patient context is enabled when modal opens
  useEffect(() => {
    if (isOpen && currentPatient && !isPatientContextEnabled) {
      setPatientContextEnabled(true)
    }
  }, [isOpen, currentPatient, isPatientContextEnabled, setPatientContextEnabled])

  // Format patient context whenever selectedContextOptions changes
  useEffect(() => {
    if (isPatientContextEnabled && currentPatient) {
      formatPatientContext();
    }
  }, [isPatientContextEnabled, currentPatient, selectedContextOptions]);

  // Format patient context for display and use in messages
  const formatPatientContext = () => {
    if (!currentPatient) {
      setFormattedPatientContext('');
      return;
    }

    let contextString = '';

    if (selectedContextOptions.length > 0) {
      // Create a properly formatted patient context with all selected data
      const patientHeader = `Patient Context: ${currentPatient.first_name} ${currentPatient.last_name} (ID: ${currentPatient.casefile_id || currentPatient.id || currentPatient.mr_number})`;
      
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
      
      contextString = contextSections.join('\n\n');
    } else {
      // Use basic patient info if no specific options were selected
      contextString = `Patient Context: ${currentPatient.first_name} ${currentPatient.last_name} (ID: ${currentPatient.casefile_id || currentPatient.id || currentPatient.mr_number})`;
    }

    setFormattedPatientContext(contextString);
  };

  // Handle context builder
  const openPatientContextBuilder = () => {
    if (currentPatient && isPatientContextEnabled) {
      setIsPatientContextBuilderOpen(true)
    }
  }

  const handleContextBuilderApply = (options: PatientContextOption[]) => {
    updatePatientContextOptions(options)
    setIsPatientContextBuilderOpen(false)
  }

  // Handle message submission
  const handleSubmit = async () => {
    if (isSubmitting || !message.trim()) return
    
    setIsSubmitting(true)
    
    try {
      // Use the default ChartChat assistant
      const assistantId = "asst_9RqcRDt3vKUEFiQeA0HfLC08"
      
      if (!assistantId) {
        throw new Error('No assistant ID available')
      }
      
      // Make sure we have the correct assistant ID set
      setCurrentAssistantId(assistantId)
      
      let messageContent = message.trim()
      let additionalInstructions = ''
      
      // Build patient context
      if (isPatientContextEnabled && currentPatient) {
        additionalInstructions = formattedPatientContext;
      }
      
      // Send message with empty file queue
      const result = await sendMessageWithFiles(
        assistantId,
        messageContent,
        []
      )
      
      if (result.success) {
        // Start streaming the response with additionalInstructions
        if (result.threadId) {
          await startStream(
            result.threadId, 
            assistantId,
            additionalInstructions
          )
        } else {
          console.error('No threadId returned from sendMessageWithFiles')
        }
      }
      
      // Clear the message input
      setMessage('')
    } catch (error) {
      console.error('Error submitting message:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="w-[90vw] max-w-[800px] h-[80vh] max-h-[800px] p-0 flex flex-col">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle>ChartChek</DialogTitle>
              <button
                type="button"
                className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={onClose}
              >
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 flex flex-col">
            <Tabs 
              value={activeTab}
              onChange={setActiveTab}
              className="flex-1 flex flex-col"
            >
              <TabsList className="px-6 pt-2">
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="context">Patient Context</TabsTrigger>
              </TabsList>
              
              {activeTab === "chat" && (
                <div className="flex-1 flex flex-col p-6 overflow-hidden">
                  <div className="flex-1 overflow-y-auto mb-4 bg-gray-50 rounded-md p-4">
                    {/* This would be where chat messages appear */}
                    {!currentThread && (
                      <div className="text-center text-gray-500 py-10">
                        <p>Start a new conversation with ChartChek</p>
                        <p className="text-sm mt-2">
                          {currentPatient ? 
                            `Patient context is enabled for ${currentPatient.first_name} ${currentPatient.last_name}` : 
                            'No patient context is available'}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Patient Context Indicator */}
                  {isPatientContextEnabled && currentPatient && (
                    <div className="mb-4 flex items-center justify-between bg-blue-50 p-2 rounded-md">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-blue-800 font-medium">
                          Patient Context: {currentPatient.first_name} {currentPatient.last_name}
                        </span>
                        <button
                          onClick={openPatientContextBuilder}
                          className="inline-flex items-center rounded-full border border-blue-200 bg-blue-100 p-1 text-blue-700 shadow-sm hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0" />
                          </svg>
                        </button>
                        {selectedContextOptions.length > 0 && (
                          <span className="text-xs text-blue-600">
                            ({selectedContextOptions.length} details selected)
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Message input */}
                  <div className="relative mt-auto">
                    <div className="flex items-center border rounded-md px-3 py-2 shadow-sm focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
                      <textarea
                        rows={1}
                        name="message"
                        id="message"
                        disabled={isSubmitting}
                        value={message}
                        ref={textareaRef}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="block flex-1 border-0 p-0 text-gray-900 focus:ring-0 sm:text-sm sm:leading-6 resize-none bg-transparent min-h-[24px] overflow-hidden"
                        placeholder="Type your message..."
                      />
                      
                      {/* Send button */}
                      <div className="flex-shrink-0 ml-2 pl-2 border-l">
                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={isSubmitting || !message.trim()}
                          className={cn(
                            'inline-flex items-center justify-center text-blue-600 hover:text-blue-800',
                            (isSubmitting || !message.trim()) && 'opacity-50 cursor-not-allowed'
                          )}
                          aria-label="Send message"
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <PaperAirplaneIcon className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === "context" && (
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Patient Context Settings</h3>
                    <p className="text-sm text-gray-500">
                      Configure what patient information to include in your ChartChek conversations.
                    </p>
                    
                    <Button 
                      onClick={openPatientContextBuilder}
                      color="blue"
                    >
                      Open Context Builder
                    </Button>
                    
                    {selectedContextOptions.length > 0 ? (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium mb-2">Preview of Patient Context:</h4>
                        <div className="bg-gray-50 rounded-md p-4 overflow-auto max-h-[300px] text-sm whitespace-pre-wrap border border-gray-200">
                          {formattedPatientContext}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                        <p className="text-sm text-gray-500">
                          No patient context options selected. Click "Open Context Builder" to select patient information to include.
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-6 flex justify-end gap-2 border-t border-gray-200 pt-4">
                      <Button onClick={onClose} color="zinc">
                        Cancel
                      </Button>
                      <Button onClick={() => {
                        // Save the current context options
                        updatePatientContextOptions(selectedContextOptions);
                        onClose();
                      }} color="blue">
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
      
      <PatientContextBuilderDialog
        isOpen={isPatientContextBuilderOpen}
        onClose={() => setIsPatientContextBuilderOpen(false)}
        onApply={handleContextBuilderApply}
      />
    </>
  )
}
