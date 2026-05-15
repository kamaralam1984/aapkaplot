"use client";

import { useEffect, useMemo, useState } from "react";
import { Gift, Share2, Sparkles, Check, IndianRupee, Users, Link2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { ShareMenu } from "@/components/property/ShareMenu";
import { formatInr } from "@/lib/format";

const STORAGE_KEY = "akp.referral.code";

function makeCode() {
  return "AKP-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

const PERKS = [
  { icon: <IndianRupee className="h-5 w-5" />, title: "₹500 for both",   body: "You and your friend each get ₹500 when they buy or list a property." },
  { icon: <Sparkles    className="h-5 w-5" />, title: "1 free Spotlight", body: "Refer 3 sellers and earn a free 7-day Spotlight boost on any listing." },
  { icon: <Gift        className="h-5 w-5" />, title: "Stack & redeem",  body: "Stack your rewards into wallet credit usable on Premium plans." },
];

const RECENT = [
  { name: "Aarav Singh",  status: "Signed up",  rewardInr: 500, days: 1 },
  { name: "Meera Iyer",   status: "Booked visit", rewardInr: 500, days: 3 },
  { name: "Pooja Sharma", status: "Pending",    rewardInr: 0,   days: 7 },
];

export default function ReferralsPage() {
  const [code, setCode] = useState<string>("AKP-XXXXXX");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      stored = makeCode();
      localStorage.setItem(STORAGE_KEY, stored);
    }
    setCode(stored);
  }, []);

  const link = useMemo(() => {
    if (typeof window === "undefined") return `/?ref=${code}`;
    return `${window.location.origin}/?ref=${code}`;
  }, [code]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  const earned = RECENT.reduce((s, r) => s + r.rewardInr, 0);

  return (
    <>
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-hero-radial">
          <div className="absolute inset-0 grid-mask opacity-50" aria-hidden />
          <Container size="wide" className="relative grid gap-10 py-16 lg:grid-cols-2 lg:py-20">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700">
                <Gift className="h-3.5 w-3.5" /> Referrals
              </span>
              <h1 className="mt-4 text-display-lg font-display text-ink-900 text-balance">
                Refer friends. <span className="text-gradient-brand">Earn together.</span>
              </h1>
              <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-ink-600">
                Share your link. When your friend buys, rents or lists a property on AapKaPlot,
                both of you get rewarded. Stack credits, unlock Spotlight boosts, withdraw to wallet.
              </p>

              <div className="mt-6 max-w-md surface-card overflow-hidden p-2">
                <div className="flex items-center gap-2 rounded-xl bg-ink-50 p-2.5">
                  <Link2 className="h-4 w-4 text-ink-500" />
                  <input
                    readOnly
                    value={link}
                    className="flex-1 bg-transparent text-[13.5px] font-mono text-ink-800 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={copy}
                    className={`inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[12px] font-bold transition ${
                      copied ? "bg-emerald-500 text-white" : "bg-ink-900 text-white hover:bg-ink-800"
                    }`}
                  >
                    {copied ? <><Check className="h-3 w-3" /> Copied</> : "Copy"}
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 px-2 pb-1 pt-2">
                  <p className="text-[12px] text-ink-500">Your code:&nbsp;<span className="font-bold text-ink-900">{code}</span></p>
                  <ShareMenu title="Earn ₹500 on AapKaPlot" text="Find verified plots, flats & houses with AI." url={link} />
                </div>
              </div>
            </div>

            {/* Earnings card */}
            <aside className="lg:justify-self-end">
              <div className="surface-card w-full max-w-sm p-6">
                <p className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">Earnings</p>
                <p className="mt-1 text-3xl font-bold text-ink-900">{formatInr(earned)}</p>
                <p className="mt-1 text-[12px] text-ink-500">
                  Credited as wallet balance — redeemable on Premium plans.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Stat label="Friends invited" value={RECENT.length} icon={<Users className="h-4 w-4" />} tone="bg-emerald-50 text-emerald-600" />
                  <Stat label="Pending rewards" value={1} icon={<Sparkles className="h-4 w-4" />} tone="bg-amber-50 text-amber-600" />
                </div>

                <Button variant="primary" size="lg" iconLeft={<Share2 className="h-4 w-4" />} className="mt-5 w-full" onClick={copy}>
                  Share your link
                </Button>
              </div>
            </aside>
          </Container>
        </section>

        {/* Perks */}
        <section className="py-14">
          <Container size="wide">
            <h2 className="text-display-md font-display text-ink-900">How it works</h2>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {PERKS.map((p) => (
                <div key={p.title} className="surface-card p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">{p.icon}</span>
                  <h3 className="mt-3 text-[14.5px] font-bold text-ink-900">{p.title}</h3>
                  <p className="mt-1 text-[13px] text-ink-600">{p.body}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* Recent activity */}
        <section className="bg-white py-14">
          <Container size="wide">
            <h2 className="text-display-md font-display text-ink-900">Recent invites</h2>
            <ul className="mt-6 surface-card divide-y divide-ink-200/70 overflow-hidden">
              {RECENT.map((r) => (
                <li key={r.name} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-gradient text-[12px] font-bold text-white">
                      {r.name.slice(0, 1)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-bold text-ink-900">{r.name}</p>
                      <p className="text-[11.5px] text-ink-500">{r.status} · {r.days}d ago</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11.5px] font-bold ${
                    r.rewardInr > 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}>
                    {r.rewardInr > 0 ? `+${formatInr(r.rewardInr)}` : "Pending"}
                  </span>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Stat({
  label, value, icon, tone,
}: {
  label: string; value: number; icon: React.ReactNode; tone: string;
}) {
  return (
    <div className="rounded-xl border border-ink-200/70 bg-white p-3">
      <span className={`grid h-8 w-8 place-items-center rounded-lg ${tone}`}>{icon}</span>
      <p className="mt-2 text-2xl font-bold text-ink-900">{value}</p>
      <p className="text-[11px] text-ink-500">{label}</p>
    </div>
  );
}
