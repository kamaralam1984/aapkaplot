import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { isAdminRole } from "@/lib/session";
import { prisma } from "@/server/db";

async function adminGuard() {
  const session = await getSession();
  if (!session) return { session: null, err: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }) };
  if (!isAdminRole(session.role)) return { session: null, err: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { session, err: null };
}

async function callGroq(prompt: string, fallback: unknown): Promise<unknown> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 4096,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return fallback;
    const data = await res.json();
    const text: string = data.choices?.[0]?.message?.content ?? "";
    // Strip markdown code fences if present
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return fallback;
  }
}

async function scoreProspect(p: {
  businessName: string;
  businessType: string;
  city: string;
  listingCount: number;
  estimatedBudget: number;
  websiteUrl: string | null;
}): Promise<{ score: number; label: "cold" | "warm" | "hot"; reason: string }> {
  const prompt = `Score this real estate business prospect's likelihood to subscribe to AapKaPlot (Indian property platform, ₹999-₹25000/month plans).
Business: ${p.businessName}, Type: ${p.businessType}, City: ${p.city}, Listings: ${p.listingCount}, Budget: ₹${p.estimatedBudget}/mo, Has website: ${!!p.websiteUrl}
Return JSON only: { "score": number 0-100, "label": "cold"|"warm"|"hot", "reason": "string (1 sentence)" }`;

  const result = await callGroq(prompt, { score: 40, label: "cold", reason: "Could not score at this time." });
  const r = result as { score?: number; label?: string; reason?: string };
  const score = Math.min(100, Math.max(0, Number(r?.score ?? 40)));
  const label = (["cold", "warm", "hot"].includes(r?.label ?? "") ? r.label : score >= 80 ? "hot" : score >= 50 ? "warm" : "cold") as "cold" | "warm" | "hot";
  const reason = r?.reason ?? "AI scoring unavailable.";
  return { score, label, reason };
}

export async function POST(req: NextRequest) {
  const { err } = await adminGuard();
  if (err) return err;

  const body = await req.json().catch(() => null);
  const { city, businessType, count = 10 } = body ?? {};

  if (!city || !businessType) {
    return NextResponse.json({ error: "city and businessType are required" }, { status: 400 });
  }

  const safeCount = Math.min(20, Math.max(1, Number(count)));

  const prompt = `You are a business researcher for AapKaPlot, an Indian real estate platform. Generate ${safeCount} realistic Indian real estate prospects in ${city} who might benefit from listing their properties on AapKaPlot.

Return ONLY a JSON array (no markdown, no explanation):
[{
  "businessName": "string (realistic Indian builder/agent name)",
  "ownerName": "string (Indian name)",
  "email": "string (realistic business email — use gmail/company domain)",
  "phone": "string (10-digit Indian mobile)",
  "city": "${city}",
  "businessType": "${businessType}",
  "propertyTypes": ["plot"|"flat"|"house"|"commercial"],
  "websiteUrl": "string or null",
  "listingCount": number (5-200),
  "estimatedBudget": number (1000-50000)
}]`;

  if (process.env.USE_DB !== "1") {
    // Return mock data when DB is off
    const mock = Array.from({ length: safeCount }, (_, i) => ({
      id: `mock-${i}`,
      businessName: `${city} Properties ${i + 1}`,
      ownerName: "Demo Owner",
      email: `demo${i}@example.com`,
      city,
      businessType,
      propertyTypes: ["plot"],
      listingCount: 20,
      estimatedBudget: 5000,
      interestScore: 60,
      interestLabel: "warm",
      aiReason: "Mock data — DB disabled",
      status: "pending",
    }));
    return NextResponse.json({ added: safeCount, prospects: mock });
  }

  const raw = await callGroq(prompt, []);
  const prospects = Array.isArray(raw) ? raw : [];

  const saved = [];
  for (const p of prospects) {
    const email = String(p.email ?? "").toLowerCase().trim();
    if (!email || !email.includes("@")) continue;

    const { score, label, reason } = await scoreProspect({
      businessName: String(p.businessName ?? ""),
      businessType: String(p.businessType ?? businessType),
      city: String(p.city ?? city),
      listingCount: Number(p.listingCount ?? 0),
      estimatedBudget: Number(p.estimatedBudget ?? 0),
      websiteUrl: p.websiteUrl ?? null,
    });

    const data = {
      businessName: String(p.businessName ?? "Unknown"),
      ownerName: p.ownerName ? String(p.ownerName) : null,
      phone: p.phone ? String(p.phone) : null,
      city: String(p.city ?? city),
      businessType: String(p.businessType ?? businessType),
      propertyTypes: Array.isArray(p.propertyTypes) ? p.propertyTypes.map(String) : [],
      websiteUrl: p.websiteUrl ? String(p.websiteUrl) : null,
      listingCount: Number(p.listingCount ?? 0),
      estimatedBudget: Number(p.estimatedBudget ?? 0),
      interestScore: score,
      interestLabel: label,
      aiReason: reason,
    };

    try {
      const prospect = await prisma.outreachProspect.upsert({
        where: { email },
        update: { ...data, updatedAt: new Date() },
        create: { email, ...data },
      });
      saved.push(prospect);
    } catch {
      // Skip duplicates or invalid entries
    }
  }

  return NextResponse.json({ added: saved.length, prospects: saved });
}
