import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { LegalArticle } from "@/components/marketing/LegalArticle";

export const metadata: Metadata = {
  title: "Terms of Service — AapKaPlot",
  description: "The legal agreement between you and AapKaPlot when using our platform.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <MarketingShell
      eyebrow="Legal"
      title="Terms of Service"
      subtitle="The agreement between you and AapKaPlot Technologies Pvt. Ltd. when using our website, app or APIs."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Terms" }]}
    >
      <LegalArticle
        effectiveDate="01 May 2026"
        sections={[
          {
            id: "acceptance",
            heading: "Acceptance of terms",
            body: (
              <p>
                By creating an account, listing a property, or using any part of AapKaPlot, you agree
                to these Terms. If you don't agree, please don't use the service.
              </p>
            ),
          },
          {
            id: "eligibility",
            heading: "Eligibility",
            body: (
              <ul className="list-disc pl-6">
                <li>You must be 18 years or older.</li>
                <li>You must be legally allowed to own / transact property in India.</li>
                <li>Sellers must own (or be authorised by the owner of) the listed property.</li>
              </ul>
            ),
          },
          {
            id: "your-account",
            heading: "Your account",
            body: (
              <p>
                You're responsible for keeping your phone, OTP, and devices secure. Notify us at{" "}
                <a href="mailto:security@aapkaplot.com" className="text-brand-600 underline">
                  security@aapkaplot.com
                </a>{" "}
                immediately if you suspect unauthorised access.
              </p>
            ),
          },
          {
            id: "listings",
            heading: "Property listings",
            body: (
              <>
                <p>By posting a listing, you warrant that:</p>
                <ul className="list-disc pl-6">
                  <li>You're the owner or have written authorisation from the owner.</li>
                  <li>All photos, videos and documents are genuine and your own.</li>
                  <li>Price, area, age and amenity claims are accurate.</li>
                  <li>The property is legally transferable / rentable as listed.</li>
                </ul>
                <p>
                  AapKaPlot reserves the right to remove any listing that violates these terms, our{" "}
                  community guidelines, or Indian law (especially RERA).
                </p>
              </>
            ),
          },
          {
            id: "fees",
            heading: "Fees & payments",
            body: (
              <ul className="list-disc pl-6">
                <li>Posting up to 2 listings is free.</li>
                <li>Premium plans, Spotlight/Featured/Turbo boosts have one-time or monthly fees as displayed.</li>
                <li>GST applies at 18%. You'll receive a tax invoice for every payment.</li>
                <li>Refunds within 24 hours of purchase. After 24 hours, refunds at AapKaPlot's discretion.</li>
              </ul>
            ),
          },
          {
            id: "no-brokerage",
            heading: "AapKaPlot is not a broker",
            body: (
              <p>
                We are a technology platform. Transactions happen directly between buyer and seller.
                AapKaPlot does not represent either party, does not guarantee the property's legal status,
                and is not liable for the final transaction outcome. Always conduct your own due diligence
                — RERA verification, legal title check, and ideally a property lawyer.
              </p>
            ),
          },
          {
            id: "prohibited",
            heading: "Prohibited use",
            body: (
              <p>You won't use AapKaPlot to:</p>
            ),
          },
          {
            id: "prohibited-list",
            heading: "Specifically — none of this",
            body: (
              <ul className="list-disc pl-6">
                <li>Post fake, duplicate or misleading listings.</li>
                <li>Scrape, crawl, or auto-extract data without written permission.</li>
                <li>Spam buyers or sellers with unsolicited messages.</li>
                <li>Impersonate another person or entity.</li>
                <li>Bypass payment, verification or security measures.</li>
                <li>List property in violation of RERA, FEMA, or local laws.</li>
              </ul>
            ),
          },
          {
            id: "termination",
            heading: "Termination",
            body: (
              <p>
                We may suspend or terminate your account if you violate these Terms, post fraudulent
                content, or harm other users. You can close your account anytime from settings.
              </p>
            ),
          },
          {
            id: "liability",
            heading: "Limitation of liability",
            body: (
              <p>
                AapKaPlot is provided "as is". To the extent permitted by Indian law, our total
                liability across all claims is limited to the fees you've paid us in the last 12 months
                (or ₹10,000, whichever is higher).
              </p>
            ),
          },
          {
            id: "jurisdiction",
            heading: "Jurisdiction",
            body: (
              <p>
                These Terms are governed by the laws of India. Any disputes are subject to the
                exclusive jurisdiction of the courts of Kolkata, West Bengal.
              </p>
            ),
          },
          {
            id: "changes",
            heading: "Changes to these terms",
            body: (
              <p>
                We may update these Terms occasionally. Material changes will be emailed and shown
                in-app. Continued use after a change means acceptance.
              </p>
            ),
          },
        ]}
      />
    </MarketingShell>
  );
}
