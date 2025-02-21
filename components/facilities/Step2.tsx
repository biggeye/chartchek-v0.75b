import React from 'react';

interface Step2Props {
  type: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onNext: () => void;
  onBack: () => void;
  error: string;
}

export default function Step2({ type, onChange, onNext, onBack, error }: Step2Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Step 2: Facility Type</h2>
      <select
        name="type"
        value={type}
        onChange={onChange}
        className="w-full p-2 border border-gray-300 rounded"
      >
        <option value="">Select type</option>
        <option value="hospital">Hospital</option>
        <option value="clinic">Clinic</option>
        <option value="nursing_home">Nursing Home</option>
      </select>
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
