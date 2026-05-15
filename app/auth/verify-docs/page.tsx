"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Upload, Check, ArrowLeft, Loader2, AlertTriangle, FileText, IdCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type DocType = "aadhaar" | "pan" | "title";

interface DocSlot {
  id: DocType;
  label: string;
  description: string;
  icon: React.ReactNode;
  required: boolean;
}

const SLOTS: DocSlot[] = [
  {
    id: "aadhaar",
    label: "Aadhaar card",
    description: "Front & back. Mask the long number for safety — we only verify name & address.",
    icon: <IdCard className="h-5 w-5" />,
    required: true,
  },
  {
    id: "pan",
    label: "PAN card",
    description: "Required for sellers receiving leads. Speeds up payouts.",
    icon: <FileText className="h-5 w-5" />,
    required: false,
  },
  {
    id: "title",
    label: "Property title / ownership doc",
    description: "Sale deed, RERA registration or owner NoC. Sellers only.",
    icon: <FileText className="h-5 w-5" />,
    required: false,
  },
];

export default function VerifyDocsPage() {
  const [files, setFiles] = useState<Partial<Record<DocType, { name: string; size: number }>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const setDoc = (id: DocType, file?: File) => {
    setFiles((cur) => ({
      ...cur,
      [id]: file ? { name: file.name, size: file.size } : undefined,
    }));
  };

  const submit = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setDone(true);
  };

  const canSubmit = SLOTS.filter((s) => s.required).every((s) => files[s.id]);

  return (
    <div className="min-h-screen bg-surface-subtle">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
        <Link
          href="/me/settings"
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink-500 hover:text-ink-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to settings
        </Link>

        <div className="mt-4 flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-display-md font-display text-ink-900">Verify your identity</h1>
            <p className="mt-1 max-w-xl text-[14px] text-ink-600">
              Upload your documents so AapKaPlot can give you a Verified badge. Verified profiles get{" "}
              <strong className="font-semibold text-emerald-700">3× more leads</strong> and unlock owner-priority placement.
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="ok"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8 surface-card grid place-items-center p-12 text-center"
            >
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Check className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-display-md font-display text-ink-900">Submitted!</h2>
              <p className="mt-2 max-w-sm text-[14px] text-ink-500">
                Our team will verify your documents within 24 hours. You'll receive a WhatsApp + SMS when your badge is live.
              </p>
              <Link href="/me" className="mt-5">
                <Button variant="primary" size="md">Back to dashboard</Button>
              </Link>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mt-8 space-y-3">
                {SLOTS.map((s) => (
                  <DocUpload
                    key={s.id}
                    slot={s}
                    file={files[s.id]}
                    onPick={(f) => setDoc(s.id, f)}
                    onRemove={() => setDoc(s.id)}
                  />
                ))}
              </div>

              <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-amber-200/70 bg-amber-50 p-4 text-[12.5px] text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Your documents are stored encrypted and shared only with AapKaPlot's verification team. We never
                  share them with buyers, sellers or third parties.
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={submit}
                disabled={!canSubmit || submitting}
                className="mt-6 w-full"
                iconRight={submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              >
                {submitting ? "Submitting…" : "Submit for verification"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function DocUpload({
  slot, file, onPick, onRemove,
}: {
  slot: DocSlot;
  file?: { name: string; size: number };
  onPick: (f: File) => void;
  onRemove: () => void;
}) {
  const has = !!file;
  return (
    <div className={cn(
      "surface-card flex items-start gap-3 p-4 transition",
      has && "border-emerald-300/70"
    )}>
      <span className={cn(
        "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
        has ? "bg-emerald-50 text-emerald-600" : "bg-brand-50 text-brand-600"
      )}>
        {has ? <Check className="h-5 w-5" /> : slot.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="inline-flex items-center gap-1 text-[14px] font-bold text-ink-900">
          {slot.label}
          {slot.required && <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">Required</span>}
        </p>
        <p className="mt-0.5 text-[12.5px] text-ink-500">{slot.description}</p>
        {has ? (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-[12px] font-semibold text-emerald-700">
            <FileText className="h-3.5 w-3.5" />
            {file!.name} <span className="text-emerald-600/70">· {(file!.size / 1024).toFixed(0)} KB</span>
            <button
              type="button"
              onClick={onRemove}
              className="ml-1 rounded-full px-1 text-[11px] font-bold hover:bg-emerald-100"
            >
              Remove
            </button>
          </p>
        ) : (
          <label className="mt-2 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 text-[12.5px] font-semibold text-ink-800 shadow-soft transition hover:border-brand-500/40">
            <Upload className="h-3.5 w-3.5" />
            Upload file
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])}
              className="sr-only"
            />
          </label>
        )}
      </div>
    </div>
  );
}
