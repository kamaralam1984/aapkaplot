"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, MapPin, MessageCircle, Loader2, Check, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

type RoleSelectable = "buyer" | "seller" | "agent";

interface Initial {
  name: string;
  email: string;
  phone: string;
  whatsappPhone: string;
  address: string;
  role: string; // BUYER | SELLER | AGENT | ADMIN | SUPER_ADMIN
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
