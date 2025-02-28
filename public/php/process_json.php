<?php
// Example PHP file that processes JSON data
header('Content-Type: application/json');

// Receive JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// If no input provided, use a sample for testing
if (empty($data)) {
    $data = [
        'patient' => [
            'name' => 'John Doe',
            'id' => '12345',
            'age' => 42,
            'diagnosis' => [
                'primary' => 'F41.1',
                'secondary' => ['F32.9', 'F43.23']
            ]
        ],
        'facility' => [
            'name' => 'Behavioral Health Clinic',
            'id' => 'BHC001'
        ],
        'assessment' => [
            'date' => '2025-02-26',
            'provider' => 'Dr. Smith',
            'notes' => 'Patient reports improvement in symptoms.',
            'scores' => [
                'phq9' => 8,
                'gad7' => 6
            ]
        ]
    ];
    
    $response = [
        'status' => 'success',
        'message' => 'Using sample data (no input provided)',
        'processed_data' => [
            'patient_name' => $data['patient']['name'],
            'facility' => $data['facility']['name'],
            'assessment_date' => $data['assessment']['date'],
            'primary_diagnosis' => $data['patient']['diagnosis']['primary'],
            'phq9_score' => $data['assessment']['scores']['phq9'],
            'gad7_score' => $data['assessment']['scores']['gad7']
        ]
    ];
} else {
    // Process the actual input data
    // This is where you would write your custom processing logic
    $response = [
        'status' => 'success',
        'message' => 'Data processed successfully',
        'received_data' => $data,
        // Add your processed data here
    ];
}

// Return the response
echo json_encode($response, JSON_PRETTY_PRINT);
?>
