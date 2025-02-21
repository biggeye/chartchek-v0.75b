import React from 'react';

interface Step3Props {
  capacity: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNext: () => void;
  onBack: () => void;
  error: string;
}

export default function Step3({ capacity, onChange, onNext, onBack, error }: Step3Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Step 3: Capacity</h2>
      <input
        type="number"
        name="capacity"
        value={capacity}
        onChange={onChange}
        placeholder="Enter capacity"
        className="w-full p-2 border border-gray-300 rounded"
      />
      {error && <p className="text-red-500">{error}</p>}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Next
        </button>
      </div>
    </div>
  );
}
