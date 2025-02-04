'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Bot, CheckCircle2, Loader2, MessageSquare } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'

interface RunStatusProps {
  isStreaming?: boolean
  error?: string
  assistantId?: string
  threadId?: string
  className?: string
}

export function RunStatus({ isStreaming, error, assistantId, threadId, className }: RunStatusProps) {
  const [assistantName, setAssistantName] = useState<string | null>(null)

  useEffect(() => {
    if (!assistantId) return

    const fetchAssistantName = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('user_assistants')
        .select('name')
        .eq('assistant_id', assistantId)
        .single()

      if (!error && data) {
        setAssistantName(data.name)
      }
    }

    fetchAssistantName()
  }, [assistantId])

  return (
    <div className={cn("grid grid-cols-3 gap-4 w-full", className)}>
      {/* Assistant Info */}
      <Alert className="flex items-center space-x-2">
        <Bot className="h-4 w-4" />
        <AlertDescription className="flex-1 truncate">
          {assistantId ? (
            <span className="font-mono text-xs" title={assistantId}>
              {assistantName || 'Loading...'} ({assistantId.slice(0, 8)}...)
            </span>
          ) : (
            <span className="text-muted-foreground">No Assistant</span>
          )}
        </AlertDescription>
      </Alert>

      {/* Thread Info */}
      <Alert className="flex items-center space-x-2">
        <MessageSquare className="h-4 w-4" />
        <AlertDescription className="flex-1 truncate">
          {threadId ? (
            <span className="font-mono text-xs" title={threadId}>
              Thread: {threadId.slice(0, 8)}...
            </span>
          ) : (
            <span className="text-muted-foreground">No Thread</span>
          )}
        </AlertDescription>
      </Alert>

      {/* Status Info */}
      {error ? (
        <Alert variant="destructive" className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex-1 truncate">
            {error}
          </AlertDescription>
        </Alert>
      ) : isStreaming ? (
        <Alert className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>Processing...</AlertDescription>
        </Alert>
      ) : (
        <Alert className="flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>Ready</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
