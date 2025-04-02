// app/protected/admin/knowledge/DocumentViewer.tsx
"use client";

import { useKnowledgeStore } from "@/store/knowledgeStore";
import { evaluationFieldComponents, MatrixField, extractContent } from "@/components/dynamicForms/PatientEvaluationItems";
import { KipuPatientEvaluationItem } from "@/types/chartChek/kipuEvaluations";

interface DocumentViewer extends Document {
  content: string;
  name: string;
  mimeType: string;
}

interface DocumentViewProps {
  items?: KipuPatientEvaluationItem[];
  content?: string;
  fileName?: string;
  mimeType?: string;
}

const DocumentView = ({ items, content, fileName, mimeType }: DocumentViewProps) => {
  const { selectedDocumentId, documents } = useKnowledgeStore();
  
  // Find the document
  const selectedDocument = documents.find(doc => doc.id === selectedDocumentId || items);
  
  if (!selectedDocumentId && !items) {
    return (
      <div className="space-y-6">
        <div className="text-center p-6 border-2 border-dashed rounded-lg">
          <p className="text-gray-500">Select a document to view its contents</p>
        </div>
      </div>
    );
  }
    if (items) {
    return (
      <div className="p-6 bg-white rounded-2xl shadow-lg space-y-2">
        {items.map((item: KipuPatientEvaluationItem, idx) => {
          if (item.fieldType === 'matrix') {
            const previousItem = items[idx - 1];
            const prevAnswer = extractContent(previousItem)?.toLowerCase();
            const previousAnswerYes = prevAnswer === 'yes';

            return previousAnswerYes ? (
              <div key={item.id}>
                <MatrixField item={item} previousAnswerYes={previousAnswerYes} />
                {item.dividerBelow && <hr className="border-dashed border-gray-300 my-4" />}
              </div>
            ) : null;
          } else {
            const Component = evaluationFieldComponents[item.fieldType] || evaluationFieldComponents.default;

            return (
              <div key={item.id}>
                <Component {...item} />
                {item.dividerBelow && <hr className="border-dashed border-gray-300 my-4" />}
              </div>
            );
          }
        })}
      </div>
    );
  }
  
  // If we have content, render it based on mime type
  if (content) {
    return (
      <div className="p-6 bg-white rounded-2xl shadow-lg">
        <h3 className="text-lg font-medium mb-4">{fileName || 'Document'}</h3>
        
        {mimeType?.includes('image/') ? (
          <img src={`data:${mimeType};base64,${content}`} alt={fileName || 'Document'} className="max-w-full" />
        ) : mimeType?.includes('application/pdf') ? (
          <div className="border rounded p-4">
            <p>PDF viewer not implemented. Please download to view.</p>
          </div>
        ) : (
          <pre className="whitespace-pre-wrap border rounded p-4 max-h-[600px] overflow-auto">
            {content}
          </pre>
        )}
      </div>
    );
  }
  
  // Fallback empty state
  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg">
      <p className="text-gray-500 text-center">No content available to display</p>
    </div>
  );
};

// This is the component that will be used in the knowledge module
export default function DocumentViewer(items: KipuPatientEvaluationItem) {
  const { selectedDocumentId, documents } = useKnowledgeStore();
  
  // Adjust property names based on your actual Document type
  const selectedDocument = documents.find(doc => doc.id === selectedDocumentId);
  
  if (!selectedDocumentId) {
    return (
      <div className="space-y-6">
        <div className="text-center p-6 border-2 border-dashed rounded-lg">
          <p className="text-gray-500">Select a document to view its contents</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
       <DocumentView 
        items={(selectedDocument as any) || items}
        content={(selectedDocument as any)?.content}
        fileName={(selectedDocument as any)?.name}
        mimeType={(selectedDocument as any)?.mimeType}
      />
    </div>
  );
}

// Also export the DocumentView component so it can be used elsewhere
export { DocumentView };