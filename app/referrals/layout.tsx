import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Referrals — Earn ₹500 per friend",
  description: "Invite friends to AapKaPlot. You both get ₹500 when they buy or list a property. Stack rewards into wallet credit usable on Premium plans.",
  alternates: { canonical: "/referrals" },
};

export default function ReferralsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
