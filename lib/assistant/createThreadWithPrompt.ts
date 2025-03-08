// lib/assistant/createThreadWithPrompt.ts
'use server'

import { createServer } from "@/utils/supabase/server";
import { getOpenAIClient } from "@/utils/openai/server";
import { ChatMessageAttachment } from "@/types/database";

const supabase = await createServer();

async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
}

/**
 * Creates a new thread with an initial prompt and starts a run
 * @param assistantId The ID of the assistant to use
 * @param messageContent The content of the initial message
 * @param attachments Optional file attachments for the message
 * @param patientContext Optional patient context to include in the run
 * @returns The ID of the created thread
 */
export async function createThreadWithPrompt(
  assistantId: string,
  messageContent: string,
  attachments: ChatMessageAttachment[] = [],
  patientContext: any = {}
): Promise<string> {
  if (!assistantId) {
    throw new Error('Assistant ID is required');
  }
  
  if (!messageContent) {
    throw new Error('Message content is required');
  }
  
  // Format the message content
  messageContent = messageContent.trim();
  
  if (patientContext && Object.keys(patientContext).length > 0) {
    console.log('Including patient context:', JSON.stringify(patientContext, null, 2));
  }

  try {
    // Get the OpenAI instance
    const openai = getOpenAIClient();
    
    // Create a thread directly using the OpenAI SDK
    const thread = await openai.beta.threads.create();
    const threadId = thread.id;
    
    if (!threadId) {
      throw new Error('Failed to create thread');
    }
    
    // Extract file IDs from attachments
    const file_ids = attachments.map(attachment => attachment.file_id);
    
    // Add a message to the thread with the formatted content
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: messageContent,
      attachments: file_ids.length > 0 ? file_ids.map(id => ({ file_id: id })) : undefined
    });
    
    // Create a run on the thread
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      additional_instructions: JSON.stringify(patientContext)
    });
    
    const userId = await getUserId();
    
    // Save to database
    const { data, error: dataError } = await supabase
      .from('chat_threads')
      .insert({
        user_id: userId,
        thread_id: threadId,
        assistant_id: assistantId,
        title: messageContent.substring(0, 50) + (messageContent.length > 50 ? '...' : ''),
        metadata: {
          patientContext: patientContext
        }
      })
      .select()
      .single();
      
    if (dataError) {
      console.error('Error saving thread to database:', dataError);
    }
    
    return threadId;
  } catch (dataError) {
    console.error('Error creating thread with prompt:', dataError);
    throw dataError;
  }
}
