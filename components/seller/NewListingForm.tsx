"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Check, Building, MapPin, Image as ImageIcon, IndianRupee, CheckCircle2,
  X, Upload, Camera, Loader2, Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { AmenityId, PropertyKind } from "@/lib/types";
import { AMENITIES_CATALOG } from "@/lib/property-detail";
import { useToast } from "@/components/ui/Toast";

type Step = 0 | 1 | 2 | 3 | 4;

const STEPS = [
  { id: 0, label: "Property",  icon: Building },
  { id: 1, label: "Location",  icon: MapPin },
  { id: 2, label: "Photos",    icon: ImageIcon },
  { id: 3, label: "Price",     icon: IndianRupee },
  { id: 4, label: "Review",    icon: CheckCircle2 },
] as const;

const KINDS: { id: PropertyKind; label: string }[] = [
  { id: "plot",        label: "Plot" },
  { id: "flat",        label: "Flat" },
  { id: "house",       label: "House" },
  { id: "villa",       label: "Villa" },
  { id: "shop",        label: "Shop" },
  { id: "office",      label: "Office" },
  { id: "warehouse",   label: "Warehouse" },
  { id: "agriculture", label: "Agriculture" },
];

interface ListingDraft {
  intent: "buy" | "rent";
  kind?: PropertyKind;
  title: string;
  bhk?: number;
  areaSqft?: number;
  furnishing?: "Unfurnished" | "Semi-furnished" | "Furnished";
  description: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  amenities: AmenityId[];
  photos: { name: string; url: string }[];
  priceInr?: number;
  negotiable: boolean;
}

const EMPTY: ListingDraft = {
  intent: "buy",
  kind: undefined,
  title: "",
  description: "",
  locality: "",
  city: "",
  state: "",
  pincode: "",
  amenities: [],
  photos: [],
  negotiable: true,
};

export function NewListingForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [draft, setDraft] = useState<ListingDraft>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const update = <K extends keyof ListingDraft>(key: K, value: ListingDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const canNext: Record<Step, boolean> = {
    0: !!draft.kind && draft.title.trim().length >= 6,
    1: !!draft.locality && !!draft.city && !!draft.state,
    2: draft.photos.length >= 1,
    3: typeof draft.priceInr === "number" && draft.priceInr > 0,
    4: true,
  };

  const next = () => setStep((s) => Math.min(4, s + 1) as Step);
  const back = () => setStep((s) => Math.max(0, s - 1) as Step);

  const submit = async () => {
    setSubmitting(true);
    // TODO: POST /api/property/create
    await new Promise((r) => setTimeout(r, 700));
    setSubmitting(false);
    setDone(true);
    setTimeout(() => router.push("/sell/listings"), 1100);
  };

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="surface-card grid place-items-center p-12 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-display-md font-display text-ink-900">Listing submitted!</h2>
        <p className="mt-2 max-w-sm text-[14px] text-ink-500">
          We're reviewing your property. You'll be notified within 24 hours once it goes live.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Stepper */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <ol className="surface-card flex gap-2 overflow-x-auto p-3 lg:flex-col">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const reached = i <= step;
            const active = i === step;
            const complete = i < step;
            return (
              <li key={s.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => i < step && setStep(i as Step)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[13.5px] transition",
                    active
                      ? "bg-brand-50 text-brand-700"
                      : reached
                      ? "text-ink-700 hover:bg-ink-100/60"
                      : "text-ink-400"
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  <span
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                      complete
                        ? "bg-brand-500 text-white"
                        : active
                        ? "bg-brand-500 text-white shadow-glow"
                        : "border border-ink-200 bg-white text-ink-500"
                    )}
                  >
                    {complete ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  </span>
                  <span className="font-semibold">{s.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </aside>

      <div className="surface-card overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25 }}
            className="p-6 lg:p-8"
          >
            {step === 0 && <PropertyStep draft={draft} update={update} />}
            {step === 1 && <LocationStep draft={draft} update={update} />}
            {step === 2 && <PhotosStep draft={draft} update={update} />}
            {step === 3 && <PriceStep draft={draft} update={update} />}
            {step === 4 && <ReviewStep draft={draft} />}
          </motion.div>
        </AnimatePresence>

        <footer className="flex items-center justify-between gap-2 border-t border-ink-200/70 bg-white/60 px-6 py-4 backdrop-blur-md lg:px-8">
          <Button variant="ghost" size="md" onClick={back} disabled={step === 0} iconLeft={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
          <div className="text-[12px] text-ink-500">Step {step + 1} of {STEPS.length}</div>
          {step < 4 ? (
            <Button variant="primary" size="md" onClick={next} disabled={!canNext[step]} iconRight={<ArrowRight className="h-4 w-4" />}>
              Continue
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={submit}
              disabled={submitting}
              iconRight={submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            >
              {submitting ? "Submitting..." : "Submit for review"}
            </Button>
          )}
        </footer>
      </div>
    </div>
  );
}

/* -------- step bodies -------- */

function PropertyStep({ draft, update }: { draft: ListingDraft; update: <K extends keyof ListingDraft>(k: K, v: ListingDraft[K]) => void }) {
  return (
    <div className="space-y-5">
      <h2 className="text-[16px] font-bold text-ink-900">About the property</h2>

      <div>
        <Label>I'm looking to</Label>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          {(["buy", "rent"] as const).map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => update("intent", i)}
              className={cn(
                "h-11 rounded-xl border text-[13.5px] font-semibold capitalize transition",
                draft.intent === i
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-ink-200 bg-white text-ink-700 hover:border-brand-500/40"
              )}
            >
              List for {i === "buy" ? "sale" : "rent"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Property type</Label>
        <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => update("kind", k.id)}
              className={cn(
                "h-11 rounded-xl border text-[13.5px] font-semibold transition",
                draft.kind === k.id
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-ink-200 bg-white text-ink-700 hover:border-brand-500/40"
              )}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>

      <Field label="Listing title">
        <input
          type="text"
          value={draft.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="e.g. Spacious 2BHK Flat in New Town"
          className="input"
        />
      </Field>

      {(draft.kind === "flat" || draft.kind === "house" || draft.kind === "villa") && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="BHK">
            <input type="number" min={1} max={10} value={draft.bhk ?? ""} onChange={(e) => update("bhk", Number(e.target.value) || undefined)} className="input" placeholder="2" />
          </Field>
          <Field label="Carpet area (sqft)">
            <input type="number" min={50} value={draft.areaSqft ?? ""} onChange={(e) => update("areaSqft", Number(e.target.value) || undefined)} className="input" placeholder="850" />
          </Field>
          <Field label="Furnishing">
            <select value={draft.furnishing ?? ""} onChange={(e) => update("furnishing", (e.target.value || undefined) as ListingDraft["furnishing"])} className="input">
              <option value="">Select…</option>
              <option>Unfurnished</option>
              <option>Semi-furnished</option>
              <option>Furnished</option>
            </select>
          </Field>
        </div>
      )}

      <Field
        label="Description (optional)"
        helper="Tell buyers what makes this place special — or let AI draft it for you."
      >
        <div className="relative">
          <textarea
            value={draft.description}
            onChange={(e) => update("description", e.target.value)}
            rows={4}
            placeholder="Sun-drenched balcony, quiet street, close to metro…"
            className="input min-h-[110px] resize-none pr-3"
          />
          <AiDescribeButton draft={draft} onResult={(text) => update("description", text)} />
        </div>
      </Field>

      <Field label="Key amenities" helper="Pick all that apply.">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {Object.values(AMENITIES_CATALOG).map((a) => {
            const on = draft.amenities.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() =>
                  update(
                    "amenities",
                    on ? draft.amenities.filter((x) => x !== a.id) : [...draft.amenities, a.id]
                  )
                }
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 text-[12.5px] font-semibold transition",
                  on
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-ink-200 bg-white text-ink-700 hover:border-brand-500/40"
                )}
              >
                {a.label}
              </button>
            );
          })}
        </div>
      </Field>
    </div>
  );
}

function LocationStep({ draft, update }: { draft: ListingDraft; update: <K extends keyof ListingDraft>(k: K, v: ListingDraft[K]) => void }) {
  return (
    <div className="space-y-5">
      <h2 className="text-[16px] font-bold text-ink-900">Where is it?</h2>
      <p className="text-[13px] text-ink-500">
        Your exact address stays private — only locality + city is shown publicly.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Locality / Area">
          <input value={draft.locality} onChange={(e) => update("locality", e.target.value)} placeholder="e.g. New Town" className="input" />
        </Field>
        <Field label="City">
          <input value={draft.city} onChange={(e) => update("city", e.target.value)} placeholder="e.g. Kolkata" className="input" />
        </Field>
        <Field label="State">
          <input value={draft.state} onChange={(e) => update("state", e.target.value)} placeholder="e.g. West Bengal" className="input" />
        </Field>
        <Field label="Pincode">
          <input value={draft.pincode} onChange={(e) => update("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="700156" className="input" />
        </Field>
      </div>

      <button
        type="button"
        className="inline-flex h-11 items-center gap-2 rounded-xl border border-brand-500/40 bg-brand-50 px-3.5 text-[13px] font-semibold text-brand-700 hover:bg-brand-100"
      >
        <MapPin className="h-4 w-4" /> Drop a pin on the map (optional)
      </button>
    </div>
  );
}

function PhotosStep({ draft, update }: { draft: ListingDraft; update: <K extends keyof ListingDraft>(k: K, v: ListingDraft[K]) => void }) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  const onPick = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const slots = Math.max(0, 12 - draft.photos.length);
      const fd = new FormData();
      Array.from(files).slice(0, slots).forEach((f) => fd.append("file", f));

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.status === 401) {
        toast.show({ kind: "info", title: "Please sign in to upload" });
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        toast.show({
          kind: "error",
          title: "Upload failed",
          description: data.error ?? "Try a smaller image (max 10 MB).",
        });
        return;
      }
      const next = [
        ...draft.photos,
        ...data.uploaded.map((u: { url: string; key: string }) => ({ name: u.key, url: u.url })),
      ];
      update("photos", next);
      toast.show({
        kind: "success",
        title: data.mode === "r2" ? "Uploaded to R2" : "Stored as preview",
        description: `${data.uploaded.length} file(s) ready.`,
      });
    } catch {
      toast.show({ kind: "error", title: "Upload failed", description: "Network error." });
    } finally {
      setUploading(false);
    }
  };

  const remove = (idx: number) =>
    update("photos", draft.photos.filter((_, i) => i !== idx));

  return (
    <div className="space-y-5">
      <h2 className="text-[16px] font-bold text-ink-900">Add photos &amp; videos</h2>
      <p className="text-[13px] text-ink-500">
        Listings with 5+ photos get <span className="font-semibold text-emerald-600">3× more leads</span>.
        High-resolution images recommended.
      </p>

      <label className="grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-ink-200 bg-ink-50/40 px-6 py-10 text-center transition hover:border-brand-500/40 hover:bg-brand-50/30">
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(e) => onPick(e.target.files)}
          className="sr-only"
        />
        {uploading ? <Loader2 className="h-8 w-8 animate-spin text-brand-500" /> : <Upload className="h-8 w-8 text-brand-500" />}
        <p className="mt-2 text-[14px] font-bold text-ink-900">
          {uploading ? "Uploading…" : "Click to upload"}
        </p>
        <p className="text-[12px] text-ink-500">or drag &amp; drop · JPG, PNG, MP4 · up to 12 files</p>
      </label>

      {draft.photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {draft.photos.map((p, i) => (
            <div key={p.url} className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-ink-200/70 bg-ink-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10.5px] font-bold text-white">
                  <Camera className="h-3 w-3" /> Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Remove"
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PriceStep({ draft, update }: { draft: ListingDraft; update: <K extends keyof ListingDraft>(k: K, v: ListingDraft[K]) => void }) {
  return (
    <div className="space-y-5">
      <h2 className="text-[16px] font-bold text-ink-900">Set your price</h2>

      <Field label={draft.intent === "rent" ? "Monthly rent (₹)" : "Expected price (₹)"}>
        <div className="flex h-12 rounded-xl border border-ink-200 bg-white shadow-soft focus-within:border-brand-500 focus-within:shadow-ring">
          <span className="grid w-12 place-items-center border-r border-ink-200 text-[14px] font-bold text-ink-700">₹</span>
          <input
            type="number"
            inputMode="numeric"
            min={1000}
            value={draft.priceInr ?? ""}
            onChange={(e) => update("priceInr", Number(e.target.value) || undefined)}
            placeholder={draft.intent === "rent" ? "25000" : "5000000"}
            className="flex-1 bg-transparent px-3 text-[15px] focus:outline-none"
          />
        </div>
      </Field>

      <label className="inline-flex items-center gap-2 text-[13.5px] font-medium text-ink-800">
        <input
          type="checkbox"
          checked={draft.negotiable}
          onChange={(e) => update("negotiable", e.target.checked)}
          className="h-4 w-4 accent-emerald-500"
        />
        Price is negotiable
      </label>

      <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50 p-4 text-[13px] text-emerald-800">
        <strong className="font-semibold">AI tip:</strong> Listings priced within ±5% of the area
        average sell <strong>40% faster</strong>. We'll show market comparisons after submit.
      </div>
    </div>
  );
}

function ReviewStep({ draft }: { draft: ListingDraft }) {
  return (
    <div className="space-y-5">
      <h2 className="text-[16px] font-bold text-ink-900">Review your listing</h2>
      <p className="text-[13px] text-ink-500">Looks right? Submit for AapKaPlot's 24-hour review.</p>

      <ul className="grid gap-3 sm:grid-cols-2">
        <Cell label="Type" value={`${draft.kind ?? "—"} · ${draft.intent === "rent" ? "Rent" : "Sale"}`} />
        <Cell label="Title" value={draft.title || "—"} />
        <Cell label="BHK / Area" value={`${draft.bhk ?? "—"} BHK · ${draft.areaSqft ?? "—"} sqft`} />
        <Cell label="Furnishing" value={draft.furnishing ?? "—"} />
        <Cell label="Locality" value={[draft.locality, draft.city, draft.state].filter(Boolean).join(", ") || "—"} />
        <Cell label="Pincode" value={draft.pincode || "—"} />
        <Cell label="Photos" value={`${draft.photos.length} attached`} />
        <Cell label="Price" value={draft.priceInr ? `₹${draft.priceInr.toLocaleString("en-IN")}${draft.negotiable ? " (negotiable)" : ""}` : "—"} />
        <Cell label="Amenities" value={draft.amenities.length ? draft.amenities.length + " selected" : "None"} />
      </ul>
    </div>
  );
}

/* -------- small primitives -------- */

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">
      {children}
    </span>
  );
}

function Field({
  label, helper, children,
}: {
  label: string; helper?: string; children: React.ReactNode;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <div className="mt-1.5">{children}</div>
      {helper && <p className="mt-1 text-[11.5px] text-ink-500">{helper}</p>}
    </label>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <li className="rounded-xl border border-ink-200/70 bg-white p-3">
      <p className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">{label}</p>
      <p className="mt-0.5 text-[13.5px] font-semibold text-ink-900">{value}</p>
    </li>
  );
}

function AiDescribeButton({
  draft,
  onResult,
}: {
  draft: ListingDraft;
  onResult: (text: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const disabled = !draft.kind || draft.title.trim().length < 4 || draft.locality.trim().length < 2;

  const run = async () => {
    if (disabled) {
      toast.show({
        kind: "info",
        title: "Need a bit more info",
        description: "Fill title, type and locality first.",
      });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/ai/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: draft.kind,
          intent: draft.intent,
          title: draft.title,
          locality: draft.locality,
          city: draft.city || "Kolkata",
          state: draft.state,
          bhk: draft.bhk,
          areaSqft: draft.areaSqft,
          amenities: draft.amenities,
          furnishing: draft.furnishing
            ? draft.furnishing === "Furnished"
              ? "full"
              : draft.furnishing === "Semi-furnished"
              ? "semi"
              : "unfurnished"
            : undefined,
          priceInr: draft.priceInr,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "ai_failed");
      onResult(data.description);
      toast.show({
        kind: "success",
        title: data.source === "claude" ? "Drafted with Claude" : "Drafted from template",
        description: "Edit it freely before posting.",
      });
    } catch {
      toast.show({ kind: "error", title: "Couldn't generate", description: "Please try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy}
      className={cn(
        "absolute right-2 top-2 inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[11.5px] font-bold transition",
        busy
          ? "bg-ink-100 text-ink-500"
          : "bg-brand-gradient text-white shadow-glow hover:brightness-105"
      )}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
      {busy ? "Drafting…" : "Generate with AI"}
    </button>
  );
}
