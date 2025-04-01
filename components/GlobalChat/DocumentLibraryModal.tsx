'use client'

import { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useDocumentStore } from '@/store/documentStore';
import { DocumentIcon } from '@heroicons/react/24/outline';

interface DocumentLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (documentIds: string[]) => void;
}

export default function DocumentLibraryModal({
  isOpen,
  onClose,
  onSelect
}: DocumentLibraryModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const { documentLibrary, fetchDocumentLibrary, isLoading } = useDocumentStore();
  
  useEffect(() => {
    if (isOpen) {
      fetchDocumentLibrary();
    }
  }, [isOpen, fetchDocumentLibrary]);
  
  useEffect(() => {
    // Reset selections when modal opens/closes
    if (!isOpen) {
      setSelectedDocuments([]);
      setSearchQuery('');
    }
  }, [isOpen]);
  
  const filteredDocuments = documentLibrary.filter(doc => {
    return doc.file_name.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  const handleToggleDocument = (documentId: string) => {
    setSelectedDocuments(prev => {
      if (prev.includes(documentId)) {
        return prev.filter(id => id !== documentId);
      } else {
        return [...prev, documentId];
      }
    });
  };
  
  const handleSelectAll = () => {
    if (selectedDocuments.length === filteredDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(filteredDocuments.map(doc => doc.document_id));
    }
  };
  
  const handleSave = () => {
    onSelect(selectedDocuments);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[80vh] flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Document Library</h2>
          </div>
          
          <div className="p-4">
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-4"
            />
            
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">
                {selectedDocuments.length} of {filteredDocuments.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedDocuments.length === filteredDocuments.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            
            <div className="overflow-y-auto max-h-[50vh]">
              {isLoading ? (
                <div className="text-center py-4">Loading documents...</div>
              ) : filteredDocuments.length > 0 ? (
                <ul className="divide-y">
                  {filteredDocuments.map((doc) => (
                    <li key={doc.document_id} className="py-2">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={`doc-${doc.document_id}`}
                          checked={selectedDocuments.includes(doc.document_id)}
                          onCheckedChange={() => handleToggleDocument(doc.document_id)}
                        />
                        <label
                          htmlFor={`doc-${doc.document_id}`}
                          className="flex items-center space-x-2 cursor-pointer flex-1"
                        >
                          <DocumentIcon className="h-5 w-5 text-gray-400" />
                          <div className="truncate">
                            <p className="text-sm font-medium">{doc.file_name}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </label>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-4">No documents found</div>
              )}
            </div>
          </div>
          
          <div className="p-4 border-t flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={selectedDocuments.length === 0}
            >
              Add Selected
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}