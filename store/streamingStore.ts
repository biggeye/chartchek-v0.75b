import { create } from 'zustand';
import { useChatStore, updateMessageMetadata, isTerminalState } from './chatStore';
import { StreamingState } from '@/types/store/streaming';
import { OpenAIStreamingEvent } from '@/types/api/openai';
import { createClient } from '@/utils/supabase/client';
import { formDefinitions } from '@/lib/forms/formDefinitions';

// Initialize Supabase client
const supabase = createClient();

// Helper function to fetch user ID from Supabase
async function fetchUserIdFromSupabase() {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id;
}

// Function to store run data in Supabase
async function storeRunData(run: any) {
  try {
    // First get the user ID
    const userId = await fetchUserIdFromSupabase();
    
    // Log the run data, particularly focusing on required_action
    console.log('[storeRunData] Processing run data:', {
      runId: run.id,
      status: run.status,
      hasRequiredAction: !!run.required_action,
      requiredActionType: run.required_action?.type,
      // Log both possible paths for tool calls
      hasToolCalls: !!(
        run.required_action?.submit_tool_outputs?.tool_calls?.length ||
        run.required_action?.tool_calls?.length
      ),
      toolCallsCount: (
        run.required_action?.submit_tool_outputs?.tool_calls?.length ||
        run.required_action?.tool_calls?.length ||
        0
      )
    });
    
    const { data, error } = await supabase
      .from('thread_runs')
      .insert([
        {
          run_id: run.id,
          thread_id: run.thread_id,
          assistant_id: run.assistant_id,
          user_id: userId,
          status: run.status,
          started_at: run.started_at ? new Date(run.started_at * 1000) : null,
          completed_at: run.completed_at ? new Date(run.completed_at * 1000) : null,
          cancelled_at: run.cancelled_at ? new Date(run.cancelled_at * 1000) : null,
          failed_at: run.failed_at ? new Date(run.failed_at * 1000) : null,
          expires_at: run.expires_at ? new Date(run.expires_at * 1000) : null,
          last_error: run.last_error,
          model: run.model,
          instructions: run.instructions,
          tools: run.tools,
          metadata: run.metadata,
          required_action: run.required_action,
          // Usage data if available
          prompt_tokens: run.usage?.prompt_tokens,
          completion_tokens: run.usage?.completion_tokens,
          total_tokens: run.usage?.total_tokens,
          // Config parameters if available
          temperature: run.temperature,
          top_p: run.top_p,
          max_prompt_tokens: run.max_prompt_tokens,
          max_completion_tokens: run.max_completion_tokens,
          truncation_strategy: run.truncation_strategy,
          response_format: run.response_format,
          tool_choice: run.tool_choice,
          parallel_tool_calls: run.parallel_tool_calls
        },
      ]);
    if (error) {
      throw error;
    }
    console.log('[streamingStore] Stored run data:', data);
    return data;
  } catch (error) {
    console.error('[streamingStore] Error storing run data:', error);
    return null;
  }
}

// Function to handle new function submissions
async function submitNewFunction(params: any) {
  console.log('[streamingStore] Submitting new function:', params);
  // Implementation here
}

// Function to handle EOB summary submissions
async function submitEobSummary(params: any) {
  console.log('[streamingStore] Submitting EOB summary:', params);
  // Implementation here
}

export const useStreamingStore = create<StreamingState>((set, get) => ({
  isStreamingActive: false,
  currentStreamContent: '',
  streamError: null,
  currentFormKey: null, // For form handling
  currentMessageId: null, // For tracking the OpenAI message ID
  
  startStream: () => {
    console.log('[streamingStore] Starting stream session');
    
    // Update the chat store active run status
    const chatStore = useChatStore.getState();
    chatStore.updateActiveRunStatus({
      isActive: true,
      status: 'in_progress'
    });
    
    set({
      isStreamingActive: true,
      currentStreamContent: '',
      streamError: null,
      currentMessageId: null, // Reset message ID when starting a new stream
    });
  },

  appendStream: (delta: string) => {
    if (!delta) return; // Skip empty deltas
    
    set((state: StreamingState) => {
      const newContent = state.currentStreamContent + delta;
      return {
        currentStreamContent: newContent,
      };
    });
  },

  cancelStream: () => {
    console.log('[streamingStore] Cancelling stream session');
    set((state: StreamingState) => {
      // Don't do anything if we're not streaming
      if (!state.isStreamingActive) {
        return state;
      }
      
      // Update the run status to cancelled - this is a terminal state
      const chatStore = useChatStore.getState();
      chatStore.updateActiveRunStatus({
        isActive: false,
        status: 'cancelled' // This is a terminal state
      });
      
      return {
        isStreamingActive: false,
        currentStreamContent: '',
        streamError: state.streamError || 'Stream was cancelled',
        currentMessageId: null, // Reset message ID
      };
    });
  },

  endStream: () => {
    console.log('[streamingStore] Ending stream session');
    set((state: StreamingState) => {
      // Don't do anything if we're not streaming or have an empty stream content
      if (!state.isStreamingActive || !state.currentStreamContent.trim()) {
        console.warn('[streamingStore] No content to hand off or stream not active');
        return {
          isStreamingActive: false,
          currentStreamContent: '',
          streamError: null,
          currentMessageId: null, // Reset message ID
        };
      }
      
      try {
        // Handoff: add the finalized message to the chat store
        console.log('[streamingStore] Handing off streamed content to chat store');
        
        // Save the message to the database
        const chatStore = useChatStore.getState();
        const threadId = chatStore.currentThread?.thread_id;
        
        if (threadId) {
          console.log(`[streamingStore] Saving assistant message to thread: ${threadId}`);
          // First, add the message to the chat store
          chatStore.addAssistantMessage(
            state.currentStreamContent, 
            state.currentMessageId || '' // Provide empty string as fallback
          )
            .then((savedMessageId) => {
              console.log(`[streamingStore] Successfully saved assistant message with ID: ${savedMessageId}`);
              
              // Update message metadata if needed (for form keys, etc.)
              if (state.currentFormKey) {
                updateMessageMetadata(savedMessageId, { formKey: state.currentFormKey });
              }
              
              // Update run status to completed - this is a terminal state
              chatStore.updateActiveRunStatus({
                isActive: false,
                status: 'completed' // This is a terminal state
              });
              
              console.log('[streamingStore] Updated run status to completed (terminal state)');
            })
            .catch((error) => {
              console.error('[streamingStore] Error saving assistant message:', error);
              
              // Update run status to failed on error - this is a terminal state
              chatStore.updateActiveRunStatus({
                isActive: false,
                status: 'failed' // This is a terminal state
              });
            });
        } else {
          console.warn('[streamingStore] No thread ID found, cannot save assistant message');
          
          // Update run status to completed even without threadId - this is a terminal state
          chatStore.updateActiveRunStatus({
            isActive: false,
            status: 'completed' // This is a terminal state
          });
        }
        
        return {
          isStreamingActive: false,
          currentStreamContent: '',
          streamError: null,
          currentMessageId: null, // Reset message ID
        };
      } catch (error) {
        console.error('[streamingStore] Error during handoff to chat store:', error);
        
        // Update run status to failed on error - this is a terminal state
        const chatStore = useChatStore.getState();
        chatStore.updateActiveRunStatus({
          isActive: false,
          status: 'failed' // This is a terminal state
        });
        
        return {
          isStreamingActive: false,
          currentStreamContent: '',
          streamError: error instanceof Error ? error.message : 'Unknown error during stream handoff',
          currentMessageId: null, // Reset message ID
        };
      }
    });
  },

  setStreamError: (error: string) => {
    console.error('[streamingStore] Error:', error);
    
    // Update the run status to failed - this is a terminal state
    const chatStore = useChatStore.getState();
    chatStore.updateActiveRunStatus({
      isActive: false,
      status: 'failed' // This is a terminal state
    });
    
    set({
      streamError: error,
      isStreamingActive: false,
      currentMessageId: null, // Reset message ID
    });
  },

  handleToolCall: (toolData: any) => {
    console.log('[streamingStore] Tool call received:', JSON.stringify(toolData, null, 2));
    
    // Determine the type of tool call event
    if (typeof toolData === 'object') {
      if (toolData.type === 'function') {
        // Handle function tool call
        console.log('[streamingStore] Processing function tool call:', JSON.stringify(toolData, null, 2));
        console.log('[streamingStore] Function name:', toolData.function?.name);
        console.log('[streamingStore] Function arguments:', toolData.function?.arguments);
        
        // Store the tool call ID for later submission of outputs if needed
        const toolCallId = toolData.id;
        if (toolCallId) {
          console.log(`[streamingStore] Tool call ID: ${toolCallId}`);
        }
        
        // Check for dynamic form generation
        if (toolData.function && 
            (toolData.function.name === 'generate_form' || 
             toolData.function.name === 'dynamicForm' ||
             toolData.function.name === 'showForm')) {
          try {
            console.log('[streamingStore] Attempting to process form generation');
            
            // Parse the arguments to get the form key
            let formArgs;
            let formKey = null;
            
            try {
              // First attempt to parse as JSON
              if (typeof toolData.function.arguments === 'string' && toolData.function.arguments.trim()) {
                // Check if the string is complete JSON
                if (toolData.function.arguments.startsWith('{') && !toolData.function.arguments.endsWith('}')) {
                  // Incomplete JSON, use a default form key
                  console.log('[streamingStore] Incomplete JSON detected in arguments, using fallback form');
                  formKey = 'application_orientation_verification'; // Fallback to a default form
                } else {
                  try {
                    formArgs = JSON.parse(toolData.function.arguments || '{}');
                    console.log('[streamingStore] Parsed form arguments:', formArgs);
                    
                    // Extract form key from potential properties
                    const possibleKeys = ['form_key', 'formKey', 'form', 'key', 'name', 'type'];
                    for (const key of possibleKeys) {
                      if (formArgs && formArgs[key] && typeof formArgs[key] === 'string') {
                        formKey = formArgs[key];
                        console.log(`[streamingStore] Found form key "${formKey}" in property "${key}"`);
                        break;
                      }
                    }
                  } catch (parseErr) {
                    console.error('[streamingStore] Error parsing form arguments:', parseErr);
                    // If parsing fails, treat the whole argument as a form key if it's a simple string
                    if (typeof toolData.function.arguments === 'string' && !toolData.function.arguments.includes('{')) {
                      formKey = toolData.function.arguments.trim();
                      console.log(`[streamingStore] Using raw arguments as form key: "${formKey}"`);
                    } else {
                      formKey = 'application_orientation_verification'; // Default fallback
                      console.log(`[streamingStore] Using default form key: "${formKey}"`);
                    }
                  }
                }
              } else if (!toolData.function.arguments || toolData.function.arguments === '{}') {
                // No arguments provided, use default
                formKey = 'application_orientation_verification';
                console.log(`[streamingStore] No arguments provided, using default form key: "${formKey}"`);
              }
            } catch (err) {
              console.error('[streamingStore] Error processing form arguments:', err);
              formKey = 'application_orientation_verification'; // Default fallback
            }
            
            // Directly set the form key if we determined one
            if (formKey) {
              console.log(`[streamingStore] Setting current form key directly: "${formKey}"`);
              get().setCurrentFormKey(formKey);
            } else {
              // If no form key was determined, still attempt to process via the standard mechanism
              console.log('[streamingStore] No form key determined, trying standard processing');
              get().processAssistantResponse({
                function_calls: [{
                  name: 'dynamicForm',
                  arguments: JSON.stringify({ form_key: 'application_orientation_verification' })
                }]
              });
            }
          } catch (err) {
            console.error('[streamingStore] Error processing form tool call:', err);
            // Final fallback - set a default form
            get().setCurrentFormKey('application_orientation_verification');
          }
        } else if (toolCallId) {
          // This is a non-form tool call that may need outputs
          console.log(`[streamingStore] Non-form tool call received with ID: ${toolCallId}`);
          
          // Check if we need to handle this tool call specifically
          // For example, you might have different handlers for different tool types
          switch(toolData.function?.name) {
            case 'get_kipu_data':
            case 'get_facility_data':
              // These tool calls might be handled by specific functions that submit outputs
              console.log(`[streamingStore] Received tool call for ${toolData.function?.name}, should be handled separately`);
              break;
            default:
              // For any other tool calls, we just log and leave it for manual handling
              console.log(`[streamingStore] Received tool call for ${toolData.function?.name || 'unknown function'}`);
              console.log('[streamingStore] Tool call details:', {
                id: toolData.id,
                name: toolData.function?.name,
                hasArguments: !!toolData.function?.arguments,
                argumentsLength: toolData.function?.arguments?.length || 0
              });
              
              // If we have full tool call data, log it for debugging
              if (toolData.id && toolData.function) {
                console.log('[streamingStore] Full tool call that may require output:', {
                  id: toolData.id,
                  function: {
                    name: toolData.function.name,
                    arguments: toolData.function.arguments
                  }
                });
              }
              
              // Update the active run status to indicate it requires action
              const chatStore = useChatStore.getState();
              if (chatStore.currentThread?.thread_id) {
                // Refresh the run status to ensure we have the latest details
                chatStore.checkActiveRun(chatStore.currentThread.thread_id);
              }
              break;
          }
        }
      } else if (toolData.delta) {
        // Handle tool call delta updates
        console.log('[streamingStore] Processing tool call delta:', toolData.delta);
      } else {
        // Generic tool call handling
        console.log('[streamingStore] Processing generic tool call data:', JSON.stringify(toolData, null, 2));
      }
    }
  },
  
  // Sets the current form key for rendering dynamic forms
  setCurrentFormKey: (formKey: string | null) => {
    console.log('[streamingStore] Setting current form key:', formKey);

    if (formKey && !formDefinitions[formKey]) {
      console.warn(`[streamingStore] WARNING: Form key "${formKey}" does not exist in formDefinitions.`);
      // We still set the unknown formKey to show the fallback form
    }

    set({ currentFormKey: formKey });
  },
  
  // Set the current message ID from the OpenAI response
  setCurrentMessageId: (id: string) => {
    console.log(`[streamingStore] Setting current message ID: ${id}`);
    set({ currentMessageId: id });
  },
  
  // Process assistant response to handle function calls
  processAssistantResponse: (response: any) => {
    console.log('[streamingStore] Processing assistant response:', JSON.stringify(response, null, 2));
    
    // Handle different response formats
    if (response && response.functionCall) {
      // Legacy format
      const { functionName, parameters } = response.functionCall;
      console.log('[streamingStore] Processing legacy function call format:', functionName, parameters);
      
      processFunction(functionName, parameters, get);
    } else if (response && response.function_calls && Array.isArray(response.function_calls)) {
      // New format with function_calls array
      console.log('[streamingStore] Processing function_calls array format');
      
      response.function_calls.forEach((call: any) => {
        const functionName = call.name;
        let parameters;
        
        try {
          // Try to parse the arguments if they're a string
          if (typeof call.arguments === 'string') {
            parameters = JSON.parse(call.arguments);
          } else {
            parameters = call.arguments;
          }
        } catch (error) {
          console.error('[streamingStore] Error parsing function arguments:', error);
          parameters = call.arguments || {};
        }
        
        console.log('[streamingStore] Processing function call:', functionName, parameters);
        processFunction(functionName, parameters, get);
      });
    } else {
      console.log('[streamingStore] No recognized function call format in response');
    }
  },
  
  cancelRun: async (threadId: string, runId: string): Promise<boolean> => {
    try {
      console.log(`[streamingStore:cancelRun] Cancelling run ${runId} in thread ${threadId}`);
      
      const response = await fetch(`/api/threads/${threadId}/run/${runId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[streamingStore:cancelRun] API error:`, errorData);
        return false;
      }
      
      const data = await response.json();
      console.log(`[streamingStore:cancelRun] Run cancelled:`, data);
      
      return true;
    } catch (err: any) {
      console.error(`[streamingStore:cancelRun] Error:`, err);
      return false;
    }
  },
  
  storeRunData: async (run: any) => {
    console.log('[streamingStore] Storing run data:', run);
    await storeRunData(run);
  },
  
  submitNewFunction: async (params: any) => {
    console.log('[streamingStore] Submitting new function:', params);
    await submitNewFunction(params);
  },
  
  submitEobSummary: async (params: any) => {
    console.log('[streamingStore] Submitting EOB summary:', params);
    await submitEobSummary(params);
  },
  
  submitToolOutputs: async (
    threadId: string,
    runId: string,
    toolOutputs: Array<{ tool_call_id: string; output: string }>
  ): Promise<boolean> => {
    try {
      console.log('[streamingStore] Submitting tool outputs:', {
        threadId,
        runId,
        toolOutputsCount: toolOutputs.length,
        toolOutputs
      });

      const response = await fetch(`/api/threads/${threadId}/run/${runId}/submit-tool-outputs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_outputs: toolOutputs,
          stream: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null) || { error: `HTTP Error ${response.status}` };
        console.error('[streamingStore] Failed to submit tool outputs:', errorData);
        return false;
      }

      const contentType = response.headers.get('content-type');
      let responseData;

      try {
        // Handle different response formats
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
          console.log('[streamingStore] Tool output submission success (JSON):', responseData);
        } else {
          // For stream or other formats, just log success
          console.log('[streamingStore] Tool output submission success (stream)');
        }
      } catch (parseError) {
        console.warn('[streamingStore] Could not parse response, but request was successful:', parseError);
      }

      // After successful submission, update the run status
      const chatStore = useChatStore.getState();
      if (chatStore.currentThread?.thread_id) {
        // Wait a moment for the server to process the submission
        setTimeout(() => {
          chatStore.checkActiveRun(threadId);
        }, 1000);
      }

      return true;
    } catch (error: any) {
      console.error('[streamingStore] Error submitting tool outputs:', error);
      return false;
    }
  }
}));

// Helper Functions

/**
 * Process a function call with the given name and parameters
 */
function processFunction(functionName: string, parameters: any, get: any) {
  console.log(`[streamingStore] Processing function: ${functionName} with parameters:`, parameters);

  // Handle form-related functions with various possible names
  const formFunctionNames = ['dynamicForm', 'generate_form', 'showForm', 'createForm'];
  if (formFunctionNames.includes(functionName)) {
    processFormFunction(parameters, get);
    return;
  }

  // Handle other function types
  switch (functionName) {
    case 'eobSummary':
      submitEobSummary(parameters);
      break;
    case 'StoreNewFunction':
      submitNewFunction(parameters);
      break;
    default:
      console.warn(`[streamingStore] No handler for function: ${functionName}`);
  }
}

/**
 * Process a form function call and update relevant state
 */
function processFormFunction(parameters: any, get: any) {
  console.log('[streamingStore] Processing form function with parameters:', parameters);
  
  // Extract form key from parameters, checking multiple possible property names
  let formKey = null;
  const possibleKeys = ['form_key', 'formKey', 'form', 'key', 'name', 'type'];
  
  try {
    // First check if parameters is a JSON string and parse it
    if (typeof parameters === 'string') {
      if (parameters.trim().startsWith('{')) {
        try {
          // If it's JSON-like, try to parse it
          if (parameters.includes('}')) {
            const parsedParams = JSON.parse(parameters);
            // If parsing succeeds, look for a form key in the parsed object
            for (const key of possibleKeys) {
              if (parsedParams && parsedParams[key] && typeof parsedParams[key] === 'string') {
                formKey = parsedParams[key];
                console.log(`[streamingStore] Found form key "${formKey}" in parsed parameter property "${key}"`);
                break;
              }
            }
          } else {
            // Incomplete JSON, use fallback
            console.log('[streamingStore] Incomplete JSON detected in parameters, using fallback form');
            formKey = 'application_orientation_verification';
          }
        } catch (parseErr) {
          // If parsing fails, treat the whole string as a form key
          console.error('[streamingStore] Error parsing form parameters JSON:', parseErr);
          // Check if the string could be a direct form key (not containing JSON syntax)
          if (!parameters.includes('{') && !parameters.includes('}')) {
            formKey = parameters.trim();
            console.log(`[streamingStore] Using raw string parameters as form key: "${formKey}"`);
          } else {
            formKey = 'application_orientation_verification'; // Default fallback
            console.log(`[streamingStore] Using default form key after JSON parse error: "${formKey}"`);
          }
        }
      } else {
        // If it's not JSON, use the whole string as a form key
        formKey = parameters.trim();
        console.log(`[streamingStore] Using string parameters as form key: "${formKey}"`);
      }
    } else if (typeof parameters === 'object' && parameters !== null) {
      // If parameters is already an object, look for form keys
      for (const key of possibleKeys) {
        if (parameters[key] && typeof parameters[key] === 'string') {
          formKey = parameters[key];
          console.log(`[streamingStore] Found form key "${formKey}" in parameter property "${key}"`);
          break;
        }
      }
    }
    
    // If no form key found through extraction, use a default
    if (!formKey) {
      // Check if parameters itself is usable as a form key
      if (typeof parameters === 'string' && parameters.trim() && !parameters.includes('{')) {
        formKey = parameters.trim();
        console.log(`[streamingStore] Using parameters as form key: "${formKey}"`);
      } else if (typeof parameters === 'object' && parameters !== null && Object.keys(parameters).length === 0) {
        // Empty object, use default form
        formKey = 'application_orientation_verification';
        console.log(`[streamingStore] Empty parameters object, using default form key: "${formKey}"`);
      } else {
        // Final fallback: use a default form
        formKey = 'application_orientation_verification';
        console.log(`[streamingStore] No valid form key found, using default: "${formKey}"`);
      }
    }
  } catch (err) {
    console.error('[streamingStore] Error extracting form key:', err);
    formKey = 'application_orientation_verification'; // Default fallback
  }

  if (formKey && typeof formKey === 'string') {
    // Check if the form key exists in formDefinitions
    const formExists = formKey in formDefinitions;
    if (!formExists) {
      console.warn(`[streamingStore] Form key "${formKey}" not found in formDefinitions. The fallback form will be shown.`);
      
      // We could optionally log to your analytics or error tracking system here
      // This helps track which form keys are being requested but not defined
      try {
        // Record the missing form key to help identify forms that need to be created
        supabase
          .from('missing_form_keys')
          .insert([{ 
            form_key: formKey, 
            timestamp: new Date().toISOString(),
            context: 'processFormFunction'
          }])
          .then(({ error }) => {
            if (error) console.error('[streamingStore] Error logging missing form key:', error);
          });
      } catch (logErr) {
        console.error('[streamingStore] Error logging missing form key:', logErr);
      }
    }

    console.log(`[streamingStore] Setting current form key: "${formKey}"`);
    get().setCurrentFormKey(formKey);
    
    // Update the latest assistant message with the form key
    const chatStore = useChatStore.getState();
    if (chatStore.currentThread && chatStore.currentThread.messages && chatStore.currentThread.messages.length > 0) {
      // Find the most recent assistant message
      const messages = [...chatStore.currentThread.messages];
      const lastAssistantMessageIndex = messages
        .map((msg, index) => ({ role: msg.role, index }))
        .filter(item => item.role === 'assistant')
        .pop()?.index;
      
      if (lastAssistantMessageIndex !== undefined) {
        console.log(`[streamingStore] Updating message at index ${lastAssistantMessageIndex} with form key`);
        // Update the message metadata with the form key
        const updatedMessages = [...messages];
        updatedMessages[lastAssistantMessageIndex] = {
          ...updatedMessages[lastAssistantMessageIndex],
          metadata: {
            ...updatedMessages[lastAssistantMessageIndex].metadata,
            formKey
          }
        };
        
        // Update the messages in the chat store
        chatStore.setCurrentMessages(updatedMessages);
        
        // Update the message in Supabase
        const msgId = updatedMessages[lastAssistantMessageIndex].id;
        if (msgId) {
          updateMessageMetadata(msgId, { formKey });
        }
      }
    }
  } else {
    console.warn('[streamingStore] Form function call missing form key in parameters:', parameters);
  }
}
