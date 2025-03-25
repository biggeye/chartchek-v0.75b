# Stream Store (Zustand) Specification

This document outlines the implementation and functionality of the `streamStore`, which is responsible for handling Server-Sent Events (SSE) streaming, processing OpenAI responses, tool call handling, and various UI states related to streaming. The store is built using [Zustand](https://github.com/pmndrs/zustand) and integrates with Supabase, the `chatStore`, and the `documentStore`.

---

## Overview

The `streamStore` manages the following aspects of the streaming process:

- **Core Streaming State:**
  - **`isStreamingActive`**: Indicates whether streaming is currently active.
  - **`currentStreamContent`**: Holds the accumulated streaming text content.
  - **`streamError`**: Captures any errors encountered during streaming.
  - **`currentRunId`**: Stores the ID of the active run.
  - **`abortController`**: Used to cancel an ongoing stream.

- **User Input and Form Processing:**
  - **`isAwaitingUserInput`**: Flags if the store is waiting for additional user input.
  - **`requiredFields`**: An array of required fields (often coming from tool call actions).
  - **`currentFormKey`** and **`formData`**: Manage form processing state when using tools like PDF generation.
  - **`isFormProcessing`**: Indicates if form processing is in progress.

- **Auxiliary Data:**
  - **`pdfPreviewUrl`**: URL for previewing a generated PDF.
  - **`currentMessageId`**: Tracks the ID of the message being streamed.
  - **`toolCallsInProgress`**: An array tracking tool calls that are in progress.
  - **`userId`**: The current authenticated user’s ID.

- **Integration:**  
  The store interacts with:
  - The **`chatStore`** to update or finalize messages.
  - The **`documentStore`** (if needed for file attachments or related operations).
  - External APIs (e.g., OpenAI endpoints) via fetch calls.

---

## State Structure

The main state properties include:

- **Streaming Control:**
  - `isStreamingActive: boolean`
  - `currentStreamContent: string`
  - `streamError: string | null`
  - `currentRunId: string | null`
  - `abortController: AbortController | null`

- **Form & Tool Handling:**
  - `isAwaitingUserInput: boolean`
  - `requiredFields: string[]`
  - `currentFormKey: string | null`
  - `isFormProcessing: boolean`
  - `formData: Record<string, any>`

- **Additional Data:**
  - `pdfPreviewUrl: string | null`
  - `currentMessageId: string | null`
  - `userId: string | null`
  - `toolCallsInProgress: any[]`

---

## Key Functions and Actions

### 1. Basic Actions & Setters

- **`setIsStreamingActive(active: boolean)`**  
  Sets whether streaming is active.

- **`setStreamError(error: string | null)`**  
  Updates the stream error state.

- **`toggleStreamEnabled()`**  
  Toggles the active streaming state.

- **`setCurrentRunId(runId: string | null)`** and **`setCurrentMessageId(messageId: string | null)`**  
  Update run and message IDs.

- **`setStreamContent(content: string)`**, **`appendStreamContent(content: string)`**, **`updateStreamContent(content: string)`**  
  Manage the streaming text content.

- **`setPdfPreviewUrl(url: string | null)`**  
  Updates the PDF preview URL.

### 2. Lifecycle Helpers

- **`resetStream()`**  
  Resets streaming state including active flags, content, errors, and form data.

- **`initialize()`**  
  Retrieves and sets the current user ID from Supabase.

### 3. SSE Stream Handling

- **`startStream(threadId: string, assistantId: string, additionalInstructions?: string)`**  
  - **Purpose:**  
    Initiates a stream by sending a POST request to the SSE endpoint (`/api/openai/threads/{threadId}/run/stream`).
  - **Behavior:**  
    - Resets and prepares streaming state.
    - Creates an `AbortController` for possible cancellation.
    - Reads the stream using a `ReadableStreamDefaultReader`.
    - Processes chunks by splitting on message delimiters and handling JSON events.
    - Invokes `processStreamEvent` for each event received.
    
- **`cancelStream(threadId?: string, runId?: string)`**  
  Cancels an active stream using the abort controller and, if provided, notifies the server to cancel the run.

### 4. Event Processing

- **`processStreamEvent(event: OpenAIStreamingEvent, threadId: string)`**  
  - **Purpose:**  
    Processes individual streaming events based on their `type`.
  - **Key Cases:**
    - **Message Events:**  
      - `thread.message.created`, `textCreated`, `thread.message.delta`, etc.  
        Append new text to `currentStreamContent`.
    - **Run Events:**  
      - `thread.run.created`, `thread.run.completed`, `thread.run.failed`, etc.  
        Update `currentRunId` and streaming state accordingly.
    - **Step Events:**  
      - `thread.run.step.delta`: Handles partial text updates from steps.
    - **Tool-Related Events:**  
      - `thread.run.requires_action`: Processes tool calls (e.g., form generation or retrieving required fields) via `handleToolCall`.

- **`findTextValueInObject(obj: any)`**  
  A helper function to recursively extract a text value from a nested object (used to process delta content).

### 5. Finalizing and Teardown

- **`endStream(savedMessageId?: string)`**  
  Ends the stream and optionally saves the current message ID.

- **`finalizeMessage()`**  
  Triggers finalization of the message by fetching updated messages via the `chatStore` and then resets streaming flags.

- **`handleStreamError(error: any)`**  
  Handles stream errors by updating `streamError` and disabling streaming.

### 6. Tool Handling (e.g., PDF Generation)

- **`handleToolCall(toolCall: any, threadId: string, runId: string)`**  
  - **Purpose:**  
    Processes tool call events (such as generating a PDF form or retrieving required form fields).
  - **Behavior:**  
    - For a `GeneratePDFForm` call:  
      - Validates form data and form key.
      - Processes and validates form data against a definition.
      - Sets `currentFormKey`, `formData`, and starts form processing.
    - For a `getFormFields` call:  
      - Retrieves required fields from form definitions.
      - Submits these as tool outputs back to the assistant.
      - Processes the resulting stream to continue the conversation.

---

## Usage Example

Below is an example usage of the `streamStore` in a component:

```typescript
import { useStreamStore } from '@/store/streamStore';

// Initialize the store (e.g., on component mount)
useStreamStore.getState().initialize();

// Start a stream for a given thread and assistant
useStreamStore.getState().startStream('thread_id_example', 'assistant_id_example', 'Additional instructions if needed')
  .catch(error => {
    console.error('Error starting stream:', error);
  });

// To cancel an active stream:
useStreamStore.getState().cancelStream('thread_id_example', 'run_id_example');

// Append manual content (if needed) or finalize the stream
useStreamStore.getState().appendStreamContent(' Some additional text.');

// Handle tool call events automatically processed via processStreamEvent.
