'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { PaperClipIcon, UserPlusIcon, XCircleIcon, ChatBubbleBottomCenterIcon, ChevronUpIcon, ChevronDownIcon, DocumentIcon } from '@heroicons/react/24/outline'
import { SendIcon } from 'lucide-react'
import { useDocumentStore } from '@/store/documentStore'
import { chatStore } from '@/store/chatStore'
import { useNewStreamingStore } from '@/store/newStreamStore'
import { Document } from '@/types/store/document'
import { useRouter, usePathname } from 'next/navigation'
import { getFacilityData } from '@/lib/kipu'
import { cn } from '@/lib/utils'
import * as Headless from '@headlessui/react'
import { Button } from '@/components/ui/button'

type PatientBasicInfo = {
  casefile_id?: string
  mr_number?: string
  first_name: string
  last_name: string
  id: string
}

export function GlobalChatInputArea() {
  // State management
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAttachFilesPanel, setShowAttachFilesPanel] = useState(false)
  const [showPatientPanel, setShowPatientPanel] = useState(false)
  const [showDocumentListPanel, setShowDocumentListPanel] = useState(false)
  const [patients, setPatients] = useState<PatientBasicInfo[]>([])
  const [isPatientContextEnabled, setIsPatientContextEnabled] = useState(false)
  const [currentPatient, setCurrentPatient] = useState<PatientBasicInfo | null>(null)
  const [documentPage, setDocumentPage] = useState(0)
  const [facilityId, setFacilityId] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(true) // Toggle for chat input visibility
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  // Extract facilityId from pathname if available
  useEffect(() => {
    const match = pathname.match(/\/facilities\/([^\/]+)/)
    if (match && match[1]) {
      setFacilityId(match[1])
    }
  }, [pathname])

  // Load patients if facilityId is available
  useEffect(() => {
    if (facilityId) {
      try {
        const facilityData = getFacilityData(facilityId)
        console.log('Facility Data: ', facilityData)
        if (facilityData && facilityData.data.patients) {
          setPatients(facilityData.data.patients)
        }
      } catch (error) {
        console.error('Error fetching patients:', error)
      }
    }
  }, [facilityId])

  // Use stores
  const { 
    currentThread, 
    sendMessage,
    transientFileQueue: storeFileQueue,
    addFileToQueue,
    removeFileFromQueue,
    setCurrentAssistantId,
    clearFileQueue
  } = chatStore()

  const {
    isStreamingActive,
    startStream,
    cancelStream
  } = useNewStreamingStore()

  const { 
    uploadFileToOpenAI, 
    uploadAndProcessDocument,
    documents, 
    isLoading: isDocumentsLoading, 
    fetchDocuments 
  } = useDocumentStore()

  // Fetch documents on mount
  useEffect(() => {
    (async () => {
      try {
        await fetchDocuments()
      } catch (error) {
        console.error('Failed to load documents:', error)
      }
    })()
  }, [fetchDocuments])

  // Pagination
  const itemsPerPage = 4
  const paginatedDocuments = useMemo(() => {
    return documents.slice(documentPage * itemsPerPage, (documentPage + 1) * itemsPerPage)
  }, [documents, documentPage, itemsPerPage])

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
    setIsPatientContextEnabled(!isPatientContextEnabled)
    if (isPatientContextEnabled) {
      setCurrentPatient(null)
    }
  }

  const selectPatient = (patient: PatientBasicInfo) => {
    setCurrentPatient(patient)
    setIsPatientContextEnabled(true)
    setShowPatientPanel(false)
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      try {
        const file = files[0]
        const result = await uploadAndProcessDocument(file)
        if (result) {
          console.log('Document uploaded and processed:', result)
          addFileToQueue(result)
          setShowAttachFilesPanel(false)
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

  // Toggle a document's attachment state in the file queue
  const handleCheckboxChange = (doc: Document) => {
    if (!doc.openai_file_id) {
      console.warn(`Document ${doc.fileName} has no OpenAI file id yet.`)
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

  const handleSubmit = async () => {
    if (isSubmitting || !message.trim() && storeFileQueue.length === 0) return
    
    setIsSubmitting(true)
    
    try {
      // Determine which assistant to use based on context
      // This is a placeholder - you would need to implement the actual logic
      // based on your application's requirements
      const assistantId = isPatientContextEnabled && currentPatient
        ? 'asst_patient_context' // Replace with your actual patient context assistant ID
        : 'asst_default' // Replace with your default assistant ID
      
      setCurrentAssistantId(assistantId)
      
      // Create message context with patient information if available
      let messageContent = message.trim()
      if (isPatientContextEnabled && currentPatient) {
        messageContent = `[Patient Context: ${currentPatient.first_name} ${currentPatient.last_name} (ID: ${currentPatient.id})]\n\n${messageContent}`
      }
      
      // For each file in the queue, use its openai_file_id if available,
      // otherwise upload it
      const attachments = await Promise.all(
        storeFileQueue.map(async (file: Document) => {
          if (file.openai_file_id) return file.openai_file_id
          return await uploadFileToOpenAI(file)
        })
      )
      
      // Filter out any failed uploads
      const validAttachments = attachments.filter(Boolean) as string[]
      
      // Format attachments for the API
      const formattedAttachments = validAttachments.map(id => ({
        file_id: id,
        tools: [{ type: 'file_search' as const }]
      }))
      
      // Create or use existing thread
      let threadToUse = currentThread?.thread_id
      if (!threadToUse) {
        console.log('[GlobalChatInputArea] No thread exists, creating a new one')
        threadToUse = await chatStore.getState().createThread(assistantId)
      }
      
      if (!threadToUse || !assistantId) {
        throw new Error('Thread ID or Assistant ID is missing')
      }
      
      // Send the message
      const result = await sendMessage(assistantId, threadToUse, messageContent, formattedAttachments)
      
      if (!result.success) {
        console.error('[GlobalChatInputArea] Error sending message:', result.error)
        throw new Error(result.error || 'Failed to send message')
      }
      
      // Start streaming the response
      await startStream(threadToUse, assistantId)
      
      // Clear the message input
      setMessage('')
      
      // Navigate to chat page if not already there
      // This is optional and depends on your application's UX flow
      if (!pathname.includes('/chat')) {
        router.push(`/protected/chat/${threadToUse}`)
      }
    } catch (error) {
      console.error('[GlobalChatInputArea] Error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // DocumentList renders a list of documents for attachment selection
  const DocumentList = () => (
    <div className="overflow-y-auto h-full">
      {isDocumentsLoading ? (
        <div className="py-2 px-3 text-gray-500">Loading documents...</div>
      ) : paginatedDocuments.length === 0 ? (
        <div className="py-2 px-3 text-gray-500">No documents found</div>
      ) : (
        paginatedDocuments.map((doc) => {
          const isSelected = storeFileQueue.some((f) => f.document_id === doc.document_id)
          return (
            <div
              key={doc.document_id}
              className="flex items-center justify-between px-3 py-2 hover:bg-gray-50"
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`doc-${doc.document_id}`}
                  checked={isSelected}
                  onChange={() => handleCheckboxChange(doc)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                />
                <label
                  htmlFor={`doc-${doc.document_id}`}
                  className="ml-2 block text-sm font-medium text-gray-900 cursor-pointer"
                >
                  {doc.fileName}
                </label>
              </div>
            </div>
          )
        })
      )}
      {documents.length > itemsPerPage && (
        <div className="flex justify-between mt-2 px-3">
          <button
            onClick={() => setDocumentPage(Math.max(documentPage - 1, 0))}
            disabled={documentPage === 0}
            className="xxs px-3 py-1 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setDocumentPage(Math.min(documentPage + 1, Math.ceil(documents.length / itemsPerPage) - 1))}
            disabled={documentPage >= Math.ceil(documents.length / itemsPerPage) - 1}
            className="xxs px-3 py-1 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full z-50">
      {/* Toggle button for chat visibility when closed */}
      {!isExpanded && (
        <button 
          onClick={() => setIsExpanded(true)}
          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full bg-gray-500/30 text-white rounded-t-md p-1 flex items-center gap-0.5 shadow-lg backdrop-blur-sm"
        >
          <ChevronUpIcon className="h-2.5 w-2.5" />
        </button>
      )}

      {/* Main chat input area - conditionally rendered based on expanded state with animation */}
      <Headless.Transition
        show={isExpanded}
        enter="transition duration-300 ease-out"
        enterFrom="transform translate-y-full"
        enterTo="transform translate-y-0"
        leave="transition duration-200 ease-in"
        leaveFrom="transform translate-y-0"
        leaveTo="transform translate-y-full"
      >
        <div className="bg-transparent relative">
          {/* Close button (X) in top right corner */}
          <button 
            onClick={() => setIsExpanded(false)}
            className="absolute top-1 right-1 text-gray-500 hover:text-gray-700 z-10"
            aria-label="Close chat input"
          >
            <XCircleIcon className="h-5 w-5" />
          </button>
          
          <div className="max-w-7xl mx-auto px-10 sm:px-4 lg:px-8 py-0.5">
            {/* Patient Context Indicator */}
            {isPatientContextEnabled && currentPatient && (
              <div className="mb-2 flex items-center justify-between bg-blue-50 p-2 rounded-md">
                <div className="flex items-center">
                  <span className="text-xs text-blue-800 font-medium">
                    Patient Context: {currentPatient.first_name} {currentPatient.last_name}
                  </span>
                </div>
                <button 
                  onClick={togglePatientContext}
                  className="text-blue-800 hover:text-blue-600"
                  aria-label="Remove patient context"
                >
                  <XCircleIcon className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* File Attachments Display */}
            {storeFileQueue.length > 0 && (
              <div className="mb-2 pt-1">
                <div className="flex flex-wrap gap-2">
                  {storeFileQueue.map((file, index) => (
                    <div key={'document_id' in file ? file.document_id : index} className="flex items-center bg-gray-100 rounded-md px-2 py-1">
                      <span className="text-xs text-gray-800 truncate max-w-[150px]">{file.fileName}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                        aria-label={`Remove ${file.fileName}`}
                      >
                        <XCircleIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main Input Area - Redesigned with solid border and integrated send button */}
            <div className="relative pt-2 pb-4">
              <div
                className={cn(
                  'flex w-full items-center rounded-lg border-2 border-gray-300 bg-white px-3 py-2.5 shadow-sm',
                  isSubmitting && 'opacity-50'
                )}
              >
                {/* Left side action buttons */}
                <div className="flex-shrink-0 mr-2 pr-2 border-r flex items-center">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={toggleAttachFilesPanel}
                      className="inline-flex items-center justify-center px-1 hover:text-blue-600"
                      aria-label="Attach files"
                    >
                      <PaperClipIcon className="h-5 w-5" />
                    </button>
                    
                    {/* Attach Files Dropdown */}
                    {showAttachFilesPanel && (
                      <div className="absolute bottom-full left-0 mb-1 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none min-w-[150px] z-10">
                        <div className="py-1">
                          <input
                            type="file"
                            id="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            Upload a file
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={togglePatientPanel}
                      className="inline-flex items-center justify-center px-1 hover:text-blue-600"
                      aria-label="Set patient context"
                    >
                      <UserPlusIcon className="h-5 w-5" />
                    </button>
                    
                    {/* Patient Panel Dropdown */}
                    {showPatientPanel && facilityId && (
                      <div className="absolute bottom-full left-0 mb-1 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none min-w-[200px] z-10">
                        <div className="py-1 max-h-56 overflow-y-auto">
                          {patients.length === 0 ? (
                            <div className="px-4 py-2 text-sm text-gray-500">No patients found</div>
                          ) : (
                            patients.map((patient: PatientBasicInfo) => (
                              <button
                                key={patient.casefile_id || patient.mr_number}
                                onClick={() => selectPatient(patient)}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                {patient.first_name} {patient.last_name}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
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
                
                <textarea
                  rows={1}
                  name="message"
                  id="message"
                  disabled={isSubmitting}
                  value={message}
                  ref={textareaRef}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="block flex-1 border-0 p-0 text-gray-900 focus:ring-0 sm:text-sm sm:leading-6 resize-none bg-transparent"
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
                <DocumentList />
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
    </div>
  )
}