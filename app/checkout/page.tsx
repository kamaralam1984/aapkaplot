import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Checkout — coming soon",
  description:
    "AapKaPlot online payments are temporarily disabled. Boosts and verifications still work — our team will reach out for direct billing.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <>
      <Navbar />
      <main className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="surface-card mx-auto max-w-xl p-8 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-violet-700">
              <Sparkles className="h-6 w-6" />
            </span>
            <h1 className="mt-4 text-[24px] font-bold text-ink-900">
              Online payments are paused
            </h1>
            <p className="mt-2 text-[14px] text-ink-600">
              We&apos;re upgrading our payment system. Boosts, premium listings
              and verification continue to work — our team will reach out for
              direct billing within 24 hours of your request.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link href="/sell">
                <Button variant="primary" size="md">
                  Back to seller dashboard
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="md">
                  Contact support
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
