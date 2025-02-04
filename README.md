# chartChek: AI-Powered Compliance Assistant for Behavioral Health Facilities
### **v0.75b**

Welcome to **chartChek**, an advanced compliance assistant designed to streamline regulatory compliance for mental health and substance-abuse recovery centers. Built with NextJS 15 and OpenAI's Assistants API, chartChek provides instant, accurate, and actionable insights tailored to each facility's unique requirements.

## Tech Stack

- **Frontend**: Next.js 15 with App Router
- **Authentication**: Supabase Auth
- **Database**: Supabase Postgresql 
- **State Management**: Zustand
- **AI**: OpenAI Assistants API / DeepSeek API
- **Deployment**: Vercel

## Purpose

The primary goal of this project is to serve as a **Joint Commission/DHCS compliance assistant**, equipping behavioral health facilities with an intelligent chatbot to assist in navigating regulatory standards, tracking compliance, and managing documentation. Each instance of chartChek can be customized with facility-specific information.

## Key Features

### **AI-Powered Assistance**
- Leverages OpenAI's Assistants API for intelligent, context-aware responses
- Maintains conversation history through Assistant threads
- Supports file attachments and citations in responses

### **Document Management**
- Processes and stores facility documents securely
- Enables document search and citation in conversations
- Supports multiple file formats including PDFs

### **Regulatory Knowledge Base**
- Pre-loaded with Joint Commission and DHCS standards
- Context-aware responses using vector similarity search
- File citations to track information sources

### **Multi-User Support**
- Secure authentication and authorization
- Facility-specific customization
- Isolated data storage per facility

### **Real-time Updates**
- Message streaming & tool status
- Progress tracking for document processing
- Instant response notifications

## Architecture Overview

### OpenAI Assistants Integration
- Utilizes Assistants API for maintaining conversation context
- Implements thread management for persistent conversations
- Supports file attachments and tool calls




### State Management (Zustand)

```typescript
interface AssistantStore {
  // Current state
  currentAssistant: Assistant | null
  currentThread: Thread | null
  messages: Message[]
  runs: Run[]
  
  // Async actions
  createAssistant: (data: CreateAssistantParams) => Promise<void>
  createThread: (data: CreateThreadParams) => Promise<void>
  sendMessage: (content: string, fileIds?: string[]) => Promise<void>
  startRun: (params: RunParams) => Promise<void>
  pollRunStatus: (threadId: string, runId: string) => Promise<void>
  
  // UI state
  isLoading: boolean
  error: Error | null
}
```

## Usage Flow

1. User selects or creates an Assistant
2. System creates a new Thread or loads existing
3. User sends messages with optional files
4. System creates a Run and starts polling status
5. Messages are displayed as they are created
6. File citations and annotations are rendered
7. Required actions are prompted when needed

## Key Features

- Real-time updates using polling
- Proper error handling and retry logic
- File upload progress and validation
- Message rendering with citations
- Tool execution status tracking
- Thread history and management
- Assistant configuration
- User authentication integration

## Security Considerations

- All API routes require authentication
- File uploads are validated and scanned
- Thread ownership is verified
- API keys are properly secured
- Rate limiting is implemented
- File size and type restrictions
