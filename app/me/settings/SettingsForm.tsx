"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, MapPin, MessageCircle, Loader2, Check, Briefcase, ShieldCheck, Upload, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

type RoleSelectable = "buyer" | "seller" | "agent";
type VerifStatus = "none" | "pending" | "approved" | "rejected";

interface VerifState {
  status: VerifStatus;
  id?: string;
}

interface Initial {
  name: string;
  email: string;
  phone: string;
  whatsappPhone: string;
  address: string;
  role: string; // BUYER | SELLER | AGENT | ADMIN | SUPER_ADMIN
  verif?: VerifState;
}

function prismaRoleToSelectable(role: string): RoleSelectable | null {
  switch (role) {
    case "BUYER":  return "buyer";
    case "SELLER": return "seller";
    case "AGENT":  return "agent";
    default:       return null; // admin / super_admin can't be downgraded here
  }
}

const PHONE_REGEX = /^[6-9][0-9]{9}$/;

export function SettingsForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [whatsappPhone, setWhatsappPhone] = useState(initial.whatsappPhone);
  const [address, setAddress] = useState(initial.address);
  const initialRole = prismaRoleToSelectable(initial.role);
  const [role, setRole] = useState<RoleSelectable | null>(initialRole);
  const [saving, setSaving] = useState(false);

  // Identity verification state
  const [verifStatus, setVerifStatus] = useState<VerifStatus>(initial.verif?.status ?? "none");
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [docUrls, setDocUrls] = useState({ aadhaarFront: "", aadhaarBack: "", selfie: "", pan: "" });
  const [submittingVerif, setSubmittingVerif] = useState(false);
  const fileRefs = { aadhaarFront: useRef<HTMLInputElement>(null), aadhaarBack: useRef<HTMLInputElement>(null), selfie: useRef<HTMLInputElement>(null), pan: useRef<HTMLInputElement>(null) };

  const phoneDigits = phone.replace(/\D/g, "").slice(-10);
  const waDigits = whatsappPhone.replace(/\D/g, "").slice(-10);
  const phoneValid = phoneDigits === "" || PHONE_REGEX.test(phoneDigits);
  const waValid = waDigits === "" || PHONE_REGEX.test(waDigits);

  const dirty =
    name.trim() !== initial.name ||
    phoneDigits !== initial.phone ||
    waDigits !== initial.whatsappPhone ||
    address.trim() !== initial.address ||
    (role !== null && role !== initialRole);

  async function save() {
    if (!phoneValid || !waValid) {
      toast.show({ kind: "error", title: "Invalid phone", description: "Must be a 10-digit Indian mobile (6–9 start)." });
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, string> = {};
      if (name.trim() !== initial.name) body.name = name.trim();
      if (phoneDigits !== initial.phone && phoneDigits) body.phone = phoneDigits;
      if (waDigits !== initial.whatsappPhone) body.whatsappPhone = waDigits;
      if (address.trim() !== initial.address) body.address = address.trim();
      if (role && role !== initialRole) body.role = role;

      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "phone_taken") {
          toast.show({ kind: "error", title: "Phone already in use", description: "Another account has this number." });
          return;
        }
        throw new Error(data.error ?? "update_failed");
      }
      toast.show({ kind: "success", title: "Saved", description: "Profile updated." });
      router.refresh();
    } catch (e) {
      toast.show({ kind: "error", title: "Couldn't save", description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  }

  async function uploadDoc(field: keyof typeof docUrls, file: File) {
    setUploading((u) => ({ ...u, [field]: true }));
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      const url = data.uploaded?.[0]?.url;
      if (res.ok && url) {
        setDocUrls((d) => ({ ...d, [field]: url }));
        toast.show({ kind: "success", title: "Uploaded", description: file.name });
      } else {
        toast.show({ kind: "error", title: "Upload failed", description: data.error ?? "Try again" });
      }
    } catch {
      toast.show({ kind: "error", title: "Upload failed", description: "Check your connection." });
    } finally {
      setUploading((u) => ({ ...u, [field]: false }));
    }
  }

  async function submitVerification() {
    if (!docUrls.aadhaarFront) {
      toast.show({ kind: "warning", title: "Aadhaar front required", description: "Please upload at least the front side." });
      return;
    }
    setSubmittingVerif(true);
    try {
      const res = await fetch("/api/verifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aadhaarFrontUrl: docUrls.aadhaarFront,
          ...(docUrls.aadhaarBack && { aadhaarBackUrl: docUrls.aadhaarBack }),
          ...(docUrls.selfie && { selfieUrl: docUrls.selfie }),
          ...(docUrls.pan && { panUrl: docUrls.pan }),
        }),
      });
      if (res.ok) {
        setVerifStatus("pending");
        toast.show({ kind: "success", title: "Submitted!", description: "We'll review your documents within 24 hours." });
      } else {
        const data = await res.json();
        toast.show({ kind: "error", title: "Submission failed", description: data.error ?? "Try again." });
      }
    } catch {
      toast.show({ kind: "error", title: "Error", description: "Please try again." });
    } finally {
      setSubmittingVerif(false);
    }
  }

  return (
    <div className="surface-card divide-y divide-ink-200/70">
      {/* Profile */}
      <section className="p-5">
        <header className="mb-4 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
            <User className="h-4 w-4" />
          </span>
          <h3 className="text-[14px] font-bold text-ink-900">Profile</h3>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field icon={<User className="h-4 w-4" />} label="Full name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 60))}
              placeholder="Your full name"
              className="input"
            />
          </Field>

          <Field icon={<Mail className="h-4 w-4" />} label="Email" disabled>
            <input value={initial.email} disabled className="input bg-ink-50 text-ink-500" />
          </Field>

          <Field
            icon={<Phone className="h-4 w-4 text-brand-500" />}
            label="Phone (primary)"
            error={phone && !phoneValid ? "Must be a 10-digit Indian mobile starting with 6–9" : undefined}
          >
            <div className="flex h-11 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-soft focus-within:border-brand-500">
              <span className="inline-flex items-center border-r border-ink-200 px-3 text-[13px] font-semibold text-ink-700">
                +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d+\-\s]/g, "").slice(0, 14))}
                placeholder="10-digit mobile"
                className="min-w-0 flex-1 bg-transparent px-3 text-[14px] outline-none"
              />
            </div>
          </Field>

          <Field
            icon={<MessageCircle className="h-4 w-4 text-emerald-500" />}
            label="WhatsApp number (optional)"
            helper="Leave blank to use your primary phone."
            error={whatsappPhone && !waValid ? "Must be a 10-digit Indian mobile" : undefined}
          >
            <div className="flex h-11 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-soft focus-within:border-brand-500">
              <span className="inline-flex items-center border-r border-ink-200 px-3 text-[13px] font-semibold text-ink-700">
                +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value.replace(/[^\d+\-\s]/g, "").slice(0, 14))}
                placeholder="Different from primary?"
                className="min-w-0 flex-1 bg-transparent px-3 text-[14px] outline-none"
              />
            </div>
          </Field>

          <Field icon={<MapPin className="h-4 w-4" />} label="Address" full>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value.slice(0, 240))}
              placeholder="House / flat, street, locality, city, state, PIN"
              rows={3}
              className="input resize-none py-2"
            />
          </Field>

          {/* Role switch — hidden for admin/super_admin (initialRole is null
              for those). Lets a user fix the "signed up but profile shows
              Buyer" case without going through OTP again. */}
          {initialRole !== null && (
            <Field
              icon={<Briefcase className="h-4 w-4 text-violet-500" />}
              label="I am a"
              helper="Switch any time. Seller / Agent unlocks the Post Property flow and seller dashboard."
              full
            >
              <div className="grid grid-cols-3 gap-2">
                {(["buyer", "seller", "agent"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`h-11 rounded-xl border text-[13px] font-semibold capitalize transition ${
                      role === r
                        ? "border-brand-500 bg-brand-50 text-brand-700 shadow-soft"
                        : "border-ink-200 bg-white text-ink-700 hover:border-brand-300"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </Field>
          )}
        </div>

        <footer className="mt-5 flex items-center justify-end gap-2">
          {!dirty ? (
            <span className="inline-flex items-center gap-1 text-[12.5px] text-ink-500">
              <Check className="h-3.5 w-3.5 text-emerald-500" /> No unsaved changes
            </span>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={save}
              disabled={saving}
              iconRight={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            >
              {saving ? "Saving…" : "Save changes"}
            </Button>
          )}
        </footer>
      </section>
      {/* Identity Verification */}
      <section className="p-5">
        <header className="mb-4 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <h3 className="text-[14px] font-bold text-ink-900">Identity Verification</h3>
            <p className="text-[11.5px] text-ink-500">Get a verified badge — buyers trust verified sellers more</p>
          </div>
          {verifStatus === "approved" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
              <Check className="h-3 w-3" /> Verified
            </span>
          )}
          {verifStatus === "pending" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">
              <Clock className="h-3 w-3" /> Under Review
            </span>
          )}
          {verifStatus === "rejected" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-700">
              <XCircle className="h-3 w-3" /> Rejected
            </span>
          )}
        </header>

        {verifStatus === "approved" ? (
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-[12.5px] text-emerald-700">
            Your identity has been verified. A verified badge is shown on your profile and listings.
          </p>
        ) : verifStatus === "pending" ? (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-[12.5px] text-amber-700">
            Your documents are under review. We'll update your status within 24 hours. No action needed.
          </p>
        ) : (
          <>
            {verifStatus === "rejected" && (
              <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-[12.5px] text-rose-700">
                Your previous submission was rejected. Please re-upload clear, legible documents and resubmit.
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  { key: "aadhaarFront", label: "Aadhaar Front *", required: true },
                  { key: "aadhaarBack",  label: "Aadhaar Back",    required: false },
                  { key: "selfie",       label: "Selfie with Aadhaar", required: false },
                  { key: "pan",          label: "PAN Card (optional)", required: false },
                ] as const
              ).map(({ key, label, required }) => (
                <div key={key}>
                  <p className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">{label}</p>
                  <input ref={fileRefs[key]} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDoc(key, f); }} />
                  <button
                    type="button"
                    onClick={() => fileRefs[key].current?.click()}
                    disabled={uploading[key]}
                    className={`flex h-20 w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed text-[12px] transition ${
                      docUrls[key]
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                        : "border-ink-200 bg-ink-50 text-ink-500 hover:border-brand-400 hover:bg-brand-50"
                    }`}
                  >
                    {uploading[key] ? (
                      <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
                    ) : docUrls[key] ? (
                      <>
                        <Check className="h-5 w-5 text-emerald-600" />
                        <span className="font-semibold">Uploaded</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5" />
                        <span>{required ? "Upload (required)" : "Upload"}</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
            <Button
              variant="primary"
              size="md"
              className="mt-4 w-full"
              onClick={submitVerification}
              disabled={submittingVerif || !docUrls.aadhaarFront}
              iconLeft={submittingVerif ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            >
              {submittingVerif ? "Submitting…" : "Submit for Verification"}
            </Button>
            <p className="mt-2 text-center text-[11px] text-ink-400">Free · Reviewed within 24 hours · Documents stored securely</p>
          </>
        )}
      </section>
    </div>
  );
}

function Field({
  icon, label, helper, error, disabled, full, children,
}: {
  icon: React.ReactNode;
  label: string;
  helper?: string;
  error?: string;
  disabled?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 inline-flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">
        {icon}
        {label}
        {disabled && <span className="ml-1 text-[10px] text-ink-400">(read-only)</span>}
      </span>
      {children}
      {helper && <span className="mt-1 block text-[11.5px] text-ink-500">{helper}</span>}
      {error && <span className="mt-1 block text-[11.5px] text-rose-600">{error}</span>}
    </label>
  );
}
