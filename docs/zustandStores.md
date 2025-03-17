# Zustand Stores Documentation

This document details the architecture of your Zustand state management system. Each file is broken down with one-sentence descriptions for states and functions, along with an in-depth look at inter-store dependencies. Read it skeptically—question every dependency and ensure your abstractions hold up under scrutiny.

---

## 1. Chat Store (`/store/chatStore.ts`)

**Overview:**  
Manages chat threads, messages, and run statuses by interfacing with OpenAI, Supabase, and your assistant logic.

### Core State Variables
- **`currentThread`**: Holds the currently active chat thread and its messages.
- **`historicalThreads`**: Stores past chat threads for retrieval and history.
- **`transientFileQueue`**: Temporarily queues files to be attached to messages.
- **`isLoading`**: Flags whether a chat-related process is in progress.
- **`error`**: Captures any error messages occurring during chat operations.
- **`activeRunStatus`**: Contains the current run status (e.g., pending, completed) of a thread.
- **`currentAssistantId`**: Tracks the active assistant’s identifier used for chat operations.
- **`patientContext`**: Holds patient context info for use in chat interactions.

### Actions & Functions
- **`createThread(assistantId)`**: Validates input and creates a new chat thread via API calls, updates metadata, and sets it as current.
- **`sendMessage(assistantId, threadId, content, attachments)`**: Sends a user message (with optional attachments) to the API and refreshes the thread’s messages.
- **`checkActiveRun(threadId)`**: Queries the API to determine if a run is active and updates state based on whether the thread’s run is terminal.
- **`fetchOpenAIMessages(threadId)`**: Retrieves the latest messages from the API and merges them into the current thread while handling errors.
- **`setError(error)` / `clearError()`**: Sets or clears the global error state for the chat store.
- **`fetchHistoricalThreads()`**: Pulls all past chat threads for the authenticated user from Supabase.
- **`deleteThread(threadId)`**: Deletes a specific thread from both the API and Supabase, updating current and historical state accordingly.
- **`updateThreadTitle(threadId, newTitle)`**: Updates a thread’s title via API and Supabase, then syncs the change in state.
- **`setCurrentThread(thread)`**: Sets the active thread and its assistant ID, falling back to a default if needed.
- **`addMessageReference(messageId, threadId, role, content)`**: Inserts a message reference into Supabase for auditing or lookup.
- **`setCurrentMessages(messages)`**: Updates the messages array of the current thread.
- **`updateActiveRunStatus(status)`**: Directly sets the active run status.
- **`getLatestRun(threadId)`**: Fetches the most recent run information for a given thread.
- **`addStreamingMessage(message)`**: Appends a temporary message to the current thread during streaming.
- **`addFileToQueue(doc)` / `removeFileFromQueue(doc)` / `clearFileQueue()`**: Manage the transient file queue by adding, removing, or clearing files.
- **`sendMessageWithFiles(assistantId, content, files)`**: Coordinates sending a message that includes files by ensuring a thread exists, formatting attachments, sending the message, and then clearing the file queue.
- **`setCurrentAssistantId(assistantId)`**: Updates the current assistant in both the chat and current thread.
- **`updatePatientContext(context)`**: Updates the chat context with patient-specific information.

*Helper Functions:*  
- **`mergeMessages(existing, incoming)`**: Combines new messages with existing ones, preserving order.
- **`isTerminalState(status)`**: Checks if a run status indicates a terminal state.

---

## 2. Document Store (`/store/documentStore.ts`)

**Overview:**  
Handles document management including fetching, uploading, categorizing, and managing a file queue tied to facilities and patient context.

### Core State Variables
- **`documents`**: An array holding document records fetched from Supabase.
- **`fileQueue`**: A temporary queue for documents pending further actions.
- **`isLoading`**: Indicates if a document operation (like fetch or upload) is in progress.
- **`error`**: Stores error messages from document operations.

### Actions & Functions
- **`setDocuments(documents)`**: Updates the document list in the state.
- **`setLoading(isLoading)`**: Toggles the loading state.
- **`setError(error)`**: Sets the error state for document-related issues.
- **`fetchDocuments(facilityId?)`**: Retrieves documents from Supabase, optionally filtered by a facility ID.
- **`fetchDocumentsForCurrentFacility()`**: Uses the facility store to fetch documents for the currently selected facility.
- **`addToFileQueue(document)`**: Adds a document to the temporary file queue.
- **`removeFromFileQueue(document)`**: Removes a document from the file queue.
- **`getFileQueue()`**: Returns the current file queue.
- **`uploadDocument(file, categorization?)`**: Uploads a file to Supabase, creates a document record, and refreshes the document list.
- **`uploadAndProcessDocument(file, categorization?)`**: Uploads a document then sends it to the OpenAI API for processing, updating the record with an OpenAI file ID.
- **`updateDocumentCategorization(documentId, categorization)`**: Updates document metadata in Supabase and refreshes the document list.

*Subscription:*  
- **`initDocumentStoreSubscriptions()`**: Sets up a client-side subscription to the facility store to refresh documents on facility changes.

---

## 3. Facility Store (`/store/facilityStore.ts`)

**Overview:**  
Manages facility data, including the list of facilities, current facility selection, and API settings, with persistence via localStorage.

### Core State Variables
- **`facilities`**: An array of facility objects fetched from a KIPU service.
- **`currentFacilityId`**: The ID of the currently active facility (persisted to localStorage).
- **`isLoading`**: Indicates if facility operations are in progress.
- **`error`**: Captures errors during facility operations.

### Actions & Functions
- **`fetchFacilities()`**: Retrieves facilities from the KIPU service and selects the first facility if none is chosen.
- **`setCurrentFacility(facilityId)`**: Updates the current facility ID and persists it in localStorage.
- **`getCurrentFacility()`**: Returns the facility object matching the current facility ID.
- **`changeFacilityWithContext(facilityId)`**: Sets the current facility and triggers context updates (with data fetching handled by subscriptions).
- **`updateFacilityApiSettings(facilityId, settings)`**: Updates facility API settings in Supabase and via the service layer, then syncs the local state.
- **`getFacilityApiSettings(facilityId)`**: Retrieves API settings for a facility from the KIPU service.

*Persistence:*  
- Uses Zustand's `persist` middleware to store `currentFacilityId` across sessions.

---

## 4. Patient Store (`/store/patientStore.ts`)

**Overview:**  
Handles patient data and context by fetching patients and their related details, integrating this information into chat context for a personalized experience.

### Core State Variables
- **`patients`**: An array of basic patient information.
- **`currentPatient`**: The patient currently in focus.
- **`currentPatientEvaluations`**: Stores evaluation details for the current patient.
- **`currentPatientVitalSigns`**: Stores vital signs data for the current patient.
- **`currentPatientAppointments`**: Stores appointment data for the current patient.
- **`isPatientContextEnabled`**: Flag indicating if patient context should be applied.
- **`selectedContextOptions`**: List of options for building the patient context.
- **`isLoading`**: Indicates if patient operations are in progress.
- **`error`**: Captures errors during patient operations.

### Actions & Functions
- **`fetchPatients(facilityId)`**: Retrieves and transforms raw patient data from KIPU for a given facility.
- **`fetchPatientsForCurrentFacility()`**: Uses the facility store to fetch patients for the selected facility.
- **`fetchPatient(facilityId, patientId)`**: Retrieves a single patient by ID.
- **`fetchPatientEvaluations(facilityId, patientId)`**: Retrieves evaluations for a patient.
- **`fetchPatientVitalSigns(facilityId, patientId)`**: Retrieves vital signs for a patient.
- **`fetchPatientAppointments(facilityId, patientId)`**: Retrieves appointments for a patient.
- **`fetchPatientWithDetails(facilityId, patientId)`**: Fetches a patient and all related details (evaluations, vital signs, appointments) in one call.
- **`setCurrentPatient(patient)`**: Sets the current patient and updates chat context.
- **`setPatientContextEnabled(enabled)`**: Enables/disables patient context and updates the chat store accordingly.
- **`updatePatientContextOptions(options)`**: Updates the selected options for patient context and refreshes chat context if enabled.
- **`buildPatientContextString()`**: Constructs a formatted string representing patient context based on the current patient and selected options.
- **`clearPatientContext()`**: Clears all patient-related state and resets the chat context.

*Subscription:*  
- **`initPatientStoreSubscriptions()`**: Subscribes to facility store changes to refresh patient data when the current facility changes.

---

## 5. Store Initializers (`/store/storeInitializers.ts`)

**Overview:**  
Coordinates initialization routines for cross-store subscriptions and facility data to ensure all stores sync correctly on app startup.

### Functions
- **`initializeStoreSubscriptions()`**: Sets up subscriptions for both the document and patient stores to automatically respond to facility changes, returning a cleanup function.
- **`initializeFacilityData()`**: Dynamically imports and triggers facility data fetching if not already loaded.

---

## 6. Stream Store (`/store/streamStore.ts`)

**Overview:**  
Manages live streaming (SSE) of messages and events, handling errors, tool calls, and PDF generation for patient reports.

### Core State Variables
- **`isStreamingActive`**: Indicates whether an SSE stream is active.
- **`currentStreamContent`**: Holds the live-updating content from the stream.
- **`streamError`**: Captures any errors during streaming.
- **`currentRunId`**: Stores the run identifier for the current stream.
- **`abortController`**: Manages cancellation of the SSE request.
- **`pdfPreviewUrl`**: URL for previewing a generated PDF.
- **`currentFormKey`**: Tracks a form key triggered during streaming.
- **`currentMessageId`**: Holds the identifier for the current stream message.
- **`isFormProcessing`**: Indicates if a tool/form is currently processing.
- **`formData`**: Stores data for tool calls (e.g., form processing).
- **`userId`**: Holds the authenticated user’s ID.
- **`toolCallsInProgress`**: Tracks tool calls in progress during streaming.

### Actions & Functions
- **`setIsStreamingActive(active)`**: Sets the streaming active flag.
- **`setStreamError(error)`**: Updates the error state for streaming issues.
- **`toggleStreamEnabled()`**: Toggles the streaming state.
- **`setCurrentRunId(runId)` / `setCurrentMessageId(messageId)`**: Updates the run or message ID.
- **`setStreamContent(content)` / `appendStreamContent(content)` / `updateStreamContent(content)`**: Manage the stream’s textual content.
- **`setPdfPreviewUrl(url)`**: Sets the PDF preview URL.
- **`resetStream()`**: Resets all streaming-related state to defaults.
- **`initialize()`**: Fetches the user ID from Supabase and stores it.
- **`startStream(threadId, assistantId, additionalInstructions?)`**: Initiates an SSE stream by resetting state, calling the API endpoint, and processing incoming events.
- **`cancelStream(threadId?, runId?)`**: Cancels an active stream and optionally notifies the server to cancel the run.
- **`processStreamEvent(event, threadId)`**: Processes incoming SSE events (e.g., message deltas, run status updates, tool calls) and updates state accordingly.
- **`endStream(savedMessageId?)`**: Ends the streaming session and updates state with a final message ID.
- **`handleStreamError(error)`**: Processes streaming errors and updates state.
- **`finalizeMessage()`**: Calls the chat store to refresh messages once the stream completes.
- **`handleToolCall(toolCall)`**: Processes tool call events (e.g., handling BioPsychSocialAssessmentForm calls) and updates the state for form processing.
- **`generatePDF(patientData)`**: Generates a PDF from patient data via an API, creates a preview URL, and uploads the PDF using the document store.

*Helper Function:*  
- **`findTextValueInObject(obj)`**: Recursively searches an object for a text value, used to process SSE delta content.

---

## Shared Responsibilities & Inter-Store Dependencies

Your stores are designed to work together, not in isolation:

- **Coordinated Initialization:**  
  The `storeInitializers.ts` file sets up subscriptions for both document and patient stores so that when the **facilityStore** changes (e.g., when a user selects a different facility), the corresponding data refreshes automatically.

- **Cross-Store Communication:**  
  - The **chatStore** integrates patient context from the **patientStore** to personalize conversations.  
  - The **documentStore** fetches documents based on the current facility provided by the **facilityStore**.  
  - The **patientStore** relies on **facilityStore** data to filter patients and even updates the chat context when patient details change.

- **Real-Time Data Flow:**  
  The **streamStore** handles live events and SSE streams, triggering updates in **chatStore** (to refresh messages) and interacting with **documentStore** (for PDF uploads). This integration ensures that changes in one domain propagate across the app.

- **Shared Error & Loading States:**  
  Each store manages its own error and loading states, but their interactions are coordinated to provide a unified, consistent UI state.

- **Persistence and Synchronization:**  
  The **facilityStore** persists the current facility in localStorage, guiding both the **documentStore** and **patientStore** to maintain consistency across sessions.

---