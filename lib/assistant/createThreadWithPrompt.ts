// lib/assistant/createThreadWithPrompt.ts
import { createClient } from "@/utils/supabase/client";
import OpenAI from "openai";

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
    .from("threads")
    .insert({
      thread_id: thread.id,
      assistant_id: assistantId,
      title: userPrompt.substring(0, 50) + (userPrompt.length > 50 ? "..." : ""),
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error storing thread:", error);
    throw error;
  }
  
  return thread.id;
}