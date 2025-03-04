'use client'

import { useState, useRef, useEffect, useMemo, KeyboardEvent } from 'react'
import { TextQuoteIcon, PaperclipIcon, XIcon, CheckIcon, UserPlusIcon } from 'lucide-react'
import { chatStore } from '@/store/chatStore'
import { useDocumentStore } from '@/store/documentStore'
import { usePatientStore } from '@/store/patientStore'
import { cn } from '@/lib/utils'
import { ChatMessageAttachment } from '@/types/database'
import { Document } from '@/types/store/document' // Import the correct Document interface

interface ChatInputAreaProps {
  onMessageSubmit: (content: string, attachments: string[], patientContext: any) => void
  isSubmitting?: boolean
  facilityId?: string
}

export function ChatInputArea({
  onMessageSubmit,
  isSubmitting = false,
  facilityId
}: ChatInputAreaProps) {
  /* ========================
       Local Component State & Refs 
  ============================= */
  const [message, setMessage] = useState('')
  const [showAttachFilesPanel, setShowAttachFilesPanel] = useState(false)
  const [showPatientPanel, setShowPatientPanel] = useState(false)
  const [showDocumentListPanel, setShowDocumentListPanel] = useState(false)
  const [page, setPage] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ========================
         Patient Store 
  ============================= */
  const {
    patients,
    fetchPatients,
    currentPatient,
    setCurrentPatient,
    isPatientContextEnabled,
    setPatientContextEnabled
  } = usePatientStore()

  /* ========================
        Chat Store & File Queue
  ============================= */
  const { transientFileQueue, addFileToQueue, removeFileFromQueue, currentThread, clearFileQueue } = chatStore()

  /* ========================
       Document Store 
  ============================= */
  const { uploadFileToOpenAI, documents, isLoading: isDocumentsLoading, fetchDocuments } = useDocumentStore()

  /* ========================
         Derived State
  ============================= */
  // Check if current thread is active by inspecting its vector store IDs
  const isThreadActive =
    currentThread &&
    currentThread.tool_resources?.file_search?.vector_store_ids &&
    currentThread.tool_resources.file_search.vector_store_ids[0] !== 'temp-vector-store'

  // Paginate documents for the attachment dropdown
  const itemsPerPage = 4
  const paginatedDocuments = useMemo(() => {
    return documents.slice(page * itemsPerPage, (page + 1) * itemsPerPage)
  }, [documents, page, itemsPerPage])

  // Compute patient context if enabled
  const patientContext = isPatientContextEnabled && currentPatient ? currentPatient : null

  /* ========================
         Side Effects
  ============================= */
  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])
  // Fetch patients when facilityId changes and patient panel is open
  useEffect(() => {
    if (facilityId && showPatientPanel) {
      fetchPatients(facilityId)
    }
  }, [facilityId, showPatientPanel, fetchPatients])
  // Fetch documents on component mount
  useEffect(() => {
    (async () => {
      try {
        await fetchDocuments()
      } catch (error) {
        console.error('Failed to load documents:', error)
      }
    })()
  }, [fetchDocuments])

  /* ========================
         Event Handlers
  ============================= */
   // Handle Enter key press for submission (Shift+Enter for newline)
   const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }
  // Submit message handler: upload files if needed, attach patient context, and reset state
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!message.trim() && transientFileQueue.length === 0 || isSubmitting) return

    try {
      // For each file in the queue, use openai_file_id if available; otherwise upload via documentStore.
      const attachments = await Promise.all(
        transientFileQueue.map(async (file) => {
          if (file.openai_file_id) return file.openai_file_id
          // Make sure file has filePath before uploading
          if (file.filePath) {
            return await uploadFileToOpenAI(file as Document)
          }
          return null
        })
      )
      const validAttachments = attachments.filter(Boolean) as string[]
      await onMessageSubmit(message.trim(), validAttachments, patientContext)
      setMessage('')
      clearFileQueue && clearFileQueue() // Assumes clearFileQueue exists in chatStore
    } catch (error) {
      console.error('[ChatInputArea] Submit error:', error)
    }
  }
  // Toggle file attachment panel and ensure only one panel is open at a time
  const toggleAttachFilesPanel = () => {
    setShowAttachFilesPanel(prev => !prev)
    if (!showAttachFilesPanel) {
      setShowPatientPanel(false)
      setShowDocumentListPanel(false)
    }
  }
  // Toggle patient selection panel; fetch patients if opening and facilityId exists.
  const togglePatientPanel = () => {
    setShowPatientPanel(prev => !prev)
    if (!showPatientPanel) {
      setShowAttachFilesPanel(false)
      setShowDocumentListPanel(false)
      facilityId && fetchPatients(facilityId)
    }
  }
  // Toggle document list panel
  const toggleDocumentListPanel = () => {
    setShowDocumentListPanel(prev => !prev)
    if (!showDocumentListPanel) {
      setShowAttachFilesPanel(false)
      setShowPatientPanel(false)
    }
  }


  // PATIENT CONTEXT //
  // Select a patient and enable patient context
  const selectPatient = (patient: any) => {
    setCurrentPatient(patient)
    setPatientContextEnabled(true)
    setShowPatientPanel(false)
  }
  // Toggle patient context enable/disable
  const togglePatientContext = () => {
    setPatientContextEnabled(!isPatientContextEnabled)
  }

   // DOCUMENT CONTEXT //    
  // Handle file input selection and add to queue via addFileToQueue
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      try {
        const fileId = await uploadFileToOpenAI({
          filePath: file.name, // Use filename as a temporary path
          // Add required properties for Document interface
          document_id: `temp-${Date.now()}`,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          processingStatus: 'pending'
        } as Document)

        if (fileId) {
          // Create a document object that conforms to the Document interface
          addFileToQueue({
            document_id: `temp-${Date.now()}`,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            filePath: file.name, // Use filename as path for temporary file
            processingStatus: 'pending',
            openai_file_id: fileId
          } as Document)
        }
      } catch (error) {
        console.error('Error uploading file:', error)
      }
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }
  // Toggle document attachment state in the file queue
  const handleCheckboxChange = (doc: Document) => {
    if (!doc.openai_file_id) {
      console.warn(`Document ${doc.fileName} has no OpenAI file id yet.`)
      return
    }
    if (transientFileQueue.some((f: any) => f.document_id === doc.document_id)) {
      removeFileFromQueue(doc)
    } else {
      addFileToQueue(doc)
    }
  }
  // Helper to remove a file from the queue by index
  const removeFile = (index: number) => {
    const file = transientFileQueue[index]
    file && removeFileFromQueue(file as Document)
  }




  /* ========================
         UI Components
  ============================= */
  // DocumentList renders a dropdown list of documents for attachment selection.
  const DocumentList = () => (
    <div className="absolute bottom-full right-0 mb-1 max-w-[40vw] bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none overflow-y-hidden">
      {isDocumentsLoading ? (
        <div className="py-2 px-3 text-gray-500">Loading documents...</div>
      ) : (
        paginatedDocuments.map((doc: Document) => {
          const isChecked = isThreadActive
            ? Boolean(doc.openai_file_id && currentThread?.current_files?.some((file: any) => file.openai_file_id === doc.openai_file_id))
            : transientFileQueue.some((f: any) => f.document_id === doc.document_id)
          return (
            <div
              key={doc.document_id}
              className={`cursor-default select-none py-2 pl-3 pr-9 ${isChecked ? 'bg-indigo-50 text-gray-900' : 'text-gray-900'}`}
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleCheckboxChange(doc)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                  aria-label={`Select ${doc.fileName}`}
                />
                <span className="ml-3 block truncate font-medium">
                  {doc.fileName}
                  {doc.processingStatus === 'processing' && (
                    <span className="ml-2 text-indigo-500 text-xs">(processing)</span>
                  )}
                </span>
              </div>
            </div>
          )
        })
      )}
      {documents.length > itemsPerPage && (
        <div className="flex justify-between mt-2 px-3">
          <button
            onClick={() => setPage(prev => Math.max(prev - 1, 0))}
            disabled={page === 0}
            className="xxs px-3 py-1 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(prev => (prev + 1) * itemsPerPage < documents.length ? prev + 1 : prev)}
            disabled={(page + 1) * itemsPerPage >= documents.length}
            className="xxs px-3 py-1 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )

  /* ========================
            Render
  ============================= */
  return (
    <div className="border-t border-gray-200 bg-white p-4 relative">
      {/* Patient Selection Panel */}
      {showPatientPanel && (
        <div className="absolute bottom-full left-0 w-full max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-t-md shadow-md">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-sm font-medium">Select Patient</h3>
            <button onClick={() => setShowPatientPanel(false)} className="text-gray-400 hover:text-gray-600">
              <XIcon size={16} />
            </button>
          </div>
          {patients.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {facilityId ? 'Loading patients...' : 'Select a facility to view patients'}
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {patients.map((patient: any) => (
                <li
                  key={patient.casefile_id}
                  className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                  onClick={() => selectPatient(patient)}
                >
                  <div>
                    <p className="text-sm font-medium">
                      {patient.first_name} {patient.last_name}
                    </p>
                    <p className="text-xs text-gray-500">MR# {patient.mr_number}</p>
                  </div>
                  {currentPatient?.casefile_id === patient.casefile_id && <CheckIcon size={16} className="text-green-500" />}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* File Attachment Panel */}
      {showAttachFilesPanel && (
        <div className="absolute bottom-full left-0 w-full max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-t-md shadow-md">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-sm font-medium">Attach Files</h3>
            <button onClick={() => setShowAttachFilesPanel(false)} className="text-gray-400 hover:text-gray-600">
              <XIcon size={16} />
            </button>
          </div>
          <div className="p-4">
            <label className="block w-full py-2 px-3 text-center border border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
              <span className="text-sm text-gray-600">Select a file</span>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.txt,.csv,.xlsx,.docx,.png,.jpg,.jpeg"
              />
            </label>
          </div>
          {/* Optional: render DocumentList if you need a dropdown of documents */}

          {/* Attachment Preview */}
          {transientFileQueue.length > 0 && (
            <ul className="divide-y divide-gray-200 mt-2">
              {transientFileQueue.map((file: any, index: number) => (
                <li key={file.document_id || `file-${index}-${file.fileName || file.name}`} className="p-3 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <PaperclipIcon size={14} className="text-gray-400" />
                    <p className="text-sm truncate max-w-[200px]">{file.fileName || file.name}</p>
                  </div>
                  <button onClick={() => removeFile(index)} className="text-gray-400 hover:text-red-500">
                    <XIcon size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Document List Panel */}
      {showDocumentListPanel && (
        <div className="absolute bottom-full left-0 w-full max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-t-md shadow-md">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-sm font-medium">Select Documents</h3>
            <button onClick={() => setShowDocumentListPanel(false)} className="text-gray-400 hover:text-gray-600">
              <XIcon size={16} />
            </button>
          </div>
          <DocumentList />
        </div>
      )}

      {/* Current Patient Badge */}
      {currentPatient && (
        <div className="mb-2 flex items-center">
          <div
            className={cn(
              'inline-flex items-center text-xs rounded-full px-2.5 py-1 mr-2',
              isPatientContextEnabled
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-gray-100 text-gray-800 border border-gray-300'
            )}
          >
            <span>
              {currentPatient.first_name} {currentPatient.last_name}
            </span>
            <button onClick={togglePatientContext} className="ml-1.5 focus:outline-none" title={isPatientContextEnabled ? 'Disable patient context' : 'Enable patient context'}>
              <div
                className={cn(
                  'w-3.5 h-3.5 rounded-full flex items-center justify-center',
                  isPatientContextEnabled ? 'bg-blue-500' : 'bg-gray-300'
                )}
              >
                {isPatientContextEnabled && <CheckIcon size={10} className="text-white" />}
              </div>
            </button>
          </div>
        </div>
      )}
      {/* Input Area */}
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        <div className="flex-1 border border-gray-300 rounded-md overflow-hidden shadow-sm focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="block w-full resize-none border-0 py-2 px-3 focus:outline-none focus:ring-0 text-sm"
            rows={1}
            disabled={isSubmitting}
          />
          <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <div className="flex space-x-1">
              {/* File Attachment Button */}
              <button onClick={toggleAttachFilesPanel} className={cn('p-1.5 rounded-md hover:bg-gray-200 focus:outline-none', showAttachFilesPanel ? 'bg-gray-200 text-blue-600' : 'text-gray-500')} title="Attach files">
                <PaperclipIcon size={16} />
              </button>
              {/* Patient Selection Button */}
              {facilityId && (
                <button onClick={togglePatientPanel} className={cn('p-1.5 rounded-md hover:bg-gray-200 focus:outline-none', showPatientPanel ? 'bg-gray-200 text-blue-600' : 'text-gray-500')} title="Select patient">
                  <UserPlusIcon size={16} />
                </button>
              )}
              {/* Document List Button */}
              <button onClick={toggleDocumentListPanel} className={cn('p-1.5 rounded-md hover:bg-gray-200 focus:outline-none', showDocumentListPanel ? 'bg-gray-200 text-blue-600' : 'text-gray-500')} title="Browse documents">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-files">
                  <path d="M15.5 2H8.6c-.4 0-.8.2-1.1.5-.3.3-.5.7-.5 1.1v12.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h9.8c.4 0 .8-.2 1.1-.5.3-.3.5-.7.5-1.1V6.5L15.5 2z" />
                  <path d="M3 7.6v12.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h9.8" />
                  <path d="M15 2v5h5" />
                </svg>
              </button>
            </div>
            <div className="text-xs text-gray-400">
              {message.length > 0 ? `${message.length} characters` : 'Press Enter to send'}
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={isSubmitting || (!message.trim() && transientFileQueue.length === 0)}
          className={cn(
            'p-2.5 rounded-md bg-blue-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2',
            isSubmitting || (!message.trim() && transientFileQueue.length === 0)
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-blue-700'
          )}
        >
          <TextQuoteIcon size={18} />
        </button>
      </form>
    </div>
  )
}