import React from 'react';

interface Step4Props {
  regulatoryInfo: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBack: () => void;
  onSubmit: () => void;
  error: string;
}

export default function Step4({ regulatoryInfo, onChange, onBack, onSubmit, error }: Step4Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Step 4: Regulatory Info</h2>
      <input
        type="text"
        name="regulatoryInfo"
        value={regulatoryInfo}
        onChange={onChange}
        placeholder="Enter regulatory info"
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
          onClick={onSubmit}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
