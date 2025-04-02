"use client"

import type React from "react"

import { useState, useRef } from "react"
import { FileUp, User, FileText, Send, ChevronDown, ChevronUp, Plus, X, MessageSquare, ChevronRight, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import GlobalChatScreen from "./GlobalChatScreen"
import { Avatar } from "@/components/ui/avatar"
import { usePatientStore } from "@/store/patientStore";
import Image from "next/image"


type ModalType = "upload" | "patient" | "documents" | null
type QueueItem = {
  id: string
  type: "file" | "patient" | "document"
  name: string
}

export default function GlobalChat() {
  const [message, setMessage] = useState("")
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [queueItems, setQueueItems] = useState<QueueItem[]>([])
  const [showQueue, setShowQueue] = useState(false)
  const queueRef = useRef<HTMLDivElement>(null)

// Inside your component:
const { patients } = usePatientStore();


  const handleSend = () => {
    if (message.trim()) {
      console.log("Sending message:", message)
      setMessage("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const addToQueue = (type: "file" | "patient" | "document", name: string) => {
    const newItem = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      name,
    }
    setQueueItems((prev) => [...prev, newItem])
    setShowQueue(true)
  }

  const removeFromQueue = (id: string) => {
    setQueueItems((prev) => prev.filter((item) => item.id !== id))
    if (queueItems.length <= 1) {
      setShowQueue(false)
    }
  }

  // Handle modal actions
  const handleModalAction = (type: ModalType, itemName: string) => {
    setActiveModal(null)
    if (type === "upload") {
      addToQueue("file", itemName)
    } else if (type === "patient") {
      addToQueue("patient", itemName)
    } else if (type === "documents") {
      addToQueue("document", itemName)
    }
  }

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
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[80%] md:w-4/5 max-w-6xl z-50">
          <div className="relative bg-background rounded-xl shadow-lg border border-border/50 backdrop-blur-sm overflow-hidden">
            {/* Expand/Collapse Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="absolute top-0 left-1/2 -translate-x-1/2 z-10 h-6 w-10 rounded-t-none rounded-b-lg bg-muted/50"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>

            {/* Chat Messages Area (hidden by default) */}
            {isExpanded && (
              <div className="h-64 p-4 overflow-y-auto">
                <div className="text-muted-foreground text-center">
                  <GlobalChatScreen />
                </div>
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
                {queueItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-full text-xs">
                    {item.type === "file" && <FileUp className="h-3 w-3" />}
                    {item.type === "patient" && <User className="h-3 w-3" />}
                    {item.type === "document" && <FileText className="h-3 w-3" />}
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
            <div className="absolute left-6 bottom-full">
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
            <div className="absolute right-6 bottom-full">
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
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    className="w-full resize-none border-0 bg-transparent px-3 py-2 text-sm ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[40px] max-h-[80px]"
                    rows={1}
                  />
                </div>

                {/* Send Button - directly attached to input */}
                <Button
                  onClick={handleSend}
                  size="icon"
                  className="rounded-full h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90 mr-2"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <Dialog open={activeModal !== null} onOpenChange={() => setActiveModal(null)}>
        <DialogOverlay className="backdrop-blur-sm" />
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {activeModal === "upload" && "Upload Files"}
              {activeModal === "patient" && "Patient Information"}
              {activeModal === "documents" && "Documents"}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <ul role="list" className="divide-y divide-gray-100">
              {activeModal === "patient" && (
                // Patient list items
                patients.map((patient, i) => (
                  <li
                    key={i}
                    className="relative flex justify-between gap-x-4 py-4 px-3 hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleModalAction(activeModal, `Patient ${i + 1}`)}
                  >
                    <div className="flex min-w-0 gap-x-3">
                      <Avatar className="h-10 w-10">
                        <Image alt="logo" src={`/logo`} />
                      </Avatar>
                      <div className="min-w-0 flex-auto">
                        <p className="text-sm font-medium text-foreground">
                          <span className="absolute inset-x-0 -top-px bottom-0" />
                          Patient {i + 1}
                        </p>
                        <p className="mt-1 flex text-xs text-muted-foreground">
                          MRN-{100000 + i}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-x-2">
                      <div className="hidden sm:flex sm:flex-col sm:items-end">
                        <p className="text-sm text-foreground">Last Visit</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(Date.now() - i * 86400000).toLocaleDateString()}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </li>
                ))

              )}
              {activeModal === "documents" && (
                // Document list items
                Array.from({ length: 6 }).map((_, i) => (
                  <li
                    key={i}
                    className="relative flex justify-between gap-x-4 py-4 px-3 hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleModalAction(activeModal, `Document ${i + 1}`)}
                  >
                    <div className="flex min-w-0 gap-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-auto">
                        <p className="text-sm font-medium text-foreground">
                          <span className="absolute inset-x-0 -top-px bottom-0" />
                          Document {i + 1}
                        </p>
                        <p className="mt-1 flex text-xs text-muted-foreground">
                          Added {new Date(Date.now() - i * 86400000).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-x-2">
                      <div className="hidden sm:flex sm:flex-col sm:items-end">
                        <p className="text-sm text-foreground">Type</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {["PDF", "DOCX", "TXT", "CSV", "XLSX", "JSON"][i % 6]}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </li>
                ))
              )}

              {activeModal === "upload" && (
                // Upload file options
                Array.from({ length: 6 }).map((_, i) => (
                  <li
                    key={i}
                    className="relative flex justify-between gap-x-4 py-4 px-3 hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleModalAction(activeModal, `File ${i + 1}`)}
                  >
                    <div className="flex min-w-0 gap-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-auto">
                        <p className="text-sm font-medium text-foreground">
                          <span className="absolute inset-x-0 -top-px bottom-0" />
                          File Option {i + 1}
                        </p>
                        <p className="mt-1 flex text-xs text-muted-foreground">
                          {["Patient Records", "Lab Results", "Imaging", "Assessments", "Treatment Plans", "Notes"][i % 6]}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center">
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>

          <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={() => setActiveModal(null)}>
            <X className="h-4 w-4" />
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}

