'use client';
import { useState, useEffect } from 'react';
import { useTemplateStore } from '@/store/templateStore';
import { ChartChekTemplate } from '@/types/store/templates';
import { KipuEvaluation } from '@/types/kipu';
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
    const { 
        templates, 
        fetchTemplates, 
        createTemplate, 
        selectedTemplate,
        setSelectedTemplate,
        kipuTemplates,
        isLoadingKipuTemplates,
        selectedKipuTemplate,
        error,
        fetchKipuTemplates,
        fetchKipuTemplate,
        setSelectedKipuTemplate,
        importKipuTemplate
    } = useTemplateStore();
    
    const [isCreating, setIsCreating] = useState(false);
    
    // Use the store's loading and error states
    const isLoadingKipu = isLoadingKipuTemplates;
    const kipuError = error;

    useEffect(() => {
        // Load templates and KIPU templates on component mount
        fetchTemplates();
        fetchKipuTemplates();
    }, [fetchTemplates, fetchKipuTemplates]);

    // Handler for selecting a KIPU template
    const handleSelectKipuTemplate = (template: any) => {
        fetchKipuTemplate(template.id);
    };

    // Handler for importing a KIPU template
    const handleImportKipuTemplate = async () => {
        if (!selectedKipuTemplate) return;

        try {
            // Use the store's importKipuTemplate function
            await importKipuTemplate(selectedKipuTemplate);
            
            // Refresh the templates list after import
            fetchTemplates();
            
            // Reset the selected KIPU template
            setSelectedKipuTemplate(null);
        } catch (error) {
            console.error('Error importing KIPU template:', error);
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
                        <div className="text-center py-4 text-gray-500">
                            No templates available
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {templates.map(template => (
                                <div
                                    key={template.id}
                                    className="p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
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
                                        className="p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSelectKipuTemplate(template)}
                                    >
                                        <div className="font-medium">{template.name}</div>
                                        <div className="text-sm text-gray-500">
                                            ID: {template.id}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="md:col-span-2 bg-white p-4 rounded-lg shadow">
                    {isCreating ? (
                        <>
                            <h2 className="text-lg font-medium mb-4">Create New Template</h2>
                            <TemplateForm onSave={handleSaveTemplate} />
                        </>
                    ) : selectedTemplate ? (
                        <>
                            <h2 className="text-lg font-medium mb-4">Edit Template</h2>
                            <TemplateDetail template={selectedTemplate} />
                        </>
                    ) : selectedKipuTemplate ? (
                        <>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-medium">KIPU Template: {selectedKipuTemplate.name}</h2>
                                <Button 
                                    onClick={handleImportKipuTemplate}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    Import Template
                                </Button>
                            </div>
                            <div className="bg-gray-50 p-4 rounded">
                                <pre className="whitespace-pre-wrap text-sm">
                                    {JSON.stringify(selectedKipuTemplate, null, 2)}
                                </pre>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            Select a template from the library or create a new one
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}