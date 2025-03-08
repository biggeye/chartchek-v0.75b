// lib/assistant/createThreadWithPrompt.ts
'use server'

import { createServer } from "@/utils/supabase/server";
import { useOpenAI } from "../contexts/OpenAIProvider";
import { ChatMessageAttachment } from "@/types/database";

const supabase = await createServer();

const getUserId = async (): Promise<string> => {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id || 'anonymous';
};


interface CreateThreadWithPromptOptions {
  assistantId: string;
  userPrompt: string;
  patient: any;
  evaluations?: any[];
  appointments?: any[];
  vitalSigns?: any[];
  attachments?: ChatMessageAttachment[];
}

export async function createThreadWithPrompt(options: CreateThreadWithPromptOptions): Promise<string> {
  const { 
    assistantId, 
    userPrompt, 
    patient, 
    evaluations = [], 
    appointments = [], 
    vitalSigns = [],
    attachments = []
  } = options;

  const patientContext = {
    patient,
    evaluations: evaluations || [],
    appointments: appointments || [],
    vitalSigns: vitalSigns || []
  };

  try {
    // Get the OpenAI instance
    const { openai, isLoading, error } = useOpenAI();
    
    // Create a thread directly using the OpenAI SDK
    const thread = await openai!.beta.threads.create();
    const threadId = thread.id;
    
    if (!threadId) {
      throw new Error('Failed to create thread');
    }
    
    // Format the message content as JSON string to ensure consistent storage format
    const messageContent = JSON.stringify({ text: userPrompt });
    
    // Extract file_ids from attachments
    const file_ids = attachments.map(attachment => attachment.file_id);
    
    // Add a message to the thread with the formatted content
    await openai!.beta.threads.messages.create(threadId, {
      role: "user",
      content: messageContent,
      attachments: file_ids.length > 0 ? file_ids.map(id => ({ file_id: id })) : undefined
    });
    
    // Create a run on the thread
    const run = await openai!.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      additional_instructions: JSON.stringify(patientContext)
    });
    
    // Get the user ID
    const userId = await getUserId();
    
    // Save to database
    const { data, data: dataError } = await supabase
      .from('chat_threads')
      .insert({
        user_id: userId,
        thread_id: threadId,
        assistant_id: assistantId,
        // Add metadata with patient context flag and basic information if a patient is provided
        metadata: patient ? {
          has_patient_context: true,
          patient_id: patient.casefile_id || patient.id,
          patient_name: `${patient.first_name} ${patient.last_name}`
        } : {
          has_patient_context: false
        }
      })
      .select()
      .single();
      
    if (dataError) {
      console.error('Error saving thread to database:', error);
    }
    
    return threadId;
  } catch (dataError) {
    console.error('Error creating thread with prompt:', dataError);
    throw dataError;
  }
}
