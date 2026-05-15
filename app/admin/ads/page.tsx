import { Megaphone, Plus } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { Button } from "@/components/ui/Button";
import { formatInr } from "@/lib/format";

const ADS = [
  { id: "ad1", title: "Festive plots in Howrah",       advertiser: "Sunshine Developers", impressions: 14_812, clicks: 312, spendInr: 18_500, status: "Live" },
  { id: "ad2", title: "Premium 3BHK launch — New Town", advertiser: "Anik Builders",       impressions: 22_109, clicks: 487, spendInr: 32_000, status: "Live" },
  { id: "ad3", title: "Lakeside villas tour",            advertiser: "Lotus Realty",        impressions: 8_602,  clicks: 145, spendInr: 9_400,  status: "Paused" },
];

export default function AdminAdsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Revenue"
        title="Ads & promotions"
        subtitle="Active campaigns across homepage banners and AI Recommendations slots."
        actions={
          <Button variant="primary" size="md" iconLeft={<Plus className="h-4 w-4" />}>
            New campaign
          </Button>
        }
      />

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="bg-ink-50/50 text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-5 py-3">Campaign</th>
                <th className="px-3 py-3">Advertiser</th>
                <th className="px-3 py-3">Impr.</th>
                <th className="px-3 py-3">Clicks</th>
                <th className="px-3 py-3">CTR</th>
                <th className="px-3 py-3">Spend</th>
                <th className="px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200/70">
              {ADS.map((a) => {
                const ctr = ((a.clicks / Math.max(1, a.impressions)) * 100).toFixed(2);
                return (
                  <tr key={a.id} className="text-[13.5px] hover:bg-ink-50/50">
                    <td className="px-5 py-3 font-bold text-ink-900">
                      <Megaphone className="mr-2 inline h-4 w-4 text-brand-500" />
                      {a.title}
                    </td>
                    <td className="px-3 py-3 text-ink-700">{a.advertiser}</td>
                    <td className="px-3 py-3 text-ink-700">{a.impressions.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-3 text-ink-700">{a.clicks.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-3 font-semibold text-ink-900">{ctr}%</td>
                    <td className="px-3 py-3 font-semibold text-ink-900">{formatInr(a.spendInr)}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        a.status === "Live"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-ink-100 text-ink-700"
                      }`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
