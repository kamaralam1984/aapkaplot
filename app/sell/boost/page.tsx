import Link from "next/link";
import { Rocket, Star, Zap } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { Button } from "@/components/ui/Button";
import { formatInr } from "@/lib/format";

const PACKS = [
  { id: "spotlight", label: "Spotlight (7 days)",      price: 499,  desc: "Top of search for 7 days in your city.",        icon: <Star className="h-5 w-5" />, tone: "bg-amber-50 text-amber-600" },
  { id: "featured",  label: "Featured (30 days)",      price: 1499, desc: "Appears on homepage AI Recommendations.",         icon: <Rocket className="h-5 w-5" />, tone: "bg-emerald-50 text-emerald-600" },
  { id: "turbo",     label: "Turbo (30 days)",         price: 2999, desc: "Spotlight + Featured + verified-priority badge.", icon: <Zap className="h-5 w-5" />, tone: "bg-violet-50 text-violet-600" },
];

export default function BoostPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Get more leads"
        title="Boost your listings"
        subtitle="Premium placement on AapKaPlot search, homepage and AI recommendations."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {PACKS.map((p) => (
          <div key={p.id} className="surface-card relative overflow-hidden p-5">
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${p.tone}`}>{p.icon}</span>
            <h3 className="mt-3 text-[15px] font-bold text-ink-900">{p.label}</h3>
            <p className="mt-1 text-[12.5px] text-ink-500">{p.desc}</p>
            <p className="mt-4 text-2xl font-bold text-ink-900">{formatInr(p.price)}</p>
            <Link href={`/checkout?plan=${p.id}`} className="mt-4 block">
              <Button variant="primary" size="md" className="w-full">
                Boost a listing
              </Button>
            </Link>
          </div>
        ))}
      </div>

      <p className="text-center text-[12.5px] text-ink-500">
        Need a custom plan?{" "}
        <Link href="/pricing" className="font-semibold text-brand-600 hover:underline">
          See all pricing
        </Link>
      </p>
    </div>
  );
}
