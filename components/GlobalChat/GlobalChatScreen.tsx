"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { FileText, User, Info, MessageSquare, ChevronRight } from "lucide-react"

interface GlobalChatScreenProps {
  document?: any
  stream?: any
  onAction?: (action: string, data?: any) => void
}

export default function GlobalChatScreen({ document, stream, onAction }: GlobalChatScreenProps) {
  const [activeTab, setActiveTab] = useState("chat")
  
  // Mock data - replace with actual data from your stores
  const recentDocuments = [
    { id: "doc1", name: "Patient Assessment", date: "2025-03-30" },
    { id: "doc2", name: "Treatment Plan", date: "2025-03-29" },
  ]
  
  const recentPatients = [
    { id: "pat1", name: "John Smith", mrn: "MRN12345" },
    { id: "pat2", name: "Sarah Johnson", mrn: "MRN67890" },
  ]

  return (
    <div className="w-full h-full flex flex-col">
      <Tabs defaultValue="chat" value={activeTab} onChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-2">
          <TabsTrigger value="chat">
            <MessageSquare className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Chat</span>
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="patients">
            <User className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Patients</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="mt-0">
          <div className="text-sm text-center">
            {stream ? (
              <div className="animate-pulse">Processing your request...</div>
            ) : (
              <div>
                <p className="mb-2">How can I help you today?</p>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={() => onAction?.("suggest", "treatment")}>
                    Suggest treatment
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onAction?.("find", "diagnosis")}>
                    Find diagnosis
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onAction?.("summarize", "notes")}>
                    Summarize notes
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onAction?.("analyze", "labs")}>
                    Analyze labs
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="documents" className="mt-0">
          <div className="text-sm">
            <h3 className="font-medium mb-2">Recent Documents</h3>
            {recentDocuments.length > 0 ? (
              <ul className="space-y-1">
                {recentDocuments.map(doc => (
                  <li key={doc.id} className="flex justify-between items-center p-2 hover:bg-muted rounded-md">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{doc.name}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => onAction?.("select-document", doc)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center">No recent documents</p>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="patients" className="mt-0">
          <div className="text-sm">
            <h3 className="font-medium mb-2">Recent Patients</h3>
            {recentPatients.length > 0 ? (
              <ul className="space-y-1">
                {recentPatients.map(patient => (
                  <li key={patient.id} className="flex justify-between items-center p-2 hover:bg-muted rounded-md">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{patient.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{patient.mrn}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => onAction?.("select-patient", patient)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center">No recent patients</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {document && (
        <div className="mt-auto p-2 bg-muted/50 rounded-md text-xs">
          <div className="flex items-center">
            <Info className="h-3 w-3 mr-1 text-muted-foreground" />
            <span>Currently viewing: {document.name}</span>
          </div>
        </div>
      )}
    </div>
  )
}