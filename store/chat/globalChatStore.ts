// store/chat/globalChatStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Patient, Document, UploadFile, QueueItem, PatientRecord, ChatMessage, GlobalChatState, AggregatedContext } from "@/types/store/chat/globalChat"; // Added ChatMessage, GlobalChatState, AggregatedContext directly
import { type TrainingDataset, TRAINING_DATASETS } from "@/types/training-datasets";
import { LLMOption, LLM_OPTIONS } from "@/lib/llm-service";
import { v4 as uuidv4 } from 'uuid';
// Corrected import path // Assuming auth store exists here
import { useDocumentStore } from "../doc/documentStore"; // Kept relative for now, check if alias works better
import { useEvaluationsStore } from "../patient/evaluationsStore"; // Kept relative

// Define the store with types
export const useGlobalChatStore = create<GlobalChatState>()(
  devtools(
    persist(
      (set, get) => ({
        // --- Initial State ---
        selectedPatient: null,
        selectedEvaluations: [],
        selectedDocuments: [],
        queueItems: [],
        uploadFiles: [],
        isUploading: false,
        aggregatedContext: [],
        assistantId: 'asst_abc123', // Placeholder
        messages: [],
        isGenerating: false,
        currentMessage: '',
        isFullScreen: false,
        currentThreadId: null,
        availableModels: LLM_OPTIONS,
        selectedModel: LLM_OPTIONS[0], // Default to first option
        availableTrainingDatasets: TRAINING_DATASETS,
        selectedTrainingDataset: TRAINING_DATASETS[0], // Default to The Joint Commission

        // --- Actions ---

        // Added selectQueueItem back to match the interface
        selectQueueItem: (record: any) => {
          // Determine ID and Name based on record structure (basic example)
          const id = typeof record === 'object' && record !== null && 'id' in record ? record.id : String(record);
          const name = typeof record === 'object' && record !== null && 'name' in record ? record.name : `Item ${id}`;
          const type = typeof record === 'object' && record !== null && 'type' in record ? record.type : 'unknown'; // Add type inference if possible
          
          const { queueItems } = get();
          if (!queueItems.some((item) => item.id === id)) {
              set((state) => ({
                  queueItems: [...state.queueItems, {
                      queueId: uuidv4(), // Unique ID for the queue entry itself
                      id: id,          // ID of the actual record
                      name: name,      // Display name
                      type: type,      // Type of record
                      data: record     // Store the original record data if needed
                  }]
              }));
          } else {
              console.log(`Item with id ${id} already in queue.`);
          }
        },


        // Deselect Queue Item
        deselectQueueItem: (queueId: string) => { // Changed param to queueId for clarity
          set((state) => ({
            queueItems: state.queueItems.filter((item) => item.queueId !== queueId),
          }));
        },

        clearQueue: () => {
          set({ queueItems: [] });
        },

        addFilesToUpload: (files: FileList) => {
          const newUploadFiles: UploadFile[] = Array.from(files).map(file => ({
            id: uuidv4(),
            file: file,
            name: file.name, // Capture name on creation
            status: 'pending',
            progress: 0,
          }));
          set((state) => ({ uploadFiles: [...state.uploadFiles, ...newUploadFiles] }));
        },

        removeUploadFile: (fileId: string) => {
          set((state) => ({
            uploadFiles: state.uploadFiles.filter((file) => file.id !== fileId),
          }));
        },

        processUploadFiles: async () => {
            set({ isUploading: true });
            // Process only files that are 'pending'
            const filesToProcess = get().uploadFiles.filter(f => f.status === 'pending');

            if (filesToProcess.length === 0) {
                console.log('No files pending upload.');
                set({ isUploading: false });
                return;
            }

            console.log(`Processing ${filesToProcess.length} files...`);
            const documentStore = useDocumentStore.getState(); // Get document store once

            try {
                for (const uploadFile of filesToProcess) {
                    console.log(`Uploading file: ${uploadFile.name}`);
                    set((state) => ({
                        uploadFiles: state.uploadFiles.map((f) =>
                            f.id === uploadFile.id ? { ...f, status: 'uploading' } : f
                        ),
                    }));

                    try {
                        // --- Actual Upload & Processing ---
                        // Use documentStore instance to call the method
                        const document = await documentStore.uploadAndProcessDocument(uploadFile.file);
                        console.log('Document processed successfully:', document?.document_id);
                        // ----------------------------------

                        set((state) => ({
                            uploadFiles: state.uploadFiles.map((f) =>
                                f.id === uploadFile.id ? { ...f, status: 'completed', progress: 100 } : f
                            ),
                        }));

                        // Add successfully uploaded and processed file to the queue
                         if (document) {
                             get().selectQueueItem({ // Use selectQueueItem now
                                 id: document.document_id, // Use the ID from the processed document
                                 name: uploadFile.name || 'Uploaded Document',
                                 type: 'document', // Assuming type is 'document'
                                 // Optionally add more data from the 'document' object if needed
                             });
                         } else {
                             console.warn(`Document processing for ${uploadFile.name} did not return document data.`);
                             // Decide if you still want to mark as completed or handle as an error/warning state
                         }

                    } catch (fileError) {
                        console.error(`Error processing file ${uploadFile.name}:`, fileError);
                        set((state) => ({
                            uploadFiles: state.uploadFiles.map((f) =>
                                f.id === uploadFile.id ? { ...f, status: 'error', error: String(fileError) } : f
                            ),
                        }));
                        // Continue with the next file
                    }
                }
                console.log('Finished processing all pending files.');
            } catch (error) {
                // Catch any unexpected errors during the loop setup or general processing
                console.error('Error during bulk file processing:', error);
            } finally {
                // Ensure isUploading is set to false after all attempts
                set({ isUploading: false });
            }
        },


        clearUploadFiles: () => {
          set({ uploadFiles: [] });
        },

        // ______________________
        // ______________________
        // ______________________
        // _____________________ CHAT MANAGEMENT

        setCurrentThreadId: (threadId: string | null) => set({ currentThreadId: threadId }), // Allow setting null

        sendMessage: async (/* provider and model params removed for now */) => {
          const {
            userInput,
            currentChatHistory,
            setUserInput,
            addMessageToHistory,
            currentThreadId, // Get currentThreadId from state
            createNewThread, // Get the action
            set,
            get,
          } = get(); // Get current state and actions
      
          if (!userInput.trim()) return; // Don't send empty messages
      
          const userMessageContent = userInput;
          setUserInput(''); // Clear input field immediately
      
          // Add user message optimistically
          const optimisticUserMessage: ChatMessage = {
            // Assign a temporary client-side ID if needed, or generate on server
            thread_id: currentThreadId, // Use 'pending' if no thread yet // Will be set by server based on auth
            role: 'user',
            content: userMessageContent,
            // other fields as needed
          };
          addMessageToHistory(optimisticUserMessage);
      
          set({ isTyping: true, error: null });
      
          let threadIdToUse = currentThreadId; // Start with the current ID
      
          try {
            // --- FIX: Check if thread exists, create if not, and WAIT ---
            if (!threadIdToUse) {
              console.log('[sendMessage] No current thread ID, creating a new one...');
              const newThreadId = await createNewThread(); // Call and wait for completion
              if (!newThreadId) {
                // Handle error if thread creation failed
                console.error('[sendMessage] Failed to create a new thread.');
                set({
                  isTyping: false,
                  error: 'Failed to start a new chat thread. Please try again.',
                });
                // Optional: Remove optimistic message?
                return; // Stop execution
              }
              threadIdToUse = newThreadId; // Use the newly created thread ID
              console.log(`[sendMessage] New thread created with ID: ${threadIdToUse}`);
              // Update the optimistic message's thread_id if needed (might require filtering history)
              set((state) => ({
                currentChatHistory: state.currentChatHistory.map((msg) =>
                  msg.message_id === optimisticUserMessage.message_id
                    ? { ...msg, thread_id: threadIdToUse! }
                    : msg
                ),
              }));
            }
            // -------------------------------------------------------------
      
            // --- Now, proceed with sending the message using threadIdToUse ---
            console.log(`[sendMessage] Sending message to thread: ${threadIdToUse}`);
      
            const messagePayload = {
              thread_id: threadIdToUse, // Use the confirmed/new thread ID
              role: 'user',
              content: userMessageContent,
              // Add other necessary fields like attachments, vendor, model if applicable
            };
      
            const response = await fetch(`/api/threads/${threadIdToUse}/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(messagePayload),
            });
      
            if (!response.ok) {
              const errorData = await response.json();
              console.error('[sendMessage] Error response from /messages:', errorData);
              throw new Error(errorData.error || 'Failed to send message');
            }
      
            const result = await response.json();
            console.log('[sendMessage] Message POST successful:', result);
      
            // --- Trigger AI response/run creation (if this is where it happens) ---
            // Example: await get().createRunForThread(threadIdToUse);
            // Or maybe the message POST itself triggers the run? Adapt as needed.
      
            // Assuming the POST was just to store the user message,
            // and a separate action/effect handles the AI response/run.
      
          } catch (error: any) {
            console.error('[sendMessage] Error:', error);
            set({
              isTyping: false,
              error: error.message || 'An unexpected error occurred.',
            });
            // Optional: Remove optimistic message if the send failed severely
            set((state) => ({
              currentChatHistory: state.currentChatHistory.filter(
                (msg) => msg.message_id !== optimisticUserMessage.message_id
              ),
            }));
          } finally {
            // Decide if isTyping should be false here or after AI response starts streaming
            // set({ isTyping: false });
          }
        },
      
        // Make sure createNewThread sets the state AND returns the ID
        createNewThread: async (): Promise<string | null> => {
          const { set, get } = get();
          set({ isTyping: true, error: null, currentThreadId: null }); // Reset relevant state
          console.log('[createNewThread] Attempting to create new thread via API...');
          try {
            const response = await fetch('/api/threads', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              // body: JSON.stringify({ optional_payload: 'data' }) // If needed
            });
      
            if (!response.ok) {
              const errorData = await response.json();
              console.error('[createNewThread] API error:', errorData);
              throw new Error(errorData.error || 'Failed to create thread');
            }
      
            const newThreadData = await response.json(); // Expecting { thread_id: '...' , ... }
            console.log('[createNewThread] API success, response:', newThreadData);
      
      
            if (!newThreadData || !newThreadData.thread_id) {
               console.error('[createNewThread] Invalid response format from API:', newThreadData);
               throw new Error('API did not return a valid thread ID.');
            }
      
            // --- FIX: Set state AND return the ID ---
            set({ currentThreadId: newThreadData.thread_id, isTyping: false });
            console.log(`[createNewThread] State updated with new thread ID: ${newThreadData.thread_id}`);
            return newThreadData.thread_id; // Return the ID for the caller
            // -----------------------------------------
      
          } catch (error: any) {
            console.error('[createNewThread] Error:', error);
            set({ isTyping: false, error: error.message || 'Failed to create thread.' });
            return null; // Indicate failure
          }
        },

        // Persists a message to Supabase
        sendMessageToSupabase: async (role: string, content: string, threadId: string, messageId?: string): Promise<any> => {
            if (!threadId) {
                console.error("sendMessageToSupabase called without a threadId.");
                throw new Error("Cannot save message without a thread ID.");
            }
            console.log(`Persisting message to Supabase: Role=${role}, Thread=${threadId}, MsgID=${messageId || 'New'}`);
            try {
                const response = await fetch(`/api/threads/${threadId}/messages`, { // Assuming a dedicated endpoint for messages
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        thread_id: threadId,
                        role: role,
                        content: content,
                        message_id: messageId // Pass ID if it exists (e.g., from OpenAI)
                    }),
                });
                if (!response.ok) {
                    const errorData = await response.text();
                    console.error("Failed to send message to Supabase:", response.status, errorData);
                    throw new Error(`Failed to save message: ${response.statusText}`);
                }
                const data = await response.json();
                 console.log("Message persisted to Supabase:", data);
                return data; // Return the persisted message data (e.g., with generated ID)
            } catch (error) {
                console.error("Error sending message to Supabase:", error);
                // Decide on error handling: re-throw, return null, etc.
                throw error; // Re-throw to be caught by the caller (sendMessage)
            }
        },

        setMessages: (messages: ChatMessage[]) => {
            set({ messages });
        },

        setCurrentMessage: (message: string) => {
          set({ currentMessage: message });
        },

        // ______________________
        // ______________________
        // ______________________
        // _____________________ UI & CONFIG

        toggleFullScreen: () => {
          set((state) => ({ isFullScreen: !state.isFullScreen }));
        },

        setIsGenerating: (isGenerating: boolean) => {
          set({ isGenerating });
        },

        setSelectedModel: (model: LLMOption) => {
          set({ selectedModel: model });
        },

        setSelectedTrainingDataset: (dataset: TrainingDataset) => {
          set({ selectedTrainingDataset: dataset });
          // Optionally trigger context rebuild here if dataset changes context significantly
          // get().setAggregatedContext(...) 
        },

        // Placeholder/Example - refine context aggregation logic as needed
        setAggregatedContext: (/* selectedRecords: any[], selectedTrainingDataset: TrainingDataset */) => {
          console.warn("setAggregatedContext called - refine implementation");
          // This function should likely pull from queueItems, selectedPatient, etc.
          // and build the context based on the current state + dataset rules.
          const { queueItems, selectedTrainingDataset } = get();
          const newAggregatedContext: AggregatedContext[] = queueItems.map(item => ({
              recordId: item.id,
              recordType: item.type || 'unknown',
              recordName: item.name,
              recordData: item.data, // Be careful sending large data objects
              recordMetadata: [], // Add relevant metadata here
          }));
          // Add logic based on selectedTrainingDataset if needed
          set({ aggregatedContext: newAggregatedContext });
      },

      }),
      {
        name: 'global-chat-storage', // name of the item in the storage (must be unique)
        storage: createJSONStorage(() => localStorage), // use localStorage
        // Only persist parts of the state you need on reload
        partialize: (state) => ({
          currentThreadId: state.currentThreadId,
          messages: state.messages,
          selectedModel: state.selectedModel,
          selectedTrainingDataset: state.selectedTrainingDataset,
          isFullScreen: state.isFullScreen,
          // Avoid persisting potentially large/sensitive/non-serializable data like:
          // queueItems, uploadFiles, selectedPatient, aggregatedContext, isGenerating, isUploading
        }),
      }
    )
  )
);

// Helper function or selector (example)
export const useCurrentThreadMessages = () => {
  return useGlobalChatStore((state) => state.messages);
};