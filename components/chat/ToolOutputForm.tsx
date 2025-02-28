'use client'

import { useState, useEffect } from 'react'
import { useChatStore } from '@/store/chatStore'
import { useStreamingStore } from '@/store/streamingStore'
import { ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface ToolOutputFormProps {
  onSubmitSuccess?: () => void
  onCancel?: () => void
}

export default function ToolOutputForm({ onSubmitSuccess, onCancel }: ToolOutputFormProps) {
  const { activeRunStatus, currentThread, checkActiveRun } = useChatStore()
  const { submitToolOutputs } = useStreamingStore()
  const [toolOutputValues, setToolOutputValues] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Log when the component renders to help debug
  console.log('[ToolOutputForm] Rendering with activeRunStatus:', {
    isActive: activeRunStatus?.isActive,
    status: activeRunStatus?.status,
    requiresAction: activeRunStatus?.requiresAction,
    toolCallsCount: activeRunStatus?.requiredAction?.toolCalls?.length,
    toolCalls: activeRunStatus?.requiredAction?.toolCalls
  })

  // If a thread is available but no tool calls are visible, try to refresh the run status
  useEffect(() => {
    if (currentThread?.thread_id && 
        (!activeRunStatus?.requiredAction?.toolCalls || 
         activeRunStatus.requiredAction.toolCalls.length === 0)) {
      console.log('[ToolOutputForm] No tool calls found, refreshing run status')
      checkActiveRun(currentThread.thread_id)
    }
  }, [currentThread, activeRunStatus, checkActiveRun])

  // If there's no active run or the run doesn't require action, don't render
  if (!activeRunStatus || !activeRunStatus.requiresAction) {
    console.log('[ToolOutputForm] Not rendering, no active run or run does not require action')
    return null
  }

  // Get tool calls, handling different possible structures in the API response
  let toolCalls = activeRunStatus.requiredAction?.toolCalls || []
  
  // If no toolCalls but we have a required action, this might be structured differently
  if (toolCalls.length === 0 && activeRunStatus.requiresAction) {
    console.log('[ToolOutputForm] No tool calls found in expected structure, but run requires action.')
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-medium mb-2">The assistant needs additional information</h3>
        <p className="text-sm mb-4">
          This run requires action, but the tool call information is not available in the expected format.
          Please refresh the page or try restarting the conversation.
        </p>
        <button
          onClick={() => {
            if (currentThread?.thread_id) {
              checkActiveRun(currentThread.thread_id)
            }
          }}
          className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Refresh Status
        </button>
      </div>
    )
  }
  
  console.log('[ToolOutputForm] Will render form with tool calls:', toolCalls)

  const handleValueChange = (toolCallId: string, value: string) => {
    setToolOutputValues(prev => ({
      ...prev,
      [toolCallId]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentThread?.thread_id || !activeRunStatus?.status) {
      setError('Missing thread or run information')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      
      // Get the latest run information to ensure we have the current run ID
      const runStatus = await checkActiveRun(currentThread.thread_id)
      
      if (!runStatus.requiresAction || !runStatus.requiredAction?.toolCalls?.length) {
        setError('No tool calls requiring output found')
        setIsSubmitting(false)
        return
      }

      // Extract the latest run ID
      const runId = runStatus.runId
      if (!runId) {
        setError('Missing run ID')
        setIsSubmitting(false)
        return
      }

      // Format tool outputs for submission
      const toolOutputs = Object.entries(toolOutputValues).map(([toolCallId, output]) => ({
        tool_call_id: toolCallId,
        output
      }))

      if (!toolOutputs.length) {
        setError('No tool outputs provided')
        setIsSubmitting(false)
        return
      }

      // Submit the tool outputs
      const success = await submitToolOutputs(
        currentThread.thread_id,
        runId,
        toolOutputs
      )

      if (success) {
        setSuccess(true)
        if (onSubmitSuccess) {
          onSubmitSuccess()
        }
      } else {
        setError('Failed to submit tool outputs')
      }
    } catch (err: any) {
      console.error('[ToolOutputForm] Error submitting tool outputs:', err)
      setError(err.message || 'An error occurred while submitting tool outputs')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <h3 className="text-sm font-medium mb-2">The assistant needs additional information:</h3>
      
      <form onSubmit={handleSubmit}>
        {toolCalls.map((toolCall: any) => {
          const toolCallId = toolCall.id
          const functionName = toolCall.function?.name || 'Unknown function'
          
          // Try to parse arguments to show a more descriptive prompt
          let prompt = 'Please provide information:'
          try {
            if (toolCall.function?.arguments) {
              const args = JSON.parse(toolCall.function.arguments)
              if (args.prompt) {
                prompt = args.prompt
              }
            }
          } catch (e) {
            // If parsing fails, use the default prompt
          }
          
          return (
            <div key={toolCallId} className="mb-3">
              <label className="block text-sm font-medium mb-1">
                {functionName}: {prompt}
              </label>
              <textarea
                className="w-full p-2 border rounded-md"
                rows={3}
                value={toolOutputValues[toolCallId] || ''}
                onChange={(e) => handleValueChange(toolCallId, e.target.value)}
                placeholder="Enter your response..."
                disabled={isSubmitting || success}
              />
            </div>
          )
        })}
        
        {error && (
          <div className="text-red-600 text-sm mb-2">
            {error}
          </div>
        )}
        
        <div className="flex justify-end space-x-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isSubmitting || success}
            >
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary/90 flex items-center gap-1"
            disabled={isSubmitting || success}
          >
            {isSubmitting ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : success ? (
              <>
                <CheckCircleIcon className="w-4 h-4" />
                Submitted
              </>
            ) : (
              'Submit'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
