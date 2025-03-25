# Chat Store (Zustand) Specification

This document outlines the implementation and functionalities provided by the `chatStore` (located at `/store/chatStore.ts`). The store is built using [Zustand](https://github.com/pmndrs/zustand) and is responsible for managing chat threads, messages, file queues, and active run statuses. It also handles integration with both Supabase for authentication and an OpenAI-based chat API.

---

## Overview

The `chatStore` manages:
- **Core State:**  
  - `currentThread`: The active chat thread.
  - `historicalThreads`: List of past chat threads.
  - `transientFileQueue`: Queue of files to be attached to messages.
  - `isLoading` & `error`: Indicators for asynchronous operations and error messages.
  - `activeRunStatus`: Status of any ongoing run (processing state) in the current thread.
  - `currentAssistantId`: Identifier for the currently active OpenAI assistant.
  - `patientContext` & `chatContext`: Contextual information about the patient and chat session.

- **Thread Management:**  
  Functions to create, update, and delete chat threads as well as setting the current active thread.

- **Message Management:**  
  Sending messages (with optional attachments), fetching messages from the API, merging messages into the current state, and persisting message references.

- **Active Run Management:**  
  Checking if there is an active run (ongoing processing) for a thread and updating the state accordingly.

- **File Queue Management:**  
  Handling file attachments by adding/removing files in a transient queue and sending messages with these files.

- **Context Management:**  
  Updating chat and patient-specific context used throughout the chat session.

---

## State Structure

The store state includes the following key properties:

- **`currentThread`**:  
  Represents the active chat thread, which contains:
  - `thread_id`: Unique thread identifier.
  - `messages`: Array of messages in the thread.
  - `assistant_id`: The associated assistant's ID.
  - `tool_resources` (optional): Additional tool-related data.

- **`historicalThreads`**:  
  An array of previously created threads.

- **`transientFileQueue`**:  
  An array to hold documents/files pending attachment to a message.

- **`isLoading`**:  
  Boolean flag indicating ongoing asynchronous operations.

- **`error`**:  
  A string capturing any error messages.

- **`activeRunStatus`**:  
  Holds the current run status (e.g., whether a message generation run is active).

- **`currentAssistantId`**:  
  ID of the current OpenAI assistant.

- **`patientContext` & `chatContext`**:  
  Contextual information used for chat and patient details (e.g., facility ID, patient ID, patient name).

---

## Key Functions and Actions

### 1. Thread Management

- **`createThread(assistantId: string): Promise<string>`**  
  - **Purpose:** Creates a new chat thread by:
    - Validating the assistant ID.
    - Retrieving the current user ID from Supabase.
    - Calling the `/api/openai/threads` endpoint (POST) to create the thread.
    - Updating thread metadata (via a PATCH call to `/api/openai/threads/{threadId}/metadata`).
    - Setting the newly created thread as the current thread.
  - **Returns:** The new `threadId`.

- **`deleteThread(threadId: string): Promise<void>`**  
  - **Purpose:** Deletes a specified thread:
    - Sends a DELETE request to `/api/openai/threads/{threadId}`.
    - Removes the thread from `historicalThreads` and resets `currentThread` if needed.

- **`updateThreadTitle(threadId: string, newTitle: string): Promise<void>`**  
  - **Purpose:** Updates the title of a thread by:
    - Patching the thread metadata via the API.
    - Updating the local state to reflect the new title.

- **`setCurrentThread(thread: Thread | null): void`**  
  - **Purpose:** Sets a given thread as the current active thread and updates the assistant ID if needed.

### 2. Message Management

- **`sendMessage(assistantId: string, threadId: string, content: string, attachments?: any[]): Promise<SendMessageResult>`**  
  - **Purpose:** Sends a message within a thread:
    - Validates input parameters (assistant ID, thread ID, and message content).
    - Checks for an active run status to avoid sending duplicate messages.
    - Constructs the message payload and sends it via a POST request.
    - Updates state by fetching the latest messages.
  - **Returns:** An object indicating success and the new message ID.

- **`fetchOpenAIMessages(threadId: string): Promise<ThreadMessage[] | undefined>`**  
  - **Purpose:** Retrieves the messages for the specified thread by calling `/api/openai/threads/{threadId}/messages`.
  - **Behavior:** Merges incoming messages with any existing ones in the state and updates `currentThread.messages`.

- **`addStreamingMessage(message: string): void`**  
  - **Purpose:** Adds a temporary streaming message to the current thread. This is useful when receiving a real-time update before the final message is processed.

- **`addMessageReference(messageId: string, threadId: string, role: string, content: string): Promise<void>`**  
  - **Purpose:** Inserts a reference to a sent message into Supabase for persistence.

- **`setCurrentMessages(messages: ThreadMessage[]): void`**  
  - **Purpose:** Updates the current thread’s messages directly in the state.

### 3. Active Run Management

- **`checkActiveRun(threadId: string): Promise<RunStatusResponse>`**  
  - **Purpose:** Checks if a thread has an active run by calling `/api/openai/threads/{threadId}/run/check`:
    - If a run is active, it updates `activeRunStatus`.
    - If the run is in a terminal state (e.g., completed), it triggers an update to fetch the final messages.
  - **Returns:** An object with details about the run status.

- **`updateActiveRunStatus(status: RunStatusResponse | null): void`**  
  - **Purpose:** Manually updates the `activeRunStatus` in the state.

### 4. File Queue Management

- **`addFileToQueue(doc: Document): void`**  
  - **Purpose:** Adds a document to the file queue for later attachment.
  
- **`removeFileFromQueue(doc: Document): void`**  
  - **Purpose:** Removes a document from the file queue.
  
- **`clearFileQueue(): void`**  
  - **Purpose:** Clears the entire file queue.

- **`sendMessageWithFiles(assistantId: string, content: string, files: Document[]): Promise<SendMessageResult>`**  
  - **Purpose:** Sends a message along with file attachments:
    - Ensures a thread exists or creates a new one.
    - Processes files to extract valid OpenAI file IDs.
    - Formats attachments and calls `sendMessage` to dispatch the message.
    - Clears the file queue upon success.

### 5. Context Management

- **`updateChatContext(context: Partial<ChatContext>): void`**  
  - **Purpose:** Updates contextual information used in the chat session (e.g., facility or patient IDs).

- **`updatePatientContext(context: PatientContext | null): void`**  
  - **Purpose:** Sets or clears the patient-specific context.

### 6. Error Handling and Helper Functions

- **`setError(error: string | null): void`** and **`clearError(): void`**  
  - **Purpose:** Manage the global error state.
  
- **Helper Functions:**
  - **`mergeMessages(existing: ThreadMessage[], incoming: ThreadMessage[]): ThreadMessage[]`**  
    - Merges new messages with existing ones, avoiding duplicates and ensuring chronological order.
  - **`isTerminalState(status: string | undefined): boolean`**  
    - Checks if a given run status is terminal (e.g., "completed", "failed", "cancelled", "expired").

---

## Usage Example

Below is an example of how you might use the `chatStore` in your React components:

```typescript
import { chatStore } from '@/store/chatStore';

// Access current thread from state
const currentThread = chatStore.getState().currentThread;

// Create a new thread if needed
chatStore.getState().createThread('assistant_id_example')
  .then(threadId => {
    console.log('New thread created with ID:', threadId);
  })
  .catch(error => {
    console.error('Error creating thread:', error);
  });

// Send a message in the current thread
chatStore.getState().sendMessage('assistant_id_example', 'thread_id_example', 'Hello, how can I help?')
  .then(result => {
    if (result.success) {
      console.log('Message sent successfully, message ID:', result.messageId);
    }
  })
  .catch(error => {
    console.error('Error sending message:', error);
  });
