// app/protected/admin/knowledge/DocumentUploader.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TextArea from "@/components/ui/text-area";
import { Card, CardContent } from "@/components/ui/card";
import { useKnowledgeStore } from "@/store/doc/knowledgeStore";
import { Loader2, Upload, File, X } from "lucide-react";
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export default function DocumentUploader() {
  const { 
    selectedCorpusId,
    corpora,
    isLoading,
    uploadDocument,
    setSelectedCorpusId
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
  
  return (
    <div className="space-y-6">
   <Select
  value={selectedCorpusId}
  onValueChange={(value) => {
    // Extract just the ID part if it contains "corpora/"
    const corpusId = value.includes('/') ? value.split('/').pop() || null : value;
    setSelectedCorpusId(corpusId);
  }}
>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a corpus" />
      </SelectTrigger>
      <SelectContent>
        {corpora.map((corpus) => (
          <SelectItem key={corpus.name} value={corpus.name}>
            {corpus.displayName || "Unnamed Corpus"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

      {selectedCorpusId && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="files">Upload Documents</Label>
                <Input
                  id="files"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <TextArea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1"
                  placeholder="Enter a description for these documents"
                />
              </div>
              
              {files.length > 0 && (
                <div className="border rounded-md p-3">
                  <p className="text-sm font-medium mb-2">Selected Files:</p>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div className="flex items-center">
                          <File className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
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
      )}
    </div>
  );
}