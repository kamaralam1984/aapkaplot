import { NextResponse } from "next/server";
import { z } from "zod";
import { importOptional } from "@/lib/optional-import";

const Body = z.object({
  kind: z.enum(["plot", "flat", "house", "villa", "shop", "office", "warehouse", "agriculture"]),
  intent: z.enum(["buy", "rent"]).default("buy"),
  title: z.string().min(2).max(120),
  locality: z.string().min(2).max(80),
  city: z.string().min(2).max(80),
  state: z.string().optional(),
  bhk: z.number().int().min(0).max(10).optional(),
  areaSqft: z.number().int().min(50).max(50_000).optional(),
  amenities: z.array(z.string()).max(20).optional(),
  furnishing: z.enum(["unfurnished", "semi", "full"]).optional(),
  priceInr: z.number().int().min(1000).max(1_000_000_000).optional(),
});

type Input = z.infer<typeof Body>;

// Cache-friendly: identical input → identical output.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // 1) Cloudflare Workers AI (free, 100k req/day) — preferred when configured.
  if (process.env.CF_ACCOUNT_ID && process.env.CF_API_TOKEN) {
    try {
      const text = await generateViaWorkersAi(parsed.data);
      return NextResponse.json({ ok: true, source: "workers-ai", description: text });
    } catch (err) {
      console.warn("[ai/describe] workers-ai failed, falling back:", (err as Error).message);
    }
  }

  // 2) Anthropic Claude — paid, opt-in only when ANTHROPIC_API_KEY is set.
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const text = await generateViaClaude(parsed.data);
      return NextResponse.json({ ok: true, source: "claude", description: text });
    } catch (err) {
      console.warn("[ai/describe] claude failed, falling back:", (err as Error).message);
    }
  }

  // 3) Deterministic fallback — uses the same 8-template bank as listings.
  const text = templateDescription(parsed.data);
  return NextResponse.json({ ok: true, source: "template", description: text });
}

async function generateViaWorkersAi(input: Input): Promise<string> {
  const account = process.env.CF_ACCOUNT_ID!;
  const token = process.env.CF_API_TOKEN!;
  const model = process.env.CF_AI_MODEL ?? "@cf/meta/llama-3.1-8b-instruct";
  const url = `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        {
          role: "system",
          content:
            "You are a luxury Indian real-estate copywriter. Write listing descriptions that are vivid, factual, ~80 words, no emojis, no marketing fluff, second-person voice.",
        },
        { role: "user", content: buildPrompt(input) },
      ],
      max_tokens: 400,
    }),
  });
  if (!res.ok) throw new Error(`workers_ai_status_${res.status}`);
  const data = (await res.json()) as { result?: { response?: string } };
  const text = data.result?.response?.trim();
  if (!text) throw new Error("workers_ai_empty");
  return text;
}

/* ---------- Claude integration (dynamic import so the SDK is optional) ---------- */

async function generateViaClaude(input: Input): Promise<string> {
  const mod = await importOptional<any>("@anthropic-ai/sdk");
  if (!mod) throw new Error("anthropic_sdk_unavailable");
  const Anthropic = (mod.default ?? mod.Anthropic) as any;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = buildPrompt(input);
  // System prompt is identical across every call → mark cache_control so the
  // SDK reuses it from Anthropic's prompt cache (90% cost saving on cache hit,
  // 5-minute TTL). Massively cheaper for high-volume listing generation.
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 380,
    system: [
      {
        type: "text",
        text:
          "You are a luxury Indian real-estate copywriter. Write listing descriptions that " +
          "are vivid, factual, ~80 words, no emojis, no marketing fluff, second-person voice. " +
          "Mention 1-2 nearby conveniences (metro / school / market) when relevant. Avoid " +
          "clichés like 'dream home' or 'paradise'.",
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content?.find((c: any) => c.type === "text");
  const text = block?.text?.trim() ?? "";
  if (!text) throw new Error("claude_empty_response");
  return text;
}

function buildPrompt(p: Input): string {
  const lines = [
    `Write a property listing description for AapKaPlot.`,
    `Title: ${p.title}`,
    `Kind: ${p.kind} (${p.intent})`,
    `Location: ${p.locality}, ${p.city}${p.state ? ", " + p.state : ""}`,
  ];
  if (p.bhk) lines.push(`BHK: ${p.bhk}`);
  if (p.areaSqft) lines.push(`Carpet area: ${p.areaSqft} sqft`);
  if (p.furnishing) lines.push(`Furnishing: ${p.furnishing}`);
  if (p.amenities?.length) lines.push(`Amenities: ${p.amenities.join(", ")}`);
  if (p.priceInr) lines.push(`Asking price: ₹${p.priceInr.toLocaleString("en-IN")}`);
  lines.push(
    "",
    "Constraints:",
    "- 70–95 words",
    "- One paragraph",
    "- Avoid clichés like 'dream home' or 'paradise'",
    "- Mention 1-2 nearby conveniences if possible",
    "- Indian English"
  );
  return lines.join("\n");
}

/* ---------- Template fallback ---------- */

const TEMPLATES: ((p: Input) => string)[] = [
  (p) =>
    `Welcome to this ${describeKind(p)} in ${p.locality}, ${p.city}. ${areaLine(p)} ` +
    `${amenitiesLine(p)} Connectivity to schools, hospitals and the metro is within easy reach, ` +
    `making it a balanced pick for both end-users and long-term investors.`,
  (p) =>
    `Set in one of ${p.city}'s most sought-after addresses, this ${describeKind(p)} blends ` +
    `${furnishingLine(p)} with thoughtful design. ${areaLine(p)} Walk to cafés, ` +
    `green space and daily essentials. ${amenitiesLine(p)}`,
  (p) =>
    `Move-in ready ${describeKind(p)} in ${p.locality}. ${areaLine(p)} ` +
    `${amenitiesLine(p)} Quiet street with secure gated access — strong rental yield in this ` +
    `${p.city} micro-market over the last three years.`,
  (p) =>
    `Smart-priced ${describeKind(p)} with sunlit rooms and tasteful finishes. ${areaLine(p)} ` +
    `Located in ${p.locality} — fast becoming one of ${p.city}'s standout corridors. ` +
    `${amenitiesLine(p)}`,
];

function templateDescription(p: Input): string {
  const idx = Math.abs(hash(p.title + p.locality + p.kind)) % TEMPLATES.length;
  return TEMPLATES[idx](p);
}

function describeKind(p: Input): string {
  if (p.kind === "flat" && p.bhk) return `${p.bhk} BHK flat`;
  if (p.kind === "house" && p.bhk) return `${p.bhk} BHK independent house`;
  if (p.kind === "villa" && p.bhk) return `${p.bhk} BHK villa`;
  if (p.kind === "plot") return "residential plot";
  if (p.kind === "shop") return "commercial shop";
  if (p.kind === "office") return "office space";
  if (p.kind === "warehouse") return "warehouse unit";
  if (p.kind === "agriculture") return "agricultural plot";
  return p.kind;
}

function areaLine(p: Input): string {
  if (!p.areaSqft) return "";
  return `Spread across ${p.areaSqft.toLocaleString("en-IN")} sqft of carpet area, ` +
    `the layout has been optimised for cross ventilation and privacy.`;
}

function furnishingLine(p: Input): string {
  if (p.furnishing === "full") return "fully-furnished interiors";
  if (p.furnishing === "semi") return "semi-furnished comforts";
  return "ready-to-customise interiors";
}

function amenitiesLine(p: Input): string {
  const a = p.amenities ?? [];
  if (a.length === 0) return "Secure access and reliable utilities round out the offering.";
  const top = a.slice(0, 4).join(", ");
  return `Highlights include ${top}.`;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}
