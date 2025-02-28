import type { ChatMessage } from '@/types/database';
import { useStreamingStore } from '@/store/streamingStore';
import { useChatStore } from '@/store/chatStore';

interface ApiResponse<T> {
  functionCall?: {
    functionName: string;
    parameters: T;
  };
}

interface EobSummaryParams {
  patient_name: string;
  date_of_service: string;
  provider: string;
  amount_paid: number;
  conditions_treated: string[];
}

interface StoreNewFunctionParams {
  name: string;
  code: string;
}

interface FormParameters {
  form_key: string;
  form_data?: Record<string, any>;
}

export async function processAssistantResponse(
    response: ApiResponse<any>
) {
    const streamingStore = useStreamingStore.getState();
    streamingStore.processAssistantResponse(response);
}

async function submitEobSummary(params: EobSummaryParams) {
    try {
        const response = await fetch('/api/function/eob/summary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });

        if (!response.ok) {
            throw new Error('Failed to submit EOB summary');
        }

        return await response.json();
    } catch (error) {
        console.error('Error submitting EOB summary:', error);
        throw error;
    }
}

async function submitNewFunction(params: StoreNewFunctionParams) {
    try {
        const response = await fetch('/api/function/store-new-function', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });

        if (!response.ok) {
            throw new Error('Failed to store new function');
        }

        return await response.json();
    } catch (error) {
        console.error('Error storing new function:', error);
        throw error;
    }
}

export async function processDynamicForm(params: FormParameters) {
    try {
        // Set the form key in the chat store
        const chatStore = useChatStore.getState();
        
        // Process the form via API if there's form data to submit
        if (params.form_data) {
            const response = await fetch(`/api/function/form/${params.form_key}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(params.form_data)
            });

            if (!response.ok) {
                throw new Error(`Failed to process form: ${params.form_key}`);
            }

            return await response.json();
        }
        
        return { success: true, message: `Form ${params.form_key} displayed` };
    } catch (error) {
        console.error(`Error processing form ${params.form_key}:`, error);
        throw error;
    }
}