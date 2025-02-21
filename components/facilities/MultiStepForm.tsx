import React, { useState } from 'react';

interface FacilityDetails {
  name: string;
  type: string;
  capacity: number;
  regulatoryInfo: string;
}

export default function MultiStepForm() {
  const [step, setStep] = useState(1);
  const [facilityDetails, setFacilityDetails] = useState<FacilityDetails>({
    name: '',
    type: '',
    capacity: 0,
    regulatoryInfo: '',
  });

  const handleNext = () => {
    if (step === 1 && facilityDetails.name) {
      setStep(3); // Skip to step 3 if name is already filled
    } else if (step === 2 && facilityDetails.type) {
      setStep(4); // Skip to step 4 if type is already filled
    } else {
      setStep((prev) => prev + 1);
    }
  };
  const handleBack = () => setStep((prev) => prev - 1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFacilityDetails((prev) => ({ ...prev, [name]: value }));
  };

  // Check if we can skip steps initially
  React.useEffect(() => {
    if (facilityDetails.name) {
      setStep(2);
    }
    if (facilityDetails.type) {
      setStep(3);
    }
    if (facilityDetails.capacity) {
      setStep(4);
    }
  }, [facilityDetails]);
  return (
    <div className="max-w-md mx-auto mt-8 p-4 bg-white shadow-md rounded-lg">
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Step 1: Facility Name</h2>
          <input
            type="text"
            name="name"
            value={facilityDetails.name}
            onChange={handleChange}
            placeholder="Enter facility name"
            className="w-full p-2 border border-gray-300 rounded"
          />
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Next
          </button>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Step 2: Facility Type</h2>
          <select
            name="type"
            value={facilityDetails.type}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="">Select type</option>
            <option value="hospital">Hospital</option>
            <option value="clinic">Clinic</option>
            <option value="nursing_home">Nursing Home</option>
          </select>
          <div className="flex justify-between">
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Next
            </button>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Step 3: Capacity</h2>
          <input
            type="number"
            name="capacity"
            value={facilityDetails.capacity}
            onChange={handleChange}
            placeholder="Enter capacity"
            className="w-full p-2 border border-gray-300 rounded"
          />
          <div className="flex justify-between">
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Next
            </button>
          </div>
        </div>
      )}
      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Step 4: Regulatory Info</h2>
          <input
            type="text"
            name="regulatoryInfo"
            value={facilityDetails.regulatoryInfo}
            onChange={handleChange}
            placeholder="Enter regulatory info"
            className="w-full p-2 border border-gray-300 rounded"
          />
          <div className="flex justify-between">
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Back
            </button>
            <button
              onClick={() => alert('Form submitted!')}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
  );
}
