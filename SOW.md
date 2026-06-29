# Statement of Work: AI-Powered Claims Damage Assessment Prototype

## 1. Project Scope

This project delivers a full-stack prototype for vehicle damage claims intake. A user submits a damaged vehicle photo or image URL; the app returns structured decision-support output for claims agents. The prototype demonstrates end-to-end thinking across frontend, backend, and AI without replacing human adjusters or claims policy.

**In scope**

- Vehicle photo upload or image URL input
- AI-generated vehicle metadata (likely make, model, color)
- Visible damage summary and severity assessment
- Preliminary repair cost range
- Confidence indicators with explanations
- Missing information checklist
- Claims routing recommendation (fast track, adjuster review, specialist review, potential total loss review, or request more information)
- Simple web interface for agents to review results
- Backend API route for image processing and AI model calls

The prototype supports agent decision-making. It helps agents review claims faster, understand uncertainty, and route each claim to the right next step. It does not approve, deny, pay, or determine coverage.

**Out of scope for prototype**

- Final claim approval or denial
- Payment authorization
- Fraud determination
- Coverage determination
- Full claims system replacement
- Long-term image storage
- Claim history
- Authentication or role-based access

## 2. Technical Approach

**Frontend** — Single-page web app for image upload or URL submission, preview, loading/error states, and agent-friendly results display.

**Backend** — Server-side API route validates the request, normalizes the image, calls the AI model, parses structured JSON, and returns it to the frontend. The API key stays server-side only.

**AI model** — Vision-capable Gemini model analyzes the image via a structured prompt and returns JSON.

**Output schema** — Consistent fields for vehicle details, damage assessment, repair estimate, confidence levels (with reasons), missing information, triage recommendation, and next best actions.

**High-level data flow**

1. User submits a vehicle image through the web UI.
2. Frontend sends the image or URL to the backend API route.
3. Backend validates and prepares the image input.
4. Gemini analyzes the image using a structured prompt.
5. Backend returns structured JSON to the frontend.
6. UI displays the result in an agent-friendly format.

**Integration points for future production**

- Claims system or CRM writeback for claim records and routing status
- Customer communication tools for requesting missing information
- Repair pricing and historical claims data for more accurate estimates
- Preferred repair partner network for partner repair recommendations, if relevant to the insurer
- Object storage for uploaded claim photos
- Authentication and role-based access for agents, adjusters, and admins
- Audit logs and model evaluation pipelines

## 3. Milestones and Timeline

### Phase 1: Prototype Build — 1 Week

Deliver a working end-to-end prototype with image input, AI analysis, structured results, and a simple claims review UI.

**Deliverables**

- Functional frontend
- Backend API route
- Gemini integration
- Structured response schema
- README and setup instructions

### Phase 2: Internal Pilot — 2–3 Weeks

Test the prototype against sample or historical claims to evaluate quality, usability, and workflow fit.

**Deliverables**

- Review sample claims across minor and severe damage scenarios
- Compare AI triage recommendations against human adjuster review
- Collect feedback from claims agents or adjusters
- Identify missing fields, edge cases, and workflow gaps

### Phase 3: Production Readiness Plan — 2–4 Weeks

Define requirements needed to move from prototype to production.

**Deliverables**

- Claims system integration plan
- Data storage and retention approach
- Authentication and access control requirements
- Audit logging requirements
- Model evaluation approach
- Repair pricing or historical claims data integration plan

## 4. Risk Assessment

### Decision Risk

**Risk:** AI outputs may be treated as final decisions, even though repair estimates and routing recommendations are probabilistic.

**Mitigations**

- Position AI as decision support, not automated approval or denial
- Show confidence levels and uncertainty explanations
- Require human review for low-confidence, high-severity, or high-cost claims
- Log AI recommendations and human edits for auditability

### Coverage Risk

**Risk:** Image-based analysis is limited to visible damage and may miss hidden or out-of-frame issues.

**Mitigations**

- Ask for missing claim context, such as VIN, mileage, drivability, and incident details
- Route complex or uncertain claims to adjuster or specialist review
- Support multi-photo intake in a production version
- Require physical inspection for claims where hidden damage may affect repair cost or safety

### Estimate Accuracy Risk

**Risk:** Repair costs may vary based on parts, labor rates, vehicle type, region, and repair partner availability.

**Mitigations**

- Treat repair estimates as preliminary in the prototype
- Integrate repair pricing data and historical claims data before production use
- Compare AI estimates against final repair invoices during pilot evaluation

## 5. Success Metrics

Success is measured across efficiency, trust, and business impact.

### Efficiency

- **Target:** 40% reduction in first-pass review time
- **Measurement:** Average time from image intake to initial triage recommendation

### Trust

- **Target:** 90% agent agreement with AI triage
- **Measurement:** Percentage of AI routing recommendations accepted or validated by agents/adjusters during pilot review

### Routing Quality

- **Target:** Improved routing of claims to fast track, adjuster review, specialist review, or request-more-information workflows
- **Measurement:** Comparison of AI routing recommendation against human review outcome

### Estimate Quality

- **Target:** Preliminary estimate range is directionally useful for triage
- **Measurement:** Variance between AI-generated estimate range and final body shop or adjuster estimate

### Workflow Completeness

- **Target:** Reduce back-and-forth caused by missing claim information
- **Measurement:** Percentage of claims where the system identifies required missing information during initial review

## 6. Future State

Planned production extensions include:

- Claims system / CRM integration
- Customer follow-up for missing information
- Partner repair recommendations, if relevant to the insurer
- Login and role-based access
- Object storage for claim photos
- Claim history and persistence
- Audit logs
- Model evaluation against adjuster outcomes
- Multi-photo support
- Repair pricing and historical claims data integration

The long-term goal is not to fully automate claims decisions, but to help agents review claims faster, understand model confidence, and route each claim to the right next step.
