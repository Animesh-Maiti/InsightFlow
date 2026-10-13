import type {
  FeedbackCategory,
  FeedbackItem,
  FeedbackSource,
  FeedbackStatus,
  Sentiment,
  Urgency,
} from './types';

const CATEGORIES: FeedbackCategory[] = [
  'Billing & Payments',
  'UI/UX',
  'Performance & Latency',
  'Customer Support',
  'Feature Request',
];
const SENTIMENTS: Sentiment[] = ['Positive', 'Neutral', 'Negative'];
const URGENCIES: Urgency[] = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES: FeedbackStatus[] = ['Open', 'In Review', 'Resolved'];

function makeItem(
  values: Omit<FeedbackItem, 'id' | 'date' | 'status' | 'processedBy'> &
    Partial<Pick<FeedbackItem, 'date' | 'status'>>,
): FeedbackItem {
  return {
    ...values,
    id: crypto.randomUUID(),
    date: values.date ?? '2026-10-13',
    status: values.status ?? 'Open',
    processedBy: 'Adaption Labs Engine',
  };
}

export const INITIAL_SAMPLE_DATA: FeedbackItem[] = [
  makeItem({ source: 'Support Ticket', customerName: 'Maya Chen', rawText: 'Our renewal went through twice this morning. The invoice shows two $249 charges, and the billing page will not let me dispute either one. Please reverse the duplicate today.', sentiment: 'Negative', sentimentScore: -0.96, category: 'Billing & Payments', urgency: 'Critical', rootCause: 'Duplicate renewal capture and a blocked self-serve dispute flow may indicate an idempotency failure in recurring billing.', recommendedAction: 'Inspect the renewal payment event and idempotency key, refund the duplicate charge, and add an alert for duplicate captures.', status: 'In Review' }),
  makeItem({ source: 'Review', customerName: 'Jordan Ellis', rawText: 'I love how quickly the new dashboard loads. I can finally get the weekly numbers in one place, and the layout is much easier to scan.', sentiment: 'Positive', sentimentScore: 0.91, category: 'UI/UX', urgency: 'Low', rootCause: 'The consolidated dashboard and improved information hierarchy are meeting customer needs.', recommendedAction: 'Preserve the current dashboard hierarchy and use this workflow as a usability benchmark.', status: 'Resolved' }),
  makeItem({ source: 'Support Ticket', customerName: 'Priya Nair', rawText: 'The reports page has been spinning for almost a minute every time I change the date range. It used to take two seconds, and our team cannot finish the morning review.', sentiment: 'Negative', sentimentScore: -0.79, category: 'Performance & Latency', urgency: 'High', rootCause: 'Date-range queries may be bypassing cached aggregates or scanning an unindexed event range.', recommendedAction: 'Trace report query latency, verify date indexes, and restore cached aggregation for common ranges.', status: 'Open' }),
  makeItem({ source: 'Survey', customerName: 'Theo Martin', rawText: 'I would like a read-only guest role for our finance auditors. They need to inspect monthly reports without seeing customer records or changing settings.', sentiment: 'Neutral', sentimentScore: 0.08, category: 'Feature Request', urgency: 'Medium', rootCause: 'The current role model does not offer a narrowly scoped audit-only permission set.', recommendedAction: 'Validate demand with finance teams and define a least-privilege reporting role for the roadmap.', status: 'Open' }),
  makeItem({ source: 'Review', customerName: 'Amara Okafor', rawText: 'Checkout keeps rejecting my saved card with “payment method unavailable.” I tried twice and now I am not sure whether either order was placed.', sentiment: 'Negative', sentimentScore: -0.88, category: 'Billing & Payments', urgency: 'High', rootCause: 'A payment processor response is not being mapped clearly, leaving the order and payment state ambiguous.', recommendedAction: 'Check the processor decline logs and show an explicit order state before allowing another payment attempt.', status: 'In Review' }),
  makeItem({ source: 'Survey', customerName: 'Luis Romero', rawText: 'The mobile filters are tiny and sit right beside the reset control. I keep clearing everything when I meant to open the status filter.', sentiment: 'Negative', sentimentScore: -0.54, category: 'UI/UX', urgency: 'Medium', rootCause: 'Mobile filter targets are too small and destructive reset is positioned next to a frequent control.', recommendedAction: 'Increase touch targets, separate reset from filter triggers, and validate the revised layout on small screens.', status: 'Open' }),
  makeItem({ source: 'Support Ticket', customerName: 'Nina Patel', rawText: 'We have had intermittent timeouts since 09:15 UTC. The API status page is green, but all 14 agents are blocked from opening customer profiles.', sentiment: 'Negative', sentimentScore: -0.93, category: 'Performance & Latency', urgency: 'Critical', rootCause: 'A dependency or profile-service degradation is causing broad timeouts that are not represented by the public health check.', recommendedAction: 'Escalate to on-call, inspect profile-service traces and dependency health, and update the status page with customer impact.', status: 'In Review' }),
  makeItem({ source: 'Review', customerName: 'Evan Brooks', rawText: 'Support agent Dani stayed with me until the import finished and explained exactly what had gone wrong. That was thoughtful, fast help.', sentiment: 'Positive', sentimentScore: 0.95, category: 'Customer Support', urgency: 'Low', rootCause: 'Clear ownership and proactive communication made a complex support interaction successful.', recommendedAction: 'Share the interaction as a support quality example and recognize the agent.', status: 'Resolved' }),
  makeItem({ source: 'Survey', customerName: 'Sofia Alvarez', rawText: 'Please add a Slack alert when a saved report fails. We currently find out only when someone remembers to check the page.', sentiment: 'Neutral', sentimentScore: 0.12, category: 'Feature Request', urgency: 'Medium', rootCause: 'Report failures have no proactive notification path, so users rely on manual checks.', recommendedAction: 'Assess demand for configurable Slack notifications and include delivery failure visibility.', status: 'Open' }),
  makeItem({ source: 'Support Ticket', customerName: 'Caleb Wright', rawText: 'I cannot download the receipt for last month. Clicking “Download PDF” shows a blank tab in Chrome and Safari.', sentiment: 'Negative', sentimentScore: -0.67, category: 'Billing & Payments', urgency: 'Medium', rootCause: 'Receipt PDF generation or its browser response headers may be failing across clients.', recommendedAction: 'Reproduce with the affected invoice, inspect PDF generation and content-disposition headers, and provide a receipt fallback.', status: 'Open' }),
  makeItem({ source: 'Review', customerName: 'Hana Kim', rawText: 'The activity feed takes 18 seconds to show anything after login. Once it appears, scrolling is smooth, but the initial wait is rough.', sentiment: 'Negative', sentimentScore: -0.73, category: 'Performance & Latency', urgency: 'High', rootCause: 'Initial activity-feed hydration likely requests too much history before rendering the first page.', recommendedAction: 'Profile the initial feed request, render the first page incrementally, and defer older activity.', status: 'Open' }),
  makeItem({ source: 'Survey', customerName: 'Oliver Grant', rawText: 'It would help to compare this quarter with the same quarter last year directly in the chart, instead of exporting both reports.', sentiment: 'Neutral', sentimentScore: 0.03, category: 'Feature Request', urgency: 'Low', rootCause: 'The analytics view lacks a direct year-over-year comparison for reporting periods.', recommendedAction: 'Test the comparison workflow with analytics users and prioritize a year-over-year chart mode if demand is broad.', status: 'Open' }),
  makeItem({ source: 'Review', customerName: 'Fatima Hassan', rawText: 'The updated navigation is much clearer. I found the team settings without asking a colleague, and the labels finally make sense.', sentiment: 'Positive', sentimentScore: 0.87, category: 'UI/UX', urgency: 'Low', rootCause: 'The revised navigation labels and grouping improve discoverability.', recommendedAction: 'Retain the updated navigation patterns and monitor task completion in usability sessions.', status: 'Resolved' }),
  makeItem({ source: 'Support Ticket', customerName: 'Ben Foster', rawText: 'I have contacted support three times about a locked workspace and still cannot get in. Each reply asks me to repeat the same verification steps.', sentiment: 'Negative', sentimentScore: -0.89, category: 'Customer Support', urgency: 'High', rootCause: 'Repeated verification requests suggest case context is not being carried between support handoffs.', recommendedAction: 'Assign a single case owner, review the verification history, and restore access after identity checks are complete.', status: 'In Review' }),
  makeItem({ source: 'Survey', customerName: 'Grace Liu', rawText: 'Everything has been reliable this month. The weekly summary arrives on time and the team has had no trouble inviting new members.', sentiment: 'Positive', sentimentScore: 0.82, category: 'Customer Support', urgency: 'Low', rootCause: 'Reliable summaries and a smooth team invitation workflow are supporting customer confidence.', recommendedAction: 'Continue tracking delivery reliability and keep onboarding steps consistent.', status: 'Resolved' }),
];

const categoryActions: Record<FeedbackCategory, { cause: string; action: string }> = {
  'Billing & Payments': {
    cause: 'A payment, invoice, or subscription workflow may be failing or unclear.',
    action: 'Review the affected transaction and processor events, then make the account and payment state explicit to the customer.',
  },
  'UI/UX': {
    cause: 'An interaction or information hierarchy is creating unnecessary friction.',
    action: 'Reproduce the flow on the reported device, improve control clarity, and validate the change with affected users.',
  },
  'Performance & Latency': {
    cause: 'A slow request, dependency, or expensive data operation is interrupting a core workflow.',
    action: 'Trace the affected request, identify the slow dependency or query, and prioritize a measurable latency fix.',
  },
  'Customer Support': {
    cause: 'The support experience may lack timely ownership, continuity, or a clear resolution.',
    action: 'Review the case history, assign a clear owner, and follow up with the customer until the issue is resolved.',
  },
  'Feature Request': {
    cause: 'The product may not support a workflow customers expect to complete directly.',
    action: 'Validate the request across customer segments, estimate impact, and add a scoped option to product discovery.',
  },
};

function classify(rawText: string) {
  const text = rawText.toLowerCase();
  const rules: Array<[FeedbackCategory, RegExp]> = [
    ['Billing & Payments', /bill|payment|paid|charge|refund|invoice|card|checkout|renew|subscription|receipt|price/],
    ['Performance & Latency', /slow|latency|timeout|timed out|spin|loading|load|lag|crash|unavailable|speed/],
    ['Customer Support', /support|agent|service|response|reply|contact|help|case|locked out/],
    ['UI/UX', /interface|navigation|layout|button|mobile|screen|confusing|hard to find|design|dashboard|filter/],
    ['Feature Request', /please add|would like|wish|request|could you|it would help|feature|add a way/],
  ];
  const category = rules.find(([, pattern]) => pattern.test(text))?.[0] ?? 'Feature Request';
  const positiveWords = ['love', 'great', 'excellent', 'easy', 'clear', 'fast', 'helpful', 'reliable', 'thank', 'smooth', 'happy', 'works well'];
  const negativeWords = ['fail', 'failed', 'failure', 'slow', 'error', 'problem', 'issue', 'cannot', "can't", 'charged', 'broken', 'frustrat', 'blocked', 'unavailable', 'timeout', 'keeps', 'twice'];
  const positive = positiveWords.filter((word) => text.includes(word)).length;
  const negative = negativeWords.filter((word) => text.includes(word)).length;
  const sentiment: Sentiment = positive > negative ? 'Positive' : negative > positive ? 'Negative' : 'Neutral';
  const sentimentScore = Math.max(-0.98, Math.min(0.98, (positive - negative) / Math.max(positive + negative, 1)));
  const critical = /duplicate|fraud|security breach|all .* blocked|everyone .* blocked|data loss|outage|charged twice|cannot access|can't access/.test(text);
  const high = /urgent|asap|today|blocked|cannot|can't|failed|failure|timeout|crash|charged|payment/.test(text);
  const urgency: Urgency = critical ? 'Critical' : high ? 'High' : /please add|would like|wish|request|could you|feature/.test(text) ? 'Low' : negative === 0 ? 'Low' : 'Medium';
  return { category, sentiment, sentimentScore, urgency };
}

function normalizeSource(source: string): FeedbackSource {
  return source === 'Survey' || source === 'Support Ticket' ? source : 'Review';
}

function enumValue<T extends string>(value: unknown, options: T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function fallbackAnalysis(rawText: string, source: string, customerName = 'Anonymous customer'): FeedbackItem {
  const result = classify(rawText);
  const advice = categoryActions[result.category];
  const customerContext = result.urgency === 'Critical'
    ? 'Immediate customer impact is likely; delay can increase financial, operational, or trust risk.'
    : result.urgency === 'High'
      ? 'A core workflow is affected and may be blocking the customer or their team.'
      : result.urgency === 'Medium'
        ? 'The friction can erode confidence or increase repeat contacts if it remains unresolved.'
        : 'This is a useful signal for product quality, retention, or roadmap discovery.';
  return makeItem({
    source: normalizeSource(source),
    customerName: customerName.trim() || 'Anonymous customer',
    rawText: rawText.trim(),
    ...result,
    rootCause: advice.cause,
    recommendedAction: advice.action,
    status: 'Open',
  });
}

function itemFromAdaption(payload: unknown, rawText: string, source: string, customerName?: string): FeedbackItem | null {
  if (!payload || typeof payload !== 'object') return null;
  const root = payload as Record<string, unknown>;
  const data = (root.data ?? root.result ?? root.analysis ?? root) as Record<string, unknown>;
  if (!data || typeof data !== 'object') return null;
  const base = classify(rawText);
  const category = enumValue(data.category, CATEGORIES, base.category);
  const sentiment = enumValue(data.sentiment, SENTIMENTS, base.sentiment);
  const urgency = enumValue(data.urgency, URGENCIES, base.urgency);
  const numericScore = Number(data.sentimentScore ?? data.sentiment_score);
  const advice = categoryActions[category];
  return makeItem({
    source: normalizeSource(source),
    customerName: typeof data.customerName === 'string' ? data.customerName : customerName?.trim() || 'Anonymous customer',
    rawText,
    sentiment,
    sentimentScore: Number.isFinite(numericScore) ? Math.max(-1, Math.min(1, numericScore)) : base.sentimentScore,
    category,
    urgency,
    rootCause: typeof data.rootCause === 'string' ? data.rootCause : typeof data.root_cause === 'string' ? data.root_cause : advice.cause,
    recommendedAction: typeof data.recommendedAction === 'string' ? data.recommendedAction : typeof data.recommended_action === 'string' ? data.recommended_action : advice.action,
    status: enumValue(data.status, STATUSES, 'Open'),
  });
}

export async function analyzeWithAdaption(
  rawText: string,
  source: string,
  customerName?: string,
): Promise<FeedbackItem> {
  const apiKey = process.env.NEXT_PUBLIC_ADAPTION_API_KEY;
  if (apiKey) {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_ADAPTION_API_URL || 'https://api.adaptionlabs.ai/v1/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          text: rawText,
          source,
          customerName,
          schema: {
            sentiment: 'Positive | Neutral | Negative',
            sentimentScore: 'number between -1 and 1',
            category: CATEGORIES,
            urgency: URGENCIES,
            rootCause: 'string',
            recommendedAction: 'string',
          },
        }),
        cache: 'no-store',
      });
      if (response.ok) {
        const item = itemFromAdaption(await response.json(), rawText.trim(), source, customerName);
        if (item) return item;
      }
    } catch {
      // Network and response errors use the same deterministic fallback.
    }
  }
  return fallbackAnalysis(rawText, source, customerName);
}