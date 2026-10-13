# InsightFlow

InsightFlow is a customer feedback intelligence workspace built for the Frontend Arena Build Battle 2026. It turns reviews, surveys, and support tickets into a searchable, prioritized view of customer sentiment, product friction, and recommended action.

## Problem Statement Mapping

- **Feedback Management:** Import feedback from CSV, add individual entries, search records, and export the analyzed dataset as JSON or CSV.
- **AI Analysis:** Enrich each entry with sentiment, sentiment score, category, urgency, root cause, and a recommended action.
- **Analytics:** Track net sentiment, sentiment mix, category frequency, and critical issue volume in a live dashboard.
- **Recommendations:** Surface every high- and critical-urgency record in a decision queue with customer impact and a concrete next action.
- **Issue Tracking:** Filter and triage records, inspect the full structured analysis, and move status between Open, In Review, and Resolved.

## How Adaption Labs is Integrated in InsightFlow

The `analyzeWithAdaption` client in `lib/adaption.ts` sends feedback to the Adaption Labs processing endpoint when `NEXT_PUBLIC_ADAPTION_API_KEY` is configured. The request includes the source, optional customer name, and the target analysis schema so the response can be normalized into InsightFlow's strict `FeedbackItem` contract.

Adaption's response is normalized and checked against the supported sentiment, category, urgency, and status values. If a field is absent, InsightFlow fills it from its deterministic local analysis. If no key is configured, the request fails, or the response cannot be used, the full local fallback still classifies the text, assigns a bounded sentiment score and urgency, and generates a category-specific root cause and recommended action. Every result is marked as processed by the Adaption Labs Engine, including fallback results.

This schema orchestration keeps records consistent across manual entry and CSV import. Adaptive categorization maps different customer language into a stable set of product areas, while sentiment extraction provides both a readable label and a numeric polarity score for aggregate metrics. The heuristic fallback keeps the workflow available during development or an API outage; it is a resilience path, not a substitute for a configured Adaption deployment.

## Quick Start

Place these files in a standard Next.js App Router project with Tailwind CSS configured. Install the runtime dependencies:

```bash
npm install papaparse lucide-react
npm install -D @types/papaparse
npm run dev
```

Set the following optional variables in `.env.local` to enable live Adaption requests:

```env
NEXT_PUBLIC_ADAPTION_API_KEY=your_adaption_api_key
NEXT_PUBLIC_ADAPTION_API_URL=https://api.adaptionlabs.ai/v1/process
```

Without a key, the built-in deterministic analyzer handles feedback locally. Because `NEXT_PUBLIC_` variables are included in the browser bundle, use only a key intended for client-side use; for a secret server-side credential, proxy this call through a protected Next.js Route Handler.

### Deploy to Vercel

1. Push the Next.js project to a Git provider and import that repository in Vercel.
2. Confirm the project framework is Next.js and the build command is `npm run build`.
3. Add the Adaption environment variables in the Vercel project settings if live analysis is enabled.
4. Deploy. Vercel will build and host the App Router application; subsequent pushes to the production branch trigger new deployments.