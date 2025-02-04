'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from '@/components/ui/alert'
import { assistantRoster } from '@/lib/assistants/roster'
import { Assistant } from '@/types/types'
import { createClient } from '@/utils/supabase/client'

interface NewThreadButtonProps {
  onNewThread: (assistantId: string) => void
}

export function NewThreadButton({ onNewThread }: NewThreadButtonProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [notification, setNotification] = useState<{
    message: string;
    variant: 'default' | 'destructive';
  } | null>(null)

  const showNotification = (message: string, variant: 'default' | 'destructive' = 'default') => {
    setNotification({ message, variant })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleAssistantSelection = async (assistant: typeof assistantRoster[0]) => {
    if (isCreating) return
    setIsCreating(true)

    try {
      const supabase = createClient()
      
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('Authentication required')
      }

      // Check if assistant already exists for this user
      const { data: existingAssistant, error: queryError } = await supabase
        .from('user_assistants')
        .select('assistant_id, name')
        .eq('user_id', user.id)
        .eq('name', assistant.name)
        .single()

      if (queryError && queryError.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw queryError
      }

      if (existingAssistant) {
        // Use existing assistant
        showNotification(`Using existing assistant: ${assistant.name}`)
        onNewThread(existingAssistant.assistant_id)
        return
      }

      // Create new assistant if none exists
      const formData = new FormData()
      formData.append('name', assistant.name)
      formData.append('instructions', assistant.instructions)
      formData.append('model', assistant.model)
      
      if (assistant.tools) {
        formData.append('tools', JSON.stringify(assistant.tools))
      }

      const res = await fetch('/api/assistant/create', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const error = await res.text()
        throw new Error(error || 'Failed to create assistant')
      }

      const data = await res.json()
      if (!data.success || !data.assistant) {
        throw new Error('Invalid response from server')
      }

      const assistant_data = data.assistant as Assistant
      onNewThread(assistant_data.id)
      showNotification(`Created new assistant: ${assistant_data.name}`)
    } catch (error) {
      console.error('Error handling assistant selection:', error)
      showNotification(
        error instanceof Error ? error.message : 'Failed to handle assistant selection',
        'destructive'
      )
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="relative">
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
            className="h-8 w-8"
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
