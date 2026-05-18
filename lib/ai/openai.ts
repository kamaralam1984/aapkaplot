/**
 * Shared OpenAI helper for AapKaPlot AI features.
 *
 * Per [[free-apis-only]] memory: OpenAI is authorized (2026-05-19) for
 *   • User-facing chat (FloatingChatBot)
 *   • AI grahak/lead matching
 *   • Email drafting
 *   • Marketing copy
 * SEO composer stays free (Wikipedia + OSM only) — DO NOT call this from
 * lib/seo/* .
 *
 * Default model: gpt-4o-mini (cheap, fast, plenty smart for these tasks).
 * Override per call or via OPENAI_MODEL env var.
 */

export const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CompleteOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;     // 0..2, default 0.7
  maxTokens?: number;       // default 600 (~$0.0001 per call on gpt-4o-mini)
  responseFormat?: "text" | "json";
}

export interface CompleteResult {
  ok: boolean;
  text: string;
  source: "openai" | "fallback";
  model?: string;
  reason?: string;          // populated on fallback
  usage?: { prompt: number; completion: number };
}

export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Single-shot chat completion. Returns text + provenance.
 * If OPENAI_API_KEY is absent, returns { ok: false, source: "fallback" }
 * so callers can decide between a canned response and a hard error.
 */
export async function complete(opts: CompleteOptions): Promise<CompleteResult> {
  if (!isOpenAIConfigured()) {
    return {
      ok: false,
      text: "",
      source: "fallback",
      reason: "OPENAI_API_KEY not set — using canned fallback.",
    };
  }
  const model = opts.model ?? DEFAULT_MODEL;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: opts.messages,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens ?? 600,
        ...(opts.responseFormat === "json" ? { response_format: { type: "json_object" } } : {}),
      }),
      // OpenAI can be slow on cold paths; 60s is generous.
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return {
        ok: false,
        text: "",
        source: "fallback",
        reason: `OpenAI ${res.status}: ${errText.slice(0, 160)}`,
      };
    }
    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content?.trim() ?? "";
    return {
      ok: text.length > 0,
      text,
      source: "openai",
      model,
      usage: data?.usage
        ? { prompt: data.usage.prompt_tokens ?? 0, completion: data.usage.completion_tokens ?? 0 }
        : undefined,
    };
  } catch (err) {
    return {
      ok: false,
      text: "",
      source: "fallback",
      reason: (err as Error).message ?? "network error",
    };
  }
}

/** Convenience helper for one-shot prompts. */
export async function complete1(prompt: string, system?: string, maxTokens = 600): Promise<CompleteResult> {
  const messages: ChatMessage[] = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: prompt });
  return complete({ messages, maxTokens });
}
