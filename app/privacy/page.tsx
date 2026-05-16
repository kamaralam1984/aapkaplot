import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { LegalArticle } from "@/components/marketing/LegalArticle";

export const metadata: Metadata = {
  title: "Privacy Policy — AapKaPlot",
  description: "How AapKaPlot collects, stores, and protects your data — written in plain English, no dark patterns.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <MarketingShell
      eyebrow="Legal"
      title="Privacy Policy"
      subtitle="Plain English. No dark patterns. Your data stays yours."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Privacy" }]}
    >
      <LegalArticle
        effectiveDate="01 May 2026"
        sections={[
          {
            id: "what-we-collect",
            heading: "What we collect",
            body: (
              <>
                <p>
                  When you use AapKaPlot, we collect only what's needed to deliver the service:
                </p>
                <ul className="list-disc pl-6">
                  <li><strong>Account info</strong> — phone number, optional email, name, role (buyer/seller/agent).</li>
                  <li><strong>Verification documents</strong> — Aadhaar, PAN, or property title (encrypted at rest; only used by our verification team).</li>
                  <li><strong>Property data</strong> — listings, photos, videos, location you choose to share.</li>
                  <li><strong>Activity</strong> — searches, saves, visits scheduled, lead contacts (used to rank recommendations and detect fraud).</li>
                  <li><strong>Device + diagnostics</strong> — browser, IP, approximate location (only when you grant GPS permission).</li>
                </ul>
              </>
            ),
          },
          {
            id: "how-we-use",
            heading: "How we use it",
            body: (
              <ul className="list-disc pl-6">
                <li>Show nearby property recommendations ranked by AI.</li>
                <li>Verify owner authenticity and prevent fake listings.</li>
                <li>Send OTPs, WhatsApp alerts, visit reminders.</li>
                <li>Aggregate (never personal) heatmaps for our analytics.</li>
                <li>Comply with Indian real-estate, KYC and tax laws.</li>
              </ul>
            ),
          },
          {
            id: "who-we-share-with",
            heading: "Who we share with",
            body: (
              <>
                <p>We share only what's strictly necessary, only with these parties:</p>
                <ul className="list-disc pl-6">
                  <li>Property sellers you choose to contact (your name + phone, never address).</li>
                  <li>Payment processor (Razorpay) — only for transaction details.</li>
                  <li>SMS/WhatsApp provider — for OTP and visit alerts.</li>
                  <li>Indian tax authorities — when legally required.</li>
                </ul>
                <p><strong>We never sell your data.</strong> Not to brokers, not to ad networks, not to anyone.</p>
              </>
            ),
          },
          {
            id: "your-rights",
            heading: "Your rights",
            body: (
              <ul className="list-disc pl-6">
                <li><strong>Access</strong> — download all your data anytime from <code>/me/settings</code>.</li>
                <li><strong>Correction</strong> — edit profile, listings or visit history yourself.</li>
                <li><strong>Deletion</strong> — request full account deletion at <a href="mailto:aapkaplots@gmail.com" className="text-brand-600 underline">aapkaplots@gmail.com</a>. We delete within 30 days.</li>
                <li><strong>Portability</strong> — exported as JSON, no lock-in.</li>
                <li><strong>Withdraw consent</strong> — turn off WhatsApp / SMS notifications from settings.</li>
              </ul>
            ),
          },
          {
            id: "retention",
            heading: "How long we keep data",
            body: (
              <ul className="list-disc pl-6">
                <li>Account data: until you delete your account.</li>
                <li>Verification documents: 18 months after listing closes, then deleted.</li>
                <li>Search + activity logs: 12 months rolling.</li>
                <li>Transaction records: 7 years (Indian Income Tax Act requirement).</li>
              </ul>
            ),
          },
          {
            id: "security",
            heading: "Security",
            body: (
              <p>
                All traffic is TLS 1.3 encrypted via Cloudflare. Passwords are hashed with bcrypt.
                Verification documents are encrypted at rest with AES-256. Production systems
                require 2FA. We run security audits quarterly.
              </p>
            ),
          },
          {
            id: "cookies",
            heading: "Cookies",
            body: (
              <p>
                See our <a href="/cookies" className="text-brand-600 underline">Cookie Policy</a> for the
                full list. Essential cookies (session, CSRF, security) cannot be disabled. Analytics
                and preference cookies are optional and can be turned off from settings.
              </p>
            ),
          },
          {
            id: "children",
            heading: "Children",
            body: <p>AapKaPlot is for users 18+. We do not knowingly collect data from minors.</p>,
          },
          {
            id: "contact",
            heading: "Contact our DPO",
            body: (
              <p>
                Questions, complaints, or data requests:{" "}
                <a href="mailto:aapkaplots@gmail.com" className="text-brand-600 underline">
                  aapkaplots@gmail.com
                </a>{" "}
                — our Data Protection Officer replies within 5 business days.
              </p>
            ),
          },
        ]}
      />
    </MarketingShell>
  );
}
