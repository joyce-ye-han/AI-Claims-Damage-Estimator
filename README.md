# AI Claims Damage Estimator

A minimal full-stack prototype for an insurance claims workflow. Upload a damaged vehicle photo or paste an image URL to receive car metadata, a visible-damage summary, and a preliminary repair cost range powered by Google Gemini.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template and add your Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey):

```bash
cp .env.example .env.local
```

3. Start the dev server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Architecture

```
User (browser)
  → app/page.tsx
  → POST /api/analyze (FormData: file OR imageUrl)
  → lib/image.ts (normalize to base64 inline data)
  → lib/gemini.ts (Gemini vision + JSON response)
  → structured JSON back to UI
```

- **Frontend**: one page at `app/page.tsx` with upload, URL input, preview, loading/error states, and result cards
- **Backend**: one API route at `app/api/analyze/route.ts`
- **AI**: `@google/genai` SDK, `gemini-2.5-flash` with fallback to `gemini-2.0-flash`
- **No database, auth, queue, or extra pages**

## Demo flow

1. Upload a car damage photo **or** paste a public HTTPS image URL
2. Click **Analyze damage**
3. Review make/model/color, damage summary, cost range, assumptions, and recommended next step

## Limitations

- Estimates are **preliminary only** and based on **visible damage** in a single photo
- Accuracy depends on image quality, angle, and lighting
- URL input requires a fetchable HTTPS image (server-side fetch)
- No persistence — results are not saved
- No human adjuster review workflow in v1

## Future improvements

- Auth
- Object storage (S3/GCS) for uploaded claim photos
- Claim history database
- Repair pricing table / historical claims integration
- Human adjuster review workflow
- Audit logs
- Evals against real adjuster outcomes
