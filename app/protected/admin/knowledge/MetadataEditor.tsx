// MetadataEditor.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useKnowledgeStore } from "@/store/doc/knowledgeStore";
import { Loader2, Plus, Save, Trash } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select } from "@/components/ui/select"; // Import the new Select component

export default function MetadataEditor() {
  const { 
    selectedDocumentId,
    documents,
    fetchMetadata,
    updateMetadata,
    metadata,
    isLoading 
  } = useKnowledgeStore();
  
  const [editedMetadata, setEditedMetadata] = useState<Record<string, any>>({});
  
  useEffect(() => {
    if (selectedDocumentId) {
      fetchMetadata(selectedDocumentId);
    }
  }, [selectedDocumentId, fetchMetadata]);
  
  useEffect(() => {
    // Convert metadata array to object
    const metaObj = metadata.reduce((acc, meta) => {
      let value: any = meta.value;
      return { ...acc, [meta.key]: value };
    }, {});
    
    setEditedMetadata(metaObj);
  }, [metadata]);
  
  const handleChangeKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return;
    
    const newMetadata = { ...editedMetadata };
    newMetadata[newKey] = newMetadata[oldKey];
    delete newMetadata[oldKey];
    setEditedMetadata(newMetadata);
  };
  
  const handleChangeValue = (key: string, value: any, type: string = 'string') => {
    let processedValue = value;
    
    if (type === 'number') {
      processedValue = Number(value);
    } else if (type === 'boolean') {
      processedValue = value === 'true';
    }
    
    setEditedMetadata({
      ...editedMetadata,
      [key]: processedValue
    });
  };
  
  const handleRemoveField = (key: string) => {
    const newMetadata = { ...editedMetadata };
    delete newMetadata[key];
    setEditedMetadata(newMetadata);
  };
  
  const handleAddField = () => {
    setEditedMetadata({
      ...editedMetadata,
      [`field_${Object.keys(editedMetadata).length}`]: ''
    });
  };
  
  const handleSave = async () => {
    if (!selectedDocumentId) return;
    await updateMetadata(selectedDocumentId, editedMetadata);
  };
  
  if (!selectedDocumentId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Select a document to edit metadata</p>
      </div>
    );
  }
  
  const selectedDocument = documents.find(d => d.id === selectedDocumentId);
  
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-semibold">
          Metadata: {selectedDocument?.document_name || 'Unknown document'}
        </h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleAddField}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Field
          </Button>
          <Button 
   
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            Save
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {Object.entries(editedMetadata).map(([key, value], index) => {
            const valueType = typeof value;
            
            return (
              <div key={key} className="grid grid-cols-12 gap-4 items-end">
                <div className="col-span-4">
                  <Label htmlFor={`key-${index}`}>Field Name</Label>
                  <Input
                    id={`key-${index}`}
                    value={key}
                    onChange={(e) => handleChangeKey(key, e.target.value)}
                  />
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor={`type-${index}`}>Type</Label>
                  <Select
                    value={valueType}
                    onValueChange={(newType: string) => {
                      let newValue = value;
                      
                      if (newType === 'string') {
                        newValue = String(value);
                      } else if (newType === 'number') {
                        newValue = Number(value);
                      } else if (newType === 'boolean') {
                        newValue = Boolean(value);
                      }
                      
                      handleChangeValue(key, newValue, newType);
                    }}
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                  </Select>
                </div>
                
                <div className="col-span-4">
                  <Label htmlFor={`value-${index}`}>Value</Label>
                  {valueType === 'boolean' ? (
                    <Select
                      value={value ? 'true' : 'false'}
                      onValueChange={(newValue: string) => handleChangeValue(key, newValue, 'boolean')}
                    >
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </Select>
                  ) : (
                    <Input
                      id={`value-${index}`}
                      value={value}
                      type={valueType === 'number' ? 'number' : 'text'}
                      onChange={(e) => handleChangeValue(
                        key, 
                        valueType === 'number' ? Number(e.target.value) : e.target.value,
                        valueType
                      )}
                    />
                  )}
                </div>
                
                <div className="col-span-2">
                  <Button
                    variant="outline"
                    onClick={() => handleRemoveField(key)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}