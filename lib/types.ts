export type FeedbackSource = 'Review' | 'Survey' | 'Support Ticket';
export type Sentiment = 'Positive' | 'Neutral' | 'Negative';
export type FeedbackCategory =
  | 'Billing & Payments'
  | 'UI/UX'
  | 'Performance & Latency'
  | 'Customer Support'
  | 'Feature Request';
export type Urgency = 'Low' | 'Medium' | 'High' | 'Critical';
export type FeedbackStatus = 'Open' | 'In Review' | 'Resolved';

export interface FeedbackItem {
  id: string;
  date: string;
  source: FeedbackSource;
  customerName: string;
  rawText: string;
  sentiment: Sentiment;
  sentimentScore: number;
  category: FeedbackCategory;
  urgency: Urgency;
  rootCause: string;
  recommendedAction: string;
  status: FeedbackStatus;
  processedBy: 'Adaption Labs Engine';
}

export interface FeedbackFilters {
  search: string;
  sentiment: Sentiment | 'All';
  category: FeedbackCategory | 'All';
  urgency: Urgency | 'All';
}

export interface MetricSummary {
  totalEntries: number;
  netSentimentScore: number;
  criticalIssues: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  categoryCounts: Record<FeedbackCategory, number>;
}