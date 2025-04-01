// app/protected/admin/knowledge/DocumentUploader.tsx
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TextArea from "@/components/ui/text-area";
import { Card, CardContent } from "@/components/ui/card";
import { useKnowledgeStore } from "@/store/knowledgeStore";
import { Loader2, Upload, File, X } from "lucide-react";

export default function DocumentUploader() {
  const { 
    selectedCorpusId,
    corpora,
    isLoading,
    uploadDocument
  } = useKnowledgeStore();
  
  const [files, setFiles] = useState<File[]>([]);
  const [description, setDescription] = useState("");
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };
  
  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };
  
  const handleUpload = async () => {
    if (!selectedCorpusId || files.length === 0) return;
    
    for (const file of files) {
      await uploadDocument(selectedCorpusId, file, { description });
    }
    
    // Reset form
    setFiles([]);
    setDescription("");
  };
  
  const selectedCorpus = corpora.find(c => c.id === selectedCorpusId);
  
  return (
    <div className="space-y-6">
      {!selectedCorpusId ? (
        <div className="text-center p-6 border-2 border-dashed rounded-lg">
          <p className="text-gray-500">Please select a corpus first</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              Upload to: <span className="font-bold">{selectedCorpus?.display_name}</span>
            </h3>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Select Files</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <TextArea
                    id="description"
                    placeholder="Add notes about these documents"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                {files.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Files ({files.length})</Label>
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <div className="flex items-center">
                            <File className="h-4 w-4 mr-2" />
                            <span className="text-sm truncate max-w-[200px]">
                              {file.name}
                            </span>
                          </div>
                          <Button
                            outline
                            onClick={() => handleRemoveFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <Button
                  onClick={handleUpload}
                  disabled={!selectedCorpusId || files.length === 0 || isLoading}
                  className="w-full"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Upload {files.length} {files.length === 1 ? 'Document' : 'Documents'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}