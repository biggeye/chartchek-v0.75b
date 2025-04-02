"use client"

import { useState, useEffect } from "react"

export const PROGRESS_STEPS = [
  "INITIALIZING REQUEST...",
  "PULLING PATIENT RECORDS...",
  "SANITIZING PATIENT DATA...",
  "ANALYZING MEDICAL CONTEXT...",
  "RETRIEVING COMPLIANCE GUIDELINES...",
  "APPLYING REGULATORY FRAMEWORK...",
  "GENERATING RESPONSE...",
  "FINALIZING ANALYSIS...",
]

export default function ProgressIndicator() {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // Simulate progress through the steps
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < PROGRESS_STEPS.length - 1) {
          return prev + 1
        }
        return prev
      })
    }, 1200)

    return () => {
      clearInterval(interval)
    }
  }, [])

  return <div className="font-sans text-emerald-700 font-medium tracking-tight">{PROGRESS_STEPS[currentStep]}</div>
}

