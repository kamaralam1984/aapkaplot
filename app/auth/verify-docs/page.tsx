"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck, Upload, Check, ArrowLeft, Loader2, AlertTriangle,
  FileText, IdCard, Camera, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

type DocType = "aadhaarFront" | "aadhaarBack" | "selfie" | "pan" | "title";

interface DocSlot {
  id: DocType;
  label: string;
  description: string;
  icon: React.ReactNode;
  required: boolean;
}

const SLOTS: DocSlot[] = [
  {
    id: "aadhaarFront",
    label: "Aadhaar — front",
    description: "Mask the long number for safety — we only need name & address.",
    icon: <IdCard className="h-5 w-5" />,
    required: true,
  },
  {
    id: "aadhaarBack",
    label: "Aadhaar — back",
    description: "Optional but speeds up verification.",
    icon: <IdCard className="h-5 w-5" />,
    required: false,
  },
  {
    id: "selfie",
    label: "Selfie",
    description: "Hold the Aadhaar next to your face — used only for liveness checks.",
    icon: <Camera className="h-5 w-5" />,
    required: false,
  },
  {
    id: "pan",
    label: "PAN card",
    description: "Required for sellers receiving payouts. Optional for buyers.",
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

interface Uploaded {
  url: string;
  name: string;
  size: number;
}

interface LatestStatus {
  verified: boolean;
  latest: { status: string; createdAt: string; note?: string | null } | null;
}

export default function VerifyDocsPage() {
  const toast = useToast();
  const [docs, setDocs] = useState<Partial<Record<DocType, Uploaded>>>({});
  const [uploadingId, setUploadingId] = useState<DocType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [status, setStatus] = useState<LatestStatus | null>(null);

  // Check current status on mount.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/verifications", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setStatus({ verified: !!data.verified, latest: data.latest ?? null });
        }
      } catch {
        // ignore — page still works for fresh submission
      }
    })();
  }, []);

  const pickFile = async (slot: DocType, file: File) => {
    setUploadingId(slot);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.status === 401) {
        toast.show({ kind: "info", title: "Please sign in first" });
        return;
      }
      if (!res.ok || !data.uploaded?.[0]) {
        toast.show({
          kind: "error",
          title: "Upload failed",
          description: data.error ?? "Try a smaller file (max 10 MB).",
        });
        return;
      }
      const u = data.uploaded[0];
      setDocs((cur) => ({
        ...cur,
        [slot]: { url: u.url, name: file.name, size: file.size },
      }));
      toast.show({
        kind: "success",
        title: data.mode === "imgbb" ? "Uploaded to ImgBB" : "Uploaded",
        description: file.name,
      });
    } catch {
      toast.show({ kind: "error", title: "Network error", description: "Please retry." });
    } finally {
      setUploadingId(null);
    }
  };

  const removeDoc = (slot: DocType) => {
    setDocs((cur) => ({ ...cur, [slot]: undefined }));
  };

  const submit = async () => {
    if (!docs.aadhaarFront) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/verifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aadhaarFrontUrl: docs.aadhaarFront.url,
          aadhaarBackUrl: docs.aadhaarBack?.url,
          selfieUrl: docs.selfie?.url,
          panUrl: docs.pan?.url,
          titleDocUrl: docs.title?.url,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 503 && data.error === "db_disabled") {
        toast.show({
          kind: "info",
          title: "Saved locally",
          description: "DB is off in this environment — admin will enable USE_DB to process.",
        });
        setDone(true);
        return;
      }
      if (!res.ok) {
        toast.show({
          kind: "error",
          title: "Couldn't submit",
          description: data.error ?? "Please try again.",
        });
        return;
      }
      toast.show({ kind: "success", title: "Submitted for review" });
      setDone(true);
    } catch {
      toast.show({ kind: "error", title: "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = !!docs.aadhaarFront;

  // Already-verified short-circuit
  if (status?.verified) {
    return (
      <div className="min-h-screen bg-surface-subtle">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
          <div className="surface-card grid place-items-center p-12 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="mt-4 text-display-md font-display text-ink-900">You're verified ✓</h1>
            <p className="mt-2 max-w-md text-[14px] text-ink-500">
              Your Aadhaar has been confirmed. Verified badge is showing on your profile and listings.
            </p>
            <Link href="/me" className="mt-5">
              <Button variant="primary" size="md">Back to dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
              <strong className="font-semibold text-emerald-700">3× more leads</strong>.
            </p>
          </div>
        </div>

        {status?.latest?.status === "pending" && (
          <div className="mt-6 surface-card flex items-start gap-3 border-amber-200/60 bg-amber-50 p-4 text-[13px] text-amber-800">
            <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
            <p>
              Your previous submission is being reviewed (received{" "}
              {new Date(status.latest.createdAt).toLocaleDateString("en-IN")}). You can upload more
              documents below to update it.
            </p>
          </div>
        )}

        {status?.latest?.status === "rejected" && (
          <div className="mt-6 surface-card flex items-start gap-3 border-rose-200/60 bg-rose-50 p-4 text-[13px] text-rose-800">
            <X className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Previous submission was rejected.</p>
              {status.latest.note && <p className="mt-1 text-rose-700">Reviewer note: {status.latest.note}</p>}
              <p className="mt-1">Re-upload below and we'll review again.</p>
            </div>
          </div>
        )}

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
                Our team will verify your documents within 24 hours. You'll be notified by email when your badge is live.
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
                    file={docs[s.id]}
                    uploading={uploadingId === s.id}
                    onPick={(f) => pickFile(s.id, f)}
                    onRemove={() => removeDoc(s.id)}
                  />
                ))}
              </div>

              <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-amber-200/70 bg-amber-50 p-4 text-[12.5px] text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Your documents are stored on AapKaPlot's image host and shared only with our verification team.
                  We never share them with buyers, sellers or third parties.
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
  slot, file, uploading, onPick, onRemove,
}: {
  slot: DocSlot;
  file?: Uploaded;
  uploading: boolean;
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
        {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : has ? <Check className="h-5 w-5" /> : slot.icon}
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
          <label className={cn(
            "mt-2 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 text-[12.5px] font-semibold text-ink-800 shadow-soft transition hover:border-brand-500/40",
            uploading && "pointer-events-none opacity-50"
          )}>
            <Upload className="h-3.5 w-3.5" />
            {uploading ? "Uploading…" : "Upload file"}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])}
              className="sr-only"
              disabled={uploading}
            />
          </label>
        )}
      </div>
    </div>
  );
}
