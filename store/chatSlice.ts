/*
  chatSlice.ts
  This slice manages chat related state including fetching thread messages and maintaining thread title.
*/

import type { Message } from '@/types/store'; // Adjust the path as needed

const createChatSlice = (set: any, get: any) => ({
  // State to hold the current thread's title
  currentThreadTitle: '',

  // Action to update current thread title
  setCurrentThreadTitle: (title: string) => set({ currentThreadTitle: title }),

  // Action to fetch thread messages from the API
  fetchThreadMessages: async (threadId: string): Promise<Message[]> => {
    try {
      const response = await fetch(`/api/threads/${threadId}/message`);
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }

      const json = await response.json();
      // Assuming json.data is an array of message objects
      const messages = (json.data || []).map((msg: any) => {
        return {
          id: msg.id,
          created_at: new Date(msg.created_at * 1000).getTime(),
          thread_id: msg.thread_id,
          role: msg.role,
          content: (Array.isArray(msg.content) && msg.content.length > 0) ? {
            type: msg.content[0].type,
            text: {
              value: msg.content[0].text.value,
              annotations: Array.isArray(msg.content[0].text.annotations) ? msg.content[0].text.annotations : []
            }
          } : { type: 'text', text: { value: '', annotations: [] } }
        };
      });

      return messages;
    } catch (error: any) {
      console.error('Error fetching thread messages:', error);
      return [];
    }
  }
});

export default createChatSlice;
