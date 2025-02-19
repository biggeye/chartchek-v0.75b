---


---

<h1 id="chartchek-developer-specification">chartChek Developer Specification</h1>
<blockquote>
<p><strong>Overview:</strong><br>
This document outlines a comprehensive specification for a web application designed to aid the behavioral health industry with compliance and accreditation. The application—EMR-Supplement—guides facility owners through certification processes (e.g., Joint Commission, DHCS) with features like chat-driven LLM-assisted compliance, document management, dynamic compliance wizards, and secure PHI handling. The solution is built using Next.js, TypeScript, Tailwind, and Supabase, as a modular monolith with future decoupling in mind.</p>
</blockquote>
<hr>
<h2 id="requirements--core-modules">1. Requirements &amp; Core Modules</h2>
<h3 id="user-types--roles">User Types &amp; Roles</h3>
<ul>
<li><strong>Primary User:</strong> Facility Owner (master account)</li>
<li><strong>Secondary Users:</strong> On-site technicians, counselors, therapists, administrative appointees</li>
<li><strong>User Relationships:</strong> Facility owners manage multiple facilities, with each facility having assigned users and compliance data.</li>
</ul>
<h3 id="key-functional-areas">Key Functional Areas</h3>
<h4 id="dashboard">Dashboard</h4>
<ul>
<li>Displays compliance metrics in three categories: <strong>Facility, Patient Charts, and HR</strong>.</li>
<li>Visual indicators (progress meters, percentages) with hover tooltips for detailed breakdowns.</li>
<li>Enterprise summary: Aggregated metrics across all facilities.</li>
</ul>
<h4 id="onboarding--compliance-wizards">Onboarding &amp; Compliance Wizards</h4>
<ul>
<li><strong>Guided Onboarding for Facility Creation:</strong>
<ul>
<li><strong>Purpose:</strong> Gather critical information to form the initial assessment of a facility’s readiness.</li>
<li><strong>Flow:</strong>
<ul>
<li>Collect facility name, type (e.g., Residential Detox, IOP—small/large), capacity, regulatory details, and accreditation history.</li>
<li><strong>Dynamic Flow:</strong> Depending on the facility’s status at onboarding, the wizard may end prior to Stage 1 if sufficient data exists. In such cases, the system will drop the user into the application with next-step prompts (e.g., “Contact Joint Commission and create account”, “Finish application”, “Pay application fee”).</li>
</ul>
</li>
</ul>
</li>
<li><strong>Compliance Specialist Selection:</strong>
<ul>
<li>Facility owners select compliance specialist(s) (Joint Commission and/or DHCS) via checkboxes.</li>
</ul>
</li>
<li><strong>Wizard Steps (Joint Commission Example):</strong>
<ul>
<li><strong>Stage 1 – Account Created:</strong>
<ul>
<li>Capture detailed facility information and verify the facility has served at least 3 clients.</li>
<li>Upload facility-specific documentation (SOPs, emergency maps, program schedules, facilitator info, etc.).</li>
<li>Background LLM process parses documents to flag surveyable items, forming the basis for dashboard metrics.</li>
</ul>
</li>
<li><strong>Stage 2 – Application Submitted:</strong>
<ul>
<li>Record application details (submission date, fee payment status).</li>
<li>Proceed upon confirmation from the Joint Commission or via a signed waiver to bypass a grace period.</li>
</ul>
</li>
<li><strong>Stage 3 – Ready Date Declared:</strong>
<ul>
<li>Set a “ready” date (minimum 30 days ahead) that triggers timeline generation based on compliance gaps.</li>
</ul>
</li>
<li><strong>Accredited Stage (Supplementary):</strong>
<ul>
<li>Upon accreditation, transition into ongoing compliance management.</li>
<li>Serves as a repository for proprietary administrative data and a task manager for maintaining compliance.</li>
<li>Users can create custom metrics and standards on top of mandatory compliance items.</li>
</ul>
</li>
</ul>
</li>
</ul>
<h4 id="surveyable-items--compliance-metrics">Surveyable Items &amp; Compliance Metrics</h4>
<ul>
<li><strong>Metadata for Each Item:</strong>
<ul>
<li>Title, Description, Category, Subcategory, Index Number(s) (linked to the JCO manual), Version #</li>
</ul>
</li>
<li><strong>Mapping:</strong>
<ul>
<li>Developer admin panel maps items to facility types (e.g., Residential Detox, IOP – Small/Large).</li>
<li>Non-applicable items are hidden from the facility’s dashboard.</li>
</ul>
</li>
<li><strong>Calculation:</strong>
<ul>
<li>Weighted (or item count based) compliance calculation per major category.</li>
</ul>
</li>
</ul>
<h4 id="chat-module-conversation-driven">Chat Module (Conversation-Driven)</h4>
<ul>
<li><strong>Conversations:</strong>
<ul>
<li>Threaded history of prompts, LLM completions, and file attachments.</li>
<li>Ability to switch between modes (Compliance, Accounts &amp; Billing, HR) via a dropdown.</li>
<li>LLM responses are tagged with the originating specialist.</li>
</ul>
</li>
<li><strong>File Attachment:</strong>
<ul>
<li>Graphical file queue displaying icons per file.</li>
<li>Clicking an icon opens a categorization modal.</li>
<li><strong>Categorization Modal:</strong>
<ul>
<li>Three radio buttons for the major categories.</li>
<li>Live-search input to filter through a large list of surveyable items.</li>
<li>Supports three levels: no categorization, major category only, or a specific surveyable item.</li>
</ul>
</li>
<li>Files can be removed from a conversation with a yes/no confirmation (displaying file name) without deleting the file from the document module.</li>
</ul>
</li>
</ul>
<h4 id="document-management-module">Document Management Module</h4>
<ul>
<li><strong>Features:</strong>
<ul>
<li>Upload via drag-and-drop, rename, delete, move files between folders, and simple search.</li>
<li>Custom folder creation with list and grid view options.</li>
</ul>
</li>
<li><strong>Security:</strong>
<ul>
<li>Adheres to HIPAA with encryption in transit and at rest, plus comprehensive audit logging.</li>
</ul>
</li>
</ul>
<h4 id="staff--facilities-modules">Staff &amp; Facilities Modules</h4>
<ul>
<li><strong>Staff Module:</strong>
<ul>
<li>Informational only at launch—captures basic user details (name, email, role, facility assignment).</li>
</ul>
</li>
<li><strong>Facilities Module:</strong>
<ul>
<li>List/grid view of facilities with a “+” button for new facility creation.</li>
<li>Facility card displays: name, type, capacity, and combined compliance score (e.g., 75/300).</li>
<li>Hover tooltips reveal breakdowns by compliance category.</li>
<li>Enterprise summary view shows aggregated metrics.</li>
</ul>
</li>
</ul>
<h4 id="notifications--calendar">Notifications &amp; Calendar</h4>
<ul>
<li><strong>Notifications:</strong>
<ul>
<li>In-app and email alerts for document processing completions, compliance wizard milestones, ready dates, and other key events.</li>
</ul>
</li>
<li><strong>Calendar:</strong>
<ul>
<li>Integrated calendar with a timeline summary (initially showing the ready date and placeholders for additional milestones).</li>
</ul>
</li>
</ul>
<h4 id="audit-logging--phi-handling">Audit Logging &amp; PHI Handling</h4>
<ul>
<li><strong>Audit Logging:</strong>
<ul>
<li>Comprehensive logging of PHI-related actions (e.g., login attempts, file uploads/downloads, chat interactions, wizard steps).</li>
</ul>
</li>
<li><strong>Active Monitoring &amp; Anonymization Layer:</strong>
<ul>
<li>Real-time scanning of outbound data for PHI (names, addresses, DOB, MRNs, etc.).</li>
<li>Uses an ephemeral, secure mapping table (encrypted in memory with strict TTL) to replace PHI with placeholders before sending to the LLM.</li>
<li>Post-response, placeholders are replaced with the original PHI.</li>
<li>Configurable parameters for PHI triggers, in line with HIPAA guidelines.</li>
</ul>
</li>
</ul>
<hr>
<h2 id="architecture--data-handling">2. Architecture &amp; Data Handling</h2>
<h3 id="architecture-choices">Architecture Choices</h3>
<ul>
<li><strong>Monolithic Design (Initial Phase):</strong>
<ul>
<li>Built with Next.js, TypeScript, and Tailwind.</li>
<li>Backend uses Supabase for authentication, realtime subscriptions, and database management.</li>
<li>RESTful endpoints (versioned, protected, rate-limited) are documented using OpenAPI/Swagger.</li>
</ul>
</li>
<li><strong>Modularity &amp; Future Decoupling:</strong>
<ul>
<li>Clear interfaces and an API-first approach allow decoupling of modules (e.g., chat, anonymization, document processing) into containerized services later if needed.</li>
</ul>
</li>
</ul>
<h3 id="data-handling--security">Data Handling &amp; Security</h3>
<ul>
<li><strong>Encryption:</strong>
<ul>
<li>All PHI data is encrypted in transit and at rest.</li>
</ul>
</li>
<li><strong>Audit Logging:</strong>
<ul>
<li>Log all actions involving PHI with timestamps and user identifiers.</li>
</ul>
</li>
<li><strong>PHI Anonymization:</strong>
<ul>
<li>Real-time anonymization layer scans and replaces PHI with placeholders before data is sent to the LLM.</li>
<li>A secure, ephemeral mapping table (with in-memory encryption and strict session TTL) restores the original PHI after processing.</li>
</ul>
</li>
<li><strong>Error Handling &amp; Logging:</strong>
<ul>
<li>Standardized JSON error responses with HTTP status codes.</li>
<li>An admin dashboard for viewing error logs and audit trails with basic filters (module, severity, time range).</li>
</ul>
</li>
<li><strong>Rate Limiting &amp; Protected Routes:</strong>
<ul>
<li>Enforced authentication and rate limits on all endpoints.</li>
</ul>
</li>
</ul>
<hr>
<h2 id="testing--cicd">3. Testing &amp; CI/CD</h2>
<h3 id="testing-strategy">Testing Strategy</h3>
<ul>
<li><strong>Unit Tests:</strong>
<ul>
<li>Use Jest for key functionality tests.</li>
</ul>
</li>
<li><strong>Integration Tests:</strong>
<ul>
<li>Minimal integration tests for RESTful endpoints and core module interactions.</li>
</ul>
</li>
<li><strong>Manual Testing:</strong>
<ul>
<li>A documented Postman collection for endpoint testing.</li>
</ul>
</li>
<li><strong>Automated Testing:</strong>
<ul>
<li>Newman tests executed on every push via GitHub Actions.</li>
</ul>
</li>
</ul>
<h3 id="cicd-pipeline">CI/CD Pipeline</h3>
<ul>
<li><strong>Pipeline Setup:</strong>
<ul>
<li>GitHub Actions will run Newman tests, unit, and integration tests on every push.</li>
<li>Upon successful tests, automatic deployment to Vercel.</li>
</ul>
</li>
<li><strong>Documentation:</strong>
<ul>
<li>OpenAPI/Swagger documentation for all endpoints maintained for internal and external reference.</li>
</ul>
</li>
</ul>
<hr>
<h2 id="deployment--infrastructure">4. Deployment &amp; Infrastructure</h2>
<ul>
<li><strong>Hosting:</strong>
<ul>
<li>Application deployed on Vercel.</li>
</ul>
</li>
<li><strong>Backend:</strong>
<ul>
<li>Supabase provides backend services (authentication, realtime updates, database).</li>
</ul>
</li>
<li><strong>Containerization &amp; Future Modularity:</strong>
<ul>
<li>Initially built as a monolith with modular interfaces.</li>
<li>Prepared for future containerization of high-load or security-critical modules (e.g., anonymization layer, document processing) as scaling demands increase.</li>
</ul>
</li>
<li><strong>Realtime Capabilities:</strong>
<ul>
<li>Leverage Supabase subscriptions for realtime updates across the application.</li>
</ul>
</li>
</ul>
<hr>
<h2 id="phased-development-plan">5. Phased Development Plan</h2>
<h3 id="phase-1-core-mvp-development">Phase 1: Core MVP Development</h3>
<ul>
<li><strong>Focus:</strong> Build foundational features using strengths in TypeScript, Tailwind, and Supabase.</li>
<li><strong>Key Deliverables:</strong>
<ul>
<li>Onboarding and dashboard with a dynamic compliance wizard (handling both new facility creation and conditional flows based on facility status).</li>
<li>Compliance wizards (Joint Commission and DHCS) with dynamic step flows.</li>
<li>Document management module (upload, drag-and-drop, rename, delete, move, search).</li>
<li>Chat module with conversation threads, file attachment queue, and categorization modal.</li>
<li>Facilities and staff modules with basic CRUD functionality.</li>
<li>Notifications (in-app and email) and an integrated calendar.</li>
<li>Basic audit logging and PHI anonymization layer.</li>
<li>RESTful endpoints with versioning, protected routes, and rate limiting.</li>
<li>CI/CD pipeline using GitHub Actions with automated Newman tests on every push.</li>
</ul>
</li>
</ul>
<h3 id="phase-2-enhanced-integration--modularity">Phase 2: Enhanced Integration &amp; Modularity</h3>
<ul>
<li><strong>Focus:</strong> Enhance integrations and prepare for future decoupling.</li>
<li><strong>Enhancements:</strong>
<ul>
<li>Advanced LLM integration with automatic context inclusion (using static compliance data and user uploads).</li>
<li>Enhanced, robust anonymization layer for PHI.</li>
<li>Refactor modules to expose clear API interfaces for future containerization.</li>
<li>Improved audit logging with an admin dashboard.</li>
<li>Expanded notifications and calendar features.</li>
</ul>
</li>
</ul>
<h3 id="phase-3-outsourcing--advanced-features">Phase 3: Outsourcing &amp; Advanced Features</h3>
<ul>
<li><strong>Focus:</strong> Outsource or further enhance modules requiring specialized expertise.</li>
<li><strong>Key Areas:</strong>
<ul>
<li>Advanced LLM and anonymization enhancements.</li>
<li>Sophisticated document processing and NLP capabilities.</li>
<li>Extended HR module development as requirements evolve.</li>
<li>Comprehensive performance, penetration, and security testing via external audits.</li>
</ul>
</li>
</ul>
<hr>
<h2 id="final-considerations">6. Final Considerations</h2>
<ul>
<li><strong>Documentation:</strong>
<ul>
<li>Maintain clear documentation for all modules, RESTful endpoints, testing procedures, and CI/CD configurations.</li>
</ul>
</li>
<li><strong>Iteration &amp; Feedback:</strong>
<ul>
<li>Continuously update the MVP based on compliance guideline changes and user feedback.</li>
</ul>
</li>
<li><strong>Security &amp; HIPAA Compliance:</strong>
<ul>
<li>Ensure all aspects of data handling, especially PHI, strictly adhere to HIPAA guidelines through encryption, audit logging, and secure anonymization processes.</li>
</ul>
</li>
</ul>
<hr>
<p>This specification is designed to be a complete blueprint for immediate development, while also providing a clear roadmap for future scalability and enhancements. It is tailored for a one-man development team but is structured to support outsourced enhancements as the project grows.</p>
<p>Happy coding!</p>
<blockquote>
<p>Written with <a href="https://stackedit.io/">StackEdit</a>.</p>
</blockquote>

