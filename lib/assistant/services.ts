import type { ApiResponse } from '@/types/api/routes';
import type { ChatMessage } from '@/types/database';

interface StoreNewFunctionParams {
    Function: string;
    Type: 'Form' | 'Procedure' | 'Corrective Action';
    Components: Array<{ key: string; value: string }>;
    Agency: string;
    Additional: string[];
}

interface EobSummaryParams {
    patient_name: string;
    policy_number: string;
    auth_days_requested: number;
    auth_days_approved: number;
    amount_billed: number;
    amount_awarded: number;
    time_period: string;
}

export async function addChatMessageToSupabase(chatMessage: any, supabase: any) {
  const { data: savedMessage, error: insertError } = await supabase
    .from('chat_messages')
    .insert(chatMessage)
    .select()
    .single()

  if (insertError) {
    throw insertError
  }
  return savedMessage;
}




export async function processAssistantResponse(response: ApiResponse<any>) {
    // Check if a function call was included in the response
    if (response && response.functionCall) {
        const { functionName, parameters } = response.functionCall;

        // Route the function call to the appropriate API endpoint
        switch (functionName) {
            case 'eobSummary':
                await submitEobSummary(parameters as EobSummaryParams);
                break;
            case 'StoreNewFunction':
                await submitNewFunction(parameters as StoreNewFunctionParams);
                break;
            // Add more cases for other function calls
            default:
                console.warn(`No handler for function: ${functionName}`);
        }
    } else {
        console.log('No function call in response.');
    }
}

async function submitEobSummary(params: EobSummaryParams) {
    try {
        const response = await fetch('/api/function/eob/summary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            throw new Error('Failed to submit EoB summary');
        }

        const result = await response.json();
        console.log('EoB summary submitted successfully:', result);
    } catch (error) {
        console.error('Error submitting EoB summary:', error);
    }
}

async function submitNewFunction(params: StoreNewFunctionParams) {
    try {
        const response = await fetch('/api/function/new', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            throw new Error('Failed to store new function');
        }

        const result = await response.json();
        console.log('Function stored successfully:', result);
    } catch (error) {
        console.error('Error storing new function:', error);
    }
}