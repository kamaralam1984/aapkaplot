"use client";

import { useState } from "react";
import {
  Globe, Play, ShieldCheck, Search, AlertTriangle, CheckCircle2,
  Info, Loader2, Wifi, Lock, FileText, Map,
} from "lucide-react";
import type { AuditResult } from "@/app/api/admin/website-audit/route";

function ScoreRing({ score, label }: { score: number; label: string }) {
  const color = score >= 90 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  const r = 28, c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-16 w-16">
        <svg viewBox="0 0 72 72" className="h-16 w-16 -rotate-90">
          <circle cx="36" cy="36" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
          <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${dash} ${c}`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[15px] font-bold text-ink-900">{score}</span>
      </div>
      <span className="text-[11px] font-semibold text-ink-500">{label}</span>
    </div>
  );
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[12px] font-semibold ${ok ? "text-emerald-700" : "text-rose-600"}`}>
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
      {label}
    </span>
  );
}

function IssueRow({ issue }: { issue: AuditResult["issues"][number] }) {
  const styles = {
    error:   { bg: "bg-rose-50 border-rose-200",   text: "text-rose-700",   icon: <AlertTriangle className="h-4 w-4 text-rose-500" />,   badge: "bg-rose-100 text-rose-700" },
    warning: { bg: "bg-amber-50 border-amber-200",  text: "text-amber-800",  icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,  badge: "bg-amber-100 text-amber-700" },
    info:    { bg: "bg-sky-50 border-sky-200",      text: "text-sky-700",    icon: <Info className="h-4 w-4 text-sky-500" />,            badge: "bg-sky-100 text-sky-700" },
  };
  const s = styles[issue.level];
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-3 ${s.bg}`}>
      <div className="mt-0.5 shrink-0">{s.icon}</div>
      <div className="flex-1 min-w-0">
        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-1 ${s.badge}`}>{issue.level}</span>
        <p className={`text-[12.5px] font-semibold ${s.text}`}>{issue.message}</p>
        <p className="text-[11px] text-ink-500 mt-0.5">{issue.category}</p>
      </div>
    </div>
  );
}

export function WebsiteAudit() {
  const [url, setUrl] = useState("https://aapkaplot.com");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/website-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "audit_failed"); return; }
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Calculate scores
  const secScore = result ? Math.round(([result.https, result.hsts, result.xframe, result.csp].filter(Boolean).length / 4) * 100) : null;
  const seoScore = result ? Math.round(([result.h1, result.metaDesc, result.sitemap, result.robots].filter(Boolean).length / 4) * 100) : null;
  const perfScore = result?.ttfbMs != null ? (result.ttfbMs < 200 ? 100 : result.ttfbMs < 500 ? 80 : result.ttfbMs < 800 ? 60 : 40) : null;
  const overallScore = secScore != null && seoScore != null && perfScore != null
    ? Math.round((secScore * 0.35 + seoScore * 0.4 + perfScore * 0.25))
    : null;

  return (
    <div className="space-y-5">
      {/* URL Input */}
      <div className="surface-card p-5">
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-ink-500 flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5" /> Audit Any Website
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 rounded-xl border border-ink-200 px-4 py-2.5 text-[14px] focus:border-brand-500 focus:outline-none"
          />
          <button
            onClick={run}
            disabled={loading || !url}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-[13px] font-bold text-white hover:bg-violet-700 disabled:opacity-50 transition"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {loading ? "Auditing…" : "Run Audit"}
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-ink-400">Checks HTTPS, headers, SEO tags, sitemap, robots.txt and server response time.</p>
        {error && <p className="mt-2 text-[12px] text-rose-700 font-semibold">Error: {error}</p>}
      </div>

      {result && (
        <>
          {/* Overall Score */}
          <div className="surface-card p-5">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Overall Score</p>
                <p className={`text-5xl font-black mt-1 ${overallScore! >= 90 ? "text-emerald-600" : overallScore! >= 60 ? "text-amber-600" : "text-rose-600"}`}>
                  {overallScore}
                </p>
                <p className="text-[11px] text-ink-400 mt-0.5">/100 · {result.url}</p>
                {result.issues.length > 0 && (
                  <p className="text-[11.5px] text-amber-700 mt-1 font-semibold">⚠ {result.issues.length} issue{result.issues.length > 1 ? "s" : ""} found</p>
                )}
              </div>
              <div className="flex flex-wrap gap-6">
                {perfScore != null && <ScoreRing score={perfScore} label="Performance" />}
                {seoScore != null && <ScoreRing score={seoScore} label="SEO" />}
                {secScore != null && <ScoreRing score={secScore} label="Security" />}
              </div>
            </div>
          </div>

          {/* SEO + Security checks */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="surface-card p-5">
              <p className="mb-3 flex items-center gap-1.5 text-[12px] font-bold text-ink-700">
                <Search className="h-4 w-4 text-violet-500" /> SEO Checks
              </p>
              <div className="space-y-2">
                <Check ok={result.https}    label="HTTPS" />
                <Check ok={result.h1}       label="H1 tag" />
                <Check ok={result.metaDesc} label="Meta description" />
                <Check ok={result.sitemap}  label="Sitemap" />
                <Check ok={result.robots}   label="Robots.txt" />
              </div>
            </div>
            <div className="surface-card p-5">
              <p className="mb-3 flex items-center gap-1.5 text-[12px] font-bold text-ink-700">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Security Headers
              </p>
              <div className="space-y-2">
                <Check ok={result.https}  label="HTTPS" />
                <Check ok={result.hsts}   label="HSTS" />
                <Check ok={result.xframe} label="X-Frame-Options / frame-ancestors" />
                <Check ok={result.csp}    label="Content-Security-Policy" />
              </div>
            </div>
          </div>

          {/* Server Response */}
          <div className="surface-card p-5">
            <p className="mb-3 flex items-center gap-1.5 text-[12px] font-bold text-ink-700">
              <Wifi className="h-4 w-4 text-sky-500" /> Server Response
            </p>
            <div className="flex flex-wrap gap-6 text-[13px]">
              <div>
                <span className="text-ink-500">TTFB</span>
                <span className={`ml-2 font-bold tabular-nums ${(result.ttfbMs ?? 0) < 500 ? "text-emerald-700" : (result.ttfbMs ?? 0) < 800 ? "text-amber-700" : "text-rose-700"}`}>
                  {result.ttfbMs}ms
                </span>
              </div>
              <div>
                <span className="text-ink-500">Protocol</span>
                <span className="ml-2 font-bold text-ink-800">{result.https ? "HTTPS" : "HTTP"}</span>
              </div>
            </div>
          </div>

          {/* Issues & Fixes */}
          {result.issues.length > 0 && (
            <div className="surface-card p-5">
              <p className="mb-3 flex items-center gap-1.5 text-[12px] font-bold text-ink-700">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Issues & Fixes ({result.issues.length})
              </p>
              <div className="space-y-2">
                {result.issues.map((issue, i) => <IssueRow key={i} issue={issue} />)}
              </div>
            </div>
          )}

          {result.issues.length === 0 && (
            <div className="surface-card flex items-center gap-3 p-5">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 shrink-0" />
              <div>
                <p className="text-[14px] font-bold text-emerald-800">All checks passed!</p>
                <p className="text-[12px] text-ink-500">No issues found for {result.url}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
