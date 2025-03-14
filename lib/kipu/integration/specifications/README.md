# KIPU API Integration Specifications

This directory contains detailed specifications for the KIPU API integration with our NextJS application.

## File Structure and Hierarchy

The KIPU API integration follows a structured approach with the following file hierarchy:

```
lib/kipu/integration/
├── local_endpoints.json        # Defines the local API endpoints needed for our application
├── detail_requests.json        # Prioritized list of endpoints and schemas needing specification
├── api_documentation.json      # Contains authentication details, header requirements, and response codes
├── api_mapping.md              # Maps mock functions to real API endpoints with implementation strategies
├── schemas.json                # Lists available data schemas for the API
└── specifications/             # Detailed specifications for each endpoint group
    ├── facility_specifications.json       # Specifications for facility-related endpoints
    ├── patient_evaluation_specifications.json  # Specifications for patient evaluation endpoints
    └── [future_domain]_specifications.json     # Future domain-specific specifications
```

## Source of Truth Hierarchy

The source of truth for API integration follows this hierarchy:

1. **`local_endpoints.json`**: Defines what endpoints our application needs
2. **`detail_requests.json`**: Tracks which endpoints need specifications and their implementation status
3. **`specifications/*.json`**: Contains the detailed specifications for each endpoint group

## Terminology Mapping

Remember that our application uses different terminology than the KIPU API:

- Our app: "facility" → KIPU API: "location"
- Our app: "facility_id" → KIPU API: "location_id"
- Our app: "facility_name" → KIPU API: "location_name"

## Implementation Strategy

Each specification file follows a consistent structure:

1. **Endpoint Definition**: Path, method, and description
2. **KIPU Mapping**: How our endpoint maps to KIPU's API
3. **Request Details**: Parameters, headers, and body schema
4. **Response Schema**: Expected response format
5. **Error Handling**: Possible error responses
6. **Implementation Details**: Caching, fallback strategies, and integration with Zustand/NextJS

## Adding New Specifications

When adding new specifications:

1. Update `detail_requests.json` with the new endpoint details
2. Create or update the appropriate specification file in this directory
3. Mark the endpoint as completed in `detail_requests.json` once specifications are done
4. Implement the endpoint according to the specifications

## Security Considerations

- API credentials are stored securely in Supabase
- All requests are authenticated using Supabase JWT
- Sensitive data is never exposed to the client
