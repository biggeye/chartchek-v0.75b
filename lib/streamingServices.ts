import { OpenAIStreamingResponse, OpenAIStreamingEvent } from '@/types/api/openai';

export async function streamAssistantResponse(
  threadId: string,
  assistantId: string,
  callbacks: OpenAIStreamingResponse
): Promise<{ cancel: () => void }> {
  const controller = new AbortController();
  const signal = controller.signal;

  // Use your local endpoint – adjust as needed.
  const url = `/api/threads/${threadId}/run/stream`;

  const options: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ assistantId: assistantId }),
    signal,
  };

  fetch(url, options)
    .then(async (response) => {
      if (!response.ok || !response.body) {
        const errText = await response.text();
        callbacks.onError!(new Error(errText));
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            // Handle SSE format by removing 'data: ' prefix
            const jsonLine = line.startsWith('data: ') ? line.substring(6) : line;
            if (jsonLine === '[DONE]') {
              callbacks.onEnd!();
              return;
            }
            const event: OpenAIStreamingEvent = JSON.parse(jsonLine);
            switch (event.type) {
              case 'textDelta':
                // Extract the actual delta text content
                const deltaText = event.data.delta?.value || event.data.delta;
                if (deltaText) {
                  callbacks.onTextDelta!(deltaText);
                }
                break;
              case 'messageCreated':
                // Handle message created event
                if (callbacks.onMessageCreated) {
                  callbacks.onMessageCreated(event.data);
                }
                break;
              case 'toolCall':
                if (callbacks.onToolCall) {
                  callbacks.onToolCall(event.data);
                  // When we receive a tool call, we should check if this is a run that requires action
                  // and update the run status accordingly
                  if (event.data?.id && threadId) {
                    try {
                      // After a short delay, check the run status to see if it requires action
                      setTimeout(async () => {
                        console.log('[streamAssistantResponse] Checking run status after tool call:', { threadId });
                        const chatStore = (await import('@/store/chatStore')).chatStore.getState();
                        const runStatus = await chatStore.checkActiveRun(threadId);
                        console.log('[streamAssistantResponse] Updated run status:', runStatus);
                      }, 500);
                    } catch (error) {
                      console.error('[streamAssistantResponse] Error checking run status after tool call:', error);
                    }
                  }
                }
                break;
              case 'toolCallCreated':
                if (callbacks.onToolCallCreated) {
                  callbacks.onToolCallCreated(event.data);
                } else if (callbacks.onToolCall) {
                  // Fallback to onToolCall if onToolCallCreated is not defined
                  callbacks.onToolCall(event.data);
                }
                break;
              case 'toolCallDelta':
                if (callbacks.onToolCallDelta) {
                  callbacks.onToolCallDelta(event.data);
                } else if (callbacks.onToolCall) {
                  // Fallback to onToolCall if onToolCallDelta is not defined
                  callbacks.onToolCall(event.data.snapshot || event.data);
                }
                break;
              case 'end':
                callbacks.onEnd!();
                return;
              case 'error':
                callbacks.onError!(new Error(event.data));
                return;
              default:
                console.warn('Unhandled streaming event type:', event.type);
            }
          } catch (err) {
            console.error('Error parsing streaming event:', err, 'Line:', line);
          }
        }
      }
      callbacks.onEnd!();
    })
    .catch((err) => {
      if (err.name === 'AbortError') return;
      callbacks.onError!(err);
    });

  return { cancel: () => controller.abort() };
}
