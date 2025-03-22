flowchart TD
    %% --- STYLE DEFINITIONS ---
    classDef local fill:#c9daf8,stroke:#6c8ebf,stroke-width:2px
    classDef kipu fill:#d9ead3,stroke:#93c47d,stroke-width:2px
    classDef cache fill:#fff2cc,stroke:#d6b656,stroke-width:2px
    classDef redis fill:#ffe6cc,stroke:#d79b00,stroke-width:2px
    classDef reactquery fill:#e1d5e7,stroke:#9673a6,stroke-width:2px

    %% --- CACHING ARCHITECTURE ---
    subgraph "Multi-Level Caching Architecture"
    direction TB
    CLIENT["Client Browser"]
    REACTQ["React Query Cache<br>(Client-side)"]
    APIROUTE["Next.js API Routes"]
    REDIS["Redis Cache<br>(Server-side)"]
    KIPUAPI["KIPU EMR API"]
    
    CLIENT --> |1. Request Data| REACTQ
    REACTQ --> |2. Cache Miss| APIROUTE
    APIROUTE --> |3. Check Cache| REDIS
    REDIS --> |4. Cache Miss| KIPUAPI
    KIPUAPI --> |5. Response| REDIS
    REDIS --> |6. Cache & Forward| APIROUTE
    APIROUTE --> |7. HTTP Cache Headers| REACTQ
    REACTQ --> |8. Cache & Forward| CLIENT
    
    %% Cache Hit Flows
    REACTQ --> |2a. Cache Hit| CLIENT
    REDIS --> |4a. Cache Hit| APIROUTE
    end

    %% --- API ENDPOINTS SUBGRAPH ---
    subgraph "Local API Endpoints"
    direction LR
    L1["facilities<br>/facilities<br>(GET)"]
    L2["facility<br>/facilities/{facility_id}<br>(GET)"]
    L3["patient_evaluations<br>/facilities/{facility_id}/patients/{patient_id}/evaluations<br>(GET)"]
    L4["patient_evaluation<br>/facilities/{facility_id}/evaluations/{evaluation_id}<br>(GET)"]
    L5["create_patient_evaluation<br>/facilities/{facility_id}/patients/{patient_id}/evaluations<br>(POST)"]
    L6["dashboard_metrics<br>/facilities/{facility_id}/metrics<br>(GET)"]
    L7["patient_stats<br>/facilities/{facility_id}/patient_stats<br>(GET)"]
    L8["document_insights<br>/facilities/{facility_id}/document_insights<br>(GET)"]
    end

    %% --- KIPU ENDPOINTS SUBGRAPH ---
    subgraph "KIPU Endpoints"
    direction LR
    K1["GET /patients/census"]
    K2["GET /evaluations"]
    K3["GET /patients/{patient_id}/patient_evaluations"]
    K4["GET /patient_evaluations/{patient_evaluation_id}"]
    K5["POST /patients/{patient_id}/patient_evaluations"]
    K6["GET /patients/occupancy"]
    K7["GET /care_levels"]
    K8["GET /patient_evaluations"]
    end

    %% --- CACHING STRATEGIES SUBGRAPH ---
    subgraph "Caching Strategies"
    direction TB
    C1["HTTP Caching<br>Cache-Control Headers"]
    C2["Redis Server Cache<br>TTL-based Key-Value Store"]
    C3["React Query<br>Client-side Data Caching"]
    C4["ISR<br>For Semi-static Pages"]
    C5["Cache Invalidation<br>For Mutation Operations"]
    end

    %% --- EDGES (DEPENDENCIES) ---
    %% 1. facilities
    L1 --> K1
    L1 --> K2
    L1 --> C1
    L1 --> C2
    L1 --> C3

    %% 2. facility
    L2 --> K1
    L2 --> K2
    L2 --> C1
    L2 --> C2
    L2 --> C3

    %% 3. patient_evaluations
    L3 --> K3
    L3 --> C1
    L3 --> C2
    L3 --> C3

    %% 4. patient_evaluation
    L4 --> K4
    L4 --> C1
    L4 --> C2
    L4 --> C3

    %% 5. create_patient_evaluation
    L5 --> K5
    L5 --> C5

    %% 6. dashboard_metrics
    L6 --> K1
    L6 --> K6
    L6 --> K2
    L6 --> K7
    L6 --> C1
    L6 --> C2
    L6 --> C3
    L6 --> C4

    %% 7. patient_stats
    L7 --> K1
    L7 --> K7
    L7 --> C1
    L7 --> C2
    L7 --> C3
    L7 --> C4

    %% 8. document_insights
    L8 --> K2
    L8 --> K8
    L8 --> C1
    L8 --> C2
    L8 --> C3
    L8 --> C4

    %% --- CLASS ASSIGNMENTS ---
    class L1,L2,L3,L4,L5,L6,L7,L8 local
    class K1,K2,K3,K4,K5,K6,K7,K8 kipu
    class C1,C4,C5 cache
    class C2 redis
    class C3 reactquery
    class CLIENT,REACTQ,APIROUTE,REDIS,KIPUAPI local

    %% --- CACHING IMPLEMENTATION NOTES ---
    %% Add notes about caching implementation
    note "HTTP Cache TTLs:<br>- Standard: 5 min (300s)<br>- Patient Evals: 3 min (180s)<br>- Evaluation Details: 10 min (600s)" C1
    note "Redis Cache Keys:<br>- Pattern: resource:{userId}:{facilityId}:...<br>- TTLs match HTTP cache" C2
    note "React Query:<br>- staleTime: matches HTTP TTL<br>- cacheTime: 2x staleTime<br>- Automatic refetching" C3
    note "ISR Implementation:<br>- Dashboard pages<br>- Patient summary pages<br>- revalidate: 5 min" C4
    note "Cache Invalidation:<br>- On mutations (POST/PUT/DELETE)<br>- Invalidates related query keys<br>- Purges Redis cache patterns" C5
