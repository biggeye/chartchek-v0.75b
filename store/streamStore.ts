// (/store/streamStore.ts)

'use client';

import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import { useLegacyChatStore } from './legacyChatStore';
import { StreamingState } from '../types/store/stream';
import { OpenAIStreamingEvent } from '@/types/api/openai';
import { useDocumentStore } from './documentStore';
import { formDefinitions } from '@/lib/forms/formDefinitions';
// If you need form definitions, import them, but let's keep it minimal for clarity
// import { formDefinitions } from '@/components/dynamicForms/formDefinitions';

// Initialize Supabase client
const supabase = createClient();

const getUserId = async () => {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id || 'anonymous';
};

export const useStreamStore = create<StreamingState>((set, get) => ({
  /***************************************************************
   * Store State
   ***************************************************************/
  isAwaitingUserInput: false,
  requiredFields: [],
  isStreamingActive: false,
  currentStreamContent: '',
  streamError: null,
  currentRunId: null,
  abortController: null,

  pdfPreviewUrl: null,
  currentFormKey: null,
  currentMessageId: null,
  isFormProcessing: false,
  formData: {},
  userId: null,
  toolCallsInProgress: [],

  findTextValueInObject: (obj: any): string | null => {
    if (!obj) return null;
    
    if (typeof obj === 'string') return obj;
    
    if (typeof obj === 'object') {
      // Check for text value in common OpenAI response structures
      if (obj.text?.value) return obj.text.value;
      if (obj.value) return obj.value;
      
      // Recursively search through object properties
      for (const key in obj) {
        const result = get().findTextValueInObject(obj[key]);
        if (result) return result;
      }
    }
    
    return null;
  },

  /***************************************************************
   * Basic Actions
   ***************************************************************/

  setIsStreamingActive: (active: boolean) => set({ isStreamingActive: active }),

  setStreamError: (error: string | null) => set({ streamError: error }),

  toggleStreamEnabled: () =>
    set((state) => ({ isStreamingActive: !state.isStreamingActive })),

  setCurrentRunId: (runId: string | null) => set({ currentRunId: runId }),

  setCurrentMessageId: (messageId: string | null) =>
    set({ currentMessageId: messageId }),

  setStreamContent: (content: string) =>
    set({ currentStreamContent: content }),

  appendStreamContent: (content: string) =>
    set((state) => ({ currentStreamContent: state.currentStreamContent + content })),

  updateStreamContent: (content: string) => set({ currentStreamContent: content }),

  setPdfPreviewUrl: (url: string | null) => set({ pdfPreviewUrl: url }),

  /***************************************************************
   * Lifecycle Helpers
   ***************************************************************/

  resetStream: () =>
    set({
      isStreamingActive: true,
      currentStreamContent: '',
      streamError: null,
      currentRunId: null,
      currentFormKey: null,
      currentMessageId: null,
      isFormProcessing: false,
      formData: {},
      toolCallsInProgress: [],
    }),

  initialize: async () => {
    try {
      const userId = await getUserId();
      set({ userId });
    } catch (error) {
      console.error('[streamStore] Error initializing:', error);
      set({ streamError: 'Failed to initialize streaming' });
    }
  },

  /***************************************************************
   * Handling the SSE stream
   ***************************************************************/

  startStream: async (threadId: string, assistantId: string, additionalInstructions?: string) => {
    if (!threadId || !assistantId) {
      const errorMsg = `Missing required parameter: ${!threadId ? 'threadId' : 'assistantId'}`;
      console.error('[streamStore]', errorMsg);
      set({ streamError: errorMsg });
      return;
    }

    // Reset and prepare for streaming
    get().resetStream();
    set({ isStreamingActive: true });

    const controller = new AbortController();
    set({ abortController: controller });

    try {
      
      // Call your SSE endpoint
      const response = await fetch(`/api/openai/threads/${threadId}/run/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assistant_id: assistantId,
          thread_id: threadId,
          additional_instructions: additionalInstructions,
        }),
        signal: controller.signal,
      });

      if (!response.body) {
        throw new Error('Unable to read stream');
      }

      // Setup SSE reading
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('[streamStore] Stream complete');
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process possible SSE messages in the buffer
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || ''; // keep leftover partial chunk

        for (const message of messages) {
          const lines = message.split('\n').filter((line) => line.trim() !== '');
          for (const line of lines) {
            if (!line.trim().startsWith('data:')) {
              continue; // skip non-data lines
            }

            const jsonStr = line.trim().slice(5).trim();
            if (jsonStr === '[DONE]') {

              get().finalizeMessage();
              break;
            }

            try {
              const event = JSON.parse(jsonStr);
              // Pass it to our event processor
              if (event.type) {
                await get().processStreamEvent(event, threadId);
              } else {
                console.warn('[streamStore] Event has no type:', event);
                // Optionally handle content if there's no .type
              }
            } catch (err) {
              console.error('[streamStore] Error parsing event:', err);
              get().handleStreamError(String(err));
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('[streamStore] Stream aborted by user');
      } else {
        console.error('[streamStore] Stream error:', err);
        set({ streamError: err instanceof Error ? err.message : String(err) });
      }
      set({ isStreamingActive: false });
    }
  },

  cancelStream: async (threadId?: string, runId?: string) => {
    const ctrl = get().abortController;
    if (ctrl) {
      ctrl.abort();
      set({ isStreamingActive: false, abortController: null });
      console.log('[streamStore] Stream cancelled.');

      // If threadId and runId are provided, also ask the server to cancel
      if (threadId && runId) {
        try {
          const response = await fetch(`/api/openai/threads/${threadId}/runs/${runId}/cancel`, {
            method: 'POST',
          });
          if (response.ok) {
            console.log(`[streamStore] Run ${runId} cancelled successfully`);
            return true;
          } else {
            console.error(`[streamStore] Failed to cancel run ${runId}`);
            return false;
          }
        } catch (error) {
          console.error('[streamStore] Error cancelling run:', error);
          return false;
        }
      }
      return true;
    }
    return false;
  },

  /***************************************************************
   * Processing SSE events
   ***************************************************************/

  processStreamEvent: async (event: OpenAIStreamingEvent, threadId: string) => {
    try {
      switch (event.type) {
        // ------------- Message events -------------
        case 'thread.message.created':
          if (event.data?.id) set({ currentMessageId: event.data.id });
          break;

        case 'textCreated':
          if (event.data?.id) set({ currentMessageId: event.data.id });
          // Reset stream content for a new message bubble
          get().setStreamContent('');
          break;

        case 'thread.message.in_progress':
          console.log('[streamStore] Message in progress');
          break;

        case 'thread.message.delta':
          if (event.data?.delta?.content) {
            const content = event.data.delta.content;
            if (Array.isArray(content)) {
              for (const item of content) {
                if (item.type === 'text' && item.text?.value) {
                  get().appendStreamContent(item.text.value);
                }
              }
            } else if (typeof content === 'string') {
              get().appendStreamContent(content);
            }
          }
          break;

        case 'messageDelta':
          if (event.data?.delta?.content) {
            const content = event.data.delta.content;
            if (Array.isArray(content)) {
              for (const item of content) {
                if (item.text?.value) {
                  get().appendStreamContent(item.text.value);
                }
              }
            } else if (typeof content === 'string') {
              get().appendStreamContent(content);
            }
          }
          break;

        case 'thread.message.completed':
          console.log('[streamStore] Message completed');
          get().finalizeMessage();
          break;

        case 'messageCompleted':
          console.log('[streamStore] Message completed:', event.data);
          get().finalizeMessage();
          break;

        case 'thread.message.incomplete':
          console.log('[streamStore] Message incomplete');
          set({ streamError: 'Message generation incomplete', isStreamingActive: false });
          break;

        // ------------- Run events -------------
        case 'thread.run.created':
          if (event.data?.id) set({ currentRunId: event.data.id });
          break;

        case 'thread.run.queued':
          console.log('[streamStore] Run queued');
          break;

        case 'thread.run.in_progress':
          console.log('[streamStore] Run in progress');
          break;

        case 'thread.run.completed':
          console.log('[streamStore] Run completed');
          set({ isStreamingActive: false, isFormProcessing: false });
          get().finalizeMessage();
          break;

        case 'thread.run.incomplete':
          console.log('[streamStore] Run incomplete');
          set({ streamError: 'Run ended incomplete', isStreamingActive: false });
          break;

        case 'thread.run.failed':
          console.log('[streamStore] Run failed:', event.data?.error);
          set({
            streamError: event.data?.error?.message || 'Run failed',
            isStreamingActive: false,
            isFormProcessing: false,
          });
          break;

        case 'thread.run.cancelling':
          console.log('[streamStore] Run cancelling');
          break;

        case 'thread.run.cancelled':
          console.log('[streamStore] Run cancelled');
          set({ isStreamingActive: false });
          break;

        case 'thread.run.expired':
          console.log('[streamStore] Run expired');
          set({ streamError: 'Run expired', isStreamingActive: false });
          break;

        case 'thread.run.requires_action':
          console.log('[streamStore] Run requires action:', JSON.stringify(event.data, null, 2));
        
          if (event.data?.id) set({ currentRunId: event.data.id });
        
          if (event.data?.required_action?.type === 'submit_tool_outputs') {
            console.log('[streamStore] Tool outputs required:', event.data.required_action.submit_tool_outputs);
        
            // 1) Save the toolCalls array in a local variable
            const toolCalls = event.data.required_action.submit_tool_outputs.tool_calls;

            console.log('[streamStore] EXACT toolCalls array shape:', JSON.stringify(toolCalls, null, 2));
        
            // 2) If it's empty or undefined, you'll see it here
            if (!toolCalls || !Array.isArray(toolCalls) || toolCalls.length === 0) {
              console.warn('[streamStore] toolCalls is empty or invalid, skipping');
              return;
            }
        
            console.log('[streamStore] Processing tool calls now...');
        
            // 3) Build the array with run_id
            const toolCallsWithRunId = toolCalls.map((tc: any) => ({
              ...tc,
              run_id: event.data.id,
            }));
            console.log('[streamStore] toolCallsWithRunId:', JSON.stringify(toolCallsWithRunId, null, 2));
        
            // 4) Iterate
            for (const toolCall of toolCallsWithRunId) {
              console.log('[streamStore] Handling tool call:', JSON.stringify(toolCall, null, 2));
              get().handleToolCall(toolCall, threadId, event.data.id);
            }
          } else {
            console.warn('[streamStore] Unknown required_action type:', event.data?.required_action?.type);
          }
          break;
          

        // ------------- Additional steps (thread.run.step.*) -------------
        case 'thread.run.step.created':
            break;

        case 'thread.run.step.in_progress':
           break;

        case 'thread.run.step.delta':
          // Example: handle partial text deltas
          if (event.data?.delta?.step_details?.message_creation?.delta?.content) {
            const content = event.data.delta.step_details.message_creation.delta.content;
             
            if (Array.isArray(content)) {
              for (const item of content) {
                if (item.text?.value) {
                   get().appendStreamContent(item.text.value);
                } else if (item.type === 'text' && item.text) {
                    get().appendStreamContent(item.text.value);
                } else {
                  console.log('[streamStore] Unhandled content item type:', item.type);
                }
              }
            } else if (typeof content === 'string') {
               get().appendStreamContent(content);
            } else {
              console.log('[streamStore] Unhandled content type:', typeof content);
            }
            
            // Set streaming active to ensure UI shows streaming content
            if (!get().isStreamingActive) {
              set({ isStreamingActive: true });
            }
          } else {
            // Look for other potential delta content locations
            const deltaContent = get().findTextValueInObject(event.data?.delta);
            if (deltaContent) {
              // Check if the text is just "tool_calls" or similar and ignore it
              const text = deltaContent.trim().toLowerCase();
              if (text === 'tool_calls' || text === 'tool calls' || text.includes('tool calls')) {
                } else {
                 get().appendStreamContent(deltaContent);
                if (!get().isStreamingActive) {
                  set({ isStreamingActive: true });
                }
              }
            }
          }
          break;

        case 'thread.run.step.completed':
          console.log('[streamStore] Step completed:', event.data?.step_details?.type);
          break;

        case 'thread.run.step.failed':
          console.log('[streamStore] Step failed:', event.data?.step_details?.type);
          console.error('[streamStore] Step error:', event.data?.last_error);
          break;

        case 'thread.run.step.cancelled':
          console.log('[streamStore] Step cancelled');
          break;

        case 'thread.run.step.expired':
          console.log('[streamStore] Step expired');
          break;

        // ------------- Misc -------------
        case 'error':
          {
            const errorMessage = typeof event.data === 'string' ? event.data : 'Stream error';
            console.error('[streamStore] Stream error event:', errorMessage);
            set({ streamError: errorMessage, isStreamingActive: false });
          }
          break;

        default:
          console.log(`[streamStore] Unhandled event type: ${event.type}`, event);
      }
    } catch (error) {
      console.error('[streamStore] Error processing stream event:', error);
      get().handleStreamError(error instanceof Error ? error.message : String(error));
    }
  },

  /***************************************************************
   * Finalizing / Teardown
   ***************************************************************/
  endStream: (savedMessageId?: string) => {
    // Provide your logic for ending the stream
    set({
      isStreamingActive: false,
      currentMessageId: savedMessageId || null,
    });
  },

  handleStreamError: (error: any) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[streamStore] Stream error:', errorMessage);
    set({
      streamError: errorMessage,
      isStreamingActive: false,
    });
  },

  finalizeMessage: () => {
    try {
      const threadId = useLegacyChatStore.getState().currentThread?.thread_id;
      if (threadId) {
        console.log('[streamStore] Finalizing message for thread:', threadId);
        useLegacyChatStore
          .getState()
          .fetchOpenAIMessages(threadId)
          .catch((error) => {
            console.error('[streamStore] Error fetching messages during finalization:', error);
          });
      } else {
        console.warn('[streamStore] Cannot finalize message: No current thread ID');
      }
    } catch (err) {
      console.error('[streamStore] Error in finalizeMessage:', err);
    } finally {
      set({ isStreamingActive: false, isFormProcessing: false });
    }
  },

  /***************************************************************
   * Tool Handling (like PDF generation)
   ***************************************************************/

  handleToolCall: async (toolCall: any, threadId: string, runId: string) => {
    try {
      const { name, arguments: argsJson } = toolCall.function;
      const args = JSON.parse(argsJson);
  
      switch (name) {
        case 'GeneratePDFForm': {
          const { formKey, formData } = args;
  
          if (!formKey || !formData || (Array.isArray(formData) && formData.length === 0) || (!Array.isArray(formData) && Object.keys(formData).length === 0)) {
            throw new Error(`Incomplete or missing formData provided for form: ${formKey}`);
          }
  
          // Ensure formKey is supported
          const validFormKeys = Object.keys(formDefinitions);
          if (!validFormKeys.includes(formKey)) {
            throw new Error(`Unsupported form type: ${formKey}`);
          }
  
          console.log(`[streamStore] Handling GeneratePDFForm:`, { formKey, formData });
          
          // Process form data if it's an array (from the OpenAI tool call)
          let processedFormData: Record<string, any> = {};
          
          if (Array.isArray(formData)) {
            console.log('[streamStore] Form data is an array, processing...');
            // Convert array of field objects to a key-value object
            formData.forEach((field: any) => {
              if (field.name && field.value !== undefined) {
                processedFormData[field.name] = field.value;
              }
            });
            console.log('[streamStore] Processed form data:', processedFormData);
          } else {
            // Use the object as is
            processedFormData = formData;
          }
          
          // Get the form definition to determine required fields
          const formDefinition = formDefinitions[formKey];
          if (formDefinition) {
            // Extract all field names from the form definition
            const fieldNames: string[] = [];
            formDefinition.sections.forEach(section => {
              section.fields.forEach(field => {
                fieldNames.push(field.name);
              });
            });
            
            // Ensure all required fields are present with fallback values
            fieldNames.forEach(fieldName => {
              if (processedFormData[fieldName] === undefined) {
                processedFormData[fieldName] = '';
              }
            });
            
            console.log(`[streamStore] Validated form data against definition for ${formKey}`);
          }
          
          // Structure the form data properly for the PDF generator
          set({
            currentFormKey: formKey,
            formData: { 
              type: formKey, 
              data: processedFormData 
            },
            isFormProcessing: true,
            streamError: null,
          });
  
          console.log('[streamStore] Form processing started for:', formKey, 'with data:', processedFormData);
          break;
        }
  
        case 'getFormFields': {
          const { formKey } = args;
  
          if (!formKey) {
            throw new Error('No formKey provided for retrieving fields.');
          }
  
          const validFormKeys = Object.keys(formDefinitions);
          if (!validFormKeys.includes(formKey)) {
            throw new Error(`Unsupported form type requested: ${formKey}`);
          }
  
          const definition = formDefinitions[formKey];
          const requiredFields = definition.sections.flatMap((section) =>
            section.fields.map((field) => field.name)
          );
  
          set({
            currentFormKey: formKey,
            requiredFields,
            formData: {},
            isAwaitingUserInput: true,
            streamError: null,
          });

          // here we should submit_tool_outputs back to the Assistant
          const submitToolOutputs = async () => {
            try {
              const response = await fetch(`/api/openai/threads/${threadId}/run/${runId}/submit-tool-outputs`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  tool_outputs: [
                    {
                      tool_call_id: toolCall.id,
                      output: JSON.stringify({ requiredFields })
                    }
                  ],
                  stream: true
                }),
              });
              
              if (!response.ok) {
                throw new Error(`Failed to submit tool outputs: ${response.statusText}`);
              }
              
              console.log('[streamStore] Submitted tool outputs successfully');
              
              // Continue listening to the stream after submitting tool outputs
              // This ensures we receive the next response from the Assistant
              const reader = response.body?.getReader();
              if (reader) {
                // Process the stream to ensure conversation continues
                const processStream = async () => {
                  try {
                    // Set streaming active to ensure UI shows streaming content
                    set({ 
                      isStreamingActive: true,
                      currentStreamContent: '' // Reset streaming content for the new response
                    });
                    
                    while (true) {
                      const { done, value } = await reader.read();
                      if (done) {
                        console.log('[streamStore] Stream completed after tool submission');
                        break;
                      }
                      
                      // Process the chunks as they come in
                      const chunk = new TextDecoder().decode(value);
                       
                      // Parse and process events from the chunk
                      const lines = chunk.split('\n').filter(line => line.trim() !== '');
                      for (const line of lines) {
                        if (!line.trim().startsWith('data:')) continue;
                        
                        const jsonStr = line.trim().slice(5).trim();
                        if (jsonStr === '[DONE]') {
                          console.log('[streamStore] Stream completed after tool submission');
                          break;
                        }
                        
                        try {
                          const event = JSON.parse(jsonStr);
                          if (event.type) {
                            await get().processStreamEvent(event, threadId);
                          } else if (event.delta?.content) {
                            // Handle direct content deltas that might not have a type
                            const content = event.delta.content;
                            if (typeof content === 'string') {
                              get().appendStreamContent(content);
                            } else if (Array.isArray(content)) {
                              for (const item of content) {
                                if (item.text?.value) {
                                  get().appendStreamContent(item.text.value);
                                }
                              }
                            }
                          } else {
                            // Try to find any text content in the event
                            const textContent = get().findTextValueInObject(event);
                            if (textContent) {
                              get().appendStreamContent(textContent);
                            }
                          }
                        } catch (err) {
                          console.error('[streamStore] Error parsing event after tool submission:', err);
                        }
                      }
                    }
                  } catch (err) {
                    console.error('[streamStore] Error processing stream after tool submission:', err);
                    set({ streamError: (err as Error).message });
                  } finally {
                    // Ensure we properly handle stream completion
                    if (get().isStreamingActive) {
                      // Don't immediately end the stream - allow the UI to show the content
                      setTimeout(() => {
                        if (get().currentStreamContent && get().isStreamingActive) {
                          get().finalizeMessage();
                        }
                      }, 1000);
                    }
                  }
                };
                
                // Start processing the stream but don't await it
                // This allows the function to return while still processing the stream
                processStream();
              }
            } catch (error) {
              console.error('[streamStore] Error submitting tool outputs:', error);
              set({ streamError: (error as Error).message, isFormProcessing: false });
            }
          };
          
          await submitToolOutputs();
          console.log(`[streamStore] Retrieved required fields for ${formKey}:`, requiredFields);
          break;
        }
  
        default:
          console.warn('[streamStore] Unsupported function call:', name);
          set({ streamError: `Unsupported function: ${name}` });
      }
    } catch (error) {
      console.error('[streamStore] Error handling tool call:', error);
      set({ streamError: (error as Error).message, isFormProcessing: false });
    }
  },
}));

/********************************************************************
 * Optional Helper for Parsing Deltas
 *******************************************************************/
function findTextValueInObject(obj: any): string | null {
  if (!obj || typeof obj !== 'object') return null;

  if (obj.text?.value) {
    return obj.text.value;
  }
  if (obj.value && typeof obj.value === 'string') {
    return obj.value;
  }
  if (obj.content) {
    if (typeof obj.content === 'string') return obj.content;

    if (Array.isArray(obj.content) && obj.content.length > 0) {
      for (const item of obj.content) {
        if (item.text?.value) {
          return item.text.value;
        }
      }
    }
  }

  // Recursively search in nested objects
  for (const key in obj) {
    if (typeof obj[key] === 'object') {
      const result = findTextValueInObject(obj[key]);
      if (result) return result;
    }
  }
  return null;
}
