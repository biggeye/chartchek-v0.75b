'use client';

import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import { chatStore } from './chatStore';
import { StreamingState } from '../types/store/stream';
import { OpenAIStreamingEvent } from '@/types/api/openai';
import { formDefinitions } from '@/components/dynamicForms/formDefinitions';

// Initialize Supabase client
const supabase = createClient();

const getUserId = async () => {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id || 'anonymous';
};

const addMessageReference = chatStore.getState().addMessageReference;

const streamStore = create<StreamingState>((set, get) => ({
    // Core state properties
    isStreamingActive: false,
    currentStreamContent: '',
    streamError: null,
    currentRunId: null,
    abortController: null,
    
    // Additional state properties from streaming.ts
    currentFormKey: null,
    currentMessageId: null,
    isFormProcessing: false,
    formData: {},
    userId: null,
    
    // Core actions
    setIsStreamingActive: (active: boolean) => set({ isStreamingActive: active }),
    
    cancelStream: async (threadId?: string, runId?: string) => {
        if (get().abortController) {
            get().abortController!.abort();
            set({ isStreamingActive: false, abortController: null });
            console.log('[streamStore] Stream cancelled.');
            
            // If threadId and runId are provided, cancel the run on the server
            if (threadId && runId) {
                try {
                    const response = await fetch(`/api/threads/${threadId}/runs/${runId}/cancel`, {
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
    
    resetStream: () => set({ 
        isStreamingActive: true, 
        currentStreamContent: '', 
        streamError: null, 
        currentRunId: null,
        currentFormKey: null,
        currentMessageId: null,
        isFormProcessing: false,
        formData: {}
    }),
    
    // Action: Set the initial content (for textCreated event)
    setStreamContent: (content: string) => set({ currentStreamContent: content }),
    
    // Action: Append delta to the current content
    appendStreamContent: (content: string) =>
        set({ currentStreamContent: get().currentStreamContent + content }),
    
    // Action: Finalize message (move from stream state to your static chat store)
    finalizeMessage: () => {
        const threadId = chatStore.getState().currentThread?.thread_id;
        if (threadId) {
            chatStore.getState().fetchOpenAIMessages(threadId);
        }
        set({ isStreamingActive: false });
    },

    // Additional actions from streaming.ts
    endStream: (savedMessageId?: string) => {
        set({ 
            isStreamingActive: false,
            currentMessageId: savedMessageId || null
        });
    },
    
    setStreamError: (error: string | null) => set({ streamError: error }),
    
    initialize: async () => {
        try {
            const userId = await getUserId();
            set({ userId });
            return;
        } catch (error) {
            console.error('[streamStore] Error initializing:', error);
            set({ streamError: 'Failed to initialize streaming' });
        }
    },
    
    // Form handling methods
    setCurrentFormKey: (formKey: string | null) => set({ currentFormKey: formKey }),
    
    determineFormKey: async (description: string) => {
        // Simple implementation - in a real app, this might use NLP or pattern matching
        const lowerDesc = description.toLowerCase();
        
        // Check if the description matches any known form keys
        for (const key in formDefinitions) {
            if (lowerDesc.includes(key.toLowerCase())) {
                get().setCurrentFormKey(key);
                return key;
            }
        }
        
        // Default to a generic form if no match found
        return 'generic';
    },
    
    updateFormData: (data: Record<string, any>) => 
        set(state => ({ formData: { ...state.formData, ...data } })),
    
    clearFormData: () => set({ formData: {} }),
    
    setFormProcessing: (isProcessing: boolean) => set({ isFormProcessing: isProcessing }),
    
    submitForm: async (threadId: string, runId: string, toolCallId: string, formData: Record<string, any>) => {
        try {
            set({ isFormProcessing: true });
            
            const response = await fetch(`/api/threads/${threadId}/runs/${runId}/tool-outputs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tool_outputs: [
                        {
                            tool_call_id: toolCallId,
                            output: JSON.stringify(formData)
                        }
                    ]
                })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to submit form: ${response.statusText}`);
            }
            
            set({ 
                isFormProcessing: false,
                currentFormKey: null,
                formData: {}
            });
            
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to submit form';
            console.error('[streamStore] Error submitting form:', errorMessage);
            set({ 
                isFormProcessing: false,
                streamError: errorMessage
            });
            return false;
        }
    },
    
    // Stream content management
    updateStreamContent: (content: string) => set({ currentStreamContent: content }),
    
    processStreamEvent: async (event: OpenAIStreamingEvent, threadId: string) => {
        try {
            // Process different event types
            switch (event.type) {
                case 'thread.message.created':
                    if (event.data?.id) {
                        set({ currentMessageId: event.data.id });
                    }
                    break;
                    
                case 'thread.run.created':
                    if (event.data?.id) {
                        set({ currentRunId: event.data.id });
                    }
                    break;
                    
                case 'thread.run.completed':
                    get().finalizeMessage();
                    break;
                    
                case 'thread.run.failed':
                    set({ 
                        streamError: event.data?.last_error || 'Run failed',
                        isStreamingActive: false
                    });
                    break;
                    
                case 'thread.run.requires_action':
                    if (event.data?.required_action?.tool_calls) {
                        const toolCalls = event.data.required_action.tool_calls;
                        for (const toolCall of toolCalls) {
                            get().handleToolCall(toolCall);
                        }
                    }
                    break;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error processing stream event';
            console.error('[streamStore] Error processing stream event:', errorMessage);
            get().handleStreamError(errorMessage);
        }
    },
    
    // Run management
    setCurrentRunId: (runId: string | null) => set({ currentRunId: runId }),
    
    processFormToolCall: async (toolCallId: string, functionName: string, parameters: any, threadId: string, runId: string) => {
        try {
            if (functionName === 'show_form') {
                const formKey = parameters.form_key || await get().determineFormKey(parameters.description || '');
                set({ 
                    currentFormKey: formKey,
                    isFormProcessing: false
                });
            } else {
                // Handle other tool calls if needed
                console.log(`[streamStore] Unhandled function: ${functionName}`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error processing form tool call';
            console.error('[streamStore] Error processing form tool call:', errorMessage);
            get().handleStreamError(errorMessage);
        }
    },
    
    // Utility functions
    toggleStreamEnabled: () => set(state => ({ isStreamingActive: !state.isStreamingActive })),
    
    handleStreamError: (error: any) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('[streamStore] Stream error:', errorMessage);
        set({ 
            streamError: errorMessage,
            isStreamingActive: false
        });
    },
    
    // Tool handling
    handleToolCall: (toolData: any) => {
        try {
            if (toolData.type === 'function' && toolData.function) {
                const { name, arguments: argsStr } = toolData.function;
                const args = JSON.parse(argsStr);
                
                if (name === 'show_form') {
                    get().setCurrentFormKey(args.form_key || 'generic');
                }
                
                // Add handling for other tool types as needed
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error handling tool call';
            console.error('[streamStore] Error handling tool call:', errorMessage);
        }
    },
    
    setCurrentMessageId: (messageId: string | null) => set({ currentMessageId: messageId }),

    startStream: async (threadId: string, assistantId: string, additionalInstructions?: string) => {
        if (!threadId || !assistantId) {
            const errorMsg = `Missing required parameter: ${!threadId ? 'threadId' : 'assistantId'}`;
            console.error('[streamStore] ' + errorMsg);
            set({ streamError: errorMsg });
            return;
        }
       
        // Reset streaming state
        const store = get();
        store.resetStream();
        set({ isStreamingActive: true });
        const controller = new AbortController();
        set({ abortController: controller });
          try {
            console.log('[streamStore] Starting stream with additional instructions: ', additionalInstructions);
      
            const response = await fetch(`/api/threads/${threadId}/run/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    assistant_id: assistantId, 
                    thread_id: threadId,
                    additional_instructions: additionalInstructions
                }),
                signal: controller.signal,
            });

            if (!response.body) {
                throw new Error('Unable to read stream');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = ''; // Buffer to handle incomplete JSON chunks

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    console.log('[streamStore] Stream complete');
                    break;
                }
                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                // Process complete SSE messages from the buffer
                const messages = buffer.split('\n\n');
                // Keep the last item which might be incomplete
                buffer = messages.pop() || '';

                for (const message of messages) {
                    const lines = message.split('\n').filter(line => line.trim() !== '');
                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        if (!trimmedLine.startsWith('data:')) {
                            continue; // Skip non-data lines
                        }
                        const jsonStr = trimmedLine.slice(5).trim();

                        if (jsonStr === '[DONE]') {
                            console.log('[streamStore] Received DONE signal');
                            // Finalize the message when the stream is done
                            get().finalizeMessage();
                            // Close the stream (using the reader/controller, not the abort controller)
                            break;
                        }

                        try {
                            const event = JSON.parse(jsonStr);
                            
                            // Add better logging of received events
                            console.log(`[streamStore] Processing event: ${event.type || 'undefined type'}`);
                            
                            // Process the event with the new method if it has a type
                            if (event.type) {
                                get().processStreamEvent(event, threadId);
                            }
                            
                            // First handle undefined event types
                            if (!event.type) {
                                console.warn('[streamStore] Event has no type:', event);
                                
                                // Try to process it based on data structure
                                if (event.data?.content && Array.isArray(event.data.content)) {
                                    // Looks like a message creation event
                                    get().setStreamContent(event.data.content[0]?.text?.value || '');
                                } else if (event.data?.delta?.content) {
                                    // Looks like a delta event
                                    get().appendStreamContent(
                                        typeof event.data.delta.content === 'string' 
                                            ? event.data.delta.content 
                                            : event.data.delta.content[0]?.text?.value || ''
                                    );
                                }
                                continue;
                            }

                            // Handle events based on their type:
                            switch (event.type) {
                                case 'textCreated':
                                case 'thread.message.created':
                                    if (
                                      event.data &&
                                      Array.isArray(event.data.content) &&
                                      event.data.content.length > 0 &&
                                      event.data.content[0].text &&
                                      typeof event.data.content[0].text.value === 'string'
                                    ) {
                                      get().setStreamContent(event.data.content[0].text.value);
                                    } else if (
                                      event.data &&
                                      event.data.content &&
                                      typeof event.data.content === 'string'
                                    ) {
                                      // Handle case where content is a direct string
                                      get().setStreamContent(event.data.content);
                                    } else {
                                      console.warn("thread.message.created event is missing expected content structure:", event.data);
                                      get().setStreamContent("No content available");
                                    }
                                    break;
                                  
                                case 'messageDelta':
                                case 'thread.message.delta':
                                    if (event.data?.delta?.content?.[0]?.text?.value) {
                                        get().appendStreamContent(event.data.delta.content[0].text.value);
                                    } else if (event.data?.delta?.content && typeof event.data.delta.content === 'string') {
                                        // Handle case where delta content is a direct string
                                        get().appendStreamContent(event.data.delta.content);
                                    } else if (event.data?.content && Array.isArray(event.data.content) && event.data.content[0]?.text?.value) {
                                        // Some implementations might send the content directly instead of in delta
                                        get().appendStreamContent(event.data.content[0].text.value);
                                    } else if (event.data?.content && typeof event.data.content === 'string') {
                                        // Handle case where content is a direct string
                                        get().appendStreamContent(event.data.content);
                                    } else {
                                        // Last resort - try to find any text content in the event data
                                        console.warn("Unrecognized message delta format:", event.data);
                                        const textValue = findTextValueInObject(event.data);
                                        if (textValue) {
                                            get().appendStreamContent(textValue);
                                        }
                                    }
                                    break;
                                case 'messageCompleted':
                                case 'thread.message.completed':
                                    if (event.data?.delta?.content?.[0]?.text?.value) {
                                        get().appendStreamContent(event.data.delta.content[0].text.value);
                                    }
                                    get().finalizeMessage();
                                    break;
                                case 'runCreated':
                                case 'thread.run.created':
                                    if (event.data?.id) {
                                        set({ currentRunId: event.data.id });
                                    }
                                    break;
                                case 'runCompleted':
                                case 'thread.run.completed':
                                    get().finalizeMessage();
                                    break;
                                case 'runFailed':
                                case 'thread.run.failed':
                                    set({ streamError: event.data?.last_error || 'Run failed' });
                                    get().finalizeMessage();
                                    break;
                                case 'runRequiresAction':
                                case 'thread.run.requires_action':
                                    if (event.data?.required_action?.tool_calls) {
                                        const toolCalls = event.data.required_action.tool_calls;
                                        for (const toolCall of toolCalls) {
                                            get().handleToolCall(toolCall);
                                        }
                                    }
                                    break;
                                default:
                                    console.log(`[streamStore] Unhandled event type: ${event.type}`);
                            }
                        } catch (error) {
                            const errorMessage = error instanceof Error ? error.message : 'Error processing event';
                            console.error('[streamStore] Error processing event:', errorMessage);
                            get().handleStreamError(errorMessage);
                        }
                    }
                }
            }
        } catch (error: unknown) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('[streamStore] Stream aborted by user');
            } else {
                const errorMessage = error instanceof Error ? error.message : 'Stream error';
                console.error('[streamStore] Stream error:', errorMessage);
                set({ streamError: errorMessage });
            }
            set({ isStreamingActive: false });
        }
    }
}));

// Helper function to recursively search for a text value in an object
function findTextValueInObject(obj: any): string | null {
    if (!obj || typeof obj !== 'object') {
        return null;
    }
    
    // Check for common text value patterns
    if (obj.text?.value) {
        return obj.text.value;
    }
    
    if (obj.value && typeof obj.value === 'string') {
        return obj.value;
    }
    
    if (obj.content) {
        if (typeof obj.content === 'string') {
            return obj.content;
        }
        
        if (Array.isArray(obj.content) && obj.content.length > 0) {
            for (const item of obj.content) {
                if (item.text?.value) {
                    return item.text.value;
                }
            }
        }
    }
    
    // Recursively search in nested objects and arrays
    for (const key in obj) {
        if (typeof obj[key] === 'object') {
            const result = findTextValueInObject(obj[key]);
            if (result) {
                return result;
            }
        }
    }
    
    return null;
}

export const useStreamStore = streamStore;
