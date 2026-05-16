import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone, MapPin, MessagesSquare, Headphones, Briefcase } from "lucide-react";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact AapKaPlot — sales, support & partnerships",
  description: "Reach AapKaPlot via WhatsApp, email, or the contact form. Sales, support and partnership enquiries — typical reply under 2 hours.",
  alternates: { canonical: "/contact" },
};

const CHANNELS = [
  { icon: <MessagesSquare className="h-5 w-5" />, title: "WhatsApp",   value: "+91 80000 00000", href: "https://wa.me/918000000000?text=Hi%20AapKaPlot%20team", tone: "bg-emerald-50 text-emerald-600", note: "Fastest reply — usually < 30 min" },
  { icon: <Mail className="h-5 w-5" />,           title: "Email",      value: "hello@aapkaplot.com", href: "mailto:hello@aapkaplot.com",  tone: "bg-sky-50 text-sky-600",     note: "We reply within 4 business hours" },
  { icon: <Phone className="h-5 w-5" />,          title: "Call us",    value: "+91 80000 00000", href: "tel:+918000000000",                tone: "bg-violet-50 text-violet-600", note: "Mon–Sat, 10 AM – 7 PM IST" },
];

const TEAMS = [
  { icon: <Briefcase className="h-5 w-5" />, title: "Sales & partnerships", email: "sales@aapkaplot.com" },
  { icon: <Headphones className="h-5 w-5" />, title: "Buyer / Seller support", email: "support@aapkaplot.com" },
  { icon: <Mail className="h-5 w-5" />,       title: "Press & media",        email: "press@aapkaplot.com" },
];

export default function ContactPage() {
  return (
    <MarketingShell
      eyebrow="Get in touch"
      title="Hi 👋 — we'd love to hear from you"
      subtitle="Pick the channel that works for you. WhatsApp is fastest. Forms go to our shared inbox and we reply within 4 business hours."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}
    >
      {/* Channels */}
      <ul className="grid gap-4 lg:grid-cols-3">
        {CHANNELS.map((c) => (
          <li key={c.title}>
            <a
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="group flex h-full flex-col rounded-2xl border border-ink-200/70 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-card"
            >
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${c.tone}`}>{c.icon}</span>
              <h3 className="mt-3 text-[15px] font-bold text-ink-900">{c.title}</h3>
              <p className="mt-1 text-[13.5px] font-semibold text-ink-800">{c.value}</p>
              <p className="mt-1 text-[12px] text-ink-500">{c.note}</p>
            </a>
          </li>
        ))}
      </ul>

      {/* Form + Team */}
      <div className="mt-12 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section className="surface-card p-6 lg:p-8">
          <h2 className="text-display-md font-display text-ink-900">Send us a message</h2>
          <p className="mt-1 text-[13.5px] text-ink-500">
            Reply in your inbox within 4 business hours.
          </p>
          <div className="mt-6">
            <ContactForm />
          </div>
        </section>

        <aside className="space-y-6">
          <section className="surface-card p-5">
            <h3 className="text-[14px] font-bold text-ink-900">Specific teams</h3>
            <ul className="mt-3 space-y-3">
              {TEAMS.map((t) => (
                <li key={t.title} className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">{t.icon}</span>
                  <div>
                    <p className="text-[13.5px] font-bold text-ink-900">{t.title}</p>
                    <a href={`mailto:${t.email}`} className="text-[12.5px] text-brand-600 hover:underline">
                      {t.email}
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="surface-card p-5">
            <h3 className="inline-flex items-center gap-2 text-[14px] font-bold text-ink-900">
              <MapPin className="h-4 w-4 text-brand-500" />
              Office
            </h3>
            <p className="mt-2 text-[13.5px] text-ink-700">
              AapKaPlot Technologies Pvt. Ltd.<br />
              42 Park Street, 4th Floor<br />
              Kolkata 700016, West Bengal
            </p>
            <p className="mt-2 text-[12px] text-ink-500">India — registered office</p>
          </section>

          <Link href="/help" className="block surface-card group p-5 transition hover:border-brand-500/40">
            <p className="text-[13.5px] font-bold text-ink-900">Have a quick question?</p>
            <p className="mt-1 text-[12.5px] text-ink-500">
              Check our Help Center — most answers in 30 seconds.
            </p>
            <span className="mt-3 inline-block text-[12.5px] font-bold text-brand-600 group-hover:underline">
              Open Help Center →
            </span>
          </Link>
        </aside>
      </div>
    </MarketingShell>
  );
}
