# chartChek Developer Specification

> **Overview:**  
> This document outlines a comprehensive specification for a web application designed to aid the behavioral health industry with compliance and accreditation. The application—EMR-Supplement—guides facility owners through certification processes (e.g., Joint Commission, DHCS) with features like chat-driven LLM-assisted compliance, document management, dynamic compliance wizards, and secure PHI handling. The solution is built using Next.js, TypeScript, Tailwind, and Supabase, as a modular monolith with future decoupling in mind.

---

## 1. Requirements & Core Modules

### User Types & Roles
- **Primary User:** Facility Owner (master account)  
- **Secondary Users:** On-site technicians, counselors, therapists, administrative appointees  
- **User Relationships:** Facility owners manage multiple facilities, with each facility having assigned users and compliance data.

### Key Functional Areas

#### Dashboard
- Displays compliance metrics in three categories: **Facility, Patient Charts, and HR**.
- Visual indicators (progress meters, percentages) with hover tooltips for detailed breakdowns.
- Enterprise summary: Aggregated metrics across all facilities.

#### Onboarding & Compliance Wizards
- **Guided Onboarding for Facility Creation:**  
  - **Purpose:** Gather critical information to form the initial assessment of a facility’s readiness.  
  - **Flow:**  
    - Collect facility name, type (e.g., Residential Detox, IOP—small/large), capacity, regulatory details, and accreditation history.
    - **Dynamic Flow:** Depending on the facility’s status at onboarding, the wizard may end prior to Stage 1 if sufficient data exists. In such cases, the system will drop the user into the application with next-step prompts (e.g., “Contact Joint Commission and create account”, “Finish application”, “Pay application fee”).
- **Compliance Specialist Selection:**  
  - Facility owners select compliance specialist(s) (Joint Commission and/or DHCS) via checkboxes.
- **Wizard Steps (Joint Commission Example):**
  - **Stage 1 – Account Created:**  
    - Capture detailed facility information and verify the facility has served at least 3 clients.
    - Upload facility-specific documentation (SOPs, emergency maps, program schedules, facilitator info, etc.).
    - Background LLM process parses documents to flag surveyable items, forming the basis for dashboard metrics.
  - **Stage 2 – Application Submitted:**  
    - Record application details (submission date, fee payment status).
    - Proceed upon confirmation from the Joint Commission or via a signed waiver to bypass a grace period.
  - **Stage 3 – Ready Date Declared:**  
    - Set a “ready” date (minimum 30 days ahead) that triggers timeline generation based on compliance gaps.
  - **Accredited Stage (Supplementary):**  
    - Upon accreditation, transition into ongoing compliance management.
    - Serves as a repository for proprietary administrative data and a task manager for maintaining compliance.
    - Users can create custom metrics and standards on top of mandatory compliance items.

#### Surveyable Items & Compliance Metrics
- **Metadata for Each Item:**  
  - Title, Description, Category, Subcategory, Index Number(s) (linked to the JCO manual), Version #
- **Mapping:**  
  - Developer admin panel maps items to facility types (e.g., Residential Detox, IOP – Small/Large).  
  - Non-applicable items are hidden from the facility’s dashboard.
- **Calculation:**  
  - Weighted (or item count based) compliance calculation per major category.

#### Chat Module (Conversation-Driven)
- **Conversations:**  
  - Threaded history of prompts, LLM completions, and file attachments.
  - Ability to switch between modes (Compliance, Accounts & Billing, HR) via a dropdown.
  - LLM responses are tagged with the originating specialist.
- **File Attachment:**  
  - Graphical file queue displaying icons per file.
  - Clicking an icon opens a categorization modal.
  - **Categorization Modal:**  
    - Three radio buttons for the major categories.
    - Live-search input to filter through a large list of surveyable items.
    - Supports three levels: no categorization, major category only, or a specific surveyable item.
  - Files can be removed from a conversation with a yes/no confirmation (displaying file name) without deleting the file from the document module.

#### Document Management Module
- **Features:**  
  - Upload via drag-and-drop, rename, delete, move files between folders, and simple search.
  - Custom folder creation with list and grid view options.
- **Security:**  
  - Adheres to HIPAA with encryption in transit and at rest, plus comprehensive audit logging.

#### Staff & Facilities Modules
- **Staff Module:**  
  - Informational only at launch—captures basic user details (name, email, role, facility assignment).
- **Facilities Module:**  
  - List/grid view of facilities with a “+” button for new facility creation.
  - Facility card displays: name, type, capacity, and combined compliance score (e.g., 75/300).
  - Hover tooltips reveal breakdowns by compliance category.
  - Enterprise summary view shows aggregated metrics.

#### Notifications & Calendar
- **Notifications:**  
  - In-app and email alerts for document processing completions, compliance wizard milestones, ready dates, and other key events.
- **Calendar:**  
  - Integrated calendar with a timeline summary (initially showing the ready date and placeholders for additional milestones).

#### Audit Logging & PHI Handling
- **Audit Logging:**  
  - Comprehensive logging of PHI-related actions (e.g., login attempts, file uploads/downloads, chat interactions, wizard steps).
- **Active Monitoring & Anonymization Layer:**  
  - Real-time scanning of outbound data for PHI (names, addresses, DOB, MRNs, etc.).
  - Uses an ephemeral, secure mapping table (encrypted in memory with strict TTL) to replace PHI with placeholders before sending to the LLM.
  - Post-response, placeholders are replaced with the original PHI.
  - Configurable parameters for PHI triggers, in line with HIPAA guidelines.

---

## 2. Architecture & Data Handling

### Architecture Choices
- **Monolithic Design (Initial Phase):**  
  - Built with Next.js, TypeScript, and Tailwind.
  - Backend uses Supabase for authentication, realtime subscriptions, and database management.
  - RESTful endpoints (versioned, protected, rate-limited) are documented using OpenAPI/Swagger.
- **Modularity & Future Decoupling:**  
  - Clear interfaces and an API-first approach allow decoupling of modules (e.g., chat, anonymization, document processing) into containerized services later if needed.

### Data Handling & Security
- **Encryption:**  
  - All PHI data is encrypted in transit and at rest.
- **Audit Logging:**  
  - Log all actions involving PHI with timestamps and user identifiers.
- **PHI Anonymization:**  
  - Real-time anonymization layer scans and replaces PHI with placeholders before data is sent to the LLM.
  - A secure, ephemeral mapping table (with in-memory encryption and strict session TTL) restores the original PHI after processing.
- **Error Handling & Logging:**  
  - Standardized JSON error responses with HTTP status codes.
  - An admin dashboard for viewing error logs and audit trails with basic filters (module, severity, time range).
- **Rate Limiting & Protected Routes:**  
  - Enforced authentication and rate limits on all endpoints.

---

## 3. Testing & CI/CD

### Testing Strategy
- **Unit Tests:**  
  - Use Jest for key functionality tests.
- **Integration Tests:**  
  - Minimal integration tests for RESTful endpoints and core module interactions.
- **Manual Testing:**  
  - A documented Postman collection for endpoint testing.
- **Automated Testing:**  
  - Newman tests executed on every push via GitHub Actions.

### CI/CD Pipeline
- **Pipeline Setup:**  
  - GitHub Actions will run Newman tests, unit, and integration tests on every push.
  - Upon successful tests, automatic deployment to Vercel.
- **Documentation:**  
  - OpenAPI/Swagger documentation for all endpoints maintained for internal and external reference.

---

## 4. Deployment & Infrastructure

- **Hosting:**  
  - Application deployed on Vercel.
- **Backend:**  
  - Supabase provides backend services (authentication, realtime updates, database).
- **Containerization & Future Modularity:**  
  - Initially built as a monolith with modular interfaces.
  - Prepared for future containerization of high-load or security-critical modules (e.g., anonymization layer, document processing) as scaling demands increase.
- **Realtime Capabilities:**  
  - Leverage Supabase subscriptions for realtime updates across the application.

---

## 5. Phased Development Plan

### Phase 1: Core MVP Development
- **Focus:** Build foundational features using strengths in TypeScript, Tailwind, and Supabase.
- **Key Deliverables:**  
  - Onboarding and dashboard with a dynamic compliance wizard (handling both new facility creation and conditional flows based on facility status).
  - Compliance wizards (Joint Commission and DHCS) with dynamic step flows.
  - Document management module (upload, drag-and-drop, rename, delete, move, search).
  - Chat module with conversation threads, file attachment queue, and categorization modal.
  - Facilities and staff modules with basic CRUD functionality.
  - Notifications (in-app and email) and an integrated calendar.
  - Basic audit logging and PHI anonymization layer.
  - RESTful endpoints with versioning, protected routes, and rate limiting.
  - CI/CD pipeline using GitHub Actions with automated Newman tests on every push.

### Phase 2: Enhanced Integration & Modularity
- **Focus:** Enhance integrations and prepare for future decoupling.
- **Enhancements:**  
  - Advanced LLM integration with automatic context inclusion (using static compliance data and user uploads).
  - Enhanced, robust anonymization layer for PHI.
  - Refactor modules to expose clear API interfaces for future containerization.
  - Improved audit logging with an admin dashboard.
  - Expanded notifications and calendar features.

### Phase 3: Outsourcing & Advanced Features
- **Focus:** Outsource or further enhance modules requiring specialized expertise.
- **Key Areas:**  
  - Advanced LLM and anonymization enhancements.
  - Sophisticated document processing and NLP capabilities.
  - Extended HR module development as requirements evolve.
  - Comprehensive performance, penetration, and security testing via external audits.

---

## 6. Final Considerations

- **Documentation:**  
  - Maintain clear documentation for all modules, RESTful endpoints, testing procedures, and CI/CD configurations.
- **Iteration & Feedback:**  
  - Continuously update the MVP based on compliance guideline changes and user feedback.
- **Security & HIPAA Compliance:**  
  - Ensure all aspects of data handling, especially PHI, strictly adhere to HIPAA guidelines through encryption, audit logging, and secure anonymization processes.
