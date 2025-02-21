import React, { useState, useEffect } from 'react';
import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';
import Step4 from './Step4';

interface FacilityDetails {
  name: string;
  type: string;
  capacity: number;
  regulatoryInfo: string;
}

interface Errors {
  name: string;
  type: string;
  capacity: string;
  regulatoryInfo: string;
}

export default function MultiStepForm() {
  const [errors, setErrors] = useState<Errors>({
    name: '',
    type: '',
    capacity: '',
    regulatoryInfo: '',
  });

  const validate = () => {
    const newErrors: Errors = { name: '', type: '', capacity: '', regulatoryInfo: '' };
    if (!facilityDetails.name) newErrors.name = 'Facility name is required.';
    if (!facilityDetails.type) newErrors.type = 'Facility type is required.';
    if (facilityDetails.capacity <= 0) newErrors.capacity = 'Capacity must be greater than zero.';
    if (!facilityDetails.regulatoryInfo) newErrors.regulatoryInfo = 'Regulatory info is required.';
    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === '');
  };
  const [step, setStep] = useState(1);
  const [facilityDetails, setFacilityDetails] = useState<FacilityDetails>({
    name: '',
    type: '',
    capacity: 0,
    regulatoryInfo: '',
  });

  const handleNext = () => {
    if (validate()) {
      if (step === 1 && facilityDetails.name) {
        setStep(3); // Skip to step 3 if name is already filled
      } else if (step === 2 && facilityDetails.type) {
        setStep(4); // Skip to step 4 if type is already filled
      } else {
        setStep((prev) => prev + 1);
      }
    }
  };

  const handleSubmit = () => {
    if (validate()) {
      alert('Form submitted!');
    }
  };
  const handleBack = () => setStep((prev) => prev - 1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFacilityDetails((prev) => ({ ...prev, [name]: value }));
  };

  // Check if we can skip steps initially
  useEffect(() => {
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
        <Step1
          name={facilityDetails.name}
          onChange={handleChange}
          onNext={handleNext}
          error={errors.name}
        />
      )}
      {step === 2 && (
        <Step2
          type={facilityDetails.type}
          onChange={handleChange}
          onNext={handleNext}
          onBack={handleBack}
          error={errors.type}
        />
      )}
      {step === 3 && (
        <Step3
          capacity={facilityDetails.capacity}
          onChange={handleChange}
          onNext={handleNext}
          onBack={handleBack}
          error={errors.capacity}
        />
      )}
      {step === 4 && (
        <Step4
          regulatoryInfo={facilityDetails.regulatoryInfo}
          onChange={handleChange}
          onBack={handleBack}
          onSubmit={handleSubmit}
          error={errors.regulatoryInfo}
        />
      )}
    </div>
  );
  );
}
