// components/dev/DebugPanel.tsx
'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
// patient state
import { usePatientStore } from '@/store/patient/patientStore';
import { useFacilityStore } from '@/store/patient/facilityStore';
import { useEvaluationsStore } from '@/store/patient/evaluationsStore';
// chat state
import { useGlobalChatStore } from '@/store/chat/globalChatStore';
//doc state
import useDocumentStore from '@/store/doc/documentStore';
import useTemplateStore from '@/store/doc/templateStore';
import { useKnowledgeStore } from '@/store/doc/knowledgeStore';


interface DebugSectionProps {
  title: string;
  data: any;
  isExpanded: boolean;
  onToggle: () => void;
}

interface FunctionInspectorProps {
  func: Function;
  setSelectedFunction: (func: Function) => void;
}

interface FunctionExecutorProps {
  func: Function;
  onClose: () => void;
}

export const FunctionInspector = ({ func, setSelectedFunction }: FunctionInspectorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const funcName = func.name || 'anonymous';
  const funcString = func.toString();

  return (
    <div className="my-1">
      <div className="flex items-center">
        <div
          className="cursor-pointer text-blue-400 hover:text-blue-300 flex-grow"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '▼' : '▶'} [Function: {funcName}]
        </div>
        <button
          className="px-2 py-0.5 text-xs bg-blue-600 hover:bg-blue-700 rounded text-white"
          onClick={() => setSelectedFunction(func)}
        >
          Execute
        </button>
      </div>

      {isExpanded && (
        <div className="ml-4 mt-1 p-2 bg-gray-800 rounded text-xs overflow-x-auto">
          <pre>{funcString}</pre>
        </div>
      )}
    </div>
  );
};

const FunctionExecutor = ({ func, onClose }: FunctionExecutorProps) => {
  const [args, setArgs] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resultExpanded, setResultExpanded] = useState(true);
  const [selectedFunction, setSelectedFunction] = useState<Function | null>(null);

  // Parse function signature to get parameter names
  const funcString = func.toString();
  const paramMatch = funcString.match(/\(([^)]*)\)/);
  const paramString = paramMatch ? paramMatch[1] : '';
  const paramNames = paramString.split(',').map(p => p.trim()).filter(p => p);

  // Initialize args with empty strings for each parameter
  useEffect(() => {
    setArgs(paramNames.map(() => ''));
  }, [paramNames.join()]);

  const updateArg = (index: number, value: string) => {
    const newArgs = [...args];
    newArgs[index] = value;
    setArgs(newArgs);
  };

  const executeFunction = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Parse JSON for each argument
      const parsedArgs = args.map(arg => {
        try {
          // Try to parse as JSON if it looks like an object/array
          if ((arg.startsWith('{') && arg.endsWith('}')) ||
            (arg.startsWith('[') && arg.endsWith(']'))) {
            return JSON.parse(arg);
          }
          // Try to convert to appropriate primitive type
          if (arg === 'true') return true;
          if (arg === 'false') return false;
          if (arg === 'null') return null;
          if (arg === 'undefined') return undefined;
          if (!isNaN(Number(arg))) return Number(arg);
          // Otherwise keep as string
          return arg;
        } catch {
          return arg; // If parsing fails, use the raw string
        }
      });

      // Execute the function with the parsed arguments
      const result = await Promise.resolve(func(...parsedArgs));
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 bg-gray-800 flex justify-between items-center">
          <h3 className="text-lg font-medium">
            Execute: <span className="text-blue-400">{func.name || 'anonymous'}</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <div className="space-y-4">
            {paramNames.length > 0 ? (
              paramNames.map((param, index) => (
                <div key={index} className="space-y-1">
                  <label className="block text-sm font-medium text-gray-400">
                    {param}
                  </label>
                  <textarea
                    value={args[index] || ''}
                    onChange={(e) => updateArg(index, e.target.value)}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm font-mono"
                    rows={3}
                    placeholder={`Enter value for ${param}`}
                  />
                </div>
              ))
            ) : (
              <p className="text-gray-400">This function takes no arguments</p>
            )}

            <button
              onClick={executeFunction}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium disabled:opacity-50"
            >
              {isLoading ? 'Executing...' : 'Execute Function'}
            </button>

            {error && (
              <div className="p-3 bg-red-900 bg-opacity-30 border border-red-700 rounded">
                <p className="text-red-400 font-medium">Error</p>
                <pre className="text-xs mt-1 text-red-300 overflow-x-auto">{error}</pre>
              </div>
            )}

            {result !== null && (
              <div className="space-y-1">
                <div
                  className="flex items-center cursor-pointer text-gray-400 hover:text-white"
                  onClick={() => setResultExpanded(!resultExpanded)}
                >
                  <span className="mr-1">{resultExpanded ? '▼' : '▶'}</span>
                  <span className="font-medium">Result</span>
                </div>

                {resultExpanded && (
                  <div className="p-2 bg-gray-800 rounded">
                    <ObjectInspector 
                      data={result} 
                      setSelectedFunction={setSelectedFunction}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// New recursive object inspector component
const ObjectInspector = ({ 
  data, 
  depth = 0,
  setSelectedFunction 
}: { 
  data: any, 
  depth?: number,
  setSelectedFunction: (func: Function) => void
}) => {
  const [expandedProps, setExpandedProps] = useState<Record<string, boolean>>({});

  const toggleProp = (prop: string) => {
    setExpandedProps((prev: Record<string, boolean>) => ({
      ...prev,
      [prop]: !prev[prop]
    }));
  };

  if (typeof data === 'function') {
    return <FunctionInspector 
      func={data} 
      setSelectedFunction={setSelectedFunction} 
    />;
  }

  if (typeof data !== 'object' || data === null) {
    return <span>{JSON.stringify(data)}</span>;
  }

  const isArray = Array.isArray(data);
  const entries = Object.entries(data);
    
  return (
    <div style={{ marginLeft: depth > 0 ? 16 : 0 }}>
      <span>{isArray ? '[' : '{'}</span>
      {entries.length > 0 && (
        <div>
          {entries.map(([key, value]) => {
            const isObject = typeof value === 'object' && value !== null;
            const isFunction = typeof value === 'function';
            const isExpandable = isObject || isFunction;
            const isExpanded = expandedProps[key];

            return (
              <div key={key} className="my-1">
                <div className="flex">
                  {isExpandable && (
                    <span
                      className="mr-1 cursor-pointer text-gray-400 hover:text-white"
                      onClick={() => toggleProp(key)}
                    >
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  )}
                  <span className="text-yellow-300">{isArray ? '' : `"${key}": `}</span>
                  {isExpandable ? (
                    isExpanded ? (
                      <span></span>
                    ) : (
                      <span>
                        {isFunction
                          ? `[Function: ${value.name || 'anonymous'}]`
                          : isArray
                            ? `Array(${(value as any[]).length})`
                            : `Object {${Object.keys(value).length} keys}`}
                      </span>
                    )
                  ) : (
                    <span className={typeof value === 'string' ? 'text-green-300' : 'text-blue-300'}>
                      {JSON.stringify(value)}
                    </span>
                  )}
                </div>
                {isExpanded && isExpandable && (
                  <ObjectInspector 
                    data={value} 
                    depth={depth + 1} 
                    setSelectedFunction={setSelectedFunction}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
      <span>{isArray ? ']' : '}'}</span>
    </div>
  );
};

const DebugSection = ({ 
  title, 
  data, 
  isExpanded, 
  onToggle,
  setSelectedFunction 
}: DebugSectionProps & { 
  setSelectedFunction: (func: Function) => void 
}) => {
  return (
    <div className="bg-gray-800 rounded overflow-hidden">
      <button
        className="w-full p-2 text-left font-medium flex justify-between items-center hover:bg-gray-700"
        onClick={onToggle}
      >
        {title}
        <span>{isExpanded ? '−' : '+'}</span>
      </button>

      {isExpanded && (
        <div className="p-2 text-xs font-mono bg-gray-950 overflow-x-auto">
          <ObjectInspector 
            data={data} 
            setSelectedFunction={setSelectedFunction}
          />
        </div>
      )}
    </div>
  );
};

export const DebugPanel = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'doc' | 'patient'>('chat');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [selectedFunction, setSelectedFunction] = useState<Function | null>(null);
  
  // Get all the contexts and stores
  const facilityStore = useFacilityStore();
  const patientStore = usePatientStore();
  const documentStore = useDocumentStore();
  const evaluationsStore = useEvaluationsStore();
  const chatStore = useGlobalChatStore();
  const templateStore = useTemplateStore();
  const knowledgeStore = useKnowledgeStore();

  const toggleSection = (section: string) => {
    setExpandedSections((prev: Record<string, boolean>) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'd') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (process.env.NODE_ENV !== 'development') return null;
  if (!isVisible) return null;

  return (
    <>
      {selectedFunction && (
        <FunctionExecutor
          func={selectedFunction}
          onClose={() => setSelectedFunction(null)}
        />
      )}
      <div className="fixed bottom-0 right-0 w-96 max-h-[80vh] bg-gray-900 text-white z-50 rounded-tl-lg shadow-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-2 bg-gray-800">
          <div className="flex space-x-2">
            <button
              className={`px-3 py-1 rounded ${activeTab === 'chat' ? 'bg-indigo-600' : 'bg-gray-700'}`}
              onClick={() => setActiveTab('chat')}
            >
              chatState
            </button>
            <button
              className={`px-3 py-1 rounded ${activeTab === 'doc' ? 'bg-indigo-600' : 'bg-gray-700'}`}
              onClick={() => setActiveTab('doc')}
            >
              docState
            </button>
            <button
              className={`px-3 py-1 rounded ${activeTab === 'patient' ? 'bg-indigo-600' : 'bg-gray-700'}`}
              onClick={() => setActiveTab('patient')}
            >patientState
            </button>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-gray-700 rounded"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto p-2 flex-1">
          {activeTab === 'chat' && (
            <div className="space-y-2">
              <DebugSection
                title="Chat State"
                data={chatStore}
                isExpanded={expandedSections['chatStore']}
                onToggle={() => toggleSection('chatStore')}
                setSelectedFunction={setSelectedFunction}
              />
            </div>
          )}

          {activeTab === 'patient' && (
            <div className="space-y-2">
              <DebugSection
                title="Patient State"
                data={patientStore}
                isExpanded={expandedSections['patientStore']}
                onToggle={() => toggleSection('patientStore')}
                setSelectedFunction={setSelectedFunction}
              />
              <DebugSection
                title="Facility State"
                data={facilityStore}
                isExpanded={expandedSections['facilityStore']}
                onToggle={() => toggleSection('facilityStore')}
                setSelectedFunction={setSelectedFunction}
              />
              <DebugSection
                title="Evaluations State"
                data={evaluationsStore}
                isExpanded={expandedSections['evaluationsStore']}
                onToggle={() => toggleSection('evaluationsStore')}
                setSelectedFunction={setSelectedFunction}
              />
            </div>
          )}

          {activeTab === 'doc' && (
            <div className="space-y-2">
              <DebugSection
                title="Document State"
                data={documentStore}
                isExpanded={expandedSections['documentStore']}
                onToggle={() => toggleSection('documentStore')}
                setSelectedFunction={setSelectedFunction}
              />
              <DebugSection
                title="Template State"
                data={templateStore}
                isExpanded={expandedSections['templateStore']}
                onToggle={() => toggleSection('templateStore')}
                setSelectedFunction={setSelectedFunction}
              />
              <DebugSection
                title="Knowledge State"
                data={knowledgeStore}
                isExpanded={expandedSections['knowledgeStore']}
                onToggle={() => toggleSection('knowledgeStore')}
                setSelectedFunction={setSelectedFunction}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DebugPanel;