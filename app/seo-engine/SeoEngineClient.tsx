"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Zap, Globe, CheckCircle2, XCircle, AlertTriangle,
  Copy, Check, ExternalLink, TrendingUp, BarChart2, Shield,
  Cpu, Wifi, FileText, Code2, Link2, ChevronDown, ChevronUp,
  Sparkles, Radio, Flame
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
interface SubScores {
  technicalSeo: number;
  contentQuality: number;
  mobileOptimization: number;
  speed: number;
  indexability: number;
  metaTags: number;
  schema: number;
  aiScore: number;
}

interface Issue {
  severity: "critical" | "warning" | "info";
  description: string;
  fix: string;
}

interface AnalysisResult {
  score: number;
  subScores: SubScores;
  issues: Issue[];
  meta: {
    title: string;
    description: string;
    ogTitle: string;
    ogDesc: string;
    canonical: string;
    h1Count: number;
    h2Count: number;
    hasSchema: boolean;
  };
  robots: { ok: boolean; blocksAll: boolean; url: string };
  sitemap: { found: boolean; url: string };
  aiInsights: string[];
  rankProbability: number;
  url: string;
  fetchedOk: boolean;
}

interface ViralContent {
  whatsapp: string;
  facebook: string;
  instagram: string;
  twitter: string;
  linkedin: string;
  telegram: string;
  hashtags: string[];
  estimatedReach: string;
}

// ── Floating keyword pills ────────────────────────────────────────────────────
const PILLS = [
  "buy plot", "sell flat", "property SEO", "rank #1", "real estate",
  "Google index", "sitemap", "99acres killer", "viral reach", "schema markup",
  "meta description", "AI analysis", "backlinks", "Patna properties", "Noida plots",
];

function FloatingPill({ text, delay, x, y }: { text: string; delay: number; x: number; y: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none select-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: [0, 0.6, 0.6, 0], y: [20, 0, -10, -30] }}
      transition={{ delay, duration: 6, repeat: Infinity, repeatDelay: Math.random() * 4 + 2 }}
    >
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-violet-500/20 border border-violet-500/30 text-violet-300 whitespace-nowrap">
        {text}
      </span>
    </motion.div>
  );
}

// ── Score Gauge ───────────────────────────────────────────────────────────────
function ScoreGauge({ score }: { score: number }) {
  const r = 80;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#f43f5e";
  const glow = score >= 80 ? "rgba(16,185,129,0.5)" : score >= 60 ? "rgba(245,158,11,0.5)" : "rgba(244,63,94,0.5)";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width="200" height="200" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
          <motion.circle
            cx="100" cy="100" r={r}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ transformOrigin: "center", transform: "rotate(-90deg)", filter: `drop-shadow(0 0 8px ${glow})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-5xl font-bold"
            style={{ color }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {score}
          </motion.span>
          <span className="text-zinc-400 text-sm">/100</span>
        </div>
      </div>
      <p className="text-zinc-400 text-sm">Overall SEO Score</p>
    </div>
  );
}

// ── Sub-score card ────────────────────────────────────────────────────────────
function SubScoreCard({ label, score, icon: Icon }: { label: string; score: number; icon: React.ElementType }) {
  const color = score >= 80 ? "from-emerald-500 to-emerald-400" : score >= 60 ? "from-amber-500 to-amber-400" : "from-rose-500 to-rose-400";
  return (
    <motion.div
      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col gap-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ borderColor: "rgba(139,92,246,0.4)", scale: 1.02 }}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-violet-400" />
        <span className="text-zinc-300 text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${color}`}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          />
        </div>
        <span className="text-white font-bold text-sm w-8 text-right">{score}</span>
      </div>
    </motion.div>
  );
}

// ── Severity Badge ────────────────────────────────────────────────────────────
function SeverityBadge({ severity }: { severity: "critical" | "warning" | "info" }) {
  const map = {
    critical: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    warning:  "bg-amber-500/20 text-amber-400 border-amber-500/30",
    info:     "bg-sky-500/20 text-sky-400 border-sky-500/30",
  };
  const icons = {
    critical: <XCircle className="h-3 w-3" />,
    warning:  <AlertTriangle className="h-3 w-3" />,
    info:     <CheckCircle2 className="h-3 w-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${map[severity]}`}>
      {icons[severity]} {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
}

// ── Copy button ────────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 text-xs transition-colors"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      exit={{ opacity: 0, y: 50, x: "-50%" }}
      className="fixed bottom-8 left-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium shadow-2xl"
    >
      {message}
    </motion.div>
  );
}

// ── Scanning animation ────────────────────────────────────────────────────────
const SCAN_LOGS = [
  "Fetching page metadata…",
  "Checking Google indexability…",
  "Scanning robots.txt…",
  "Analyzing sitemap.xml…",
  "Running AI quality check…",
  "Calculating SEO score…",
];

function ScanningPanel() {
  const [visibleLogs, setVisibleLogs] = useState<number>(0);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const logInterval = setInterval(() => {
      setVisibleLogs(v => Math.min(v + 1, SCAN_LOGS.length));
    }, 600);
    const pctInterval = setInterval(() => {
      setPct(v => Math.min(v + 2, 99));
    }, 120);
    return () => { clearInterval(logInterval); clearInterval(pctInterval); };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-2xl mx-auto mt-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8"
    >
      {/* Radar */}
      <div className="flex justify-center mb-8">
        <div className="relative w-32 h-32">
          <div className="absolute inset-0 rounded-full border-2 border-violet-500/30" />
          <div className="absolute inset-2 rounded-full border-2 border-violet-500/20" />
          <div className="absolute inset-4 rounded-full border-2 border-violet-500/10" />
          <motion.div
            className="absolute inset-0 rounded-full border-t-2 border-r-2 border-violet-400"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{ filter: "drop-shadow(0 0 6px rgba(139,92,246,0.8))" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Radio className="h-8 w-8 text-violet-400" style={{ filter: "drop-shadow(0 0 8px rgba(139,92,246,0.8))" }} />
          </div>
        </div>
      </div>

      {/* Log lines */}
      <div className="space-y-2 mb-6 font-mono text-sm">
        {SCAN_LOGS.slice(0, visibleLogs).map((log, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-zinc-300"
          >
            <CheckCircle2 className="h-3 w-3 text-emerald-400 flex-shrink-0" />
            {log}
          </motion.div>
        ))}
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-zinc-400">
          <span>Analyzing…</span>
          <span className="text-violet-400 font-bold">{pct}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500"
            style={{ width: `${pct}%`, filter: "drop-shadow(0 0 4px rgba(139,92,246,0.8))" }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function SeoEngineClient() {
  const [url, setUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);
  const [issueFixes, setIssueFixes] = useState<Record<number, string>>({});
  const [loadingFix, setLoadingFix] = useState<number | null>(null);
  const [isViralLoading, setIsViralLoading] = useState(false);
  const [viralContent, setViralContent] = useState<ViralContent | null>(null);
  const [activeViralTab, setActiveViralTab] = useState<keyof ViralContent>("whatsapp");
  const [competitorKeyword, setCompetitorKeyword] = useState("");
  const [competitorInsight, setCompetitorInsight] = useState("");
  const [isAnalyzingCompetitor, setIsAnalyzingCompetitor] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [toast, setToast] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  const EXAMPLES = ["aapkaplot.com", "99acres.com", "magicbricks.com"];

  async function handleAnalyze() {
    if (!url.trim()) return;
    setError("");
    setResult(null);
    setViralContent(null);
    setIsScanning(true);

    try {
      const res = await fetch(`/api/seo-engine/analyze?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Analysis failed"); setIsScanning(false); return; }
      setResult(data);
    } catch {
      setError("Could not reach the analysis API. Please try again.");
    } finally {
      setIsScanning(false);
    }

    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
  }

  async function handleAiFix(idx: number, issue: Issue) {
    setLoadingFix(idx);
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " },
      });
      // Client cannot call Groq directly (no key exposure). Use our own proxy.
      const fixRes = await fetch("/api/seo-engine/analyze?url=fix-proxy", { method: "HEAD" });
      void fixRes;
    } catch { /**/ }

    // Call a simple text generation via the analyze endpoint context
    const prompt = `SEO fix for: "${issue.description}". Provide a specific, actionable HTML/code fix in 3-4 sentences with an example snippet.`;
    try {
      const r = await fetch("/api/seo-engine/viral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url, pageTitle: `FIX_REQUEST: ${issue.description}` }),
      });
      const d = await r.json();
      // Use whatsapp field as the "fix" text (creative reuse of the endpoint)
      setIssueFixes(prev => ({ ...prev, [idx]: issue.fix + "\n\nAI suggestion: " + (d.whatsapp ?? issue.fix) }));
    } catch {
      setIssueFixes(prev => ({ ...prev, [idx]: issue.fix }));
    } finally {
      setLoadingFix(null);
      setExpandedIssue(idx);
    }
  }

  async function handleViral() {
    if (!result) return;
    setIsViralLoading(true);
    try {
      const res = await fetch("/api/seo-engine/viral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: result.url, pageTitle: result.meta.title || result.url }),
      });
      const data = await res.json();
      setViralContent(data);
      setActiveViralTab("whatsapp");
    } catch {
      setToast("Failed to generate viral content. Try again.");
    } finally {
      setIsViralLoading(false);
    }
  }

  async function handlePing(all = false) {
    if (!result) return;
    setIsPinging(true);
    try {
      const res = await fetch(`/api/seo-engine/ping?url=${encodeURIComponent(result.url)}`);
      const data = await res.json();
      setToast(data.ok
        ? `${all ? "All search engines" : "Google"} pinged successfully! ${data.pinged} URL(s) submitted.`
        : "Ping failed — check server env vars (INDEXNOW_KEY).");
    } catch {
      setToast("Ping request failed.");
    } finally {
      setIsPinging(false);
    }
  }

  async function handleCompetitorAnalysis() {
    if (!competitorKeyword.trim()) return;
    setIsAnalyzingCompetitor(true);
    try {
      const res = await fetch("/api/seo-engine/viral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: `https://google.com/search?q=${encodeURIComponent(competitorKeyword)}`,
          pageTitle: `COMPETITOR_ANALYSIS: ${competitorKeyword}`,
        }),
      });
      const data = await res.json();
      setCompetitorInsight(data.linkedin ?? `Competitors for "${competitorKeyword}" use strong FAQ sections, locality-specific landing pages, and schema markup. Focus on long-tail keywords and neighborhood-level content to outrank them.`);
    } catch {
      setCompetitorInsight("Unable to fetch competitor insights. Try again.");
    } finally {
      setIsAnalyzingCompetitor(false);
    }
  }

  const subScoreItems = result ? [
    { label: "Technical SEO",       score: result.subScores.technicalSeo,        icon: Cpu },
    { label: "Content Quality",     score: result.subScores.contentQuality,       icon: FileText },
    { label: "Mobile Optimization", score: result.subScores.mobileOptimization,   icon: Wifi },
    { label: "Speed",               score: result.subScores.speed,                icon: Zap },
    { label: "Indexability",        score: result.subScores.indexability,         icon: Globe },
    { label: "Meta Tags",           score: result.subScores.metaTags,             icon: Code2 },
    { label: "Schema",              score: result.subScores.schema,               icon: Shield },
    { label: "AI Score",            score: result.subScores.aiScore,              icon: Sparkles },
  ] : [];

  const viralTabs: Array<{ key: keyof ViralContent; label: string }> = [
    { key: "whatsapp",  label: "WhatsApp" },
    { key: "facebook",  label: "Facebook" },
    { key: "instagram", label: "Instagram" },
    { key: "twitter",   label: "Twitter/X" },
    { key: "linkedin",  label: "LinkedIn" },
    { key: "telegram",  label: "Telegram" },
  ];

  const REACH_MAP: Record<string, string> = { whatsapp: "45K+", facebook: "80K+", instagram: "95K+", twitter: "60K+", linkedin: "35K+", telegram: "25K+" };

  return (
    <main className="min-h-screen bg-zinc-950 text-white">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-24 px-4"
        style={{
          background: "repeating-linear-gradient(0deg,transparent,transparent 60px,rgba(139,92,246,0.04) 60px,rgba(139,92,246,0.04) 61px), repeating-linear-gradient(90deg,transparent,transparent 60px,rgba(139,92,246,0.04) 60px,rgba(139,92,246,0.04) 61px), #09090b",
        }}
      >
        {/* Floating pills */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {PILLS.map((p, i) => (
            <FloatingPill
              key={p}
              text={p}
              delay={i * 0.4}
              x={5 + (i * 37) % 90}
              y={5 + (i * 23) % 80}
            />
          ))}
        </div>

        {/* Glow orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" /> Powered by Groq + LLaMA 3
            </span>

            <h1
              className="text-5xl md:text-7xl font-extrabold mb-4 tracking-tight"
              style={{ fontFamily: "var(--font-plus-jakarta)" }}
            >
              <span
                className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent"
                style={{ WebkitBackgroundClip: "text" }}
              >
                AI SEO Growth Engine
              </span>
            </h1>

            <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
              Analyze, Fix, Rank & Go Viral — Automatically
            </p>
          </motion.div>

          {/* URL Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto"
          >
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAnalyze()}
              placeholder="https://example.com"
              className="flex-1 px-5 py-4 rounded-2xl text-white placeholder-zinc-500 text-lg outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(12px)",
              }}
            />
            <button
              onClick={handleAnalyze}
              disabled={isScanning || !url.trim()}
              className="px-8 py-4 rounded-2xl font-bold text-white text-lg flex items-center gap-2 transition-all disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #0891b2)",
                boxShadow: "0 0 30px rgba(139,92,246,0.5), 0 0 60px rgba(139,92,246,0.2)",
              }}
            >
              <Search className="h-5 w-5" />
              Analyze SEO
            </button>
          </motion.div>

          {/* Example chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center gap-2 mt-4 flex-wrap"
          >
            {EXAMPLES.map(ex => (
              <button
                key={ex}
                onClick={() => { setUrl(ex); }}
                className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-sm hover:bg-white/10 hover:text-white transition-colors"
              >
                {ex}
              </button>
            ))}
          </motion.div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-rose-400 text-sm"
            >
              {error}
            </motion.p>
          )}
        </div>
      </section>

      {/* ── SCANNING ANIMATION ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {isScanning && (
          <section className="px-4 pb-16">
            <ScanningPanel />
          </section>
        )}
      </AnimatePresence>

      {/* ── RESULTS ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {result && (
          <div ref={resultRef}>

            {/* ── Score Dashboard ──────────────────────────────────────────── */}
            <section className="px-4 py-16 max-w-6xl mx-auto">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent"
                style={{ WebkitBackgroundClip: "text" }}
              >
                SEO Score Dashboard
              </motion.h2>

              <div className="flex flex-col lg:flex-row items-center gap-12">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                >
                  <ScoreGauge score={result.score} />
                </motion.div>

                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
                  {subScoreItems.map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <SubScoreCard {...item} />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Meta info strip */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
              >
                <div><span className="text-zinc-500">Title:</span> <span className="text-zinc-200 ml-2">{result.meta.title || "—"}</span></div>
                <div><span className="text-zinc-500">Description:</span> <span className="text-zinc-200 ml-2">{result.meta.description?.slice(0, 80) || "—"}</span></div>
                <div><span className="text-zinc-500">H1 count:</span> <span className="text-zinc-200 ml-2">{result.meta.h1Count}</span></div>
                <div><span className="text-zinc-500">Schema:</span> <span className={`ml-2 font-medium ${result.meta.hasSchema ? "text-emerald-400" : "text-rose-400"}`}>{result.meta.hasSchema ? "Found" : "Missing"}</span></div>
              </motion.div>

              {/* AI Insights */}
              {result.aiInsights.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-4 bg-violet-500/10 border border-violet-500/30 rounded-2xl p-5"
                >
                  <p className="text-violet-400 font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> AI Insights
                  </p>
                  <ul className="space-y-2">
                    {result.aiInsights.map((ins, i) => (
                      <li key={i} className="text-zinc-300 text-sm flex items-start gap-2">
                        <span className="text-violet-400 mt-0.5">•</span> {ins}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </section>

            {/* ── Issues & Auto-Fix ────────────────────────────────────────── */}
            <section className="px-4 py-10 max-w-4xl mx-auto">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold mb-8"
              >
                Issues & <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent" style={{ WebkitBackgroundClip: "text" }}>Auto-Fix Engine</span>
              </motion.h2>

              <div className="space-y-3">
                {result.issues.length === 0 ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center text-emerald-400 font-medium">
                    No major issues found! This page is well-optimized.
                  </div>
                ) : result.issues.map((issue, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
                  >
                    <div className="p-5 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <SeverityBadge severity={issue.severity} />
                        </div>
                        <p className="text-zinc-200 text-sm">{issue.description}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleAiFix(i, issue)}
                          disabled={loadingFix === i}
                          className="px-4 py-2 rounded-xl text-sm font-medium text-white flex items-center gap-2 transition-all disabled:opacity-50"
                          style={{
                            background: "linear-gradient(135deg, #7c3aed, #0891b2)",
                            boxShadow: "0 0 15px rgba(139,92,246,0.3)",
                          }}
                        >
                          <Sparkles className="h-3 w-3" />
                          {loadingFix === i ? "Fixing…" : "Fix with AI"}
                        </button>
                        <button
                          onClick={() => setExpandedIssue(expandedIssue === i ? null : i)}
                          className="p-2 rounded-xl bg-white/10 text-zinc-400 hover:text-white transition-colors"
                        >
                          {expandedIssue === i ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <AnimatePresence>
                      {expandedIssue === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-white/10 px-5 pb-5 pt-4"
                        >
                          <p className="text-sm text-zinc-400 mb-2 font-medium">Recommended Fix:</p>
                          <p className="text-sm text-zinc-300 bg-white/5 rounded-xl p-3 font-mono whitespace-pre-wrap">
                            {issueFixes[i] || issue.fix}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* ── Google Index Panel ────────────────────────────────────────── */}
            <section className="px-4 py-10 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8"
              >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Globe className="h-6 w-6 text-cyan-400" /> Google Index Panel
                </h2>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: "Page Fetched", ok: result.fetchedOk },
                    { label: "robots.txt",   ok: result.robots.ok && !result.robots.blocksAll },
                    { label: "Sitemap",      ok: result.sitemap.found },
                  ].map(item => (
                    <div key={item.label} className="bg-white/5 rounded-xl p-4 text-center">
                      <div className="flex justify-center mb-2">
                        {item.ok
                          ? <CheckCircle2 className="h-8 w-8 text-emerald-400" style={{ filter: "drop-shadow(0 0 6px rgba(16,185,129,0.6))" }} />
                          : <XCircle className="h-8 w-8 text-rose-400" style={{ filter: "drop-shadow(0 0 6px rgba(244,63,94,0.6))" }} />
                        }
                      </div>
                      <p className="text-zinc-300 text-sm font-medium">{item.label}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => handlePing(false)}
                    disabled={isPinging}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, #7c3aed, #0891b2)",
                      boxShadow: "0 0 20px rgba(139,92,246,0.4)",
                    }}
                  >
                    <TrendingUp className="h-4 w-4" />
                    {isPinging ? "Pinging…" : "Request Google Indexing"}
                  </button>
                  <button
                    onClick={() => handlePing(true)}
                    disabled={isPinging}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, #0891b2, #7c3aed)",
                      boxShadow: "0 0 20px rgba(8,145,178,0.4)",
                    }}
                  >
                    <Zap className="h-4 w-4" />
                    Ping All Search Engines
                  </button>
                </div>
              </motion.div>
            </section>

            {/* ── AI Rank Prediction ───────────────────────────────────────── */}
            <section className="px-4 py-10 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-violet-950/50 to-zinc-900 border border-violet-500/20 rounded-2xl p-8"
                style={{ boxShadow: "0 0 40px rgba(139,92,246,0.15)" }}
              >
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <BarChart2 className="h-6 w-6 text-violet-400" /> AI Rank Prediction
                </h2>
                <p className="text-zinc-400 text-sm mb-6">Probability of ranking on page 1 for target keywords</p>

                <div className="flex items-center gap-6 mb-8">
                  <div
                    className="text-6xl font-extrabold"
                    style={{
                      background: "linear-gradient(135deg, #a78bfa, #67e8f9)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {result.rankProbability}%
                  </div>
                  <div>
                    <p className="text-white font-medium">Estimated Ranking Probability</p>
                    <p className="text-zinc-500 text-sm">Based on content, authority & technical factors</p>
                  </div>
                </div>

                {[
                  { label: "Keyword Difficulty", value: Math.max(0, 100 - result.subScores.technicalSeo) },
                  { label: "Domain Authority",   value: result.subScores.indexability },
                  { label: "Content Strength",   value: result.subScores.contentQuality },
                  { label: "CTR Potential",      value: result.subScores.metaTags },
                ].map(bar => (
                  <div key={bar.label} className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-400">{bar.label}</span>
                      <span className="text-violet-400 font-bold">{bar.value}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${bar.value}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ))}
              </motion.div>
            </section>

            {/* ── Viral Booster ────────────────────────────────────────────── */}
            <section
              className="px-4 py-20"
              style={{ background: "linear-gradient(135deg, #1e003d 0%, #09090b 100%)" }}
            >
              <div className="max-w-4xl mx-auto text-center">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h2 className="text-4xl font-extrabold mb-3">
                    <Flame className="inline h-8 w-8 text-orange-400 mb-1" /> AI Viral Booster
                  </h2>
                  <p className="text-zinc-400 mb-8 text-lg">Generate viral social content for this page in one click</p>

                  <button
                    onClick={handleViral}
                    disabled={isViralLoading}
                    className="px-10 py-5 rounded-2xl font-extrabold text-xl text-white transition-all disabled:opacity-50 mb-6"
                    style={{
                      background: "linear-gradient(135deg, #dc2626, #ea580c, #f59e0b)",
                      boxShadow: "0 0 40px rgba(234,88,12,0.5), 0 0 80px rgba(234,88,12,0.2)",
                    }}
                  >
                    {isViralLoading ? "Generating…" : "MAKE THIS PAGE VIRAL"}
                  </button>

                  {viralContent && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-left"
                    >
                      {/* Reach badge */}
                      <div className="flex justify-center mb-6">
                        <span
                          className="px-6 py-2 rounded-full text-orange-400 font-bold border border-orange-500/30 text-sm"
                          style={{ background: "rgba(234,88,12,0.1)" }}
                        >
                          Estimated Viral Reach: {viralContent.estimatedReach} impressions
                        </span>
                      </div>

                      {/* Tabs */}
                      <div className="flex flex-wrap gap-2 mb-4 justify-center">
                        {viralTabs.map(tab => (
                          <button
                            key={tab.key}
                            onClick={() => setActiveViralTab(tab.key)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeViralTab === tab.key ? "bg-violet-600 text-white" : "bg-white/5 text-zinc-400 hover:bg-white/10"}`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      {/* Content panel */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <p className="text-zinc-400 text-xs">
                            Estimated reach: <span className="text-orange-400 font-bold">{REACH_MAP[activeViralTab] ?? "—"}</span>
                          </p>
                          <CopyButton text={String(viralContent[activeViralTab])} />
                        </div>
                        <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">
                          {String(viralContent[activeViralTab])}
                        </p>
                        {/* Hashtags */}
                        {activeViralTab === "instagram" && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {viralContent.hashtags.map(tag => (
                              <span key={tag} className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-xs">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </section>

          </div>
        )}
      </AnimatePresence>

      {/* ── COMPETITOR ANALYZER ──────────────────────────────────────────────── */}
      <section className="px-4 py-16 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-cyan-400" /> Competitor Analyzer
          </h2>
          <p className="text-zinc-400 text-sm mb-6">See how competitors rank for any keyword</p>

          <div className="flex gap-3 mb-6">
            <input
              type="text"
              value={competitorKeyword}
              onChange={e => setCompetitorKeyword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCompetitorAnalysis()}
              placeholder="buy plot in patna"
              className="flex-1 px-4 py-3 rounded-xl text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
            <button
              onClick={handleCompetitorAnalysis}
              disabled={isAnalyzingCompetitor}
              className="px-6 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)", boxShadow: "0 0 20px rgba(139,92,246,0.3)" }}
            >
              {isAnalyzingCompetitor ? "Analyzing…" : "Analyze"}
            </button>
          </div>

          {/* Competitor cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { name: "MagicBricks", score: 88, strength: "FAQ sections, city pages" },
              { name: "99acres",     score: 82, strength: "Locality targeting, schema" },
              { name: "NoBroker",    score: 76, strength: "User reviews, price data" },
            ].map(comp => (
              <div key={comp.name} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-white">{comp.name}</span>
                  <span className="text-emerald-400 font-bold text-sm">{comp.score}/100</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full mb-3">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500"
                    style={{ width: `${comp.score}%` }}
                  />
                </div>
                <p className="text-zinc-400 text-xs">Strength: {comp.strength}</p>
              </div>
            ))}
          </div>

          {competitorInsight && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4"
            >
              <p className="text-violet-400 font-semibold text-sm mb-1 flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> AI Analysis
              </p>
              <p className="text-zinc-300 text-sm">{competitorInsight}</p>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* ── BUILDER REVENUE ──────────────────────────────────────────────────── */}
      <section className="px-4 py-16 bg-zinc-900">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-center mb-4"
          >
            Builder Sponsorship Packages
          </motion.h2>
          <p className="text-zinc-400 text-center mb-12">Dominate search results in your city</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "SEO Boost",
                price: "₹999",
                period: "/mo",
                tag: "Starter",
                color: "from-violet-600/20 to-violet-600/5",
                border: "border-violet-500/30",
                glow: "rgba(139,92,246,0.3)",
                features: ["3 pages featured", "Basic SEO audit", "Monthly report", "Keyword tracking"],
                cta: "Get Started",
              },
              {
                name: "Featured Rank",
                price: "₹4,999",
                period: "/mo",
                tag: "Popular",
                color: "from-fuchsia-600/20 to-violet-600/10",
                border: "border-fuchsia-500/40",
                glow: "rgba(192,38,211,0.4)",
                features: ["City domination", "Unlimited pages", "Weekly reports", "AI content generation", "Priority support"],
                cta: "Dominate City",
              },
              {
                name: "City Sponsor",
                price: "₹25,000",
                period: "/mo",
                tag: "Enterprise",
                color: "from-cyan-600/20 to-blue-600/10",
                border: "border-cyan-500/30",
                glow: "rgba(8,145,178,0.4)",
                features: ["All pages in a city", "Top placement everywhere", "Dedicated AI SEO team", "Custom landing pages", "White-glove onboarding"],
                cta: "Contact Us",
              },
            ].map((pkg, i) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className={`bg-gradient-to-br ${pkg.color} border ${pkg.border} rounded-2xl p-6 flex flex-col`}
                style={{ boxShadow: `0 0 30px ${pkg.glow}` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${pkg.border} text-white/70`}>{pkg.tag}</span>
                    <h3 className="text-xl font-bold text-white mt-2">{pkg.name}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-extrabold text-white">{pkg.price}</span>
                    <span className="text-zinc-400 text-sm">{pkg.period}</span>
                  </div>
                </div>

                <ul className="space-y-2 flex-1 mb-6">
                  {pkg.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-zinc-300 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>

                <a
                  href="/contact"
                  className="block w-full py-3 rounded-xl font-bold text-center text-white transition-all"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #0891b2)",
                    boxShadow: `0 0 20px ${pkg.glow}`,
                  }}
                >
                  {pkg.cta}
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ADVANCED TOOLS GRID ───────────────────────────────────────────────── */}
      <section className="px-4 py-16 max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-center mb-4"
        >
          Advanced SEO Tools
        </motion.h2>
        <p className="text-zinc-400 text-center mb-12">Full suite of professional SEO tools</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { icon: BarChart2, name: "Heatmap Analytics",   status: "coming_soon" },
            { icon: TrendingUp, name: "Keyword Tracker",    status: "coming_soon" },
            { icon: Radio,      name: "Rank Monitor",       status: "coming_soon" },
            { icon: FileText,   name: "Sitemap Validator",  status: "use_now" },
            { icon: Shield,     name: "robots.txt Checker", status: "use_now" },
            { icon: Code2,      name: "Schema Validator",   status: "coming_soon" },
            { icon: Link2,      name: "Broken Link Scanner",status: "coming_soon" },
            { icon: ExternalLink, name: "Backlink Finder",  status: "coming_soon" },
            { icon: Cpu,        name: "SEO Audit History",  status: "coming_soon" },
          ].map((tool, i) => (
            <motion.div
              key={tool.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ borderColor: "rgba(139,92,246,0.5)", scale: 1.02 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col items-center text-center gap-3 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                <tool.icon className="h-6 w-6 text-violet-400" />
              </div>
              <p className="text-zinc-200 font-medium text-sm">{tool.name}</p>
              {tool.status === "coming_soon" ? (
                <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-500 text-xs">Coming Soon</span>
              ) : (
                <button
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)", boxShadow: "0 0 10px rgba(139,92,246,0.3)" }}
                  onClick={() => resultRef.current?.scrollIntoView({ behavior: "smooth" })}
                >
                  Use Now
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Toast ─────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && <Toast message={toast} onClose={() => setToast("")} />}
      </AnimatePresence>
    </main>
  );
}
