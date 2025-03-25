// Simple script to test the vital signs API
const testVitalsApi = async () => {
  try {
    // Replace with a valid patient ID from your system
    const patientId = "YOUR_TEST_PATIENT_ID";
    const encodedPatientId = encodeURIComponent(patientId);
    
    console.log(`Testing vital signs API for patient: ${patientId}`);
    
    // Make a request to the API endpoint
    const response = await fetch(`http://localhost:3000/api/kipu/patients/${encodedPatientId}/vitals`);
    
    if (!response.ok) {
      console.error(`API request failed with status: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Error details: ${errorText}`);
      return;
    }
    
    const data = await response.json();
    console.log('API response:', JSON.stringify(data, null, 2));
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error during test:', error);
  }
};

// Run the test
testVitalsApi();
