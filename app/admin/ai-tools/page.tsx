import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { AiToolsPanel } from "./AiToolsPanel";
import { isOpenAIConfigured } from "@/lib/ai/openai";

export const dynamic = "force-dynamic";

export default function AdminAiToolsPage() {
  const configured = isOpenAIConfigured();

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <SectionHeader
        eyebrow="AI tools"
        title="AI Studio"
        subtitle="Generate emails, match grahaks (leads) to listings, and write marketing copy with OpenAI."
      />

      {!configured && (
        <div className="rounded-2xl bg-amber-50 ring-1 ring-amber-200 p-4 text-amber-800 text-sm">
          <p className="font-semibold">⚠ OpenAI key not configured</p>
          <p className="mt-1 text-amber-700">
            Add <code className="rounded bg-white px-1.5 py-0.5">OPENAI_API_KEY</code> to <code className="rounded bg-white px-1.5 py-0.5">.env.local</code> on the server, then run <code className="rounded bg-white px-1.5 py-0.5">pm2 restart aapkaplot --update-env</code>.
            Until then these tools return canned/templated drafts (still usable, just less smart).
          </p>
        </div>
      )}

      <AiToolsPanel />
    </div>
  );
}
