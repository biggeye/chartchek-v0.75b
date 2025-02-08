'use client'

import { AssistantChat, AssistantSelector, ThreadList } from "@/components/chat";
import { useAssistantStore } from "@/store/assistantStore";

export default function ChatPage() {
    const { currentAssistant } = useAssistantStore();

    if (!currentAssistant) {
        return null;
    }

    return (
        <div className="px-4 py-10 sm:px-6 lg:px-8 lg:py-6 overflow-hidden">
{currentAssistant &&
        <AssistantChat currentAssistant={currentAssistant} />
        }
        </div>

    )
}