flowchart TD
  %% Node Definitions
  Client["Client Browser"]
  StreamStore["store/streamStore.ts"]
  APIRoute["API Route: /api/threads/{threadId}/run/stream"]
  OpenAI["OpenAI API"]
  ToolHandlers["toolHandlers.ts"]
  Database["Supabase Database"]
  UI["Update UI Based on Tool Call"]
  PDFGen["PDF Generation Endpoint"]
  DocumentStore["Document Store (Zustand)"]
  ToolDefinitions["toolDefinitions.ts"]
  
  %% Flow Steps
  Client -->|"startStream(threadId, assistantId)"| StreamStore
  StreamStore -->|"POST Stream Request"| APIRoute
  APIRoute -->|"Create Streaming Run"| OpenAI
  
  %% SSE Streaming
  OpenAI -.->|"SSE Stream"| APIRoute
  APIRoute -.->|"Forward SSE Events"| StreamStore
  
  %% Decision: Requires Action?
  OpenAI -.->|"thread.run.requires_action event"| APIRoute
  
  %% Handling Tool Calls (Server Side)
  APIRoute -->|"handleToolCalls(toolCalls, threadId, runId)"| ToolHandlers
  ToolHandlers -->|"getToolDefinitions()"| ToolDefinitions
  ToolHandlers -->|"Store Assessment Data"| Database
  ToolHandlers -->|"submitToolOutputs(outputs, threadId, runId)"| OpenAI
  
  %% Forward requires_action event to Client
  APIRoute -.->|"Forward requires_action event"| StreamStore
  
  %% Client-side Handling of Tool Calls
  StreamStore -->|"processStreamEvent('requires_action')"| StreamStore
  StreamStore -->|"handleToolCall(toolCall)"| StreamStore
  
  %% Client-side Decision: Type of Tool Call
  StreamStore -->|"If BioPsychSocialAssessmentForm"| PDFGen
  
  %% PDF Generation & Document Upload
  PDFGen -->|"Generate PDF"| DocumentStore
  
  %% Final UI Updates
  StreamStore -->|"setPdfPreviewUrl(url)"| UI
  DocumentStore -->|"uploadDocument(file)"| Database
  
  %% Error Handling Paths
  StreamStore -.->|"handleStreamError(error)"| UI
  ToolHandlers -.->|"Error Handling"| OpenAI
  
  %% Completion Path
  OpenAI -.->|"thread.run.completed event"| APIRoute
  APIRoute -.->|"Forward completion"| StreamStore
  StreamStore -->|"finalizeMessage()"| UI
  
  %% Nodes Styling
  classDef client fill:#c9daf8,stroke:#6c8ebf,stroke-width:2px
  classDef server fill:#f4cccc,stroke:#d79b9b,stroke-width:2px
  classDef external fill:#d9ead3,stroke:#93c47d,stroke-width:2px
  classDef db fill:#fff2cc,stroke:#f1c232,stroke-width:2px
  classDef ui fill:#ead1dc,stroke:#c27ba0,stroke-width:2px
  
  class Client,StreamStore,UI client
  class APIRoute,ToolHandlers,ToolDefinitions server
  class OpenAI external
  class Database db
  class DocumentStore,PDFGen ui

%% Notes on the Flow
%% 1. The flow begins with the client initiating a stream through streamStore.ts
%% 2. Server-side and client-side processing occur in parallel for tool calls
%% 3. Tool outputs are submitted back to OpenAI to continue the run
%% 4. PDF generation happens on both server (storage) and client (preview)
