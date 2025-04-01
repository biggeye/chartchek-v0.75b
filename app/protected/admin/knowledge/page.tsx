"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useKnowledgeStore } from "@/store/knowledgeStore";
import CorpusManager from "./CorpusManager";
import DocumentUploader from "./DocumentUploader";
import MetadataEditor from "./MetadataEditor";
import DocumentViewer from "@/lib/DocumentView";
import AnalyticsPanel from "./AnalyticsPanel";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
export default function KnowledgeAdminDashboard() {
  const { 
    corpora, 
    selectedCorpusId, 
    documents, 
    selectedDocumentId,
    fetchCorpora,
    setSelectedCorpusId,
    fetchDocuments,
    setSelectedDocumentId,
    isLoading,
    error
  } = useKnowledgeStore();

  useEffect(() => {
    fetchCorpora();
  }, [fetchCorpora]);

  useEffect(() => {
    if (selectedCorpusId) {
      fetchDocuments(selectedCorpusId);
    }
  }, [selectedCorpusId, fetchDocuments]);

  return (
    <div className="container py-6">
      <div className="h-full w-full overflow-y-auto mb-15">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Knowledge Base Administration</h1>
            <GoogleAuthButton />
            {error && <div className="text-red-500">{error}</div>}
          </div>

          <Tabs defaultValue="corpus" className="w-full">
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="corpus">Corpora</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
              <TabsTrigger value="viewer">Document Viewer</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="corpus">
              <Card>
                <CardHeader>
                  <CardTitle>Corpus Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <CorpusManager />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Document Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <DocumentUploader />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="metadata">
              <Card>
                <CardHeader>
                  <CardTitle>Metadata Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <MetadataEditor />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="viewer">
              <Card>
                <CardHeader>
                  <CardTitle>Document Viewer</CardTitle>
                </CardHeader>
                <CardContent>
                  <DocumentViewer />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Usage Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <AnalyticsPanel />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}