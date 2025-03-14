// src/services/openai/toolHandlers.ts
import { createServer } from "@/utils/supabase/server";
import { getOpenAIClient } from "@/utils/openai/server";
import { BioPsychSocialAssessment } from "@/types/pdf/biopsychsocialassessment";

type ToolCall = {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
};

export async function handleToolCalls(toolCalls: ToolCall[], threadId: string, runId: string) {
  const outputs = [];

  for (const call of toolCalls) {
    try {
      switch (call.function.name) {
        case "BioPsychSocialAssessmentForm":
          const args = JSON.parse(call.function.arguments);
          const pdfUrl = await generateBioPsychSocialPDF(args);
          outputs.push({
            tool_call_id: call.id,
            output: JSON.stringify({ url: pdfUrl }),
          });
          break;

        default:
          outputs.push({
            tool_call_id: call.id,
            output: "Function not implemented.",
          });
      }
    } catch (error: unknown) {
      // Safely handle the unknown error type
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown error occurred';
        
      console.error(`[ToolCallHandler] Error: ${errorMessage}`);
      outputs.push({
        tool_call_id: call.id,
        output: `Error: ${errorMessage}`,
      });
    }
  }

  await submitToolOutputs(outputs, threadId, runId);
}

async function generateBioPsychSocialPDF(patientData: BioPsychSocialAssessment['patient']): Promise<string> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/tools/biopsychsocial-assessment`, {
    method: 'POST',
    body: JSON.stringify({ patientData }),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Failed to generate PDF');
  }

  const pdfBuffer = await response.arrayBuffer();

  // Save PDF to Supabase Storage
  const supabase = await createServer();
  const fileName = `biopsychsocial/${patientData.firstName}_${patientData.lastName}_${Date.now()}.pdf`;

  const { data, error } = await supabase.storage
    .from('pdf-reports')
    .upload(fileName, pdfBuffer, { contentType: 'application/pdf' });

  if (error) {
    throw new Error(`Storage error: ${error.message}`);
  }

  const { data: signedUrl, error: signedUrlError } = await supabase.storage
    .from('pdf-reports')
    .createSignedUrl(data.path, 3600); // URL valid for 1 hour

  if (signedUrlError) {
    throw new Error(`Signed URL error: ${signedUrlError.message}`);
  }

  return signedUrl.signedUrl;
}

export async function submitToolOutputs(
  toolOutputs: Array<{ tool_call_id: string; output: string }>,
  threadId: string,
  runId: string
) {
  const openai = getOpenAIClient();

  try {
    const stream = openai.beta.threads.runs.submitToolOutputsStream(threadId, runId, {
      tool_outputs: toolOutputs,
      stream: true,
    });

    for await (const event of stream) {
      console.log(`[OpenAI Stream] Event received:`, event);
      // Optionally handle events here, e.g., emit via SSE if desired.
    }
  } catch (error: unknown) {
    // Safely handle the unknown error type
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
      
    console.error("[submitToolOutputs] Error submitting tool outputs:", errorMessage);
    throw error;
  }
  return toolOutputs;
}
