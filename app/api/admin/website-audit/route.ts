import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const maxDuration = 30;

export interface AuditResult {
  url: string;
  https: boolean;
  hsts: boolean;
  xframe: boolean;
  csp: boolean;
  h1: boolean;
  metaDesc: boolean;
  sitemap: boolean;
  robots: boolean;
  ttfbMs: number | null;
  issues: { level: "error" | "warning" | "info"; category: string; message: string }[];
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  const { url } = await req.json().catch(() => ({}));
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url_required" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(url.startsWith("http") ? url : `https://${url}`);
  } catch {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  const start = Date.now();
  let html = "";
  let headers: Record<string, string> = {};

  try {
    const res = await fetch(target.href, {
      headers: { "User-Agent": "Mozilla/5.0 AapKaPlot-Audit/1.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    html = await res.text();
    res.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
  } catch {
    return NextResponse.json({ error: "fetch_failed" }, { status: 502 });
  }

  const ttfbMs = Date.now() - start;

  // Security checks
  const https = target.protocol === "https:";
  const hsts = !!headers["strict-transport-security"];
  const xframe = !!headers["x-frame-options"] || (headers["content-security-policy"] ?? "").includes("frame-ancestors");
  const csp = !!headers["content-security-policy"];

  // SEO checks
  const h1 = /<h1[\s>]/i.test(html);
  const metaDesc = /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{10}/i.test(html) ||
                   /<meta[^>]+content=["'][^"']{10}[^>]+name=["']description["']/i.test(html);

  // Check sitemap
  let sitemap = false;
  try {
    const sitemapRes = await fetch(`${target.origin}/sitemap.xml`, {
      headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(5000),
    });
    sitemap = sitemapRes.ok && (sitemapRes.headers.get("content-type") ?? "").includes("xml");
  } catch { /* ignore */ }

  // Check robots.txt
  let robots = false;
  try {
    const robotsRes = await fetch(`${target.origin}/robots.txt`, {
      headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(5000),
    });
    robots = robotsRes.ok;
  } catch { /* ignore */ }

  // Build issues list
  const issues: AuditResult["issues"] = [];
  if (!https)    issues.push({ level: "error",   category: "Security",     message: "Site is not served over HTTPS" });
  if (!hsts)     issues.push({ level: "warning",  category: "Security",     message: "HSTS header missing — add Strict-Transport-Security" });
  if (!xframe)   issues.push({ level: "warning",  category: "Security",     message: "X-Frame-Options or frame-ancestors CSP missing" });
  if (!csp)      issues.push({ level: "warning",  category: "Security",     message: "Content-Security-Policy header not set" });
  if (!h1)       issues.push({ level: "error",    category: "SEO",          message: "No <h1> tag found on page" });
  if (!metaDesc) issues.push({ level: "warning",  category: "SEO",          message: "Meta description missing or too short" });
  if (!sitemap)  issues.push({ level: "warning",  category: "SEO",          message: "sitemap.xml not found at /sitemap.xml" });
  if (!robots)   issues.push({ level: "info",     category: "Crawlability", message: "robots.txt not found at /robots.txt" });
  if (ttfbMs > 800) issues.push({ level: "warning", category: "Performance", message: `Slow server response: ${ttfbMs}ms TTFB (target < 800ms)` });

  const result: AuditResult = { url: target.href, https, hsts, xframe, csp, h1, metaDesc, sitemap, robots, ttfbMs, issues };
  return NextResponse.json(result);
}
