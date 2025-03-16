'use client';

import { useState } from 'react';

interface ToolCallDebuggerProps {
  toolCalls: any[];
  runId?: string | null;
}

export default function ToolCallDebugger({ toolCalls, runId }: ToolCallDebuggerProps) {
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  if (!toolCalls || toolCalls.length === 0) {
    return null;
  }

  const toggleExpand = (id: string) => {
    setExpandedTool(expandedTool === id ? null : id);
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 my-2 text-xs">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-amber-800">Function Call Debug</h3>
        {runId && (
          <span className="text-amber-600 text-xs">
            Run ID: {runId.substring(0, 8)}...
          </span>
        )}
      </div>
      
      <div className="space-y-2">
        {toolCalls.map((tool) => {
          const toolId = tool.id || `tool-${Math.random().toString(36).substring(7)}`;
          const isExpanded = expandedTool === toolId;
          
          return (
            <div 
              key={toolId} 
              className="border border-amber-300 rounded bg-amber-100 overflow-hidden"
            >
              <div 
                className="flex items-center justify-between p-2 cursor-pointer hover:bg-amber-200"
                onClick={() => toggleExpand(toolId)}
              >
                <div className="font-medium">
                  {tool.function?.name || 'Unknown Function'}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-amber-700">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                </div>
              </div>
              
              {isExpanded && (
                <div className="p-2 border-t border-amber-300 bg-white">
                  <div className="mb-2">
                    <span className="font-medium">Function:</span> {tool.function?.name}
                  </div>
                  
                  <div className="mb-2">
                    <span className="font-medium">ID:</span> {tool.id || 'N/A'}
                  </div>
                  
                  <div className="mb-2">
                    <span className="font-medium">Type:</span> {tool.type || 'N/A'}
                  </div>
                  
                  {tool.function?.arguments && (
                    <div>
                      <span className="font-medium">Arguments:</span>
                      <pre className="mt-1 p-2 bg-gray-100 rounded overflow-auto max-h-32 text-xs">
                        {JSON.stringify(JSON.parse(tool.function.arguments), null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
