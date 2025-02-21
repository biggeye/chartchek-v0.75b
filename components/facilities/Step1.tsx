import React from 'react';

interface Step1Props {
  name: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNext: () => void;
  error: string;
}

export default function Step1({ name, onChange, onNext, error }: Step1Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Step 1: Facility Name</h2>
      <input
        type="text"
        name="name"
        value={name}
        onChange={onChange}
        placeholder="Enter facility name"
        className="w-full p-2 border border-gray-300 rounded"
      />
      {error && <p className="text-red-500">{error}</p>}
      <button
        onClick={onNext}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Next
      </button>
    </div>
  );
}
