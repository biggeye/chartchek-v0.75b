'use client';

import { useState } from 'react';
import { useStreamingStore } from '@/store/streamingStore';
import DynamicForm from '@/lib/forms/DynamicForm';
import { Button } from '@/components/ui/button';

export default function TestFormPage() {
  const { currentFormKey, setCurrentFormKey, processAssistantResponse } = useStreamingStore();
  
  const handleTestFormClick = (formKey: string) => {
    setCurrentFormKey(formKey);
  };
  
  const handleClearForm = () => {
    setCurrentFormKey(null);
  };
  
  // Create a simulated assistant response with function call
  const simulateAssistantResponse = (formKey: string) => {
    const mockResponse = {
      functionCall: {
        functionName: 'dynamicForm',
        parameters: {
          form_key: formKey
        }
      }
    };
    
    // Use the streaming store's processAssistantResponse function
    processAssistantResponse(mockResponse);
  };
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Dynamic Form Test Page</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Test Forms</h2>
        <div className="flex flex-wrap gap-4">
          <Button 
            onClick={() => handleTestFormClick('application_orientation_verification')}
            outline
          >
            Show Application Form
          </Button>
          
          <Button 
            onClick={() => handleTestFormClick('patient_intake')}
            outline
          >
            Show Patient Intake Form
          </Button>
          
          <Button 
            onClick={() => simulateAssistantResponse('patient_intake')}
            color="green"
          >
            Simulate Assistant Response
          </Button>
          
          <Button 
            onClick={handleClearForm}
            color="red"
          >
            Clear Form
          </Button>
        </div>
      </div>
      
      <div className="border rounded-lg p-6 bg-white">
        {currentFormKey ? (
          <div>
            <h2 className="text-lg font-semibold mb-4">Current Form: {currentFormKey}</h2>
            <DynamicForm formKey={currentFormKey} />
          </div>
        ) : (
          <div className="text-center text-gray-500 py-12">
            <p>No form selected. Click one of the buttons above to load a form.</p>
          </div>
        )}
      </div>
    </div>
  );
}
