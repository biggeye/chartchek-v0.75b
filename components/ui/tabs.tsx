"use client"

import * as React from 'react'
import { useState, createContext, useContext } from 'react'
import { cn } from "@/lib/utils"

// Interface definitions
interface TabsProps {
  defaultValue?: string
  value?: string
  onChange?: (value: string) => void
  className?: string
  children: React.ReactNode
}

interface TabsListProps {
  className?: string
  children: React.ReactNode
}

interface TabsTriggerProps {
  value: string
  disabled?: boolean
  className?: string
  children: React.ReactNode
  asChild?: boolean
}

interface TabsContentProps {
  value?: string
  className?: string
  children: React.ReactNode
}

interface TabsPanelProps {
  value: string
  className?: string
  children: React.ReactNode
}

// Create context for tab state
interface TabsContextType {
  value: string
  onChange: (value: string) => void
}

const TabsContext = createContext<TabsContextType>({
  value: '',
  onChange: () => {},
})

// Hook to use tabs context
const useTabsContext = () => useContext(TabsContext)

export function Tabs({
  defaultValue,
  value,
  onChange,
  className,
  children,
  ...props
}: TabsProps) {
  const [tabValue, setTabValue] = useState(value || defaultValue || '')
  
  const handleValueChange = (newValue: string) => {
    setTabValue(newValue)
    onChange?.(newValue)
  }

  return (
    <TabsContext.Provider 
      value={{
        value: value !== undefined ? value : tabValue,
        onChange: handleValueChange,
      }}
    >
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export function TabsList({
  className,
  children,
  ...props
}: TabsListProps) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
      role="tablist"
      {...props}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({
  value,
  disabled,
  className,
  children,
  asChild,
  ...props
}: TabsTriggerProps) {
  const { value: selectedValue, onChange } = useTabsContext()
  const isSelected = selectedValue === value
  
  const handleClick = () => {
    if (!disabled) {
      onChange(value)
    }
  }
  
  // Handle the asChild prop for Link compatibility
  const Component = asChild ? 'span' : 'button'
  
  return (
    <Component
      role="tab"
      aria-selected={isSelected}
      data-state={isSelected ? "active" : "inactive"}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isSelected
          ? "bg-background text-foreground shadow-sm"
          : "hover:bg-background/50 hover:text-foreground",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Component>
  )
}

export function TabsContent({
  value,
  className,
  children,
  ...props
}: TabsContentProps) {
  const { value: selectedValue } = useTabsContext()
  const isSelected = selectedValue === value
  
  if (!isSelected) return null
  
  return (
    <div
      role="tabpanel"
      data-state={isSelected ? "active" : "inactive"}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}


export function TabsPanel({
  value,
  className,
  children,
  ...props
}: TabsPanelProps) {
  const { value: selectedValue } = useTabsContext()
  const isSelected = selectedValue === value
  
  if (!isSelected) return null
  
  return (
    <div
      data-state={isSelected ? "active" : "inactive"}
      className={cn(className)}
      {...props}
    >
      {children}
    </div>
  )
}
