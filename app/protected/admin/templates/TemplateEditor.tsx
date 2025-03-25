'use client';

import { useState } from 'react';
import { useTemplateStore } from '@/store/templateStore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ChartChekTemplate, TemplateField } from '@/types/store/templates';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2 } from 'lucide-react'; // Add icon for delete button
import { adaptKipuEvaluationToTemplate } from '@/lib/forms/kipuEvaluationAdapter';


interface TemplateEditorProps {
  template?: ChartChekTemplate;
  isNew: boolean;
  onSave?: () => void;
}
const importFromKipuEvaluation = async (evaluationId: string) => {
  try {
    await useTemplateStore.getState().importKipuEvaluation(evaluationId);
    // The store already updates currentTemplate internally, no need to do it here
  } catch (error) {
    console.error('Error importing KIPU evaluation:', error);
  }
};
// Preview component for the template
const TemplatePreview = ({ template }: { template: Partial<ChartChekTemplate> }) => {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold">{template.name || 'Template Preview'}</h2>
        <p className="text-gray-600 mt-1">Version: {template.version || '1.0.0'}</p>
        {template.description && (
          <p className="text-gray-700 mt-2">{template.description}</p>
        )}
      </div>

      <div className="space-y-6">
        {template.fields?.map((field) => (
          <Card key={field.id} className="border rounded-md">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium">{field.name}</h3>
                {field.required && (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Required</span>
                )}
              </div>

              {renderFieldPreview(field)}

              {Object.keys(field.mappings || {}).length > 0 && (
                <div className="mt-3 pt-3 border-t text-sm">
                  <p className="text-gray-500 font-medium mb-1">System Mappings:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(field.mappings || {}).map(([system, mapping]) => (
                      <div key={system} className="flex">
                        <span className="text-gray-600 font-medium mr-2">{system}:</span>
                        <span className="text-gray-800">{mapping}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {(!template.fields || template.fields.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            No fields have been added to this template yet.
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to render different field types
const renderFieldPreview = (field: TemplateField) => {
  switch (field.type) {
    case 'text':
      return <input type="text" placeholder="Text input" className="mt-1 w-full p-2 border rounded-md bg-gray-50" disabled />;
    case 'textarea':
      return <textarea placeholder="Text area input" className="mt-1 w-full p-2 border rounded-md bg-gray-50 h-24" disabled />;
    case 'select':
      return (
        <select className="mt-1 w-full p-2 border rounded-md bg-gray-50" disabled>
          <option>Select an option</option>
        </select>
      );
    case 'checkbox':
      return (
        <div className="mt-1 flex items-center">
          <input type="checkbox" className="mr-2" disabled />
          <span className="text-gray-700">Checkbox option</span>
        </div>
      );
    case 'radio':
      return (
        <div className="mt-1 flex items-center">
          <input type="radio" className="mr-2" disabled />
          <span className="text-gray-700">Radio option</span>
        </div>
      );
    case 'date':
      return <input type="date" className="mt-1 w-full p-2 border rounded-md bg-gray-50" disabled />;
    default:
      return <p className="mt-1 text-gray-600">Field type: {field.type}</p>;
  }
};

export default function TemplateEditor({ template, isNew, onSave }: TemplateEditorProps) {
  const { saveTemplate, createTemplate } = useTemplateStore();
  const [currentTemplate, setCurrentTemplate] = useState<Partial<ChartChekTemplate>>(
    template || {
      id: '',
      name: 'New Template',
      version: '1.0.0',
      description: '',
      targetSystems: ['KIPU', 'ChartChek'],
      fields: [],
      transformations: [],
      validationRules: []
    }
  );

  // State for view mode toggle
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');
  // State for saving status
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (isNew) {
        await createTemplate(currentTemplate as ChartChekTemplate);
      } else {
        await saveTemplate(currentTemplate as ChartChekTemplate);
      }
      onSave?.();
    } catch (error) {
      console.error("Failed to save template:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddField = () => {
    setCurrentTemplate({
      ...currentTemplate,
      fields: [
        ...(currentTemplate.fields || []),
        {
          id: `field_${Date.now()}`,
          name: 'New Field',
          type: 'text',
          required: false,
          mappings: {}
        }
      ]
    });
  };

  const handleFieldUpdate = (index: number, field: TemplateField) => {
    const updatedFields = [...(currentTemplate.fields || [])];
    updatedFields[index] = field;
    setCurrentTemplate({
      ...currentTemplate,
      fields: updatedFields
    });
  };

  const handleRemoveField = (index: number) => {
    const updatedFields = [...(currentTemplate.fields || [])];
    updatedFields.splice(index, 1);
    setCurrentTemplate({
      ...currentTemplate,
      fields: updatedFields
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{isNew ? 'Create New Template' : 'Edit Template'}</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className={viewMode === 'code' ? 'font-medium' : 'text-gray-500'}>Code</span>
            <Switch
              checked={viewMode === 'preview'}
              onChange={(checked: boolean) => setViewMode(checked ? 'preview' : 'code')}
            />
            <span className={viewMode === 'preview' ? 'font-medium' : 'text-gray-500'}>Preview</span>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </div>

      {viewMode === 'preview' ? (
        <TemplatePreview template={currentTemplate} />
      ) : (
        <>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                <Input
                  value={currentTemplate.name || ''}
                  onChange={(e) => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                <Input
                  value={currentTemplate.version || ''}
                  onChange={(e) => setCurrentTemplate({ ...currentTemplate, version: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <Input
                value={currentTemplate.description || ''}
                onChange={(e) => setCurrentTemplate({ ...currentTemplate, description: e.target.value })}
                className="w-full"
              />
            </div>
          </div>

          <Tabs defaultValue="fields">
            <TabsList className="w-full">
              <TabsTrigger value="fields" className="flex-1">Fields</TabsTrigger>
              <TabsTrigger value="transformations" className="flex-1">Transformations</TabsTrigger>
              <TabsTrigger value="validation" className="flex-1">Validation</TabsTrigger>
            </TabsList>

            <TabsContent value="fields" className="py-4">
              <div className="mb-4 flex justify-between">
                <h3 className="text-lg font-medium">Template Fields</h3>
                <Button outline onClick={handleAddField}>Add Field</Button>
              </div>

              <div className="space-y-4">
                {currentTemplate.fields?.map((field, index) => (
                  <div key={field.id} className="border p-4 rounded-md">
                    <div className="flex justify-between mb-2">
                      <h4 className="font-medium">Field #{index + 1}</h4>
                      <Button 
                        outline
                        onClick={() => handleRemoveField(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-2">
                      <div>
                        <label className="block text-sm font-medium mb-1">Field Name</label>
                        <Input
                          value={field.name}
                          onChange={(e) => {
                            const updatedField = { ...field, name: e.target.value };
                            handleFieldUpdate(index, updatedField);
                          }}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Field Type</label>
                        <select
                          value={field.type}
                          onChange={(e) => {
                            const updatedField = { ...field, type: e.target.value as any };
                            handleFieldUpdate(index, updatedField);
                          }}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="text">Text</option>
                          <option value="textarea">Text Area</option>
                          <option value="select">Select</option>
                          <option value="checkbox">Checkbox</option>
                          <option value="radio">Radio</option>
                          <option value="date">Date</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => {
                          const updatedField = { ...field, required: e.target.checked };
                          handleFieldUpdate(index, updatedField);
                        }}
                        className="mr-2"
                      />
                      <label className="text-sm">Required Field</label>
                    </div>

                    <div className="border-t pt-3 mt-3">
                      <h4 className="text-sm font-medium mb-2">Field Mappings</h4>
                      <div className="space-y-2">
                        {Object.entries(field.mappings || {}).map(([system, mapping]) => (
                          <div key={system} className="flex space-x-2">
                            <Input value={system} disabled className="w-1/3" />
                            <Input
                              value={mapping}
                              onChange={(e) => {
                                const updatedMappings = { ...field.mappings, [system]: e.target.value };
                                const updatedField = { ...field, mappings: updatedMappings };
                                handleFieldUpdate(index, updatedField);
                              }}
                              className="w-2/3"
                            />
                          </div>
                        ))}
                        <Button
                          outline
                          onClick={() => {
                            const systemName = `system_${Object.keys(field.mappings || {}).length + 1}`;
                            const updatedMappings = { ...field.mappings, [systemName]: '' };
                            const updatedField = { ...field, mappings: updatedMappings };
                            handleFieldUpdate(index, updatedField);
                          }}
                          className="mt-2"
                        >
                          Add Mapping
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {(!currentTemplate.fields || currentTemplate.fields.length === 0) && (
                  <div className="text-center py-8 text-gray-500 border rounded-md">
                    No fields have been added to this template yet.
                    <div className="mt-4">
                      <Button outline onClick={handleAddField}>Add Your First Field</Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="transformations" className="py-4">
              <div className="p-8 text-center text-gray-500 border rounded-md">
                Transformation rules configuration coming soon
              </div>
            </TabsContent>

            <TabsContent value="validation" className="py-4">
              <div className="p-8 text-center text-gray-500 border rounded-md">
                Validation rules configuration coming soon
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}