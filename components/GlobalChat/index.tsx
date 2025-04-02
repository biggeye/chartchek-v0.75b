"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
  FileUp,
  User,
  FileText,
  Send,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  MessageSquare,
  Maximize2,
  Minimize2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import PatientModal from "./patient-modal"
import DocumentModal from "./document-modal"
import FileUploadModal from "./file-upload-modal"
import ChatMessage from "./chat-message"
import ChatMessages from "./chat-messages"
import ModelSelector from "./model-selector"
import TrainingSelector from "./training-selector"
import { useGlobalChatStore } from "@/store/chatStore"
import { useFacilityStore } from "@/store/facilityStore"
import { assistantAdditionalStream } from "@/lib/openai/assistantService"
// Import the hook and types from the original GlobalChat component
import { useOpenAIResponse } from '@/hooks/useOpenAIResponse';
import { OutputTextContent, ReasoningOutput } from '@/types/openai/responses';
// Add keyframes for slide-up animation
const slideUpKeyframes = `
  @keyframes slideUp {
    from {
      transform: translateY(100%);
      opacity: 0.7;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`

type ModalType = "upload" | "patient" | "documents" | null

// Define the ChatMessage interface
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function MasterGlobalChat() { // Renamed to avoid conflicts
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  const { currentFacilityId } = useFacilityStore();
  
  const {
    currentAssistantId,
    queueItems,
    removeFromQueue,
    currentMessage,
    setCurrentMessage,
    sendMessage,
    isGenerating,
    isFullScreen,
    toggleFullScreen,
  } = useGlobalChatStore()

  const queueRef = useRef<HTMLDivElement>(null)
  const showQueue = queueItems.length > 0

  // Add this useEffect to inject the keyframes
  useEffect(() => {
    // Add keyframes to the document
    const styleElement = document.createElement("style")
    styleElement.textContent = slideUpKeyframes
    document.head.appendChild(styleElement)

    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  const handleSend = () => {
    if (currentMessage.trim()) {
      sendMessage()
      assistantAdditionalStream(assistantId, currentMessage)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const getModalContent = () => {
    switch (activeModal) {
      case "upload":
        return <FileUploadModal onClose={() => setActiveModal(null)} />
      case "patient":
        return <PatientModal onClose={() => setActiveModal(null)} />
      case "documents":
        return <DocumentModal onClose={() => setActiveModal(null)} />
      default:
        return null
    }
  }

  const getQueueItemIcon = (type: string) => {
    switch (type) {
      case "file":
        return <FileUp className="h-3 w-3" />
      case "patient":
        return <User className="h-3 w-3" />
      case "document":
        return <FileText className="h-3 w-3" />
      default:
        return null
    }
  }

  // --- INTEGRATED GLOBAL CHAT LOGIC ---
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    response,
    error,
    loading,
    streaming,
    createResponse,
    streamResponse,
    stopStreaming
  } = useOpenAIResponse({
    initialOptions: {
      model: 'gpt-4o',
      temperature: 0.7,
    }
  });

  // Extract text from response
  useEffect(() => {
    if (response && response.status === 'completed') {
      // Find text content in the response
      const textContents = response.output
        .filter(item => item.type === 'message')
        .flatMap(message =>
          'content' in message
            ? message.content.filter(c => c.type === 'output_text') as OutputTextContent[]
            : []
        );

      if (textContents.length > 0) {
        const assistantMessage = textContents.map(content => content.text).join('\n');

        setMessages(prev => {
          // Check if we already added this response
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            // Update the last message
            return [...prev.slice(0, -1), { role: 'assistant', content: assistantMessage }];
          } else {
            // Add a new message
            return [...prev, { role: 'assistant', content: assistantMessage }];
          }
        });
      }
    }
  }, [response]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleOpenAIChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentMessage.trim()) return;

    // Add user message
    const userMessage = { role: 'user' as const, content: currentMessage };
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');

    // Get conversation history
    const conversationHistory = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    const sentToAssistant = assistantAdditionalStream(assistantId, currentMessage);
    // Stream the response
    streamResponse({
      model: 'gpt-4o',
      input: [
        ...conversationHistory.map(msg => ({
          type: msg.role,
          text: msg.content
        })),
        {
          type: 'user',
          text: userMessage.content
        }
      ],
    });
  };
  // --- END INTEGRATED GLOBAL CHAT LOGIC ---

  return (
    <>
      {/* Minimized Chat Tab */}
      {!isVisible && (
        <Button
          onClick={() => setIsVisible(true)}
          className="fixed bottom-0 left-1/2 -translate-x-1/2 rounded-b-none rounded-t-lg shadow-lg z-50"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Chat
        </Button>
      )}

      {/* Main Chat Component */}
      {isVisible && (
        <div
          className={cn(
            "fixed z-50 transition-all duration-500 ease-in-out",
            isFullScreen ? "inset-0 p-0" : "bottom-4 left-1/2 -translate-x-1/2 w-[80%] md:w-4/5 max-w-6xl",
          )}
        >
          <div
            className={cn(
              "relative bg-background/95 rounded-xl shadow-lg border border-border/50 backdrop-blur-sm overflow-hidden",
              isFullScreen ? "h-full rounded-none" : "",
            )}
            style={{
              boxShadow: "0 0 15px rgba(120, 120, 255, 0.1), 0 0 30px rgba(70, 70, 120, 0.05)",
            }}
          >
            {/* Expand/Collapse Button (only when not fullscreen) */}
            {!isFullScreen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="absolute top-0 left-1/2 -translate-x-1/2 z-10 h-6 w-10 rounded-t-none rounded-b-lg bg-muted/50"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </Button>
            )}

            {/* Chat Messages Area */}
            {(isExpanded || isFullScreen) && (
              <div
                className={cn("overflow-hidden flex flex-col", isFullScreen ? "h-[calc(100%-110px)]" : "h-64")}
                style={{
                  backgroundImage: "linear-gradient(0deg, rgba(0, 0, 0, 0.03) 50%, transparent 50%)",
                  backgroundSize: "100% 4px",
                  backgroundColor: "#f5f5f5",
                }}
              >
                <div className="p-2 border-b border-border/50 bg-muted/20">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <ModelSelector />
                        <TrainingSelector />
                      </div>
                      <Button variant="outline" size="icon" onClick={toggleFullScreen} className="h-9 w-9 shrink-0">
                        {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                {/* <ChatMessages /> */}
                {/* INTEGRATED CHAT MESSAGES */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${message.role === 'user'
                        ? 'bg-blue-100 ml-auto max-w-[80%]'
                        : 'bg-gray-100 mr-auto max-w-[80%]'
                        }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  ))}

                  {loading && !streaming && (
                    <div className="bg-gray-100 p-3 rounded-lg mr-auto max-w-[80%]">
                      <p>Thinking...</p>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-100 p-3 rounded-lg mr-auto max-w-[80%]">
                      <p>Error: {error.message}</p>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
                {/* END INTEGRATED CHAT MESSAGES */}
              </div>
            )}

            {/* Queue Row (slides in when items are added) */}
            <div
              ref={queueRef}
              className={cn(
                "transition-all duration-300 ease-in-out overflow-hidden bg-muted/20 border-t border-border/50",
                showQueue ? "max-h-12 py-2 px-4" : "max-h-0 py-0 px-4",
              )}
            >
              <div className="flex items-center gap-2 overflow-x-auto">
                {queueItems.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-full text-xs">
                    {getQueueItemIcon(item.type)}
                    <span className="truncate max-w-[100px]">{item.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 rounded-full hover:bg-muted"
                      onClick={() => removeFromQueue(item.id)}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Left Tab */}
            <div className={cn("absolute left-6 bottom-full", isFullScreen && "hidden")}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-10 rounded-t-lg rounded-b-none border border-b-0 border-border/50 bg-background/95 backdrop-blur-sm px-4 flex items-center gap-2"
                  >
                    <span>Options</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem>Clear chat</DropdownMenuItem>
                  <DropdownMenuItem>Save conversation</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsVisible(false)}>Hide chat</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Right Tab */}
            <div className={cn("absolute right-6 bottom-full", isFullScreen && "hidden")}>
              <Button
                variant="ghost"
                className="h-10 rounded-t-lg rounded-b-none border border-b-0 border-border/50 bg-background/95 backdrop-blur-sm px-4"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Input Area */}
            <div className="border-t border-border/50 bg-muted/30 backdrop-blur-sm">
              <div className="flex items-center">
                {/* Magic Icons - directly attached to input */}
                <div className="flex items-center pl-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setActiveModal("upload")}
                    className={cn("rounded-full h-8 w-8", activeModal === "upload" && "bg-primary/20")}
                  >
                    <FileUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setActiveModal("patient")}
                    className={cn("rounded-full h-8 w-8", activeModal === "patient" && "bg-primary/20")}
                  >
                    <User className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setActiveModal("documents")}
                    className={cn("rounded-full h-8 w-8", activeModal === "documents" && "bg-primary/20")}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>

                {/* Input Field */}
                <div className="flex-1 relative">
                  <textarea
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    className="w-full resize-none border-0 bg-transparent px-3 py-2 text-sm ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[40px] max-h-[80px]"
                    rows={1}
                    disabled={isGenerating}
                  />
                </div>

                {/* Send Button - directly attached to input */}
                <Button
                  onClick={handleOpenAIChatSubmit} // Changed to the new handler
                  size="icon"
                  className="rounded-full h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90 mr-2"
                  disabled={isGenerating || !currentMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
                {streaming && (
                  <Button
                    type="button"
                    onClick={stopStreaming}
                    className="bg-red-500 text-white px-4 py-2 rounded-md"
                  >
                    Stop
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <Dialog open={activeModal !== null} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogOverlay className="backdrop-blur-sm" />
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {activeModal === "upload" && "Upload Files"}
              {activeModal === "patient" && "Patient Information"}
              {activeModal === "documents" && "Documents"}
            </DialogTitle>
          </DialogHeader>

          {getModalContent()}
        </DialogContent>
      </Dialog>
    </>
  )
}