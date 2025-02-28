'use client'

import { useMemo } from 'react'
import { chatStore } from '@/store/chatStore'
import { XCircleIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { RunStatusResponse } from '@/types/store/chat'

interface RunStatusIndicatorProps {
  onCancel?: () => void
}

export default function RunStatusIndicator({ onCancel }: RunStatusIndicatorProps) {
  const { activeRunStatus, currentThread } = chatStore()

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

  return (
    <div className={`${runInfo.statusClass} rounded-lg p-3 mb-3 flex items-center justify-between`}>
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
  )
}
