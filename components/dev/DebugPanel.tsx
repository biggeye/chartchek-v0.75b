// components/dev/DebugPanel.tsx
'use client';

import { useState, useEffect } from 'react';
import { usePatientStore } from '@/store/patient/patientStore';
import { useFacilityStore } from '@/store/patient/facilityStore';
import { useStreamStore } from '@/store/chat/streamStore';
import { useKnowledgeStore } from '@/store/doc/knowledgeStore';
import { X, Maximize, Minimize } from 'lucide-react';
import useDocumentStore from '@/store/doc/documentStore';
import { useEvaluationsStore } from '@/store/patient/evaluationsStore';
import { useGlobalChatStore } from '@/store/chat/chatStore';
import useLegacyChatStore from '@/store/chat/legacyChatStore';
import useTemplatesStore from '@/store/doc/templateStore';

interface DebugSectionProps {
  title: string;
  data: any;
  isExpanded: boolean;
  onToggle: () => void;
}

interface FunctionInspectorProps {
  func: Function;
}

const FunctionInspector = ({ func }: FunctionInspectorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExecutor, setShowExecutor] = useState(false);

  const funcName = func.name || 'anonymous';
  const funcString = func.toString();

  return (
    <div className="my-1">
      <div className="flex items-center justify-between">
        <div
          className="cursor-pointer text-blue-400 hover:text-blue-300"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '▼' : '▶'} [Function: {funcName}]
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowExecutor(true);
          }}
          className="text-green-400 hover:text-green-300"
        >
          Run
        </button>
      </div>

      {isExpanded && (
        <div className="ml-4 mt-1 p-2 bg-gray-800 rounded text-xs overflow-x-auto">
          <pre>{funcString}</pre>
        </div>
      )}

      {showExecutor && <FunctionExecutor func={func} onClose={() => setShowExecutor(false)} />}
    </div>
  );
};

interface FunctionExecutorProps {
  func: Function;
  onClose: () => void;
}

const FunctionExecutor = ({ func, onClose }: FunctionExecutorProps) => {
  const [args, setArgs] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resultExpanded, setResultExpanded] = useState(true);

  // Extract parameter names from the function signature
  const funcString = func.toString();
  const paramMatch = funcString.match(/\(([^)]*)\)/);
  const paramString = paramMatch ? paramMatch[1] : '';
  const paramNames = paramString.split(',').map(p => p.trim()).filter(p => p);

  // Initialize args based on parameter names
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
    setResult(null);
    try {
      // Attempt to parse each argument as JSON or convert to a primitive type
      const parsedArgs = args.map(arg => {
        try {
          if ((arg.startsWith('{') && arg.endsWith('}')) || (arg.startsWith('[') && arg.endsWith(']'))) {
            return JSON.parse(arg);
          }
          if (arg === 'true') return true;
          if (arg === 'false') return false;
          if (arg === 'null') return null;
          if (arg === 'undefined') return undefined;
          if (!isNaN(Number(arg))) return Number(arg);
          return arg;
        } catch {
          return arg;
        }
      });
      const execResult = await Promise.resolve(func(...parsedArgs));
      setResult(execResult);
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
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {paramNames.length > 0 ? (
            paramNames.map((param, index) => (
              <div key={index} className="space-y-1 mb-2">
                <label className="block text-sm font-medium text-gray-400">{param}</label>
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
            <p className="text-gray-400 mb-2">This function takes no arguments</p>
          )}

          <button
            onClick={executeFunction}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium disabled:opacity-50 mb-2"
          >
            {isLoading ? 'Executing...' : 'Execute Function'}
          </button>

          {error && (
            <div className="p-3 bg-red-900 bg-opacity-30 border border-red-700 rounded mb-2">
              <p className="text-red-400 font-medium">Error</p>
              <pre className="text-xs mt-1 text-red-300 overflow-x-auto">{error}</pre>
            </div>
          )}

          {result !== null && (
            <div>
              <div
                className="flex items-center cursor-pointer text-gray-400 hover:text-white"
                onClick={() => setResultExpanded(!resultExpanded)}
              >
                <span className="mr-1">{resultExpanded ? '▼' : '▶'}</span>
                <span className="font-medium">Result</span>
              </div>

              {resultExpanded && (
                <div className="p-2 bg-gray-800 rounded">
                  <ObjectInspector data={result} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ObjectInspector = ({ data, depth = 0 }: { data: any; depth?: number }) => {
  const [expandedProps, setExpandedProps] = useState<Record<string, boolean>>({});

  const toggleProp = (prop: string) => {
    setExpandedProps(prev => ({ ...prev, [prop]: !prev[prop] }));
  };

  if (typeof data === 'function') {
    return <FunctionInspector func={data} />;
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
            const isExpandable = (typeof value === 'object' && value !== null) || typeof value === 'function';
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
                  <span className="text-yellow-300">
                    {isArray ? '' : `"${key}": `}
                  </span>
                  {isExpandable ? (
                    !isExpanded && (
                      <span>
                        {typeof value === 'function'
                          ? `[Function: ${value.name || 'anonymous'}]`
                          : isArray
                          ? `Array(${(value as any[]).length})`
                          : `Object {${Object.keys(value).length} keys}` }
                      </span>
                    )
                  ) : (
                    <span className={typeof value === 'string' ? 'text-green-300' : 'text-blue-300'}>
                      {JSON.stringify(value)}
                    </span>
                  )}
                </div>
                {isExpanded && isExpandable && (
                  <ObjectInspector data={value} depth={depth + 1} />
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

const DebugSection = ({ title, data, isExpanded, onToggle }: DebugSectionProps) => {
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
          <ObjectInspector data={data} />
        </div>
      )}
    </div>
  );
};

export const DebugPanel = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'doc' | 'patient' | 'context'>('context');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Get all the stores
  const facilityStore = useFacilityStore();
  const patientStore = usePatientStore();
  const documentStore = useDocumentStore();
  const evaluationsStore = useEvaluationsStore();
  const chatStore = useGlobalChatStore();
  const streamStore = useStreamStore();
  const knowledgeStore = useKnowledgeStore();
  const legacyChatStore = useLegacyChatStore();
  const templatesStore = useTemplatesStore();

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Toggle panel visibility using Alt+D
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

  const panelClass = isFullScreen
    ? 'fixed inset-0 bg-gray-900 text-white z-50 flex flex-col'
    : 'fixed bottom-0 right-0 w-96 max-h-[80vh] bg-gray-900 text-white z-50 rounded-tl-lg shadow-xl overflow-hidden flex flex-col';

  return (
    <div className={panelClass}>
      <div className="flex items-center justify-between p-2 bg-gray-800">
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 rounded ${activeTab === 'chat' ? 'bg-indigo-600' : 'bg-gray-700'}`}
            onClick={() => setActiveTab('chat')}
          >
            chat State
          </button>
          <button
            className={`px-3 py-1 rounded ${activeTab === 'doc' ? 'bg-indigo-600' : 'bg-gray-700'}`}
            onClick={() => setActiveTab('doc')}
          >
            Document State
          </button>
          <button
            className={`px-3 py-1 rounded ${activeTab === 'patient' ? 'bg-indigo-600' : 'bg-gray-700'}`}
            onClick={() => setActiveTab('patient')}
          >
            Patient State
          </button>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsFullScreen(prev => !prev)}
            className="p-1 hover:bg-gray-700 rounded"
          >
            {isFullScreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-gray-700 rounded"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto p-2 flex-1">
        {activeTab === 'context' && (
          <div className="space-y-2">
            <DebugSection
              title="Chat State"
              data={chatStore}
              isExpanded={expandedSections['chatStore']}
              onToggle={() => toggleSection('chatStore')}
            />
            <DebugSection
              title="Stream Store"
              data={streamStore}
              isExpanded={expandedSections['streamStore']}
              onToggle={() => toggleSection('streamStore')}
            />
            <DebugSection
              title="Legacy Chat Store"
              data={legacyChatStore}
              isExpanded={expandedSections['legacyChatStore']}
              onToggle={() => toggleSection('legacyChatStore')}
            />
          </div>
        )}

        {activeTab === 'doc' && (
          <div className="space-y-2">
            <DebugSection
              title="Document Store"
              data={patientStore}
              isExpanded={expandedSections['patientStore']}
              onToggle={() => toggleSection('patientStore')}
            />
            <DebugSection
              title="Knowledge Store"
              data={knowledgeStore}
              isExpanded={expandedSections['knowledgeStore']}
              onToggle={() => toggleSection('knowledgeStore')}
            />
            <DebugSection
              title="Templates Store"
              data={templatesStore}
              isExpanded={expandedSections['templatesStore']}
              onToggle={() => toggleSection('templatesStore')}
            />
          </div>
        )}

        {activeTab === 'patient' && (
          <div className="space-y-2">
            <DebugSection
              title="Patient Store"
              data={patientStore}
              isExpanded={expandedSections['patientStore']}
              onToggle={() => toggleSection('chatStore')}
            />
            <DebugSection
              title="Facility Store"
              data={facilityStore}
              isExpanded={expandedSections['facilityStore']}
              onToggle={() => toggleSection('facilityStore')}
            />
            <DebugSection
              title="Evaluations Store"
              data={evaluationsStore}
              isExpanded={expandedSections['evaluationsStore']}
              onToggle={() => toggleSection('evaluationsStore')}
            />
          </div>
        )}
      </div>

      <div className="p-2 bg-gray-800 text-xs text-gray-400">
        Press Alt+D to toggle this panel
      </div>
    </div>
  );
};

function replacer(key: string, value: any) {
  if (typeof value === 'function') {
    const fnName = value.name || 'anonymous';
    const fnStr = value.toString();
    const paramMatch = fnStr.match(/\(([^)]*)\)/);
    const params = paramMatch ? paramMatch[1] : '';
    const bodyMatch = fnStr.match(/{([\s\S]*)}/);
    let body = bodyMatch ? bodyMatch[1].trim() : '';
    if (body.length > 100) {
      body = body.substring(0, 100) + '...';
    }
    return `[Function: ${fnName}(${params}) {${body} }]`;
  }
  if (value && typeof value === 'object' && value.$$typeof) {
    const type = value.type?.name || value.type?.displayName || (typeof value.type === 'string' ? value.type : 'Unknown');
    const props = value.props ? Object.keys(value.props).join(', ') : '';
    return `[React Element: <${type} ${props}>]`;
  }
  const seen = new WeakSet();
  if (typeof value === 'object' && value !== null) {
    if (seen.has(value)) return '[Circular]';
    seen.add(value);
  }
  if (value instanceof Promise) return '[Promise]';
  return value;
}

export default DebugPanel;
