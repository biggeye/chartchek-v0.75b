'use client'

import { useEffect } from 'react'
import { useAssistantStore } from '@/store/assistantStore'
import { Loader2 } from 'lucide-react'
import { UserAssistant } from '@/types/database'

export function AssistantSelector() {
    const { 
        assistants, 
        isLoading, 
        error,
        fetchAssistants, 
        setCurrentAssistant 
    } = useAssistantStore()

    useEffect(() => {
        // Fetch assistants when component mounts
        fetchAssistants()
    }, [fetchAssistants])
    
    const handleAssistantChange = (assistantId: string) => {
        const selectedAssistant = assistants.find(a => a.assistant_id === assistantId);
        if (selectedAssistant) {
            setCurrentAssistant(selectedAssistant);
        }
    };
    

    if (error) {
        return <div className="text-red-500">Error: {error}</div>
    }

    return (
        <div className="relative">
            <select 
                onChange={(e) => handleAssistantChange(e.target.value)}
                disabled={isLoading}
                className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
            >
                <option value="">Select an assistant</option>
                {assistants.map((assistant: UserAssistant) => (
                    <option key={assistant.assistant_id} value={assistant.assistant_id}>
                        {assistant.name}
                    </option>
                ))}
            </select>
            
            {isLoading && (
                <div className="absolute right-2 top-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                </div>
            )}
        </div>
    )
}