# KIPU EMR Integration

This directory contains the integration layer between our NextJS application and the KIPU EMR system. The integration follows a structured approach to ensure maintainability, performance, and resilience.

## Directory Structure

```
lib/kipu/integration/
├── README.md                # This file - overview of the integration
├── api_documentation.json   # Authentication details, headers, response codes
├── api_mapping.md           # Maps mock functions to real API endpoints
├── detail_requests.json     # Prioritized list of endpoints and schemas
├── local_endpoints.json     # Local API endpoints needed for our application
├── schemas.json             # Available data schemas for the API
└── specifications/          # Detailed endpoint specifications
    ├── README.md            # Specifications structure and guidelines
    ├── facility_specifications.json
    ├── patient_evaluation_specifications.json
    └── patient_specifications.json
```

## Integration Strategy

### API Gateway Pattern

The integration uses an API Gateway pattern to centralize transformation logic between our application and the KIPU API. This allows us to:

1. Handle terminology differences (e.g., "facility" in our app vs. "location" in KIPU)
2. Transform data structures to match our application's needs
3. Implement consistent error handling and logging

### Performance Optimization

We employ a multi-level caching strategy:

1. **Short-term caching**: Frequently accessed data (e.g., facility list) is cached for 5-10 minutes
2. **Invalidation triggers**: Cache is invalidated when related data is modified
3. **Stale-while-revalidate**: Show cached data while fetching fresh data in the background

### Resilience

Fallback mechanisms ensure the application remains functional even when the KIPU API is unavailable:

1. **Local JSON fallback**: Mock data is used when the API is unreachable
2. **Graceful degradation**: Non-critical features are disabled instead of breaking the entire application
3. **Error boundaries**: Prevent API errors from cascading through the application

### Security

API credentials are stored securely:

1. **Supabase storage**: Primary storage for API keys and settings
2. **Local JSON fallback**: For development environments
3. **Server-side only**: Credentials never exposed to the client

## Key Terminology Mapping

| Our Application | KIPU API | Notes |
|-----------------|----------|-------|
| facility | location | Base entity for treatment centers |
| facility_id | location_id | Identifier mapping |
| facility_name | location_name | Display name mapping |
| building | building | Same terminology in both systems |
| casefile_id | casefile_id | Patient identifier format: `^[0-9]+\:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$` |

## Authentication

KIPU uses HMAC SHA-1 signature-based authentication:

- **Required headers**: Accept, Authorization, Date
- **Query parameter**: app_id (also called recipient_id)
- **Implementation**: See `api_documentation.json` for details

## Implementation Priorities

1. **High Priority**: Facility management endpoints (critical for FacilitySelector)
2. **Medium Priority**: Patient evaluation endpoints
3. **Low Priority**: Complex analytics endpoints

## Development Workflow

1. Define required endpoints in `local_endpoints.json`
2. Track implementation status in `detail_requests.json`
3. Create detailed specifications in `specifications/*.json`
4. Implement NextJS API routes in `app/api/kipu/`
5. Integrate with Zustand stores for state management

## Testing

All API integrations should be tested at multiple levels:

1. **Unit tests**: For transformation logic
2. **Integration tests**: For API route handlers
3. **Mock tests**: Using local JSON data
4. **End-to-end tests**: Full application flow

## Related Components

The integration supports these key UI components:

1. **FacilitySelector**: Component in AppLayout for selecting facilities
2. **PatientsList**: For displaying patients in the selected facility
3. **PatientDetail**: For showing detailed patient information
4. **EvaluationForms**: For managing patient evaluations
