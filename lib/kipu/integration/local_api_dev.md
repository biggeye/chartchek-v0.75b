flowchart LR
    %% --- STYLE DEFINITIONS ---
    classDef local fill:#c9daf8,stroke:#6c8ebf,stroke-width:2px
    classDef kipu fill:#d9ead3,stroke:#93c47d,stroke-width:2px
    classDef aggregator fill:#f4cccc,stroke:#d79b9b,stroke-width:2px

    %% --- SUBGRAPHS ---
    subgraph Local Endpoints
    L1["facilities<br>/facilities<br>(GET)"]
    L2["facility<br>/facilities/{facility_id}<br>(GET)"]
    L3["patient_evaluations<br>/facilities/{facility_id}/patients/{patient_id}/evaluations<br>(GET)"]
    L4["patient_evaluation<br>/facilities/{facility_id}/evaluations/{evaluation_id}<br>(GET)"]
    L5["create_patient_evaluation<br>/facilities/{facility_id}/patients/{patient_id}/evaluations<br>(POST)"]
    L6["dashboard_metrics<br>/facilities/{facility_id}/metrics<br>(GET)"]
    L7["patient_stats<br>/facilities/{facility_id}/patient_stats<br>(GET)"]
    L8["document_insights<br>/facilities/{facility_id}/document_insights<br>(GET)"]
    end

    subgraph KIPU Endpoints
    K1["GET /patients/census"]
    K2["GET /evaluations"]
    K3["GET /patients/{patient_id}/patient_evaluations"]
    K4["GET /patient_evaluations/{patient_evaluation_id}"]
    K5["POST /patients/{patient_id}/patient_evaluations"]
    K6["GET /patients/occupancy"]
    K7["GET /care_levels"]
    K8["GET /patient_evaluations"]
    end

    %% --- EDGES (DEPENDENCIES) ---

    %% 1. facilities
    L1 --> K1
    L1 --> K2

    %% 2. facility
    L2 --> K1
    L2 --> K2

    %% 3. patient_evaluations
    L3 --> K3

    %% 4. patient_evaluation
    L4 --> K4

    %% 5. create_patient_evaluation
    L5 --> K5

    %% 6. dashboard_metrics
    L6 --> K1
    L6 --> K6
    L6 --> K2
    L6 --> K7

    %% 7. patient_stats
    L7 --> K1
    L7 --> K7

    %% 8. document_insights
    L8 --> K2
    L8 --> K8

    %% --- CLASS ASSIGNMENTS ---
    class L1,L2,L3,L4,L5,L6,L7,L8 local
    class K1,K2,K3,K4,K5,K6,K7,K8 kipu
