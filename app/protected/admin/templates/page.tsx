'use client';

import { useState, useEffect } from 'react';
import { useTemplateStore } from '@/store/templateStore';
import { ChartChekTemplate } from '@/types/store/templates';
import TemplateEditor from './TemplateEditor';
import { Button } from '@/components/ui/button';

// Update your TemplateForm component to match the expected signature
const TemplateForm = ({ onSave }: { onSave: () => void }) => {
    // Reuse your existing TemplateEditor for creating new templates
    return <TemplateEditor isNew={true} onSave={onSave} />;
  };
  
  const TemplateDetail = ({ template }: { template: ChartChekTemplate }) => {
    // Reuse your existing TemplateEditor for viewing/editing templates
    return <TemplateEditor template={template} isNew={false} />;
  };
  

export default function TemplateAdminDashboard() {
    const { templates, fetchTemplates, createTemplate } = useTemplateStore();
    const [selectedTemplate, setSelectedTemplate] = useState<ChartChekTemplate | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [kipuTemplates, setKipuTemplates] = useState<any[]>([]);
    const [isLoadingKipu, setIsLoadingKipu] = useState(false);
    const [kipuError, setKipuError] = useState<string | null>(null);
    const [selectedKipuTemplate, setSelectedKipuTemplate] = useState<any>(null);
    const [isLoadingKipuDetail, setIsLoadingKipuDetail] = useState(false);
    const [kipuDetailError, setKipuDetailError] = useState<string | null>(null);

    // Add this function to fetch KIPU template details
    const fetchKipuTemplateDetail = async (templateId: string) => {
        setIsLoadingKipuDetail(true);
        setKipuDetailError(null);

        try {
            const response = await fetch(`/api/kipu/evaluations/${templateId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch template details');
            }

            console.log('KIPU template detail:', data);
            setSelectedKipuTemplate(data);
        } catch (error) {
            console.error('Error fetching KIPU template detail:', error);
            setKipuDetailError((error as Error).message);
        } finally {
            setIsLoadingKipuDetail(false);
        }
    };

    // Add a handler for clicking on a KIPU template
    const handleSelectKipuTemplate = (template: any) => {
        fetchKipuTemplateDetail(template.id);
    };
    useEffect(() => {
        fetchTemplates();
        fetchKipuTemplates();
    }, [fetchTemplates]);



    const fetchKipuTemplates = async () => {
        setIsLoadingKipu(true);
        setKipuError(null);

        try {
            const response = await fetch('/api/kipu/evaluations');
            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.error || 'Failed to fetch KIPU templates');
            }

            console.log('KIPU templates response:', responseData);

            // The correct path is responseData.evaluations based on your server log
            const templates = responseData.evaluations || [];

            setKipuTemplates(templates);
        } catch (error) {
            console.error('Error fetching KIPU templates:', error);
            setKipuError((error as Error).message);
        } finally {
            setIsLoadingKipu(false);
        }
    };

    const handleCreateNew = () => {
        setSelectedTemplate(null);
        setIsCreating(true);
    };

    const handleSelectTemplate = (template: ChartChekTemplate) => {
        setSelectedTemplate(template);
        setIsCreating(false);
    };

    const handleSaveTemplate = () => {
        // The TemplateEditor already calls createTemplate internally
        setIsCreating(false);
      };

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Template Management Dashboard</h1>
                <Button onClick={handleCreateNew} className="bg-indigo-600 hover:bg-indigo-700">
                    Create New Template
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-white p-4 rounded-lg shadow">
                    <h2 className="text-lg font-medium mb-4">Template Library</h2>

                    {templates.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No templates found. Create your first template!
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {templates.map(template => (
                                <div
                                    key={template.id}
                                    className={`p-3 rounded-md cursor-pointer ${selectedTemplate?.id === template.id ? 'bg-indigo-100 border-indigo-300' : 'hover:bg-gray-100'}`}
                                    onClick={() => handleSelectTemplate(template)}
                                >
                                    <div className="font-medium">{template.name}</div>
                                    <div className="text-sm text-gray-500">v{template.version}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-8">
                        <h2 className="text-lg font-medium mb-4">KIPU Templates</h2>
                        {isLoadingKipu ? (
                            <div className="text-center py-4">Loading KIPU templates...</div>
                        ) : kipuError ? (
                            <div className="text-center py-4 text-red-500">
                                Error: {kipuError}
                                <Button
                                    onClick={fetchKipuTemplates}
                                    className="mt-2 text-xs"
                                >
                                    Retry
                                </Button>
                            </div>
                        ) : kipuTemplates.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">
                                No KIPU templates available
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {kipuTemplates.map(template => (
                                    <div
                                        key={template.id}
                                        className="p-3 rounded-md cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSelectKipuTemplate(template)}
                                    >
                                        <div className="font-medium">{template.name}</div>
                                        <div className="text-sm text-gray-500">KIPU ID: {template.id}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="md:col-span-2 bg-white p-4 rounded-lg shadow">
                    {isCreating ? (
                        <TemplateForm onSave={handleSaveTemplate} />
                    ) : selectedTemplate ? (
                        <TemplateDetail template={selectedTemplate} />
                    ) : selectedKipuTemplate ? (
                        <div>
                            <h2 className="text-xl font-bold mb-4">KIPU Template: {selectedKipuTemplate.name}</h2>
                            {isLoadingKipuDetail ? (
                                <div>Loading template details...</div>
                            ) : kipuDetailError ? (
                                <div className="text-red-500">Error: {kipuDetailError}</div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-medium">Template ID</h3>
                                        <p>{selectedKipuTemplate.id}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-medium">Description</h3>
                                        <p>{selectedKipuTemplate.description || 'No description available'}</p>
                                    </div>
                                    <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-96 text-xs">
                                        {JSON.stringify(selectedKipuTemplate, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            Select a template to view details or click "Create New" to create a template
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}