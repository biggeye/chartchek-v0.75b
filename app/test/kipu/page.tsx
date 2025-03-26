// app/test/kipu/page.tsx
'use client';

import { useState, useEffect } from 'react';

export default function TestKipuPage() {
    const [evaluations, setEvaluations] = useState<any[]>([]);
    const [selectedEvalId, setSelectedEvalId] = useState<string | null>(null);
    const [evalDetails, setEvalDetails] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch the list of evaluations
    // Update the fetchEvaluations function to match KIPU's response format
    const fetchEvaluations = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/kipu/evaluations');

            if (!response.ok) throw new Error(`HTTP error ${response.status}`);

            const data = await response.json();

            // Add this right after the fetch in fetchEvaluations
            console.log('Raw KIPU response structure:', {
                responseKeys: Object.keys(data),
                nestedDataCheck: data.data ? Object.keys(data.data) : 'No data property',
                evaluationsCheck: data.evaluations ?
                    `Found ${data.evaluations.length} evaluations` :
                    (data.data?.evaluations ? `Found ${data.data.evaluations.length} nested evaluations` : 'No evaluations found')
            });
            // KIPU returns { evaluations: [...] } with pagination
            if (data.evaluations) {
                setEvaluations(data.evaluations);
            } else if (data.data && data.data.evaluations) {
                // Handle possible nested structure from our API wrapper
                setEvaluations(data.data.evaluations);
            } else {
                console.error('Unexpected response structure:', data);
                throw new Error('Unexpected response format');
            }
        } catch (err) {
            setError(`Error fetching evaluations: ${err}`);
            console.error('Error fetching evaluations:', err);
        } finally {
            setLoading(false);
        }
    };


    // Fetch a specific evaluation by ID
// Update the fetchEvaluationDetails function
const fetchEvaluationDetails = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/kipu/evaluations/${id}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      
      const data = await response.json();
      console.log('Evaluation details response:', data);
      
      // The response is already in the format we want to display
      // No need to extract data.data.evaluation
      setEvalDetails(data);
    } catch (err) {
      setError(`Error fetching evaluation details: ${err}`);
      console.error('Error fetching evaluation details:', err);
    } finally {
      setLoading(false);
    }
  };
    // Load evaluations on initial render
    useEffect(() => {
        fetchEvaluations();
    }, []);

    // Handle evaluation selection
    const handleSelectEvaluation = (id: string) => {
        setSelectedEvalId(id);
        fetchEvaluationDetails(id);
    };

    return (
        <div className="p-4 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">KIPU Evaluation Test</h1>

            {/* Controls */}
            <div className="mb-4 flex gap-2">
                <button
                    onClick={fetchEvaluations}
                    className="bg-blue-500 text-white p-2 rounded"
                    disabled={loading}
                >
                    {loading ? 'Loading...' : 'Refresh Evaluations'}
                </button>
            </div>

            {error && <div className="text-red-500 mb-4">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Evaluations List */}
                <div className="border rounded p-4">
                    <h2 className="text-xl font-bold mb-2">Evaluations</h2>
                    {evaluations.length === 0 ? (
                        <p>{loading ? 'Loading...' : 'No evaluations found'}</p>
                    ) : (
                        <ul className="max-h-[600px] overflow-y-auto">
                            {evaluations.map((evaluation) => (
                                <li
                                    key={evaluation.id}
                                    className={`p-2 mb-1 cursor-pointer rounded hover:bg-gray-100 ${selectedEvalId === evaluation.id ? 'bg-blue-100' : ''
                                        }`}
                                    onClick={() => handleSelectEvaluation(evaluation.id)}
                                >
                                    <div className="font-medium">{evaluation.name || 'Unnamed Evaluation'}</div>
                                    <div className="text-sm text-gray-500">ID: {evaluation.id}</div>
                                    <div className="text-xs text-gray-400">
                                        {evaluation.created_at ? new Date(evaluation.created_at).toLocaleString() : 'No date'}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        Status: {evaluation.enabled ? 'Enabled' : 'Disabled'}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Evaluation Details */}
                <div className="border rounded p-4 md:col-span-2">
                    <h2 className="text-xl font-bold mb-2">Evaluation Details</h2>
                    {loading && selectedEvalId ? (
                        <p>Loading details...</p>
                    ) : evalDetails ? (
                        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[600px] text-xs">
                            {JSON.stringify(evalDetails, null, 2)}
                        </pre>
                    ) : (
                        <p>Select an evaluation to view details</p>
                    )}
                </div>
            </div>
        </div>
    );
}