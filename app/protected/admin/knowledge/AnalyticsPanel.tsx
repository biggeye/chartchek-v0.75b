// app/protected/admin/knowledge/AnalyticsPanel.tsx
import { useState, useEffect } from "react";
import { useKnowledgeStore } from "@/store/knowledgeStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AnalyticsPanel() {
  const { 
    selectedCorpusId,
    selectedDocumentId,
    fetchQueryHistory,
    isLoading
  } = useKnowledgeStore();
  
  const [queryHistory, setQueryHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  
  useEffect(() => {
    async function fetchHistory() {
      let history;
      
      if (activeTab === "corpus" && selectedCorpusId) {
        history = await fetchQueryHistory(selectedCorpusId);
      } else if (activeTab === "document" && selectedDocumentId) {
        history = await fetchQueryHistory(undefined, selectedDocumentId);
      } else {
        history = await fetchQueryHistory();
      }
      
      setQueryHistory(history || []);
    }
    
    fetchHistory();
  }, [activeTab, selectedCorpusId, selectedDocumentId, fetchQueryHistory]);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          Query Analytics
        </h3>
      </div>
      
      <Tabs value={activeTab} onChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Queries</TabsTrigger>
          <TabsTrigger 
            value="corpus"
            disabled={!selectedCorpusId}
          >
            Selected Corpus
          </TabsTrigger>
          <TabsTrigger 
            value="document"
            disabled={!selectedDocumentId}
          >
            Selected Document
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === "all" ? "All Queries" : 
                 activeTab === "corpus" ? "Corpus Queries" : "Document Queries"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : queryHistory.length === 0 ? (
                <div className="text-center p-6">
                  <p className="text-gray-500">No query history available</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Query</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Results</TableHead>
                      <TableHead>Response Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queryHistory.map((query) => (
                      <TableRow key={query.id}>
                        <TableCell className="font-medium">
                          {query.query.length > 50 
                            ? `${query.query.substring(0, 50)}...` 
                            : query.query}
                        </TableCell>
                        <TableCell>
                          {new Date(query.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>{query.result_count}</TableCell>
                        <TableCell>{query.response_time_ms}ms</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}