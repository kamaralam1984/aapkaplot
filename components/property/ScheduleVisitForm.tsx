"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Check, Send } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { track } from "@/lib/track";

interface ScheduleVisitFormProps {
  propertyId: string;
  ownerName: string;
}

const SLOTS = ["10:00 AM", "12:00 PM", "3:00 PM", "5:30 PM"];

export function ScheduleVisitForm({ propertyId, ownerName }: ScheduleVisitFormProps) {
  const days = useMemo(buildNextDays, []);
  const [dayIso, setDayIso] = useState(days[0].iso);
  const [slot, setSlot] = useState<string | null>(SLOTS[1]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const toast = useToast();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slot || !name || phone.length < 10) return;
    try {
      const res = await fetch("/api/visit-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          name,
          phone: `+91${phone}`,
          slot,
          scheduledFor: new Date(`${dayIso}T00:00:00.000Z`).toISOString(),
        }),
      });
      if (!res.ok) throw new Error("send_failed");
      track("visit_requested", { propertyId, slot });
      toast.show({
        kind: "success",
        title: "Visit requested",
        description: `${ownerName} will confirm shortly.`,
      });
      setSubmitted(true);
    } catch {
      toast.show({
        kind: "error",
        title: "Couldn't send",
        description: "Please try again or message the owner.",
      });
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="surface-card mt-4 p-5 text-center"
      >
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-600">
          <Check className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-[15px] font-bold text-ink-900">Visit requested!</h3>
        <p className="mt-1 text-[13px] text-ink-500">
          {ownerName} will confirm your slot shortly. You'll get a WhatsApp + SMS reminder.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="surface-card mt-4 p-5">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <CalendarDays className="h-[18px] w-[18px]" />
        </span>
        <div>
          <p className="text-[14px] font-bold text-ink-900">Schedule a visit</p>
          <p className="text-[12px] text-ink-500">Pick a slot — it's free.</p>
        </div>
      </div>

      {/* Day picker */}
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
        {days.map((d) => (
          <button
            key={d.iso}
            type="button"
            onClick={() => setDayIso(d.iso)}
            className={cn(
              "flex w-16 shrink-0 flex-col items-center rounded-xl border px-2 py-2 text-center transition",
              dayIso === d.iso
                ? "border-transparent bg-brand-gradient text-white shadow-glow"
                : "border-ink-200 bg-white text-ink-700 hover:border-brand-500/40"
            )}
          >
            <span className="text-[10.5px] font-semibold uppercase tracking-wider opacity-80">
              {d.weekday}
            </span>
            <span className="text-[15px] font-bold leading-tight">{d.dayNum}</span>
            <span className="text-[10px] opacity-80">{d.month}</span>
          </button>
        ))}
      </div>

      {/* Slots */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {SLOTS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSlot(s)}
            className={cn(
              "rounded-xl border px-3 py-2 text-[12.5px] font-semibold transition",
              slot === s
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-ink-200 bg-white text-ink-700 hover:border-brand-500/40"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Contact fields */}
      <div className="mt-4 space-y-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          required
          className="h-11 w-full rounded-xl border border-ink-200 bg-white px-3.5 text-[14px] placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="10-digit mobile number"
          required
          className="h-11 w-full rounded-xl border border-ink-200 bg-white px-3.5 text-[14px] placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        iconRight={<Send className="h-4 w-4" />}
        className="mt-4 w-full"
        disabled={!slot || !name || phone.length < 10}
      >
        Request Visit
      </Button>

      <p className="mt-2 text-center text-[11px] text-ink-400">
        By continuing you agree to AapKaPlot's <span className="underline">terms</span>.
      </p>
    </form>
  );
}

function buildNextDays() {
  const out: { iso: string; weekday: string; dayNum: string; month: string }[] = [];
  const wk = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getTime() + i * 86_400_000);
    out.push({
      iso: d.toISOString().slice(0, 10),
      weekday: wk[d.getDay()],
      dayNum: String(d.getDate()).padStart(2, "0"),
      month: mo[d.getMonth()],
    });
  }
  return out;
}
