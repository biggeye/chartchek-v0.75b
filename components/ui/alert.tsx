import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface AlertProps {
  variant?: 'default' | 'destructive'
  className?: string
  children: ReactNode
}

export function Alert({
  variant = 'default',
  className,
  children,
}: AlertProps) {
  return (
    <div
      className={cn(
        'relative w-full rounded-lg border p-4',
        variant === 'default' && 'bg-background text-foreground',
        variant === 'destructive' && 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
        className
      )}
    >
      {children}
    </div>
  )
}

export function AlertDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      className={cn('text-sm [&_p]:leading-relaxed', className)}
      {...props}
    />
  )
}