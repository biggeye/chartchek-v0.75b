# chartChek Phased Development Plan

## Phase 1: Core MVP Development

**Focus:**  
Build the foundational architecture and essential features leveraging your strengths in TypeScript, Tailwind, and Supabase.

**Tech Stack:**  
- **Frontend:** Next.js with TypeScript and Tailwind UI  
- **Backend:** Supabase (authentication, realtime subscriptions, database)  
- **API:** RESTful endpoints (versioned, protected, rate-limited) with OpenAPI/Swagger documentation

**Modules & Key Features:**  
- **User Onboarding & Dashboard:**  
  - Login and guided onboarding (facility details, current accreditations, accreditation goals)  
  - Dashboard with compliance metrics for Facility, Patient Charts, and HR (including hover tooltips for details)

- **Compliance Wizards:**  
  - Step-by-step processes for Joint Commission (and DHCS) with dynamic flows  
    - Stage 1: Account creation, file uploads, and background LLM document parsing  
    - Stage 2: Application submission (fee payment, confirmation, and ready date selection)  
    - Stage 3: Ready date declaration and timeline generation  
    - Accredited stage for transitioning into maintenance mode

- **Document Management Module:**  
  - Drag-and-drop uploads, file rename, delete, move, and search functionality  
  - Folder organization (list/grid view)  
  - HIPAA compliance with encryption and audit logging

- **Chat Module:**  
  - Conversation-driven interface with multi-specialist support (Compliance, Billing, HR)  
  - File attachment queue with categorization modal (via radio buttons and live search)  
  - Capability to remove file associations with confirmation alerts

- **Facilities & Staff Modules:**  
  - Facilities: List/grid view of facility cards with enterprise metrics and detailed compliance breakdown  
  - Staff: Basic module for informational user details and facility assignments

- **Notifications & Calendar:**  
  - In-app notifications and email alerts for document processing, milestones, and ready dates  
  - Integrated calendar with timeline summary for key milestones (ready date and placeholders)

- **Audit Logging & Anonymization:**  
  - Minimal logging for PHI-related actions  
  - Active anonymization layer to detect and replace PHI (with ephemeral secure mapping) before LLM processing

- **CI/CD & Testing:**  
  - Set up a GitHub Actions pipeline that runs Newman tests on every push  
  - Develop unit/integration tests (Jest) as necessary

**Outcome:**  
A fully functional MVP that demonstrates core compliance workflows, document management, conversation-driven chat, and basic analytics—all within a monolithic architecture that is built for future modularity.

---

## Phase 2: Enhanced Integration & Modularity

**Focus:**  
Strengthen and modularize key components for scalability, improved security, and advanced functionality.

**Enhancements:**  
- **Advanced LLM Integration:**  
  - Integrate LLM-powered compliance assistant with automatic inclusion of context (combining user uploads and baked-in content)  
  - Enhance anonymization layer with more robust PHI processing

- **Modularization:**  
  - Refactor key components (chat, anonymization layer, document processing) with clear, API-first interfaces  
  - Prepare modules for potential containerization if usage or security demands increase

- **Enhanced Audit Logging & Security:**  
  - Develop a simple admin dashboard for error and audit logs  
  - Implement stricter role-based access controls and real-time PHI monitoring

- **Extended Notifications & Calendar Integration:**  
  - Expand the integrated calendar with interactive timeline views and additional event details

**Outcome:**  
A more robust and scalable system, ready for decoupling and improved performance, while maintaining compliance and security standards.

---

## Phase 3: Outsourcing & Advanced Features

**Focus:**  
Outsource or further enhance modules that require specialized expertise or heavy processing.

**Outsourcing Considerations:**  
- **LLM & Anonymization Enhancements:**  
  - Consider outsourcing development of advanced LLM integration and anonymization if complexity increases  
- **Advanced Document Processing:**  
  - Evaluate outsourcing the development of more sophisticated natural language processing features for document tagging and mapping  
- **Advanced HR Module:**  
  - As HR requirements become clearer, explore external expertise if needed

**Additional Enhancements:**  
- Comprehensive performance and penetration testing through external audits  
- Expanded CI/CD and automated testing pipelines

**Outcome:**  
A scalable, robust system with key components either optimized in-house or outsourced, ensuring a focus on core business logic and user experience.

---

## Next Steps

1. **Immediate Action Items (Phase 1):**  
   - Develop the core MVP using your strengths in TypeScript, Tailwind, and Supabase.  
   - Set up the GitHub Actions pipeline for automated Newman tests and essential unit/integration tests.

2. **Planning for Phase 2:**  
   - Identify clear module boundaries and document API interfaces to facilitate future decoupling.  
   - Begin researching LLM and anonymization solutions to inform future enhancements.

3. **Evaluation for Outsourcing (Phase 3):**  
   - Once the MVP is stable, assess which modules (e.g., advanced LLM processing or HR features) may benefit from external development expertise.

