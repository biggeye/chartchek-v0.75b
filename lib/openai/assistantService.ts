// lib/chat/createThreadWithPrompt.ts
'use server'

import { createServer } from "@/utils/supabase/server";
import { getOpenAIClient } from "@/utils/openai/server";
import { ChatMessageAttachment } from "@/types/database";

import { useLegacyChatStore } from "@/store/chat/legacyChatStore";
import { useStreamStore } from "@/store/chat/streamStore";
import { useGlobalChatStore } from "@/store/chat/chatStore";

const supabase = await createServer();

async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
}


export async function assistantAdditionalStream(
  assistantId: string,
  messageContent: string,
  additionalInstructions: any = {},
  attachments: ChatMessageAttachment[] = []
): Promise<string> {
  const streamInit = useStreamStore.getInitialState();
  const legacyChatInit = useLegacyChatStore.getInitialState();
  const chatInit = useGlobalChatStore.getInitialState();

 
  
  if (!messageContent) {
    throw new Error('Message content is required');
  }
  
  try {
    const file_ids = attachments.map(attachment => attachment.file_id);
    if (assistantId) {
      
    }
    // Get the OpenAI instance
    const openai = getOpenAIClient();
    
    // Create a thread
    const thread = await openai.beta.threads.create();
    const threadId = thread.id;
    
    if (!threadId) {
      throw new Error('Failed to create thread');
    }
    

    // Add a message to the thread
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: messageContent,
      attachments: file_ids.length > 0 ? file_ids.map(id => ({ file_id: id })) : undefined
    });
    
    // Create a run with additional instructions
    await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      additional_instructions: typeof additionalInstructions === 'string' 
        ? additionalInstructions 
        : JSON.stringify(additionalInstructions)
    });
    
    // Save thread to database
    const userId = await getUserId();
    await supabase
      .from('chat_threads')
      .insert({
        user_id: userId,
        thread_id: threadId,
        assistant_id: assistantId,
        title: messageContent.substring(0, 50) + (messageContent.length > 50 ? '...' : ''),
        metadata: {
          additionalInstructions
        }
      });
    
    return threadId;
  } catch (error) {
    console.error('Error creating thread:', error);
    throw error;
  }
}