'use client';

import Papa from 'papaparse';
import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  FileJson2,
  FileSpreadsheet,
  Filter,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { analyzeWithAdaption, INITIAL_SAMPLE_DATA } from '../lib/adaption';
import type { FeedbackCategory, FeedbackItem, FeedbackSource, FeedbackStatus, Sentiment, Urgency } from '../lib/types';

const categories: FeedbackCategory[] = ['Billing & Payments', 'UI/UX', 'Performance & Latency', 'Customer Support', 'Feature Request'];
const statuses: FeedbackStatus[] = ['Open', 'In Review', 'Resolved'];
const sources: FeedbackSource[] = ['Review', 'Survey', 'Support Ticket'];
type SelectFilter = 'All' | Sentiment | Urgency | FeedbackCategory;

const sentimentTone: Record<Sentiment, string> = {
  Positive: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  Neutral: 'border-slate-400/20 bg-slate-400/10 text-slate-300',
  Negative: 'border-rose-400/20 bg-rose-400/10 text-rose-300',
};
const urgencyTone: Record<Urgency, string> = {
  Low: 'text-slate-400',
  Medium: 'text-amber-300',
  High: 'text-orange-300',
  Critical: 'text-rose-300',
};
const statusTone: Record<FeedbackStatus, string> = {
  Open: 'text-rose-300',
  'In Review': 'text-amber-300',
  Resolved: 'text-emerald-300',
};

function scoreText(items: FeedbackItem[]) {
  if (!items.length) return '0';
  const score = items.reduce((sum, item) => sum + item.sentimentScore, 0) / items.length;
  return `${score > 0 ? '+' : ''}${Math.round(score * 100)}`;
}

function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex max-w-full items-center rounded border px-2 py-1 text-[11px] font-medium leading-4 ${className}`}>{children}</span>;
}

function Select({ value, onChange, children, ariaLabel }: { value: string; onChange: (value: string) => void; children: React.ReactNode; ariaLabel: string }) {
  return (
    <span className="relative inline-flex items-center">
      <select aria-label={ariaLabel} value={value} onChange={(event) => onChange(event.target.value)} className="h-9 appearance-none rounded-md border border-white/10 bg-[#111827] py-0 pl-3 pr-8 text-xs text-slate-200 outline-none transition focus:border-indigo-400/70">
        {children}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-slate-500" />
    </span>
  );
}

export default function InsightFlowPage() {
  const [items, setItems] = useState<FeedbackItem[]>(INITIAL_SAMPLE_DATA);
  const [search, setSearch] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<SelectFilter>('All');
  const [categoryFilter, setCategoryFilter] = useState<SelectFilter>('All');
  const [urgencyFilter, setUrgencyFilter] = useState<SelectFilter>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [manualText, setManualText] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualSource, setManualSource] = useState<FeedbackSource>('Review');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [notice, setNotice] = useState('');
  const uploadRef = useRef<HTMLInputElement>(null);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) =>
      (!query || `${item.rawText} ${item.customerName} ${item.source} ${item.category}`.toLowerCase().includes(query)) &&
      (sentimentFilter === 'All' || item.sentiment === sentimentFilter) &&
      (categoryFilter === 'All' || item.category === categoryFilter) &&
      (urgencyFilter === 'All' || item.urgency === urgencyFilter),
    );
  }, [items, search, sentimentFilter, categoryFilter, urgencyFilter]);

  const counts = useMemo(() => {
    const sentiment: Record<Sentiment, number> = { Positive: 0, Neutral: 0, Negative: 0 };
    const category: Record<FeedbackCategory, number> = {
      'Billing & Payments': 0,
      'UI/UX': 0,
      'Performance & Latency': 0,
      'Customer Support': 0,
      'Feature Request': 0,
    };
    for (const item of items) {
      sentiment[item.sentiment] += 1;
      category[item.category] += 1;
    }
    return { sentiment, category };
  }, [items]);

  const priorityItems = useMemo(() => items.filter((item) => item.urgency === 'Critical' || item.urgency === 'High'), [items]);
  const pipelineReady = Boolean(process.env.NEXT_PUBLIC_ADAPTION_API_KEY);
  const total = items.length || 1;
  const categoryMax = Math.max(1, ...Object.values(counts.category));

  function updateStatus(id: string, status: FeedbackStatus) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, status } : item));
  }

  async function addManualEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!manualText.trim()) return;
    setIsAnalyzing(true);
    try {
      const item = await analyzeWithAdaption(manualText, manualSource, manualName);
      setItems((current) => [item, ...current]);
      setManualText('');
      setManualName('');
      setModalOpen(false);
      setNotice('Feedback analyzed and added.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function importCsv(file?: File) {
    if (!file) return;
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: async ({ data }) => {
        setIsAnalyzing(true);
        try {
          const imported = await Promise.all(data.filter((row) => Object.values(row).some((value) => value?.trim())).map((row) => {
            const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim().toLowerCase().replace(/[\s_-]/g, ''), value]));
            const text = normalized.rawtext ?? normalized.feedback ?? normalized.text ?? normalized.comment ?? '';
            if (!text.trim()) return null;
            const source = normalized.source ?? 'Review';
            return analyzeWithAdaption(text, source, normalized.customername ?? normalized.customer ?? normalized.name);
          }));
          const valid = imported.filter((item): item is FeedbackItem => item !== null);
          setItems((current) => [...valid, ...current]);
          setNotice(valid.length ? `${valid.length} CSV record${valid.length === 1 ? '' : 's'} analyzed and added.` : 'No feedback rows found. Include a rawText, feedback, text, or comment column.');
        } finally {
          setIsAnalyzing(false);
          if (uploadRef.current) uploadRef.current.value = '';
        }
      },
      error: (error) => setNotice(`Could not parse CSV: ${error.message}`),
    });
  }

  function exportReport(format: 'json' | 'csv') {
    const content = format === 'json' ? JSON.stringify(items, null, 2) : Papa.unparse(items);
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `insightflow-feedback-${new Date().toISOString().slice(0, 10)}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice(`${format.toUpperCase()} report exported.`);
  }

  return (
    <main className="min-h-screen bg-[#090d18] text-slate-100">
      <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#0b1020]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-5 py-3.5 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-indigo-300/20 bg-indigo-400/10 text-indigo-300"><Activity className="h-5 w-5" /></div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-lg font-semibold tracking-tight">InsightFlow</h1>
                <Badge className="border-indigo-400/20 bg-indigo-400/[0.08] text-indigo-200"><Sparkles className="mr-1 h-3 w-3" /> Powered by Adaption Labs</Badge>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">Customer feedback intelligence</p>
            </div>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <button onClick={() => { setItems(INITIAL_SAMPLE_DATA); setNotice('Loaded 15 sample records.'); }} className="action-button"><ArrowDownToLine className="h-3.5 w-3.5" /> <span>Load 15 Sample Records</span></button>
            <button onClick={() => setModalOpen(true)} className="action-button"><Plus className="h-3.5 w-3.5" /> <span>Add Manual Entry</span></button>
            <input ref={uploadRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => importCsv(event.target.files?.[0])} />
            <button onClick={() => uploadRef.current?.click()} className="action-button" disabled={isAnalyzing}><ArrowUpFromLine className="h-3.5 w-3.5" /> <span>Upload CSV</span></button>
            <div className="group relative">
              <button className="action-button" aria-haspopup="true"><FileJson2 className="h-3.5 w-3.5" /> <span>Export Report</span><ChevronDown className="h-3 w-3 text-slate-500" /></button>
              <div className="invisible absolute right-0 top-full z-30 mt-1 w-40 rounded-lg border border-white/10 bg-[#111827] p-1 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <button onClick={() => exportReport('json')} className="menu-item"><FileJson2 className="h-4 w-4" /> JSON</button>
                <button onClick={() => exportReport('csv')} className="menu-item"><FileSpreadsheet className="h-4 w-4" /> CSV</button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] space-y-5 px-5 py-6 lg:px-8 lg:py-8">
        {notice && <div role="status" className="flex items-center justify-between rounded-md border border-indigo-300/15 bg-indigo-400/[0.07] px-3.5 py-2.5 text-xs text-indigo-100"><span>{notice}</span><button aria-label="Dismiss notice" onClick={() => setNotice('')}><X className="h-4 w-4" /></button></div>}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Feedback metrics">
          <MetricCard label="Total Entries" value={items.length.toString()} detail="All feedback records" icon={<FileSpreadsheet className="h-4 w-4" />} color="text-sky-300" />
          <MetricCard label="Net Sentiment Score" value={scoreText(items)} detail="Average polarity · −100 to +100" icon={<Activity className="h-4 w-4" />} color="text-emerald-300" />
          <MetricCard label="Critical Issues" value={items.filter((item) => item.urgency === 'Critical').length.toString()} detail={`${priorityItems.length} high-priority signals`} icon={<ShieldAlert className="h-4 w-4" />} color="text-rose-300" />
          <div className="metric-card flex items-center justify-between">
            <div><p className="text-xs text-slate-400">Adaption Pipeline</p><p className="mt-2 text-base font-semibold">{pipelineReady ? 'API Connected' : 'Heuristic Fallback'}</p><p className="mt-1 text-[11px] text-slate-500">{pipelineReady ? 'Live analysis with local fallback' : 'Analysis ready · API key not configured'}</p></div>
            <span className={`grid h-9 w-9 place-items-center rounded-lg ${pipelineReady ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-400/10 text-amber-300'}`}><BrainCircuit className="h-4.5 w-4.5" /></span>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]" aria-label="Feedback analytics">
          <div className="panel p-5">
            <SectionHeading title="Sentiment Overview" eyebrow="CUSTOMER SIGNAL" />
            <div className="mt-6 space-y-5">
              {(['Positive', 'Neutral', 'Negative'] as Sentiment[]).map((sentiment) => {
                const pct = Math.round((counts.sentiment[sentiment] / total) * 100);
                const bar = sentiment === 'Positive' ? 'bg-emerald-400' : sentiment === 'Neutral' ? 'bg-slate-400' : 'bg-rose-400';
                return <div key={sentiment}>
                  <div className="mb-2 flex items-center justify-between text-xs"><span className="text-slate-300">{sentiment}</span><span className="font-medium tabular-nums text-slate-200">{pct}% <span className="ml-1 text-slate-500">({counts.sentiment[sentiment]})</span></span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className={`h-full rounded-full ${bar} transition-all`} style={{ width: `${pct}%` }} /></div>
                </div>;
              })}
            </div>
            <div className="mt-6 flex items-center gap-2 border-t border-white/[0.07] pt-4 text-[11px] text-slate-500"><Activity className="h-3.5 w-3.5" /> Based on {items.length} analyzed {items.length === 1 ? 'record' : 'records'}</div>
          </div>
          <div className="panel p-5">
            <SectionHeading title="Feedback by Category" eyebrow="ISSUE DISTRIBUTION" />
            <div className="mt-5 space-y-3.5">
              {categories.map((category) => {
                const amount = counts.category[category];
                return <div className="grid grid-cols-[minmax(112px,0.85fr)_minmax(0,1.5fr)_30px] items-center gap-3" key={category}>
                  <span className="truncate text-[11px] text-slate-400" title={category}>{category}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-indigo-400/80 transition-all" style={{ width: `${(amount / categoryMax) * 100}%` }} /></div>
                  <span className="text-right text-xs tabular-nums text-slate-300">{amount}</span>
                </div>;
              })}
            </div>
          </div>
        </section>

        <section className="panel overflow-hidden" aria-label="Priority recommendations">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
            <SectionHeading title="Priority Recommendations" eyebrow="DECISION QUEUE" />
            <Badge className="border-rose-400/20 bg-rose-400/[0.08] text-rose-200"><CircleAlert className="mr-1 h-3 w-3" /> {priorityItems.length} items need attention</Badge>
          </div>
          {priorityItems.length ? <div className="divide-y divide-white/[0.06]">
            {priorityItems.map((item) => <article key={item.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(180px,0.8fr)_minmax(180px,1fr)_minmax(240px,1.4fr)]">
              <div><div className="flex flex-wrap items-center gap-2"><Badge className={`${item.urgency === 'Critical' ? 'border-rose-400/20 bg-rose-400/10 text-rose-300' : 'border-orange-300/20 bg-orange-300/[0.08] text-orange-200'}`}>{item.urgency}</Badge><span className="text-[11px] text-slate-500">{item.date}</span></div><h3 className="mt-2 text-xs font-medium text-slate-200">{item.customerName} <span className="font-normal text-slate-500">· {item.category}</span></h3><p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-400">{item.rawText}</p></div>
              <div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Why It Matters</p><p className="mt-1.5 text-xs leading-5 text-slate-300">{item.urgency === 'Critical' ? 'Immediate customer impact is likely; delay can increase financial, operational, or trust risk.' : 'A core workflow is affected and may be blocking the customer or their team.'}</p></div>
              <div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Issue Root Cause</p><p className="mt-1 text-xs leading-5 text-slate-300">{item.rootCause}</p><p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-indigo-300">AI Recommended Action</p><p className="mt-1 text-xs leading-5 text-slate-300">{item.recommendedAction}</p></div>
            </article>)}
          </div> : <div className="px-5 py-8 text-center text-xs text-slate-500">No high-priority feedback. The queue is clear.</div>}
        </section>

        <section className="panel overflow-hidden" aria-label="Feedback records">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-4">
            <div><h2 className="text-sm font-semibold">Feedback records</h2><p className="mt-1 text-[11px] text-slate-500">Search, triage, and update issue status</p></div>
            <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
              <label className="relative min-w-[180px] flex-1 lg:w-56 lg:flex-none"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search feedback..." className="h-9 w-full rounded-md border border-white/10 bg-[#0c1221] pl-9 pr-3 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-400/70" /></label>
              <Select ariaLabel="Filter by sentiment" value={sentimentFilter} onChange={(value) => setSentimentFilter(value as SelectFilter)}><option value="All">All sentiment</option><option>Positive</option><option>Neutral</option><option>Negative</option></Select>
              <Select ariaLabel="Filter by category" value={categoryFilter} onChange={(value) => setCategoryFilter(value as SelectFilter)}><option value="All">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</Select>
              <Select ariaLabel="Filter by urgency" value={urgencyFilter} onChange={(value) => setUrgencyFilter(value as SelectFilter)}><option value="All">All urgency</option><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></Select>
              <span className="hidden text-[11px] text-slate-500 xl:inline-flex xl:items-center"><Filter className="mr-1 h-3 w-3" /> {visibleItems.length} of {items.length}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse text-left">
              <thead><tr className="border-b border-white/[0.07] bg-white/[0.015] text-[10px] font-medium uppercase tracking-wider text-slate-500"><th className="px-4 py-3 pl-5">Date</th><th className="px-3 py-3">Customer / Source</th><th className="px-3 py-3">Raw Feedback</th><th className="px-3 py-3">Sentiment</th><th className="px-3 py-3">Urgency</th><th className="px-3 py-3">Category</th><th className="px-3 py-3 pr-5">Status</th></tr></thead>
              <tbody className="divide-y divide-white/[0.05]">
                {visibleItems.map((item) => <FeedbackRow key={item.id} item={item} expanded={expandedId === item.id} onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)} onStatusChange={(value) => updateStatus(item.id, value)} />)}
                {!visibleItems.length && <tr><td colSpan={7} className="px-5 py-12 text-center text-xs text-slate-500">No records match these filters.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
        <footer className="flex flex-wrap items-center justify-between gap-2 pb-2 text-[10px] text-slate-600"><span>InsightFlow · Feedback operations workspace</span><span>{isAnalyzing ? 'Analyzing feedback…' : 'Analysis is ready'}</span></footer>
      </div>

      {modalOpen && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isAnalyzing) setModalOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="manual-entry-title" className="w-full max-w-lg rounded-xl border border-white/10 bg-[#111827] p-5 shadow-2xl">
          <div className="flex items-start justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-300">New signal</p><h2 id="manual-entry-title" className="mt-1 text-lg font-semibold">Add feedback</h2></div><button disabled={isAnalyzing} onClick={() => setModalOpen(false)} aria-label="Close dialog" className="rounded-md p-1 text-slate-500 hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button></div>
          <form onSubmit={addManualEntry} className="mt-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1.5 text-xs text-slate-400"><span>Customer name</span><input value={manualName} onChange={(event) => setManualName(event.target.value)} placeholder="Optional" className="field-input" /></label><label className="space-y-1.5 text-xs text-slate-400"><span>Feedback source</span><Select ariaLabel="Feedback source" value={manualSource} onChange={(value) => setManualSource(value as FeedbackSource)}>{sources.map((source) => <option key={source}>{source}</option>)}</Select></label></div>
            <label className="block space-y-1.5 text-xs text-slate-400"><span>Customer feedback</span><textarea required rows={6} maxLength={5000} value={manualText} onChange={(event) => setManualText(event.target.value)} placeholder="Paste the feedback you'd like to analyze..." className="field-input resize-y leading-5" /><span className="block text-right text-[10px] text-slate-600">{manualText.length} / 5000</span></label>
            <div className="flex justify-end gap-2 border-t border-white/[0.07] pt-4"><button type="button" disabled={isAnalyzing} onClick={() => setModalOpen(false)} className="action-button">Cancel</button><button type="submit" disabled={isAnalyzing || !manualText.trim()} className="inline-flex h-9 items-center gap-2 rounded-md border border-indigo-300/20 bg-indigo-400/15 px-3 text-xs font-medium text-indigo-100 hover:bg-indigo-400/25 disabled:cursor-not-allowed disabled:opacity-50"><Sparkles className="h-3.5 w-3.5" />{isAnalyzing ? 'Analyzing…' : 'Analyze feedback'}</button></div>
          </form>
        </section>
      </div>}
      <style jsx global>{`
        .action-button { display:inline-flex; height:36px; align-items:center; justify-content:center; gap:7px; border:1px solid rgba(255,255,255,.1); border-radius:6px; background:rgba(255,255,255,.025); padding:0 10px; color:#cbd5e1; font-size:11px; font-weight:500; transition:background .15s,border-color .15s; }
        .action-button:hover { border-color:rgba(165,180,252,.25); background:rgba(255,255,255,.07); color:#fff; }
        .action-button:disabled { cursor:wait; opacity:.55; }
        .menu-item { display:flex; width:100%; align-items:center; gap:9px; border-radius:5px; padding:9px 10px; color:#cbd5e1; font-size:12px; text-align:left; }
        .menu-item:hover { background:rgba(255,255,255,.06); color:#fff; }
        .metric-card { min-height:112px; border:1px solid rgba(255,255,255,.08); border-radius:9px; background:rgba(17,24,39,.78); padding:16px 18px; }
        .panel { border:1px solid rgba(255,255,255,.08); border-radius:9px; background:rgba(17,24,39,.68); }
        .field-input { width:100%; border:1px solid rgba(255,255,255,.1); border-radius:6px; background:#0c1221; padding:10px 11px; color:#e2e8f0; font-size:12px; outline:none; }
        .field-input:focus { border-color:rgba(129,140,248,.7); }
        .field-input::placeholder { color:#64748b; }
      `}</style>
    </main>
  );
}

function MetricCard({ label, value, detail, icon, color }: { label: string; value: string; detail: string; icon: React.ReactNode; color: string }) {
  return <div className="metric-card flex items-start justify-between"><div><p className="text-xs text-slate-400">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</p><p className="mt-1 text-[11px] text-slate-500">{detail}</p></div><span className={`grid h-9 w-9 place-items-center rounded-lg bg-white/[0.04] ${color}`}>{icon}</span></div>;
}

function SectionHeading({ title, eyebrow }: { title: string; eyebrow: string }) {
  return <div><p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-indigo-300/80">{eyebrow}</p><h2 className="mt-1 text-sm font-semibold text-slate-100">{title}</h2></div>;
}

function FeedbackRow({ item, expanded, onToggle, onStatusChange }: { item: FeedbackItem; expanded: boolean; onToggle: () => void; onStatusChange: (status: FeedbackStatus) => void }) {
  return <>
    <tr className="group align-top transition hover:bg-white/[0.02]">
      <td className="whitespace-nowrap px-4 py-3.5 pl-5 text-[11px] tabular-nums text-slate-400"><button onClick={onToggle} aria-label={`${expanded ? 'Hide' : 'Show'} details for ${item.customerName}`} className="mr-1 inline-flex align-middle text-slate-600 hover:text-indigo-300">{expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}</button>{item.date}</td>
      <td className="px-3 py-3.5"><p className="whitespace-nowrap text-xs font-medium text-slate-200">{item.customerName}</p><p className="mt-1 text-[10px] text-slate-500">{item.source}</p></td>
      <td className="max-w-[330px] px-3 py-3.5"><button onClick={onToggle} className="line-clamp-2 text-left text-[11px] leading-5 text-slate-400 hover:text-slate-200">{item.rawText}</button></td>
      <td className="px-3 py-3.5"><Badge className={sentimentTone[item.sentiment]}>{item.sentiment} <span className="ml-1 opacity-70">{item.sentimentScore > 0 ? '+' : ''}{item.sentimentScore.toFixed(2)}</span></Badge></td>
      <td className="px-3 py-3.5"><span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-medium ${urgencyTone[item.urgency]}`}><span className={`h-1.5 w-1.5 rounded-full ${item.urgency === 'Critical' ? 'bg-rose-400' : item.urgency === 'High' ? 'bg-orange-300' : item.urgency === 'Medium' ? 'bg-amber-300' : 'bg-slate-500'}`} />{item.urgency}</span></td>
      <td className="px-3 py-3.5"><Badge className="border-white/10 bg-white/[0.03] text-slate-300">{item.category}</Badge></td>
      <td className="px-3 py-3.5 pr-5"><Select ariaLabel={`Status for ${item.customerName}`} value={item.status} onChange={(value) => onStatusChange(value as FeedbackStatus)}>{statuses.map((status) => <option key={status}>{status}</option>)}</Select></td>
    </tr>
    {expanded && <tr className="bg-[#0b1120]"><td colSpan={7} className="border-t border-white/[0.04] px-5 py-4"><div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]"><div><p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Issue Root Cause</p><p className="text-xs leading-5 text-slate-300">{item.rootCause}</p><p className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">AI Recommended Action</p><p className="text-xs leading-5 text-slate-300">{item.recommendedAction}</p></div><div><p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Adaption structured breakdown</p><pre className="max-h-64 overflow-auto rounded-md border border-white/[0.07] bg-[#080c16] p-3 text-[10px] leading-5 text-indigo-100/80">{JSON.stringify(item, null, 2)}</pre></div></div></td></tr>}
  </>;
}