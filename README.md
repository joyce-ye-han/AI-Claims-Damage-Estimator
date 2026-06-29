# AI Claims Damage Estimator

## Overview

This is a full-stack prototype for an insurance claims workflow. A user can upload a damaged vehicle photo or paste an image URL. The app returns AI-generated vehicle metadata, a visible damage summary, a preliminary repair cost range, confidence indicators, and claims agent next steps.

The output is decision support only, not an automated claim approval or denial.

## Setup Instructions

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env.local
```

3. Add Gemini API key:

```env
GEMINI_API_KEY=your_key_here
```

Get a key from [Google AI Studio](https://aistudio.google.com/apikey).

4. Start the app locally:

```bash
npm run dev
```

5. Open:

```
http://localhost:3000
```

**Notes**

- The Gemini API key is only used server-side in `/api/analyze`.

## Architecture Overview

**Stack**

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Google Gemini via `@google/genai`

**Data flow**

```
User uploads image or pastes URL
→ Next.js frontend
→ /api/analyze backend route
→ image is validated and normalized server-side
→ Gemini vision model analyzes the image
→ structured JSON response is returned
→ results are displayed in the UI
```

- **Frontend** — image input, preview, loading/error states, and results display on a single page (`app/page.tsx`).
- **Backend** — validates the request, normalizes the image (`lib/image.ts`), calls Gemini (`lib/gemini.ts`), parses the structured response, and returns JSON (`app/api/analyze/route.ts`).
- **Security** — the API key is never exposed to the browser.

## Design Explanation

- **Next.js** — Keeps the frontend and backend in one project, which made it faster to build a working prototype and easier to explain end-to-end. 
- **Gemini vision model** — The use case depends on analyzing vehicle photos directly. Vision input is required to identify the vehicle and assess visible damage from a single image.
- **TypeScript** — Makes the structured AI response consistent between the API route and UI, reducing errors when mapping fields like confidence levels and triage recommendations.
- **Structured JSON** — Lets the model output render cleanly in the UI and could later plug into claims systems without re-parsing free text.
- **Confidence badges** — Build trust and transparency. Agents get a quick read (High / Medium / Low), then click for a short explanation when they need to understand uncertainty before acting.
- **Claims workflow fields** — Make the output actionable, not just descriptive. Triage routing, missing information, and next steps help agents move the claim forward without treating the AI result as a final decision.
- **Simple v1 scope** — Prioritizes a working, customer-ready prototype over production complexity (no auth, database, or queue in v1).
- **Tailwind CSS** — Keeps styling lightweight and consistent without adding a component library, so the UI stays polished but easy to maintain for a take-home prototype.

## AI Logic

- The backend sends the uploaded image or a server-fetched image URL to Gemini with a structured prompt.
- Gemini returns JSON for vehicle metadata, damage assessment, preliminary repair estimate, confidence levels (with reasons), and agent next steps.
- The prompt instructs the model to describe **visible damage only**, avoid final claim decisions, and be honest about uncertainty.
- Confidence reasons are returned by the model and shown when an agent clicks a confidence badge.
- Triage recommendations follow a defined routing policy (e.g. Fast track for minor cosmetic damage, Adjuster review for moderate damage). Fast track means a lighter review path — not automatic approval.
- The repair estimate is preliminary and should be reviewed by an adjuster or body shop.

## Limitations

- Repair estimate is preliminary and AI-generated.
- Hidden structural or mechanical damage cannot be confirmed from one image.
- Image quality and angle can affect accuracy.
- No real claims system integration in v1.
- No repair pricing table or historical claims data in v1.
- No login or authentication in v1.
- No persistence or claim history in v1.
- Uploaded photos are not stored long-term in v1.

## Future Improvements

- **Partner recommendation** — If the insurer uses preferred or in-network repair partners, recommend a repair path based on damage type, customer location, shop availability, vehicle make/model, and insurer rules.
- **Persistence** — Save claim assessments so agents can revisit prior analyses.
- **Object storage and claim history** — Store uploaded photos in object storage and link them to claim records.
- **Login functionality** — Authentication and role-based access for claims agents, adjusters, and admins.
- **Human adjuster review workflow**
- **Repair pricing / historical claims data integration**
- **Audit logs**
- **Model evaluation against actual adjuster outcomes**
- **Multi-photo support**
- **Claims system / CRM integration**

For project scope, milestones, risks, and success metrics, see [`SOW.md`](SOW.md).
