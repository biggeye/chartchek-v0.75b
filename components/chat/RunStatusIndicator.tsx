'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { chatStore } from '@/store/chatStore'
import { XCircleIcon, ClockIcon, ArrowPathIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { RunStatusResponse } from '@/types/store/chat'

interface RunStatusIndicatorProps {
  onCancel?: () => void
}

export default function RunStatusIndicator({ onCancel }: RunStatusIndicatorProps) {
  const { activeRunStatus, currentThread } = chatStore()
  const [toolOutput, setToolOutput] = useState('')
  const [showInputField, setShowInputField] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Set up timer to show input field after delay
  useEffect(() => {
    // Clear any existing timer when status changes
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    // Only set timer if we're in requires_action state
    if (activeRunStatus?.status === 'requires_action' && activeRunStatus.requiresAction) {
      // Show input field after 5 seconds
      timerRef.current = setTimeout(() => {
        setShowInputField(true)
      }, 5000) // 5 seconds delay
    } else {
      // Reset when not in requires_action state
      setShowInputField(false)
    }

    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [activeRunStatus])

  // Get run information
  const runInfo = useMemo(() => {
    if (!activeRunStatus || !activeRunStatus.isActive) {
      return null
    }

    // Determine icon and message based on status
    let icon = <ClockIcon className="w-5 h-5" />
    let message = 'Processing...'
    let details = ''
    let actionText = 'Cancel'
    let statusClass = 'bg-secondary/50'

    if (activeRunStatus.status === 'requires_action' && activeRunStatus.requiresAction) {
      icon = <ArrowPathIcon className="w-5 h-5 animate-spin" />
      message = 'Waiting for tool outputs'
      statusClass = 'bg-yellow-50 border border-yellow-200'
      
      if (activeRunStatus.requiredAction?.toolCalls && activeRunStatus.requiredAction.toolCalls.length > 0) {
        const toolNames = activeRunStatus.requiredAction.toolCalls
          .map((call: any) => call.function?.name || 'unknown tool')
          .join(', ')
        
        details = `Tools: ${toolNames}`
      }
    } else if (activeRunStatus.status === 'in_progress') {
      icon = <ArrowPathIcon className="w-5 h-5 animate-spin" />
      message = 'The assistant is thinking...'
    } else if (activeRunStatus.status === 'queued') {
      icon = <ClockIcon className="w-5 h-5" />
      message = 'Your request is queued'
    }

    return { icon, message, details, actionText, statusClass }
  }, [activeRunStatus])

  // Always render if we have an active run status, even if current thread is not loaded
  if (!runInfo) {
    return null
  }

  // Handle submitting tool outputs
  const handleSubmitToolOutput = async () => {
    if (!currentThread?.thread_id || !activeRunStatus?.runId || !toolOutput.trim()) return;
    
    try {
      // Get the tool call ID from the active run status
      const toolCallId = activeRunStatus.requiredAction?.toolCalls?.[0]?.id;
      if (!toolCallId) return;
      
      // Create the tool output payload
   
      
      // Submit the tool outputs to the API
      const response = await fetch(`/api/openai/threads/${currentThread.thread_id}/run/${activeRunStatus.runId}/submit-tool-outputs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_outputs: toolOutput, stream: true })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit tool outputs');
      }
      console.log('Tool outputs submitted successfully')
      // Reset the tool output state
      setToolOutput('');
      setShowInputField(false);
    } catch (error) {
      console.error('Error submitting tool outputs:', error);
    }
  };

  return (
    <div className={`${runInfo.statusClass} rounded-lg p-3 mb-3 shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="text-primary">{runInfo.icon}</div>
          <div>
            <p className="text-sm font-medium">{runInfo.message}</p>
            {runInfo.details && <p className="text-xs text-muted-foreground">{runInfo.details}</p>}
          </div>
        </div>
        
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex items-center gap-1 text-xs bg-white/80 text-red-600 px-3 py-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all"
            aria-label="Cancel run"
          >
            <XCircleIcon className="w-4 h-4" />
            {runInfo.actionText}
          </button>
        )}
      </div>
      
      {/* Conditionally render text area for tool outputs after delay */}
      {activeRunStatus && 
       activeRunStatus.status === 'requires_action' && 
       activeRunStatus.requiresAction && 
       showInputField && (
        <div className="mt-2">
          <textarea
            value={toolOutput}
            onChange={(e) => setToolOutput(e.target.value)}
            placeholder="Enter your response to the assistant's request..."
            className="w-full p-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSubmitToolOutput}
              disabled={!toolOutput.trim()}
              className="flex items-center gap-1 text-xs bg-primary text-white px-3 py-1.5 rounded-md hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
