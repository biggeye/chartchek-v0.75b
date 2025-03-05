'use client';

import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import { chatStore } from './chatStore';
import { NewStreamingState } from '@/types/store/newStream';

// Initialize Supabase client
const supabase = createClient();

const getUserId = async () => {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id || 'anonymous';
};

const addMessageReference = chatStore.getState().addMessageReference;

const newStreamingStore = create<NewStreamingState>((set, get) => ({
    isStreamingActive: false,
    currentStreamContent: '',
    streamError: null,
    currentRunId: null,
    abortController: null,
    // Action: Initialize the stream state
    setIsStreamingActive: (active: boolean) => set({ isStreamingActive: active }),
    cancelStream: () => {
        if (get().abortController) {
            get().abortController!.abort();
            set({ isStreamingActive: false, abortController: null });
            console.log('[streamingStore] Stream cancelled.');
        }
    },
    resetStream: () => set({ isStreamingActive: true, currentStreamContent: '', streamError: null, currentRunId: null }),
    // Action: Set the initial content (for textCreated event)
    setStreamContent: (content: string) => set({ currentStreamContent: content }),
    // Action: Append delta to the current content
    appendStreamContent: (content: string) =>
        set({ currentStreamContent: get().currentStreamContent + content }),
    // Action: Finalize message (move from stream state to your static chat store)
    finalizeMessage: () => {
        const threadId = chatStore.getState().currentThread?.thread_id;
      chatStore.getState().fetchOpenAIMessages(threadId!);
      set({ isStreamingActive: false });
    },

    startStream: async (threadId: string, assistantId: string) => {
        if (!threadId || !assistantId) {
            const errorMsg = `Missing required parameter: ${!threadId ? 'threadId' : 'assistantId'}`;
            console.error('[streamingStore] ' + errorMsg);
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
            const response = await fetch(`/api/threads/${threadId}/run/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assistant_id: assistantId, thread_id: threadId }),
                signal: controller.signal,
            });

            if (!response.body) {
                throw new Error('Unable to read stream');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    console.log('[streamingStore] Stream complete');
                    break;
                }
                const chunk = decoder.decode(value, { stream: true });

                // Split into individual SSE lines
                const lines = chunk.split('\n').filter(line => line.trim() !== '');
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine.startsWith('data:')) {
                        continue; // Skip non-data lines
                    }
                    const jsonStr = trimmedLine.slice(5).trim();

                    if (jsonStr === '[DONE]') {
                        console.log('[streamingStore] Received DONE signal');
                        // Finalize the message when the stream is done
                        get().finalizeMessage();
                        // Close the stream (using the reader/controller, not the abort controller)
                        break;
                    }

                    try {
                        const event = JSON.parse(jsonStr);

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
                                } else {
                                  console.warn("thread.message.created event is missing expected content structure:", event.data);
                                  // Optionally, set a default or handle the error gracefully.
                                  get().setStreamContent("No content available");
                                }
                                break;
                              
                            case 'messageDelta':
                            case 'thread.message.delta':
                                // Append incremental updates to current content
                                if (event.data?.delta?.content) {
                                    get().appendStreamContent(event.data.delta.content[0].text.value);
                                }
                                break;
                            case 'messageCompleted':
                            case 'thread.message.completed':
                                // Append any final delta and then finalize the message
                                if (event.data?.delta?.content) {
                                    get().appendStreamContent(event.data.delta.content[0].text.value);
                                }
                                get().finalizeMessage();
                                break;
                            // Add additional event types (like run events) as needed:
                            case 'thread.run.created':
                            case 'thread.run.in_progress':
                            case 'thread.run.completed':
                            case 'thread.run.failed':
                            case 'thread.run.cancelled':
                                if (event.data?.id) {
                                    set({ currentRunId: event.data.id });
                                }
                                console.log(`[streamingStore] Run event received: ${event.type}`, event.data);
                                break;
                            case 'error':
                                console.error('[streamingStore] Error event:', event.data);
                                set({ streamError: event.data });
                                break;
                            default:
                                console.warn('[streamingStore] Unhandled event type:', event.type, event.data);
                        }
                    } catch (err) {
                        console.error('[streamingStore] Error parsing event JSON:', err, 'Line:', jsonStr);
                    }
                }
            }
        } catch (error) {
            console.error('[streamingStore] Streaming error:', error);
            set({ streamError: error instanceof Error ? error.message : String(error) });
        } finally {
            get().finalizeMessage();
            set({ isStreamingActive: false, abortController: null });
        }
    },

}));

export const useNewStreamingStore = newStreamingStore;