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
  console.log(`[ToolCallHandler] Processing ${toolCalls.length} tool calls for thread ${threadId}, run ${runId}`);
  const outputs = [];

  for (const call of toolCalls) {
    try {
      console.log(`[ToolCallHandler] Processing tool call: ${call.function.name}`);
      
      switch (call.function.name) {
        case "BioPsychSocialAssessmentForm":
          const args = JSON.parse(call.function.arguments);
          console.log(`[ToolCallHandler] BioPsychSocialAssessmentForm args:`, JSON.stringify(args, null, 2));
          
          // Validate required fields based on the assistant's function definition
          const requiredFields = [
            "firstName", "lastName", "dateOfBirth", "gender", 
            "assessmentDate", "clinicianName", "presentingProblem", 
            "psychiatricHistory", "medicalHistory", "substanceUseHistory", 
            "socialHistory", "legalHistory", "employmentStatus", "educationalHistory"
          ];
          
          const missingFields = requiredFields.filter(field => !args[field]);
          if (missingFields.length > 0) {
            const errorMsg = `Missing required fields: ${missingFields.join(', ')}`;
            console.error(`[ToolCallHandler] ${errorMsg}`);
            outputs.push({
              tool_call_id: call.id,
              output: JSON.stringify({ error: errorMsg }),
            });
            continue;
          }
          
          // Format the patient data to match our expected structure
          const patientData: BioPsychSocialAssessment['patient'] = {
            firstName: args.firstName,
            lastName: args.lastName,
            dateOfBirth: args.dateOfBirth,
            gender: args.gender,
            presentingProblem: args.presentingProblem,
            psychiatricHistory: args.psychiatricHistory,
            medicalHistory: args.medicalHistory,
            socialHistory: args.socialHistory,
            substanceUseHistory: args.substanceUseHistory,
            assessmentDate: args.assessmentDate,
            clinicianName: args.clinicianName,
            legalHistory: args.legalHistory,
            employmentStatus: args.employmentStatus,
            educationalHistory: args.educationalHistory
          };
          
          // Generate the PDF
          const pdfUrl = await generateBioPsychSocialPDF(patientData);
          
          // Store the assessment in the database for future reference
          await storeAssessmentRecord(threadId, patientData, pdfUrl);
          
          outputs.push({
            tool_call_id: call.id,
            output: JSON.stringify({ 
              url: pdfUrl,
              message: `BioPsychSocial Assessment created for ${patientData.firstName} ${patientData.lastName}`
            }),
          });
          break;

        default:
          console.warn(`[ToolCallHandler] Unknown function: ${call.function.name}`);
          outputs.push({
            tool_call_id: call.id,
            output: JSON.stringify({ 
              error: "Function not implemented.",
              availableFunctions: ["BioPsychSocialAssessmentForm"] 
            }),
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
        output: JSON.stringify({ error: errorMessage }),
      });
    }
  }

  // Submit the outputs back to OpenAI
  await submitToolOutputs(outputs, threadId, runId);
  
  return outputs;
}

async function generateBioPsychSocialPDF(patientData: BioPsychSocialAssessment['patient']): Promise<string> {
  console.log(`[ToolCallHandler] Generating PDF for ${patientData.firstName} ${patientData.lastName}`);
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/tools/biopsychsocial-assessment`, {
    method: 'POST',
    body: JSON.stringify({ patientData }),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate PDF: ${errorText}`);
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

  console.log(`[ToolCallHandler] PDF generated and stored at: ${signedUrl.signedUrl}`);
  return signedUrl.signedUrl;
}

/**
 * Store assessment record in the database for tracking and future reference
 */
async function storeAssessmentRecord(
  threadId: string,
  patientData: BioPsychSocialAssessment['patient'],
  pdfUrl: string
): Promise<void> {
  try {
    const supabase = await createServer();
    
    // Store in the assessments table
    const { error } = await supabase
      .from('assessments')
      .insert({
        thread_id: threadId,
        patient_name: `${patientData.firstName} ${patientData.lastName}`,
        assessment_type: 'biopsychsocial',
        assessment_date: patientData.assessmentDate,
        clinician_name: patientData.clinicianName,
        pdf_url: pdfUrl,
        metadata: { patientData }
      });
      
    if (error) {
      console.error(`[ToolCallHandler] Error storing assessment record: ${error.message}`);
    }
  } catch (error) {
    console.error('[ToolCallHandler] Error in storeAssessmentRecord:', error);
    // Non-critical error, don't throw
  }
}

export async function submitToolOutputs(
  toolOutputs: Array<{ tool_call_id: string; output: string }>,
  threadId: string,
  runId: string
) {
  const openai = getOpenAIClient();
  console.log(`[ToolCallHandler] Submitting ${toolOutputs.length} tool outputs for thread ${threadId}, run ${runId}`);

  try {
    const stream = await openai.beta.threads.runs.submitToolOutputsStream(threadId, runId, {
      tool_outputs: toolOutputs,
      stream: true,
    });

    // Use a more generic approach to handle events
    for await (const event of stream) {
      // Log the event for debugging
      console.log(`[ToolCallHandler] Event received:`, JSON.stringify({
        event_keys: Object.keys(event),
        data_keys: event.data ? Object.keys(event.data) : []
      }));
      
      // Use a type assertion to access event properties safely
      const typedEvent = event as any;
      
      // Check for run status changes
      if (typedEvent.data && typedEvent.data.status) {
        console.log(`[ToolCallHandler] Run status: ${typedEvent.data.status}`);
        
        // Handle specific statuses
        if (typedEvent.data.status === 'completed') {
          console.log(`[ToolCallHandler] Run completed successfully`);
        } else if (typedEvent.data.status === 'failed') {
          const errorMessage = typedEvent.data.last_error?.message || 'Unknown error';
          console.error(`[ToolCallHandler] Run failed: ${errorMessage}`);
        } else if (typedEvent.data.status === 'requires_action') {
          console.log(`[ToolCallHandler] Run requires further action`);
        }
      }
    }
  } catch (error: unknown) {
    // Safely handle the unknown error type
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
      
    console.error("[ToolCallHandler] Error submitting tool outputs:", errorMessage);
    throw error;
  }
  return toolOutputs;
}
