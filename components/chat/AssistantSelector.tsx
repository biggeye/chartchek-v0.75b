'use client'

import { useEffect, useState } from 'react'
import { useAssistantStore } from '@/store/assistantStore'
import { Loader2 } from 'lucide-react'
import { UserAssistant } from '@/types/database'
import DropdownMenu from '../dropdown-menu'

export function AssistantSelector() {
    const { 
        assistants, 
        isLoading, 
        error,
        fetchAssistants, 
        setCurrentAssistant 
    } = useAssistantStore()

    const [selectedAssistantName, setSelectedAssistantName] = useState('');

    useEffect(() => {
        // Fetch assistants when component mounts
        fetchAssistants()
    }, [fetchAssistants])
    
    const handleAssistantChange = (assistantId: string) => {
        const selectedAssistant = assistants.find(a => a.assistant_id === assistantId);
        if (selectedAssistant) {
            setCurrentAssistant(selectedAssistant);
            setSelectedAssistantName(selectedAssistant.name);
        }
    };
    

    if (error) {
        return <div className="text-red-500">Error: {error}</div>
    }

    return (
        <div className="relative p-3">
            <DropdownMenu
                buttonLabel="Select an assistant"
                selectedLabel={selectedAssistantName}
                items={assistants.map((assistant: UserAssistant) => ({
                    label: assistant.name,
                    onClick: () => handleAssistantChange(assistant.assistant_id)
                }))}
                disabled={isLoading}
            />
            
            {isLoading && (
                <div className="absolute right-2 top-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                </div>
            )}
        </div>
    )
}