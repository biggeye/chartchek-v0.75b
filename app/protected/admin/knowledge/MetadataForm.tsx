// app/protected/admin/knowledge/MetadataForm.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MetadataFormProps {
  metadata: Record<string, any>;
  setMetadata: (metadata: Record<string, any>) => void;
}

export default function MetadataForm({ metadata, setMetadata }: MetadataFormProps) {
  const handleAddField = () => {
    setMetadata({
      ...metadata,
      [`field_${Object.keys(metadata).length}`]: ''
    });
  };
  
  const handleRemoveField = (key: string) => {
    const newMetadata = { ...metadata };
    delete newMetadata[key];
    setMetadata(newMetadata);
  };
  
  const handleChangeKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return;
    
    const newMetadata = { ...metadata };
    newMetadata[newKey] = newMetadata[oldKey];
    delete newMetadata[oldKey];
    setMetadata(newMetadata);
  };
  
  const handleChangeValue = (key: string, value: any, type: string = 'string') => {
    let processedValue = value;
    
    if (type === 'number') {
      processedValue = Number(value);
    } else if (type === 'boolean') {
      processedValue = value === 'true';
    }
    
    setMetadata({
      ...metadata,
      [key]: processedValue
    });
  };
  
  return (
    <div className="space-y-4">
      {Object.entries(metadata).length === 0 ? (
        <div className="text-center p-4 border-2 border-dashed rounded-lg">
          <p className="text-gray-500">No metadata fields. Add some below.</p>
        </div>
      ) : (
        Object.entries(metadata).map(([key, value], index) => {
          const valueType = typeof value;
          
          return (
            <div key={index} className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-5">
                <Label htmlFor={`key-${index}`}>Key</Label>
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
                  onValueChange={(type) => {
                    // Convert the value to the new type
                    if (type === 'string') {
                      handleChangeValue(key, String(value), type);
                    } else if (type === 'number') {
                      handleChangeValue(key, Number(value), type);
                    } else if (type === 'boolean') {
                      handleChangeValue(key, Boolean(value), type);
                    }
                  }}
                >
                  <SelectTrigger id={`type-${index}`}>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-4">
                <Label htmlFor={`value-${index}`}>Value</Label>
                {valueType === 'boolean' ? (
                  <Select
                    value={value ? 'true' : 'false'}
                    onValueChange={(val) => handleChangeValue(key, val, 'boolean')}
                  >
                    <SelectTrigger id={`value-${index}`}>
                      <SelectValue placeholder="Value" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">True</SelectItem>
                      <SelectItem value="false">False</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={`value-${index}`}
                    value={String(value)}
                    type={valueType === 'number' ? 'number' : 'text'}
                    onChange={(e) => handleChangeValue(key, e.target.value, valueType)}
                  />
                )}
              </div>
              
              <div className="col-span-1">
                <Button
                  variant="outline"
                  onClick={() => handleRemoveField(key)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })
      )}
      
      <Button
        variant="outline"
        onClick={handleAddField}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Metadata Field
      </Button>
    </div>
  );
}