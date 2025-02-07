'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from '@/components/ui/alert'
import { assistantRoster } from '@/lib/assistants/roster'
import { createClient } from '@/utils/supabase/client'
import type { Assistant, NewThreadButtonProps } from '@/types'

interface Notification {
  message: string
  variant: 'default' | 'destructive'
}

export function NewThreadButton({ onNewThread, className }: NewThreadButtonProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [notification, setNotification] = useState<Notification | null>(null)

  const showNotification = (message: string, variant: Notification['variant'] = 'default') => {
    setNotification({ message, variant })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleAssistantSelection = async (assistant: typeof assistantRoster[0]) => {
    if (isCreating) return
    setIsCreating(true)

    try {
      const formData = new FormData()
      formData.append('name', assistant.name)
      formData.append('instructions', assistant.instructions)
      formData.append('tools', JSON.stringify(assistant.tools))
      formData.append('model', assistant.model)

      const response = await fetch('/api/assistant/create', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create assistant')
      }

      if (!data.assistant?.id) {
        throw new Error('Invalid response from server')
      }

      onNewThread(data.assistant.id)
      showNotification(`Created new assistant: ${data.assistant.name}`)
    } catch (error) {
      console.error('[NewThreadButton] Error:', error)
      showNotification(
        error instanceof Error ? error.message : 'Failed to create assistant',
        'destructive'
      )
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className={cn('relative', className)}>
      {notification && (
        <div className="absolute bottom-full mb-2 w-64 right-0 z-50">
          <Alert variant={notification.variant}>
            <AlertDescription>{notification.message}</AlertDescription>
          </Alert>
        </div>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            disabled={isCreating}
            className={cn('w-8 h-8 shrink-0', {
              'opacity-50 cursor-not-allowed': isCreating
            })}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {assistantRoster.map((assistant) => (
            <DropdownMenuItem
              key={assistant.key}
              onClick={() => handleAssistantSelection(assistant)}
              disabled={isCreating}
            >
              {assistant.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
