import { generateText, streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { anthropic } from "@ai-sdk/anthropic"
import type { Patient, PatientRecord, Document, QueueItem } from "@/types/store/chat/globalChat"

// LLM Models
export type LLMProvider = "openai" | "anthropic" | "gemini" | "assistants"
export type LLMModel =
  | "gpt-4o"
  | "gpt-4-turbo"
  | "gpt-3.5-turbo"
  | "claude-3-opus"
  | "claude-3-sonnet"
  | "claude-3-haiku"
  | "tjc"

export interface LLMOption {
  id: string
  provider: LLMProvider
  model: LLMModel
  name: string
  description: string
  maxTokens: number
  costPer1KTokens: string
}

export const LLM_OPTIONS: LLMOption[] = [
  {
    id: "gpt-4o",
    provider: "openai",
    model: "gpt-4o",
    name: "GPT-4o",
    description: "Most capable OpenAI model with vision",
    maxTokens: 128000,
    costPer1KTokens: "$0.0100",
  },
  {
    id: "gpt-4-turbo",
    provider: "openai",
    model: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    description: "Powerful model with knowledge up to Apr 2023",
    maxTokens: 128000,
    costPer1KTokens: "$0.0100",
  },
  {
    id: "gpt-3.5-turbo",
    provider: "openai",
    model: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    description: "Fast and cost-effective model",
    maxTokens: 16000,
    costPer1KTokens: "$0.0015",
  },
  {
    id: "claude-3-opus",
    provider: "anthropic",
    model: "claude-3-opus",
    name: "Claude 3 Opus",
    description: "Most powerful Claude model for complex tasks",
    maxTokens: 200000,
    costPer1KTokens: "$0.0150",
  },
  {
    id: "claude-3-sonnet",
    provider: "anthropic",
    model: "claude-3-sonnet",
    name: "Claude 3 Sonnet",
    description: "Balanced performance and cost",
    maxTokens: 200000,
    costPer1KTokens: "$0.0030",
  },
  {
    id: "claude-3-haiku",
    provider: "anthropic",
    model: "claude-3-haiku",
    name: "Claude 3 Haiku",
    description: "Fastest Claude model for quick responses",
    maxTokens: 200000,
    costPer1KTokens: "$0.0025",
  },
]

// Helper to get the AI SDK model instance
const getModelInstance = (option: LLMOption) => {
  switch (option.provider) {
    case "openai":
      return openai(option.model as any)
    case "anthropic":
      return anthropic(option.model as any)
    case "gemini":
      
    default:
      throw new Error(`Unsupported provider: ${option.provider}`)
  }
}

// Format patient data for LLM context
export const formatPatientContext = (patient: Patient, records: PatientRecord[]): string => {
  const patientInfo = `
Patient Information:
- Name: ${patient.firstName} ${patient.lastName}
- Date of Birth: ${patient.dateOfBirth}
- Medical Record Number: ${patient.mrn}
- Status: ${patient.status}
  `.trim()

  const recordsInfo =
    records.length > 0
      ? `\n\nPatient Records:\n${records
          .map((record) =>
            `
- Type: ${record.type}
- Date: ${record.date}
- Title: ${record.patientEvaluation?.name} | ${record.title}
- Provider: ${record.provider}
- Summary: ${record.patientEvaluation?.patientEvaluationItems} | ${record.summary}
    `.trim(),
          )
          .join("\n\n")}`
      : "\n\nNo patient records available."

  return patientInfo + recordsInfo
}

// Format document data for LLM context
export const formatDocumentContext = (documents: Document[]): string => {
  if (documents.length === 0) return "No documents provided."

  return `
Referenced Documents:
${documents
  .map((doc, index) =>
    `
${index + 1}. ${doc.name}
   - Type: ${doc.type}
   - Category: ${doc.category}
   - Created: ${doc.dateCreated}
   - Size: ${(doc.size / 1024).toFixed(1)} KB
`.trim(),
  )
  .join("\n")}
  `.trim()
}

// Process queue items to create context for LLM
export const processQueueForLLM = (queueItems: QueueItem[]): string => {
  const patients: Patient[] = []
  const records: PatientRecord[] = []
  const documents: Document[] = []

  queueItems.forEach((item) => {
    if (item.type === "patient") {
      if ("mrn" in item.data) {
        // It's a patient
        patients.push(item.data as Patient)
      } else if ("patientId" in item.data) {
        // It's a patient record
        records.push(item.data as PatientRecord)
      }
    } else if (item.type === "document") {
      documents.push(item.data as Document)
    }
  })

  let context = ""

  // Add patient information
  if (patients.length > 0) {
    patients.forEach((patient) => {
      const patientRecords = records.filter((r) => r.patientId === patient.patientId)
      context += formatPatientContext(patient, patientRecords) + "\n\n"
    })
  } else if (records.length > 0) {
    // If we have records but no patient, group by patientId
    const recordsByPatient = records.reduce(
      (acc, record) => {
        if (!acc[record.patientId]) {
          acc[record.patientId] = []
        }
        acc[record.patientId].push(record)
        return acc
      },
      {} as Record<string, PatientRecord[]>,
    )

    Object.values(recordsByPatient).forEach((patientRecords) => {
      context += `Patient Records (Patient ID: ${patientRecords[0].patientId}):\n`
      patientRecords.forEach((record) => {
        context +=
          `
- Type: ${record.type}
- Date: ${record.date}
- Title: ${record.title}
- Provider: ${record.provider}
- Summary: ${record.summary}
        `.trim() + "\n\n"
      })
    })
  }

  // Add document information
  if (documents.length > 0) {
    context += formatDocumentContext(documents)
  }

  return context.trim()
}

// LLM Service
export const llmService = {
  // Generate text completion
  generateCompletion: async (prompt: string, context: string, selectedModel: LLMOption): Promise<string> => {
    const model = getModelInstance(selectedModel)

    const systemPrompt = `
You are a medical assistant AI helping with patient information. 
Use the following context to inform your responses, but only reference information that is directly relevant to the query.
Do not make up information that is not in the provided context.

CONTEXT:
${context}
    `.trim()

    try {
      const { text } = await generateText({
        model,
        prompt,
        system: systemPrompt,
        maxTokens: 1000,
      })

      return text
    } catch (error) {
      console.error("Error generating completion:", error)
      throw new Error("Failed to generate response. Please try again.")
    }
  },

  // Stream text completion
  streamCompletion: async (
    prompt: string,
    context: string,
    selectedModel: LLMOption,
    onChunk: (chunk: string) => void,
    onFinish: (fullText: string) => void,
  ) => {
    const model = getModelInstance(selectedModel)

    const systemPrompt = `
You are a medical assistant AI helping with patient information. 
Use the following context to inform your responses, but only reference information that is directly relevant to the query.
Do not make up information that is not in the provided context.

CONTEXT:
${context}
    `.trim()

    try {
      const result = streamText({
        model,
        prompt,
        system: systemPrompt,
        maxTokens: 1000,
        onChunk: ({ chunk }) => {
          if (chunk.type === "text-delta") {
            onChunk(chunk.textDelta)  // Change from chunk.text to chunk.textDelta
          }
        },
      })

      result.text.then((fullText) => {
        onFinish(fullText)
      })

      return result
    } catch (error) {
      console.error("Error streaming completion:", error)
      throw new Error("Failed to generate response. Please try again.")
    }
  },

  // Process and analyze patient data
  analyzePatientData: async (
    patient: Patient,
    records: PatientRecord[],
    query: string,
    selectedModel: LLMOption,
  ): Promise<string> => {
    const context = formatPatientContext(patient, records)
    return llmService.generateCompletion(query, context, selectedModel)
  },

  // Process and analyze documents
  analyzeDocuments: async (documents: Document[], query: string, selectedModel: LLMOption): Promise<string> => {
    const context = formatDocumentContext(documents)
    return llmService.generateCompletion(query, context, selectedModel)
  },
}

export function functionCheck(messageContent: string) {

}

