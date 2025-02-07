'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'
import type { RunStatusProps } from '@/types'

export function RunStatus({ 
  isStreaming, 
  error, 
  assistantId, 
  threadId,
  className 
}: RunStatusProps) {
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
    <div className={cn("flex items-center gap-2", className)}>
      {error ? (
        <>
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive">{error}</span>
        </>
      ) : isStreaming ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {assistantName ? `${assistantName} is thinking...` : 'Processing...'}
          </span>
        </>
      ) : (
        <>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground/50" />
          <span className="text-sm text-muted-foreground/50">
            {assistantName ? `${assistantName} is ready` : 'Ready'}
          </span>
        </>
      )}
    </div>
  )
}
