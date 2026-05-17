import type { Metadata } from "next";
import { Building2, CheckCircle2, Clock, ShieldCheck, TrendingDown } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { EMICalculator } from "@/components/property/EMICalculator";
import { LoanLeadForm } from "./LoanLeadForm";

export const metadata: Metadata = {
  title: "Home loans — Compare partner-bank rates · AapKaPlot",
  description:
    "Compare home-loan rates from leading Indian banks (SBI, HDFC, ICICI, Axis, Kotak). Free EMI calculator, instant eligibility check and zero-fee referral.",
  alternates: { canonical: "/loans" },
};

interface Lender {
  name: string;
  rateFrom: number;
  rateTo: number;
  maxTenureYears: number;
  processingFeePct: number;
  notes: string;
  highlight?: string;
}

// Rates are illustrative public benchmarks (Q2 2026). Real quotes come from
// the partner-bank advisor after the callback form.
const LENDERS: Lender[] = [
  { name: "State Bank of India",   rateFrom: 8.50, rateTo: 9.65,  maxTenureYears: 30, processingFeePct: 0.35, notes: "Lowest rate for women borrowers · YONO loan in 7 days." },
  { name: "HDFC Bank",             rateFrom: 8.60, rateTo: 9.50,  maxTenureYears: 30, processingFeePct: 0.50, notes: "PMAY subsidy auto-applied · Doorstep documentation." },
  { name: "ICICI Bank",            rateFrom: 8.75, rateTo: 9.65,  maxTenureYears: 30, processingFeePct: 0.50, notes: "InstaHL — pre-approved up to ₹3 Cr in 60 seconds." },
  { name: "Axis Bank",             rateFrom: 8.75, rateTo: 9.40,  maxTenureYears: 30, processingFeePct: 0.50, notes: "Loan top-up post-disbursal · Repo-linked." },
  { name: "Kotak Mahindra",        rateFrom: 8.70, rateTo: 9.45,  maxTenureYears: 25, processingFeePct: 0.50, notes: "Free property legal & technical verification." },
  { name: "Bank of Baroda",        rateFrom: 8.40, rateTo: 9.85,  maxTenureYears: 30, processingFeePct: 0.50, notes: "BSG-linked variable rate · Lower for govt employees.", highlight: "Best rate" },
  { name: "Punjab National Bank",  rateFrom: 8.45, rateTo: 9.65,  maxTenureYears: 30, processingFeePct: 0.35, notes: "Pradhan Mantri Awas Yojana subsidy support." },
  { name: "LIC Housing Finance",   rateFrom: 8.50, rateTo: 9.30,  maxTenureYears: 30, processingFeePct: 0.50, notes: "Higher LTV for under-construction projects." },
];

export default function LoansPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-hero-radial">
          <Container size="wide" className="relative py-12 lg:py-16">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700">
              <Building2 className="h-3.5 w-3.5" /> Home loans
            </p>
            <h1 className="mt-4 text-display-lg font-display text-ink-900">
              Compare <span className="text-gradient-brand">home-loan rates</span> from India's top banks
            </h1>
            <p className="mt-3 max-w-2xl text-[15.5px] leading-relaxed text-ink-600">
              Live indicative rates from 8 partner banks. Free EMI calculator. A loan advisor
              will reach you with a tailored quote — no fees, no spam.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3 sm:max-w-2xl">
              <Why icon={<TrendingDown className="h-4 w-4" />} title="Best rates" body="Pre-negotiated from ₹15 Cr+ monthly origination." />
              <Why icon={<ShieldCheck className="h-4 w-4" />} title="No fee" body="Banks pay referral on disbursal — buyers pay zero." />
              <Why icon={<Clock className="h-4 w-4" />} title="48h sanction" body="Instant eligibility, sanction in 2 working days." />
            </div>
          </Container>
        </section>

        <Container size="wide" className="py-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* Left: rate table + EMI */}
            <div className="space-y-8">
              <section className="surface-card overflow-hidden">
                <header className="border-b border-ink-200/70 bg-white/60 p-5">
                  <h2 className="text-[15px] font-bold text-ink-900">Partner-bank rates</h2>
                  <p className="text-[12.5px] text-ink-500">
                    Indicative starting rates · Effective Q2 2026 · Final rate depends on credit score, income & LTV.
                  </p>
                </header>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-[13.5px]">
                    <thead>
                      <tr className="bg-ink-50/60 text-[11.5px] uppercase tracking-wider text-ink-500">
                        <th className="px-5 py-3 font-semibold">Lender</th>
                        <th className="px-3 py-3 font-semibold">Rate (p.a.)</th>
                        <th className="px-3 py-3 font-semibold">Tenure</th>
                        <th className="px-3 py-3 font-semibold">Proc. fee</th>
                        <th className="px-5 py-3 font-semibold">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-200/70">
                      {LENDERS.map((l) => (
                        <tr key={l.name}>
                          <td className="px-5 py-3">
                            <p className="font-bold text-ink-900">{l.name}</p>
                            {l.highlight && (
                              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" /> {l.highlight}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 font-semibold text-emerald-700">
                            {l.rateFrom.toFixed(2)}% – {l.rateTo.toFixed(2)}%
                          </td>
                          <td className="px-3 py-3 text-ink-700">Up to {l.maxTenureYears}y</td>
                          <td className="px-3 py-3 text-ink-700">{l.processingFeePct.toFixed(2)}%</td>
                          <td className="px-5 py-3 text-ink-500">{l.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="text-[15px] font-bold text-ink-900">Try the EMI calculator</h2>
                <p className="text-[12.5px] text-ink-500">
                  Drag the sliders to model your loan repayment.
                </p>
                <div className="mt-4">
                  <EMICalculator defaultPriceInr={5_000_000} />
                </div>
              </section>
            </div>

            {/* Right: lead-capture */}
            <aside className="lg:sticky lg:top-20 lg:self-start">
              <h2 className="mb-3 text-[15px] font-bold text-ink-900">Get a personalised quote</h2>
              <LoanLeadForm />
            </aside>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}

function Why({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="surface-card p-4">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700">{icon}</div>
      <p className="mt-2 text-[13.5px] font-bold text-ink-900">{title}</p>
      <p className="text-[12px] text-ink-500">{body}</p>
    </div>
  );
}
