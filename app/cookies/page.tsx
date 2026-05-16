import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "Cookie Policy — AapKaPlot",
  description: "What cookies AapKaPlot uses, what they do, and how to control them.",
  alternates: { canonical: "/cookies" },
};

const COOKIES = [
  { name: "akp_session",        type: "Essential",  duration: "30 days",   purpose: "Keeps you signed in. HMAC-signed, httpOnly, secure.", required: true },
  { name: "akp.favorites.v1",   type: "Functional", duration: "Persistent", purpose: "Stores your saved-property list locally (localStorage, not a server cookie).", required: false },
  { name: "akp.lang.v1",        type: "Functional", duration: "Persistent", purpose: "Remembers your language preference (EN / HI / BN / TA / TE / MR).", required: false },
  { name: "akp.gps.banner.v1",  type: "Functional", duration: "Persistent", purpose: "Tracks whether you've dismissed the GPS consent banner.", required: false },
  { name: "akp.referral.code",  type: "Functional", duration: "Persistent", purpose: "Your personal referral code so you can be credited for invites.", required: false },
  { name: "_csrf",              type: "Essential",  duration: "Session",   purpose: "Protects against cross-site request forgery on form submissions.", required: true },
  { name: "__cf_bm",            type: "Essential",  duration: "30 min",    purpose: "Cloudflare bot mitigation — protects the site from abuse.", required: true },
];

export default function CookiesPage() {
  return (
    <MarketingShell
      eyebrow="Legal"
      title="Cookie Policy"
      subtitle="What we set, why we set it, and how to turn it off. We don't use ad-tracking cookies."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Cookies" }]}
    >
      <div className="space-y-10">
        <section className="surface-card p-5">
          <p className="rounded-xl bg-brand-50 px-3 py-2 text-[11.5px] font-bold uppercase tracking-wider text-brand-700">
            Effective 01 May 2026
          </p>
          <p className="mt-4 text-[14.5px] leading-relaxed text-ink-700">
            Cookies are small text files stored on your device. AapKaPlot uses cookies (and localStorage)
            only for <strong>essential and functional</strong> purposes — keeping you signed in, remembering
            your language and saved properties, and protecting the site from bots. <strong>We do not use
            third-party advertising or cross-site tracking cookies.</strong>
          </p>
        </section>

        <section>
          <h2 className="text-display-md font-display text-ink-900">Cookies we use</h2>
          <div className="mt-4 overflow-x-auto surface-card">
            <table className="w-full min-w-[720px] text-left">
              <thead className="bg-ink-50/60 text-[11.5px] font-bold uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">Duration</th>
                  <th className="px-3 py-3">Purpose</th>
                  <th className="px-5 py-3">Required?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200/70">
                {COOKIES.map((c) => (
                  <tr key={c.name} className="text-[13px] hover:bg-ink-50/50">
                    <td className="px-5 py-3 font-mono font-bold text-ink-900">{c.name}</td>
                    <td className="px-3 py-3">
                      <span className={"inline-flex rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider " +
                        (c.type === "Essential" ? "bg-rose-50 text-rose-700" : "bg-sky-50 text-sky-700")}>
                        {c.type}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-ink-700">{c.duration}</td>
                    <td className="px-3 py-3 text-ink-700">{c.purpose}</td>
                    <td className="px-5 py-3">{c.required ? "Yes" : "No (can disable)"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-display-md font-display text-ink-900">Managing cookies</h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-ink-700">
            <strong>In-app</strong> — visit <a className="text-brand-600 underline" href="/me/settings">settings</a> to
            turn off WhatsApp / SMS notifications, marketing emails, and switch language.
          </p>
          <p className="mt-3 text-[14.5px] leading-relaxed text-ink-700">
            <strong>In your browser</strong> — you can delete cookies and localStorage from any browser's
            developer settings. Note: disabling essential cookies will sign you out and break some
            features (e.g., saved properties).
          </p>
        </section>

        <section>
          <h2 className="text-display-md font-display text-ink-900">Updates</h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-ink-700">
            We'll update this page if we add or remove cookies. Material changes will be announced in-app.
          </p>
        </section>
      </div>
    </MarketingShell>
  );
}
