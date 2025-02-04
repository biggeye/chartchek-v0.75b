'use client'

import { Button } from '@/components/ui/button'

interface SubmitButtonProps {
  message: string
  isLoading: boolean
}

export function SubmitButton({ message, isLoading }: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={isLoading || !message.trim()}
      className="shrink-0"
    >
      Send
    </Button>
  )
}