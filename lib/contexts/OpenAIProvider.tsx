// contexts/OpenAIContext.tsx
'use client'

import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import OpenAI from 'openai'

type OpenAIContextType = {
  openai: OpenAI | null
  isLoading: boolean
  error: Error | null
}

const OpenAIContext = createContext<OpenAIContextType>({
  openai: null,
  isLoading: true,
  error: null
})

export function OpenAIProvider({ children }: { children: ReactNode }) {
  const [openai, setOpenAI] = useState<OpenAI | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    const initOpenAI = async () => {
      try {
        // Only initialize in browser environment
        if (typeof window !== 'undefined') {
          const openaiClient = new OpenAI({
            apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
            dangerouslyAllowBrowser: true
          })
          setOpenAI(openaiClient)
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize OpenAI client'))
      } finally {
        setIsLoading(false)
      }
    }
    
    initOpenAI()
  }, [])
  
  return (
    <OpenAIContext.Provider value={{ openai, isLoading, error }}>
      {children}
    </OpenAIContext.Provider>
  )
}

export const useOpenAI = () => useContext(OpenAIContext)