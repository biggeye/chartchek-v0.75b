# KIPU API Mapping Module

This module centralizes all mapping functions between KIPU API responses and our application's data structures. It handles the terminology differences and field naming conventions between systems.

## Terminology Differences

| Our Application | KIPU API | Notes |
|-----------------|----------|-------|
| Facility | Location | KIPU uses "location" for what we call "facility" |
| facility_id | location_id | ID field naming follows the same pattern |
| facility_name | location_name | Name field naming follows the same pattern |
| Building | Building | Both systems use the same term |
| Patient | Patient | Both systems use the same term |

## Mapping Functions

### `mapKipuLocationToFacility`

Maps a KIPU location object to our Facility format. This function handles different field naming conventions between our app and KIPU API.

```typescript
function mapKipuLocationToFacility(kipuLocation: any): Facility
```

### `mapKipuBuildingToBuilding`

Maps a KIPU building object to our Building format.

```typescript
function mapKipuBuildingToBuilding(kipuBuilding: any, facilityId?: string | number): any
```

### `mapKipuPatientToPatientBasicInfo`

Maps a KIPU patient object to our PatientBasicInfo format. This function handles different field naming conventions between our app and KIPU API.

```typescript
function mapKipuPatientToPatientBasicInfo(kipuPatient: any): PatientBasicInfo
```

## Usage

Import the mapping functions directly from the mapping module:

```typescript
import { mapKipuLocationToFacility, mapKipuPatientToPatientBasicInfo } from '@/lib/kipu/mapping';
```

## Best Practices

1. Always use these mapping functions when converting between KIPU API responses and our application's data structures
2. If you need to add a new mapping function, add it to this module
3. Keep mapping functions pure - they should not have side effects
4. Include proper error handling and fallbacks for missing data
5. Log the structure of the input data to help with debugging
