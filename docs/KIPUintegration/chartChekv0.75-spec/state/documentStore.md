# Document Store (Zustand) Specification

This document outlines the implementation and functionality of the `documentStore`, which manages document state, file queues, uploads, processing, and categorization. The store leverages [Zustand](https://github.com/pmndrs/zustand) for state management and uses Supabase for data persistence and storage operations.

---

## Overview

The `documentStore` is responsible for:
- **State Management:**  
  - **documents:** List of document records.
  - **fileQueue:** Temporary queue for files pending upload/processing.
  - **isLoading:** Indicator for asynchronous operations.
  - **error:** String holding error messages.
  
- **Document Operations:**  
  - **Fetching Documents:** Retrieves documents from Supabase, optionally filtered by facility.
  - **Uploading Documents:** Handles file uploads to Supabase storage and records document metadata in the database.
  - **Processing Documents:** Sends uploaded files to the OpenAI files API, updates document records with OpenAI IDs, and sets processing statuses.
  - **Categorization Updates:** Updates document categorization data (e.g., facility, patient, and compliance concerns).

- **File Queue Management:**  
  - Add, remove, and retrieve files from the transient file queue.

- **Store Subscriptions:**  
  - Subscribes to changes in the facility store to automatically fetch documents for the currently selected facility.

---

## State Structure

The store maintains the following key state properties:
- **`documents`**: An array of document records.
- **`fileQueue`**: An array containing documents/files queued for processing or attachment.
- **`isLoading`**: Boolean indicating if an asynchronous operation is in progress.
- **`error`**: String for storing any error messages.

---

## Key Functions and Actions

### 1. Setting State
- **`setDocuments(documents: Document[])`**  
  Updates the store with a new list of document records.

- **`setLoading(isLoading: boolean)`**  
  Sets the loading state (true or false).

- **`setError(error: string | null)`**  
  Sets the error state with a provided error message (or clears it with `null`).

### 2. Fetching Documents
- **`fetchDocuments(facilityId?: number): Promise<Document[]>`**  
  - **Purpose:**  
    Fetches documents from the Supabase `documents` table.  
  - **Behavior:**  
    Optionally filters documents by a given facility ID and orders results by creation date (descending).
  - **Outcome:**  
    Updates `documents` in the store and resets `isLoading` upon completion.

- **`fetchDocumentsForCurrentFacility(): Promise<Document[]>`**  
  - **Purpose:**  
    Dynamically retrieves the current facility ID from the facility store and calls `fetchDocuments` accordingly.
  - **Outcome:**  
    Returns the document list for the currently selected facility.

### 3. File Queue Management
- **`addToFileQueue(document: Document)`**  
  Adds a document to the file queue.

- **`removeFromFileQueue(document: Document)`**  
  Removes a document from the file queue by filtering out based on its unique ID.

- **`getFileQueue()`**  
  Returns the current file queue.

### 4. Document Upload and Processing
- **`uploadDocument(file: File, categorization?: DocumentCategorization): Promise<Document | null>`**  
  - **Purpose:**  
    Uploads a file to Supabase storage and creates a document record in the `documents` table.  
  - **Details:**  
    - Generates a unique file path using the current user ID and timestamp.
    - Inserts file metadata (name, type, size, etc.) into the database.
    - Optionally includes categorization data (e.g., patient ID, compliance concerns).
  - **Outcome:**  
    Refreshes the document list after upload and returns the new document record.

- **`uploadAndProcessDocument(file: File, categorization?: DocumentCategorization): Promise<Document | null>`**  
  - **Purpose:**  
    An enhanced upload function that:
    - First calls `uploadDocument`.
    - Then sends the file to the OpenAI files API (via a POST request with FormData).
    - Updates the document record with the OpenAI file ID and changes its processing status.
  - **Outcome:**  
    Returns the updated document record after processing.

### 5. Updating Document Categorization
- **`updateDocumentCategorization(documentId: string, categorization: DocumentCategorization): Promise<boolean>`**  
  - **Purpose:**  
    Updates a document’s categorization details (e.g., facility ID, patient ID, compliance concerns).
  - **Outcome:**  
    Refreshes the documents for the current facility and returns a boolean indicating success.

### 6. Store Subscriptions
- **`initDocumentStoreSubscriptions()`**  
  - **Purpose:**  
    Sets up a subscription to the facility store to listen for changes to the current facility.  
  - **Behavior:**  
    When the current facility changes, the store automatically fetches documents for the new facility.
  - **Outcome:**  
    Returns an unsubscribe function (or a no-op if running on the server).

---

## Usage Example

Below is an example of how you might use the `documentStore` in a React component:

```typescript
import { documentStore } from '@/store/documentStore';

// Fetch documents for the current facility
documentStore.getState().fetchDocumentsForCurrentFacility()
  .then((documents) => {
    console.log('Fetched documents:', documents);
  })
  .catch((error) => {
    console.error('Error fetching documents:', error);
  });

// Upload a file and process it
const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
fileInput.addEventListener('change', async (event) => {
  const file = fileInput.files?.[0];
  if (file) {
    const result = await documentStore.getState().uploadAndProcessDocument(file, { patient_id: 'chart123:patient456' });
    if (result) {
      console.log('Document uploaded and processed:', result);
    } else {
      console.error('Failed to upload and process document');
    }
  }
});
