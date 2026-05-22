import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users,
  TrendingUp,
  Star,
  MessageCircle,
  PhoneCall,
  IndianRupee,
} from "lucide-react";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { LeadScoreBadge } from "./LeadScoreBadge";
import { LeadStatusSelect } from "./LeadStatusSelect";

export const dynamic = "force-dynamic";

// ── Types ─────────────────────────────────────────────────────────────────────

type LeadStatus = "new" | "contacted" | "qualified" | "lost";
type BuyerType = "serious" | "investor" | "urgent" | "casual" | "spam";

interface CrmLead {
  id: string;
  name: string;
  phone: string;
  budget: number | null;      // lakhs
  score: number;
  buyerType: BuyerType | string;
  status: LeadStatus | string;
  propertyTitle: string;
  propertyCity: string;
  createdAt: Date;
}

// ── Mock data (USE_DB !== "1") ─────────────────────────────────────────────────

const MOCK_LEADS: CrmLead[] = [
  { id: "1", name: "Rahul Sharma",    phone: "9876541234", budget: 65, score: 85, buyerType: "serious",  status: "new",       propertyTitle: "3BHK Flat in Patna",      propertyCity: "Patna",    createdAt: new Date(Date.now() - 1000 * 60 * 30) },
  { id: "2", name: "Priya Singh",     phone: "9123456789", budget: 35, score: 62, buyerType: "investor", status: "contacted", propertyTitle: "2BHK in Boring Road",     propertyCity: "Patna",    createdAt: new Date(Date.now() - 1000 * 60 * 90) },
  { id: "3", name: "Amit Kumar",      phone: "8765432109", budget: 22, score: 45, buyerType: "urgent",   status: "new",       propertyTitle: "Plot in Danapur",         propertyCity: "Patna",    createdAt: new Date(Date.now() - 1000 * 60 * 180) },
  { id: "4", name: "Sunita Devi",     phone: "7654321098", budget: 12, score: 25, buyerType: "casual",   status: "qualified", propertyTitle: "1BHK Studio",             propertyCity: "Muzaffarpur", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5) },
  { id: "5", name: "Vikram Tiwari",   phone: "9988776655", budget: 80, score: 92, buyerType: "serious",  status: "new",       propertyTitle: "Villa in Gaya",           propertyCity: "Gaya",     createdAt: new Date(Date.now() - 1000 * 60 * 10) },
  { id: "6", name: "Neha Gupta",      phone: "8877665544", budget: 18, score: 12, buyerType: "spam",     status: "lost",      propertyTitle: "2BHK Flat in Bhagalpur",  propertyCity: "Bhagalpur",createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function maskPhone(phone: string): string {
  const clean = phone.replace(/\D/g, "").slice(-10);
  if (clean.length < 10) return phone;
  return `+91 ${clean.slice(0, 2)}****${clean.slice(6)}`;
}

function timeAgo(date: Date): string {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60)   return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function borderColor(buyerType: string): string {
  const map: Record<string, string> = {
    serious:  "border-l-emerald-500",
    investor: "border-l-amber-500",
    urgent:   "border-l-orange-500",
    casual:   "border-l-slate-400",
    spam:     "border-l-red-400",
  };
  return map[buyerType] ?? "border-l-slate-300";
}

function waLink(phone: string, propertyTitle: string): string {
  const clean = phone.replace(/\D/g, "").slice(-10);
  const text = encodeURIComponent(
    `Namaste! AapKaPlot par aapki property "${propertyTitle}" ke baare mein inquiry aayi hai. Kya aap baat kar sakte hain?`,
  );
  return `https://wa.me/91${clean}?text=${text}`;
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    new:       "bg-sky-100 text-sky-800",
    contacted: "bg-violet-100 text-violet-800",
    qualified: "bg-emerald-100 text-emerald-800",
    lost:      "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${map[status] ?? "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}

// ── No-DB banner ──────────────────────────────────────────────────────────────

function MockBanner() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
      <strong>Demo mode</strong> — showing mock leads. Set <code className="rounded bg-amber-100 px-1">USE_DB=1</code> to connect to live data.
    </div>
  );
}

// ── Lead row ──────────────────────────────────────────────────────────────────

function LeadRow({ lead }: { lead: CrmLead }) {
  return (
    <tr className={`group border-l-4 ${borderColor(lead.buyerType)} bg-white hover:bg-slate-50 transition-colors`}>
      {/* Buyer */}
      <td className="px-4 py-3">
        <p className="text-[13px] font-semibold text-ink-900">{lead.name}</p>
        <p className="text-[11px] text-ink-500 font-mono">{maskPhone(lead.phone)}</p>
      </td>
      {/* Property */}
      <td className="px-4 py-3 text-[12px] text-ink-700">
        <p className="font-medium">{lead.propertyTitle}</p>
        <p className="text-ink-500">{lead.propertyCity}</p>
      </td>
      {/* Budget */}
      <td className="px-4 py-3 text-[12px] text-ink-700">
        {lead.budget ? (
          <span className="inline-flex items-center gap-0.5">
            <IndianRupee className="h-3 w-3" />
            {lead.budget}L
          </span>
        ) : (
          <span className="text-ink-400">—</span>
        )}
      </td>
      {/* Score badge */}
      <td className="px-4 py-3">
        <LeadScoreBadge score={lead.score} buyerType={lead.buyerType} />
      </td>
      {/* Status */}
      <td className="px-4 py-3">
        <LeadStatusSelect leadId={lead.id} initialStatus={lead.status} />
      </td>
      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <a
            href={waLink(lead.phone, lead.propertyTitle)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-600 transition-colors"
            title="WhatsApp"
          >
            <MessageCircle className="h-3 w-3" />
            WhatsApp
          </a>
          <a
            href={`tel:+91${lead.phone.replace(/\D/g, "").slice(-10)}`}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-ink-600 hover:bg-slate-50 transition-colors"
            title="Call"
          >
            <PhoneCall className="h-3 w-3" />
            Call
          </a>
        </div>
      </td>
      {/* Time */}
      <td className="px-4 py-3 text-[11px] text-ink-400 whitespace-nowrap">
        {timeAgo(lead.createdAt)}
      </td>
    </tr>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default async function BuilderCrmPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string>>;
}) {
  const session = await getSession();
  if (!session) redirect("/auth/login?next=/builder/crm");

  const params: Record<string, string> = await (searchParams ?? Promise.resolve({}));
  const activeFilter = params.filter ?? "all";

  const useDb = process.env.USE_DB === "1";
  let leads: CrmLead[] = [];
  let tier = "Free";

  if (!useDb) {
    leads = MOCK_LEADS;
  } else {
    // Fetch user's properties and their received leads
    const dbLeads = await prisma.lead.findMany({
      where: { toUserId: session.uid },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        fromUser: { select: { name: true, phone: true } },
        property: { select: { title: true, city: true, priceInr: true } },
      },
    });

    leads = dbLeads.map((l) => ({
      id:             l.id,
      name:           l.fromUser.name ?? "Unknown",
      phone:          l.fromUser.phone ?? "",
      budget:         l.offerAmountInr ? Math.round(l.offerAmountInr / 100000) : null,
      score:          l.leadScore ?? 0,
      buyerType:      (l.buyerType ?? "casual") as BuyerType,
      status:         l.status,
      propertyTitle:  l.property.title,
      propertyCity:   l.property.city,
      createdAt:      l.createdAt,
    }));

    // Try to get subscription tier
    try {
      const sub = await prisma.builderSubscription.findFirst({
        where: { userId: session.uid, status: "ACTIVE" },
        select: { tier: true },
      });
      tier = sub?.tier ?? "Free";
    } catch { /* non-fatal */ }
  }

  // Stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalLeads     = leads.length;
  const newToday       = leads.filter((l) => l.createdAt >= today).length;
  const qualified      = leads.filter((l) => l.status === "qualified").length;
  const contacted      = leads.filter((l) => l.status === "contacted" || l.status === "qualified").length;
  const conversionRate = totalLeads > 0 ? Math.round((qualified / totalLeads) * 100) : 0;

  // Filter
  const filtered = leads.filter((l) => {
    if (activeFilter === "all")        return true;
    if (activeFilter === "high-score") return l.score >= 70;
    return l.status === activeFilter;
  });

  const FILTER_TABS: { key: string; label: string }[] = [
    { key: "all",        label: `All (${totalLeads})` },
    { key: "new",        label: `New (${leads.filter((l) => l.status === "new").length})` },
    { key: "contacted",  label: `Contacted (${leads.filter((l) => l.status === "contacted").length})` },
    { key: "qualified",  label: `Qualified (${qualified})` },
    { key: "lost",       label: `Lost (${leads.filter((l) => l.status === "lost").length})` },
    { key: "high-score", label: `High Score >70` },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <SectionHeader
        eyebrow={`Builder CRM · ${tier} plan`}
        title="Lead Management"
        subtitle="Track, score, and contact buyers who have shown interest in your listings."
      />

      {!useDb && <MockBanner />}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Leads"      value={totalLeads}         icon={Users}       tone="sky" />
        <StatCard label="New Today"        value={newToday}           icon={Star}        tone="amber" />
        <StatCard label="Qualified"        value={qualified}          icon={TrendingUp}  tone="emerald" />
        <StatCard label="Conversion Rate"  value={`${conversionRate}%`} icon={TrendingUp} tone="violet" />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {FILTER_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/builder/crm?filter=${tab.key}`}
            className={`rounded-full px-3 py-1 text-[12px] font-semibold transition-colors ${
              activeFilter === tab.key
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-ink-600 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Lead table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center text-ink-400">
          <Users className="mx-auto mb-3 h-8 w-8 opacity-40" />
          <p className="text-[14px]">No leads found for this filter.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-4 py-3">Buyer</th>
                  <th className="px-4 py-3">Property</th>
                  <th className="px-4 py-3">Budget</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                  <th className="px-4 py-3">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((lead) => (
                  <LeadRow key={lead.id} lead={lead} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
