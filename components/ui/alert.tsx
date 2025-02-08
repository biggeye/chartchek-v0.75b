import { cn } from '@/lib/utils'
import { ReactNode } from 'react'
import { XCircleIcon } from '@heroicons/react/20/solid'

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
        'rounded-md bg-red-50 p-4',
        variant === 'destructive' && 'bg-red-100',
        className
      )}
    >
      <div className="flex">
        <div className="shrink-0">
          <XCircleIcon aria-hidden="true" className="w-5 h-5 text-red-400" />
        </div>
        <div className="ml-3">
          {children}
        </div>
      </div>
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