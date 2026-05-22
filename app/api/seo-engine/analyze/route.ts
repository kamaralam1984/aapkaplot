import { NextResponse } from "next/server";

export const runtime = "nodejs";

async function callGroq(prompt: string): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return "";
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  } catch {
    return "";
  }
}

export async function GET(req: Request) {
  const rawUrl = new URL(req.url).searchParams.get("url");
  if (!rawUrl) {
    return NextResponse.json({ error: "url_required" }, { status: 400 });
  }

  // Normalize URL
  let targetUrl: URL;
  try {
    targetUrl = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
  } catch {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  const origin = targetUrl.origin;

  // ── 1. Fetch the target page ─────────────────────────────────────────────
  let html = "";
  let pageFetchOk = false;
  try {
    const pageRes = await fetch(targetUrl.toString(), {
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "AapKaPlot-SEO-Bot/1.0" },
    });
    html = await pageRes.text();
    pageFetchOk = pageRes.ok;
  } catch {
    // graceful fallback
  }

  // ── 2. Extract meta tags from HTML ───────────────────────────────────────
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch?.[1]?.trim() ?? "";

  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  const description = descMatch?.[1]?.trim() ?? "";

  const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  const ogTitle = ogTitleMatch?.[1]?.trim() ?? "";

  const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
  const ogDesc = ogDescMatch?.[1]?.trim() ?? "";

  const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  const canonical = canonicalMatch?.[1]?.trim() ?? "";

  const h1Count = (html.match(/<h1[\s>]/gi) ?? []).length;
  const h2Count = (html.match(/<h2[\s>]/gi) ?? []).length;
  const hasSchema = html.includes('"@context"') || html.includes("application/ld+json");
  const hasOG = !!ogTitle || !!ogDesc;
  const hasCanonical = !!canonical;
  const hasTitle = !!title;
  const hasDescription = !!description;
  const hasH1 = h1Count > 0;

  // ── 3. Check robots.txt ──────────────────────────────────────────────────
  let robotsOk = false;
  let robotsContent = "";
  try {
    const rRes = await fetch(`${origin}/robots.txt`, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "AapKaPlot-SEO-Bot/1.0" },
    });
    if (rRes.ok) {
      robotsContent = await rRes.text();
      robotsOk = true;
    }
  } catch {
    // ignore
  }
  const robotsBlocksAll = robotsContent.toLowerCase().includes("disallow: /");

  // ── 4. Check sitemap.xml ─────────────────────────────────────────────────
  let hasSitemap = false;
  let sitemapUrl = `${origin}/sitemap.xml`;
  try {
    const sRes = await fetch(sitemapUrl, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "AapKaPlot-SEO-Bot/1.0" },
    });
    hasSitemap = sRes.ok;
  } catch {
    // check robots for sitemap directive
    const sitemapLine = robotsContent.match(/Sitemap:\s*(\S+)/i);
    if (sitemapLine) {
      sitemapUrl = sitemapLine[1];
      hasSitemap = true;
    }
  }

  // ── 5. Score calculation ─────────────────────────────────────────────────
  let score = 0;
  if (hasTitle) score += 20;
  if (hasDescription) score += 15;
  if (hasOG) score += 10;
  if (hasCanonical) score += 10;
  if (hasSitemap) score += 15;
  if (robotsOk && !robotsBlocksAll) score += 10;
  if (hasH1) score += 10;
  if (hasSchema) score += 10;

  const subScores = {
    technicalSeo: Math.min(100, Math.round((+robotsOk * 30) + (+hasSitemap * 40) + (+hasCanonical * 30))),
    contentQuality: Math.min(100, Math.round((+hasTitle * 30) + (+hasDescription * 30) + (+hasH1 * 20) + (h2Count > 0 ? 20 : 0))),
    mobileOptimization: html.includes("viewport") ? 85 : 40,
    speed: pageFetchOk ? 70 : 30,
    indexability: robotsOk && !robotsBlocksAll ? (hasSitemap ? 95 : 70) : 20,
    metaTags: Math.min(100, (+hasTitle * 35) + (+hasDescription * 35) + (+hasOG * 30)),
    schema: hasSchema ? 90 : 20,
    aiScore: 0, // filled below
  };

  // ── 6. Build issues ──────────────────────────────────────────────────────
  const issues: { severity: "critical" | "warning" | "info"; description: string; fix: string }[] = [];

  if (!hasTitle)       issues.push({ severity: "critical", description: "Page is missing a <title> tag — search engines cannot index it properly.", fix: "Add a unique, descriptive <title> tag between 50–60 characters." });
  if (!hasDescription) issues.push({ severity: "critical", description: "No meta description found — click-through rate will suffer.", fix: "Add a <meta name=\"description\"> tag with a compelling 150–160 char summary." });
  if (!hasH1)          issues.push({ severity: "critical", description: "No H1 heading detected on this page.", fix: "Add exactly one <h1> tag with the primary keyword for this page." });
  if (!hasOG)          issues.push({ severity: "warning",  description: "Open Graph tags missing — social shares will show blank previews.", fix: "Add og:title, og:description, og:image, og:url meta tags." });
  if (!hasCanonical)   issues.push({ severity: "warning",  description: "No canonical URL tag found — may cause duplicate content issues.", fix: "Add <link rel=\"canonical\" href=\"https://yourdomain.com/page\"> to the <head>." });
  if (!hasSitemap)     issues.push({ severity: "warning",  description: "No sitemap.xml found — crawlers may miss important pages.", fix: "Generate and submit a sitemap.xml to Google Search Console." });
  if (!robotsOk)       issues.push({ severity: "warning",  description: "robots.txt is missing or inaccessible.", fix: "Create a robots.txt at the root domain allowing search bot crawling." });
  if (robotsBlocksAll) issues.push({ severity: "critical", description: "robots.txt appears to block all crawlers with 'Disallow: /'.", fix: "Review robots.txt — ensure Googlebot is not blocked." });
  if (!hasSchema)      issues.push({ severity: "info",     description: "No structured data (Schema.org) detected.", fix: "Add JSON-LD schema markup for RealEstateListing or Organization." });
  if (h1Count > 1)     issues.push({ severity: "info",     description: `Multiple H1 tags detected (${h1Count}). Use only one H1 per page.`, fix: "Reduce H1 tags to exactly one. Use H2/H3 for section headings." });
  if (!html.includes("viewport")) issues.push({ severity: "warning", description: "Viewport meta tag missing — page may not be mobile-friendly.", fix: "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">." });

  // ── 7. Groq AI analysis ──────────────────────────────────────────────────
  let aiScore = 50;
  let insights: string[] = [];
  let rankProbability = Math.round(score * 0.8);

  const groqPrompt = `You are an SEO expert. Given this website data: title='${title.slice(0, 120)}', description='${description.slice(0, 200)}', h1Count=${h1Count}, hasSchema=${hasSchema}, hasSitemap=${hasSitemap}, hasOG=${hasOG}, seoScore=${score}. Return ONLY valid JSON with no markdown: { "aiScore": number_0_to_100, "insights": ["insight1", "insight2"], "rankProbability": number_0_to_100 }`;

  const groqRaw = await callGroq(groqPrompt);
  if (groqRaw) {
    try {
      const jsonMatch = groqRaw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (typeof parsed.aiScore === "number") aiScore = Math.min(100, Math.max(0, parsed.aiScore));
        if (Array.isArray(parsed.insights)) insights = parsed.insights.slice(0, 3);
        if (typeof parsed.rankProbability === "number") rankProbability = Math.min(100, Math.max(0, parsed.rankProbability));
      }
    } catch {
      // keep defaults
    }
  }

  subScores.aiScore = aiScore;

  return NextResponse.json({
    score,
    subScores,
    issues,
    meta: { title, description, ogTitle, ogDesc, canonical, h1Count, h2Count, hasSchema },
    robots: { ok: robotsOk, blocksAll: robotsBlocksAll, url: `${origin}/robots.txt` },
    sitemap: { found: hasSitemap, url: sitemapUrl },
    aiInsights: insights,
    rankProbability,
    url: targetUrl.toString(),
    fetchedOk: pageFetchOk,
  });
}
