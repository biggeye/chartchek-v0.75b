# KIPU Mock Functions to API Endpoints Mapping

This document maps the mock functions in the KIPU library (`lib/kipu/index.ts`) to their corresponding real API endpoints as defined in `lib/kipu/endpoints.json`. This mapping will help with the future implementation of real API integrations.

## Facility Functions

| Mock Function | Description | Corresponding API Endpoint |
|---------------|-------------|---------------------------|
| `getFacilityData(facilityId)` | Fetches facility data by ID | No direct endpoint available. This would likely be a custom endpoint or part of a facility management API not shown in the endpoints.json file. |
| `listFacilities()` | Lists all available facilities | No direct endpoint available. This would likely be a custom endpoint or part of a facility management API not shown in the endpoints.json file. |

## Patient Evaluation Functions

| Mock Function | Description | Corresponding API Endpoint |
|---------------|-------------|---------------------------|
| `fetchPatientEvaluation(evaluationId, facilityId?)` | Fetches a patient evaluation by ID | `GET /patient_evaluations/{patient_evaluation_id}` |
| `createPatientEvaluation(evaluationData, facilityId?)` | Creates a new patient evaluation | `POST /patients/{patient_id}/patient_evaluations` |
| `getPatientEvaluations(facilityId, patientId)` | Gets evaluations for a specific patient | `GET /patients/{patient_id}/patient_evaluations` |
| `createOrUpdatePatientEvaluation(evaluationData, evaluationId, facilityId)` | Creates or updates a patient evaluation | `POST /patients/{patient_id}/patient_evaluations` (create) <br> No direct PATCH endpoint available for updates |

## Insights and Analytics Functions

| Mock Function | Description | Corresponding API Endpoint |
|---------------|-------------|---------------------------|
| `getBillingInsights(facilityId?)` | Gets billing insights for facilities | No direct endpoint available. This would be an aggregate/analytics API. |
| `getMetrics(facilityId?)` | Gets specific metrics | No direct endpoint available. This would be an aggregate/analytics API. |
| `getPatientStats(facilityId?)` | Gets patient data for stats | Potentially aggregated from multiple endpoints like `GET /patients/census` and `GET /patients/occupancy` |
| `getDocumentInsights(facilityId?)` | Gets document insights | No direct endpoint available. This would be an aggregate/analytics API. |
| `getRecentConversations(facilityId?)` | Gets recent conversations | No direct endpoint available. This would likely involve a messaging API not shown in the endpoints.json file. |
| `getFacilityInsights(facilityId?)` | Gets facility insights | No direct endpoint available. This would be an aggregate/analytics API. |
| `getComplianceInsights(facilityId?)` | Gets compliance insights | No direct endpoint available. This would be an aggregate/analytics API. |

## Detailed Analysis of Aggregate and Unmappable Functions

### Facility Management Functions

1. **`getFacilityData(facilityId)`**
   - **Current Implementation**: Loads facility data from JSON files with patient and document counts
   - **API Integration Strategy**: 
     - Would likely require a custom endpoint in a production environment
     - Could be implemented as a combination of:
       - A base facility endpoint (not shown in endpoints.json)
       - `GET /patients/census` for patient counts
       - Document-related endpoints for document counts
   - **Data Transformation Required**: Significant transformation to match the current structure

2. **`listFacilities()`**
   - **Current Implementation**: Returns an array of facility objects with metadata
   - **API Integration Strategy**:
     - Similar to `getFacilityData` but for multiple facilities
     - Would require aggregating data from multiple endpoints
     - Might need pagination handling for large facility lists

### Analytics and Insights Functions

1. **`getBillingInsights(facilityId?)`**
   - **Current Implementation**: Returns mock billing data with revenue, outstanding claims, and denials
   - **API Integration Strategy**:
     - Would likely require multiple API calls to financial/billing endpoints
     - Possible endpoints (not in current endpoints.json):
       - Claims management endpoints
       - Revenue cycle endpoints
       - Financial reporting endpoints
   - **Client-side Processing**: Significant aggregation and calculation would be needed

2. **`getMetrics(facilityId?)`**
   - **Current Implementation**: Returns patient, document, and revenue metrics
   - **API Integration Strategy**:
     - Combines data from multiple domains:
       - Patient metrics: Could use `GET /patients/census` and `GET /patients/occupancy`
       - Document metrics: No direct endpoints available
       - Revenue metrics: Would require financial endpoints not in current documentation
   - **Caching Consideration**: High candidate for caching due to aggregation of multiple data sources

3. **`getPatientStats(facilityId?)`**
   - **Current Implementation**: Returns detailed patient statistics including demographics and status
   - **API Integration Strategy**:
     - Primary data source: `GET /patients/census`
     - Additional data needed from:
       - `GET /care_levels` for level of care distribution
       - Patient demographic data (would need specific endpoints)
   - **Data Processing**: Would require client-side aggregation and statistical analysis

4. **`getDocumentInsights(facilityId?)`**
   - **Current Implementation**: Returns document counts by type, recent documents, and pending reviews
   - **API Integration Strategy**:
     - For evaluations: `GET /evaluations` and `GET /patient_evaluations`
     - For other document types: No direct endpoints available
     - Recent documents: Would need to combine and sort data from multiple document endpoints
   - **Implementation Challenge**: Document categorization and status tracking

5. **`getRecentConversations(facilityId?)`**
   - **Current Implementation**: Returns mock conversation data with messages and participants
   - **API Integration Strategy**:
     - No messaging or conversation endpoints in current documentation
     - Would require a separate messaging API or service
     - Alternative: Could be implemented using notes or comments if available

6. **`getFacilityInsights(facilityId?)`**
   - **Current Implementation**: Returns facility performance metrics and trends
   - **API Integration Strategy**:
     - Would combine data from:
       - `GET /patients/occupancy` for capacity metrics
       - Would need additional endpoints for:
         - Staff performance
         - Quality metrics
         - Operational efficiency
   - **Time-series Analysis**: Would require historical data access and trend calculation

7. **`getComplianceInsights(facilityId?)`**
   - **Current Implementation**: Returns compliance metrics and alerts
   - **API Integration Strategy**:
     - No direct compliance endpoints in current documentation
     - Would need specific endpoints for:
       - Regulatory compliance tracking
       - Documentation completeness
       - Staff certification status
   - **Risk Assessment**: Would require complex business logic to evaluate compliance risk

## Implementation Recommendations

1. **API Gateway Pattern**:
   - Consider implementing an API gateway that aggregates data from multiple KIPU endpoints
   - This would centralize the transformation logic and reduce client-side complexity

2. **Caching Strategy**:
   - Implement a multi-level caching strategy:
     - Short-term cache (minutes) for frequently accessed data
     - Medium-term cache (hours) for relatively stable data like facility information
     - Cache invalidation based on relevant update events

3. **Fallback Mechanisms**:
   - Implement graceful degradation when specific endpoints are unavailable
   - Consider showing partial data with clear indication of what's missing

4. **Data Transformation Layer**:
   - Create a dedicated transformation layer to convert API responses to the expected format
   - This will help maintain backward compatibility with existing code

5. **Pagination and Rate Limiting**:
   - Implement pagination handling for large data sets
   - Respect API rate limits by implementing request throttling
   - Consider batch operations where appropriate

This mapping provides a starting point for implementing real API integrations with the KIPU EMR system while maintaining compatibility with the existing application structure.
