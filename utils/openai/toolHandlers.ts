// src/services/openai/toolHandlers.ts
import { formDefinitions } from '@/lib/forms/formDefinitions';
import { createServer } from '@/utils/supabase/server';
import { getOpenAIClient } from '@/utils/openai/server';
import { generatePDF } from '@/lib/forms/pdfGenerator';

export type ToolCall = {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
};

export type ToolOutput = {
  tool_call_id: string;
  output: string;
};

export async function handleToolCalls(toolCalls: ToolCall[], threadId: string, runId: string) {
  const outputs: ToolOutput[] = [];

  for (const call of toolCalls) {
    try {
      const args = JSON.parse(call.function.arguments);

      switch (call.function.name) {
        case 'GeneratePDFForm': {
          const { formKey, formData } = args;

          if (!formKey || !formData) {
            throw new Error('formKey and formData are required.');
          }

          const definition = formDefinitions[formKey];
          if (!definition) {
            throw new Error(`Invalid formKey: ${formKey}`);
          }

          const missingFields = definition.sections.flatMap((section) =>
            section.fields
              .filter((field) => !(field.name in formData))
              .map((field) => field.name)
          );

          if (missingFields.length) {
            throw new Error(`Missing fields: ${missingFields.join(', ')}`);
          }

          const pdfUrl = await generatePDFAndStore(formKey, formData, threadId);

          outputs.push({
            tool_call_id: call.id,
            output: JSON.stringify({ success: true, pdfUrl, message: `PDF generated for ${formKey}` }),
          });
          break;
        }

        case 'getFormFields': {
          const { formKey } = args;
          const definition = formDefinitions[formKey];
          if (!definition) {
            throw new Error(`Unsupported formKey: ${formKey}`);
          }

          const requiredFields = definition.sections.flatMap((section) =>
            section.fields.map((field) => field.name)
          );

          outputs.push({
            tool_call_id: call.id,
            output: JSON.stringify({ requiredFields }),
          });
          break;
        }

        default:
          outputs.push({
            tool_call_id: call.id,
            output: JSON.stringify({ error: `Unsupported function: ${call.function.name}` }),
          });
      }
    } catch (error) {
      outputs.push({
        tool_call_id: call.id,
        output: JSON.stringify({ error: (error as Error).message }),
      });
    }
  }

  await submitToolOutputs(outputs, threadId, runId);
  return outputs;
}

async function submitToolOutputs(outputs: Array<{ tool_call_id: string; output: string }>, threadId: string, runId: string) {
  const openai = getOpenAIClient();
  await openai.beta.threads.runs.submitToolOutputs(threadId, runId, { tool_outputs: outputs });
}

async function generatePDFAndStore(formKey: string, formData: Record<string, any>, threadId: string): Promise<string> {
  const { blob } = await generatePDF({ type: formKey, data: formData });
  const supabase = await createServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User authentication failed.');

  const filename = `${formKey}-${Date.now()}.pdf`;
  const filePath = `${user.id}/${threadId}/${filename}`;

  const { error } = await supabase.storage.from('documents').upload(filePath, blob);
  if (error) throw error;

  const { data: fileUrl } = supabase.storage.from('documents').getPublicUrl(filePath);
  return fileUrl.publicUrl;
};

function toPascalCase(str: string) {
  return str.replace(/(^\w|_\w)/g, (s) => s.replace('_', '').toUpperCase());
};
