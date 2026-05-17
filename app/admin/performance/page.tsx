import { prisma } from "@/server/db";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { ScanButton } from "./ScanButton";

export const dynamic = "force-dynamic";

function tone(score: number | null | undefined): string {
  if (score === null || score === undefined) return "bg-ink-50 text-ink-500 border-ink-200";
  if (score >= 90) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (score >= 50) return "bg-amber-50 text-amber-800 border-amber-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
}

function relative(d: Date) {
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function ScoreCard({
  label, score, suffix,
}: { label: string; score: number | null; suffix?: string }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${tone(score)}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wider">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">
        {score === null ? "—" : `${score}${suffix ?? ""}`}
      </div>
    </div>
  );
}

export default async function PerformancePage() {
  if (process.env.USE_DB !== "1") {
    return (
      <div className="space-y-6">
        <SectionHeader eyebrow="Quality" title="Performance audit" subtitle="DB-off mode" />
        <div className="surface-card p-6 text-[13.5px] text-rose-700">
          DB is disabled (USE_DB ≠ 1).
        </div>
      </div>
    );
  }

  const [latestMobile, latestDesktop, history] = await Promise.all([
    prisma.performanceScan.findFirst({
      where: { strategy: "mobile" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.performanceScan.findFirst({
      where: { strategy: "desktop" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.performanceScan.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true, strategy: true, performance: true, accessibility: true,
        bestPractices: true, seo: true, lcpMs: true, clsX1000: true, createdAt: true,
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <SectionHeader
          eyebrow="Quality"
          title="Performance audit"
          subtitle="Google PageSpeed Insights — desktop + mobile scores."
        />
        <ScanButton />
      </div>

      {!latestMobile && !latestDesktop && (
        <div className="surface-card p-6 text-[13.5px] text-ink-600">
          No scans yet. Click <b>Run audit</b> above — it usually takes 30–60 seconds for
          each strategy. Results are cached so you don&apos;t have to rerun.
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        {(["mobile", "desktop"] as const).map((s) => {
          const r = s === "mobile" ? latestMobile : latestDesktop;
          return (
            <div key={s} className="surface-card overflow-hidden">
              <header className="flex items-center justify-between border-b border-ink-200/70 px-5 py-3.5">
                <h3 className="text-[14px] font-bold capitalize text-ink-900">{s}</h3>
                <span className="text-[11.5px] text-ink-500">
                  {r ? `Last scan ${relative(r.createdAt)}` : "no scan yet"}
                </span>
              </header>
              {!r ? (
                <div className="px-5 py-8 text-center text-[13px] text-ink-500">No data.</div>
              ) : (
                <div className="space-y-4 p-5">
                  <div className="grid grid-cols-2 gap-2">
                    <ScoreCard label="Performance" score={r.performance ?? null} />
                    <ScoreCard label="Accessibility" score={r.accessibility ?? null} />
                    <ScoreCard label="Best practices" score={r.bestPractices ?? null} />
                    <ScoreCard label="SEO" score={r.seo ?? null} />
                  </div>
                  <div className="rounded-xl border border-ink-200 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                      Core Web Vitals
                    </div>
                    <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[12.5px]">
                      <dt className="text-ink-500">LCP</dt>
                      <dd className="text-right tabular-nums text-ink-800">
                        {r.lcpMs ? `${(r.lcpMs / 1000).toFixed(2)} s` : "—"}
                      </dd>
                      <dt className="text-ink-500">CLS</dt>
                      <dd className="text-right tabular-nums text-ink-800">
                        {r.clsX1000 !== null ? (r.clsX1000 / 1000).toFixed(3) : "—"}
                      </dd>
                      <dt className="text-ink-500">INP</dt>
                      <dd className="text-right tabular-nums text-ink-800">
                        {r.inpMs ? `${r.inpMs} ms` : "—"}
                      </dd>
                      <dt className="text-ink-500">TTFB</dt>
                      <dd className="text-right tabular-nums text-ink-800">
                        {r.ttfbMs ? `${r.ttfbMs} ms` : "—"}
                      </dd>
                      <dt className="text-ink-500">FCP</dt>
                      <dd className="text-right tabular-nums text-ink-800">
                        {r.fcpMs ? `${(r.fcpMs / 1000).toFixed(2)} s` : "—"}
                      </dd>
                    </dl>
                  </div>
                  <div className="text-[11px] text-ink-400">URL: {r.url}</div>
                </div>
              )}
            </div>
          );
        })}
      </section>

      <section className="surface-card overflow-hidden">
        <header className="border-b border-ink-200/70 px-5 py-3.5">
          <h3 className="text-[14px] font-bold text-ink-900">Scan history (last 20)</h3>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="bg-ink-50/60 text-[11px] uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-2">When</th>
                <th className="px-4 py-2">Strategy</th>
                <th className="px-4 py-2 text-right">Perf</th>
                <th className="px-4 py-2 text-right">A11y</th>
                <th className="px-4 py-2 text-right">BP</th>
                <th className="px-4 py-2 text-right">SEO</th>
                <th className="px-4 py-2 text-right">LCP</th>
                <th className="px-4 py-2 text-right">CLS</th>
              </tr>
            </thead>
            <tbody className="text-[12.5px]">
              {history.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-ink-500">No history yet.</td>
                </tr>
              )}
              {history.map((h) => (
                <tr key={h.id} className="border-t border-ink-200/60">
                  <td className="px-4 py-2 text-ink-600">{relative(h.createdAt)}</td>
                  <td className="px-4 py-2 capitalize">{h.strategy}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{h.performance ?? "—"}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{h.accessibility ?? "—"}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{h.bestPractices ?? "—"}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{h.seo ?? "—"}</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {h.lcpMs ? `${(h.lcpMs / 1000).toFixed(1)}s` : "—"}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {h.clsX1000 !== null ? (h.clsX1000 / 1000).toFixed(3) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
