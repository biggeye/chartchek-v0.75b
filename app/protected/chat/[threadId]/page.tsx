'use client'

import { useEffect, useState } from 'react'
import React from 'react'
import { MessageList } from '@/components/chat/MessageList'
import { useChatStore } from '@/store/chatStore'
import { useStreamStore } from '@/store/streamStore'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import RunStatusIndicator from '@/components/chat/RunStatusIndicator'
import { ClockIcon, UserCircleIcon, FileTextIcon, InfoIcon } from 'lucide-react'
import { XCircleIcon } from '@heroicons/react/24/outline'
import { Skeleton, SkeletonText } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'


export default function ChatPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = React.use(params)
  const [isLoading, setIsLoading] = useState(true)
  const [localError, setLocalError] = useState<string | null>(null)
  const [hasPatientContext, setHasPatientContext] = useState(false)
  const [patientInfo, setPatientInfo] = useState<{ firstName: string; lastName: string; id: string } | null>(null)

  const { 
    currentThread, 
    fetchOpenAIMessages, 
    activeRunStatus,
    checkActiveRun
  } = useChatStore()
  
  const {
    currentStreamContent,
    isStreamingActive,
    streamError,
    cancelStream
  } = useStreamStore()

  // Extract patient context from the first message if available
  const extractPatientContext = (messages: any[]) => {
    if (!messages || messages.length === 0) return
    
    // Look for patient context in the first user message
    for (const message of messages) {
      if (message.role === 'user' && message.content) {
        let content = message.content
        
        // Handle different content formats
        if (Array.isArray(content)) {
          content = content.find(c => c.type === 'text')?.text?.value || ''
        } else if (typeof content === 'object' && content.text) {
          content = content.text.value || ''
        }
        
        // Check for patient context pattern
        const patientContextMatch = content.match(/\[Patient Context: ([^\(]+) \(ID: ([^\)]+)\)/)
        if (patientContextMatch) {
          const fullName = patientContextMatch[1].trim()
          const id = patientContextMatch[2].trim()
          const nameParts = fullName.split(' ')
          const firstName = nameParts[0] || ''
          const lastName = nameParts.slice(1).join(' ') || ''
          
          setPatientInfo({ firstName, lastName, id })
          setHasPatientContext(true)
          return
        }
      }
    }
  }

  // Fetch thread data
  useEffect(() => {
    const loadThread = async () => {
      try {
        setIsLoading(true)
        if (!threadId) return
        
        // Fetch messages for this thread
        await fetchOpenAIMessages(threadId)
        
        // Extract patient context if available
        if (currentThread?.messages) {
          extractPatientContext(currentThread.messages)
        }
        
        // Check if there's an active run
        await checkActiveRun(threadId)
      } catch (error) {
        console.error('[ChatPage] Error loading thread:', error)
        setLocalError(error instanceof Error ? error.message : String(error))
      } finally {
        setIsLoading(false)
      }
    }
    
    loadThread()
  }, [threadId, fetchOpenAIMessages, checkActiveRun, currentThread?.messages])

  const handleCancelRun = async () => {
    if (!threadId || !activeRunStatus?.isActive) {
      console.log('[ChatPage] No active run to cancel')
      return
    }
    
    try {
      // Cancel the stream
      cancelStream()
      console.log('[ChatPage] Successfully cancelled run')
      
      // Check active run status
      await checkActiveRun(threadId)
    } catch (error) {
      console.error('[ChatPage] Error cancelling run:', error)
      setLocalError(error instanceof Error ? error.message : String(error))
    }
  }

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'Unknown'
    return new Date(timestamp * 1000).toLocaleString()
  }

  return (
    <div className="container py-6">
      <div className="flex flex-col-reverse md:flex-row gap-6">
        {/* Main Chat Area */}
        <div className="w-full md:w-3/4">
          <Card className="h-full">
            <CardHeader className="px-6 py-4 border-b">
              <title className="text-xl flex items-center">
                <span>Thread {currentThread?.title || threadId.slice(0, 8)}</span>
                <RunStatusIndicator onCancel={handleCancelRun}  />
              </title>
            </CardHeader>
            <CardContent className="p-0 h-[calc(100vh-12rem)]">
              {(localError || streamError) && (
                <div
                  className="m-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md"
                  role="alert"
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <XCircleIcon className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm">{localError || streamError}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {isLoading ? (
                <div className="p-6 space-y-6">
                  <SkeletonText lines={2} className="w-3/4" animation="shimmer" />
                  <SkeletonText lines={4} className="w-full ml-auto bg-primary/10" animation="shimmer" />
                  <SkeletonText lines={3} className="w-4/5" animation="shimmer" />
                  <SkeletonText lines={2} className="w-2/3 ml-auto bg-primary/10" animation="shimmer" />
                </div>
              ) : (
                <MessageList
                  isAssistantLoading={isLoading && !isStreamingActive}
                  isStreamingActive={isStreamingActive}
                  streamingContent={currentStreamContent}
                />
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Thread Details Sidebar */}
        <div className="w-full md:w-1/4">
          <Card>
            <CardHeader className="px-4 py-3 border-b">
              <title className="text-lg">Thread Details</title>
            </CardHeader>
            <CardContent className="p-4 space-y-6">
              {/* Thread Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-1">
                  <InfoIcon className="h-4 w-4" />
                  Thread Information
                </h3>
                
                {isLoading ? (
                  <SkeletonText lines={3} animation="shimmer" />
                ) : (
                  <div className="text-sm space-y-1">
                    <p className="text-muted-foreground flex justify-between">
                      <span>Created:</span> 
                      <span>{currentThread?.created_at} | 'Unknown'</span>
                    </p>
                  
                    <p className="text-muted-foreground flex justify-between">
                      <span>Message Count:</span>
                      <span>{currentThread?.messages?.length || 0}</span>
                    </p>
                  </div>
                )}
              </div>
              
              {/* Run Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" />
                  Run Status
                </h3>
                
                {isLoading ? (
                  <SkeletonText lines={2} animation="shimmer" />
                ) : (
                  <div className="text-sm space-y-1">
                    <p className="text-muted-foreground flex justify-between">
                      <span>Status:</span>
                      <span className={cn(
                        activeRunStatus?.isActive ? "text-orange-500 font-medium" : "text-green-500 font-medium"
                      )}>
                        {activeRunStatus?.isActive ? 'In Progress' : 'Completed'}
                      </span>
                    </p>
                    {activeRunStatus?.isActive && (
                      <button
                        onClick={handleCancelRun}
                        className="mt-2 text-xs w-full bg-red-50 hover:bg-red-100 text-red-700 py-1 px-2 rounded"
                      >
                        Cancel Run
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {/* Attached Files */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-1">
                  <FileTextIcon className="h-4 w-4" />
                  Attached Files
                </h3>
                
                {isLoading ? (
                  <SkeletonText lines={2} animation="shimmer" /> 
                ) : (
                  <div className="text-sm">
                    {currentThread?.current_files && currentThread.current_files.length > 0 ? (
                      <ul className="space-y-1 list-disc list-inside pl-1">
                        {currentThread.current_files.map((file: any, index: number) => (
                          <li key={index} className="text-muted-foreground truncate">
                            {file.file_name || file.file_id || `File ${index + 1}`}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">No files attached</p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Patient Context */}
              {(isLoading || hasPatientContext) && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-1">
                    <UserCircleIcon className="h-4 w-4" />
                    Patient Context
                  </h3>
                  
                  {isLoading ? (
                    <Skeleton height={60} className="rounded-md bg-blue-50" animation="shimmer" />
                  ) : hasPatientContext && patientInfo ? (
                    <div className="text-sm bg-blue-50 p-3 rounded-md">
                      <p className="font-medium text-blue-800">
                        {patientInfo.firstName} {patientInfo.lastName}
                      </p>
                      <p className="text-blue-700 text-xs mt-1">
                        ID: {patientInfo.id}
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
