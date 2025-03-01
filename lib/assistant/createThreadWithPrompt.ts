// lib/assistant/createThreadWithPrompt.ts
import { createClient } from "@/utils/supabase/client";
import OpenAI from "openai";
// wrap in a function
// Initialize Supabase client
const supabase = createClient();

// Create a function to get the user ID that doesn't use top-level await
const userId = async () => {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id || 'anonymous';
};

export async function createThreadWithPrompt({
  assistantId,
  userPrompt,
  patient,
  evaluations = [],
  appointments = [],
  vitalSigns = []
}: {
  assistantId: string;
  userPrompt: string;
  patient: any;
  evaluations?: any[];
  appointments?: any[];
  vitalSigns?: any[];
}) {
  const supabase = createClient();
  const openai = new OpenAI({
    dangerouslyAllowBrowser: true,
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  })
  
  // Create a thread
  const thread = await openai.beta.threads.create();
  
  // Create a system message with patient context
  const patientContext = {
    patient: patient,
    evaluations: evaluations || [],
    appointments: appointments || [],
    vitalSigns: vitalSigns || []
  };
  
  // Add the system message with patient context
  await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: JSON.stringify(patientContext), // later switch to additional_instructions
  });
  
  // Add the user prompt
  await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: JSON.stringify({ type: "text", text: userPrompt }),
  });
  
  // Store the thread in Supabase
  const { data, error } = await supabase
    .from("chat_threads")
    .insert({
      user_id: await userId(),
      thread_id: thread.id,
      assistant_id: assistantId,
      title: userPrompt.substring(0, 50) + (userPrompt.length > 50 ? "..." : ""),
      metadata: [
        { key:                          "patientContext", value: JSON.stringify(patientContext) },
        { key: "user_id", value: await userId() },
        { key: "assistant_id", value: assistantId }
      ]
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error storing thread:", error);
    throw error;
  }
  
  return thread.id;
}