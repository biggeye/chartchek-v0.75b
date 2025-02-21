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
    <div>
      {step === 1 && (
        <div>
          <h2>Step 1: Facility Name</h2>
          <input
            type="text"
            name="name"
            value={facilityDetails.name}
            onChange={handleChange}
            placeholder="Enter facility name"
          />
          <button onClick={handleNext}>Next</button>
        </div>
      )}
      {step === 2 && (
        <div>
          <h2>Step 2: Facility Type</h2>
          <select name="type" value={facilityDetails.type} onChange={handleChange}>
            <option value="">Select type</option>
            <option value="hospital">Hospital</option>
            <option value="clinic">Clinic</option>
            <option value="nursing_home">Nursing Home</option>
          </select>
          <button onClick={handleBack}>Back</button>
          <button onClick={handleNext}>Next</button>
        </div>
      )}
      {step === 3 && (
        <div>
          <h2>Step 3: Capacity</h2>
          <input
            type="number"
            name="capacity"
            value={facilityDetails.capacity}
            onChange={handleChange}
            placeholder="Enter capacity"
          />
          <button onClick={handleBack}>Back</button>
          <button onClick={handleNext}>Next</button>
        </div>
      )}
      {step === 4 && (
        <div>
          <h2>Step 4: Regulatory Info</h2>
          <input
            type="text"
            name="regulatoryInfo"
            value={facilityDetails.regulatoryInfo}
            onChange={handleChange}
            placeholder="Enter regulatory info"
          />
          <button onClick={handleBack}>Back</button>
          <button onClick={() => alert('Form submitted!')}>Submit</button>
        </div>
      )}
    </div>
  );
}
