import { Search, BadgeCheck, MoreHorizontal } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { MOCK_USERS } from "@/lib/mock-dashboard";
import { formatRelativeTime } from "@/lib/format";

const ROLE_STYLE = {
  buyer:  "bg-ink-100 text-ink-700",
  seller: "bg-emerald-50 text-emerald-700",
  agent:  "bg-sky-50 text-sky-700",
  admin:  "bg-violet-50 text-violet-700",
} as const;

const STATUS_STYLE = {
  active:    "bg-emerald-50 text-emerald-700 border-emerald-200/70",
  suspended: "bg-rose-50 text-rose-700 border-rose-200/70",
} as const;

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="People"
        title="Users"
        subtitle="Manage buyers, sellers, agents and admins. Suspend or verify."
      />

      <div className="surface-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-ink-200/70 px-5 py-3">
          <div className="relative h-10 max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              placeholder="Search by name, phone or email…"
              className="h-10 w-full rounded-xl border border-ink-200 bg-white pl-9 pr-3 text-[13px] placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead className="bg-ink-50/50 text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3">Verified</th>
                <th className="px-3 py-3">Listings</th>
                <th className="px-3 py-3">Joined</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-5 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200/70">
              {MOCK_USERS.map((u) => (
                <tr key={u.id} className="text-[13.5px] hover:bg-ink-50/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-gradient text-[12px] font-bold text-white">
                        {u.name.slice(0, 1)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-ink-900">{u.name}</p>
                        <p className="truncate text-[12px] text-ink-500">{u.email ?? u.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${ROLE_STYLE[u.role]}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {u.verified ? (
                      <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-emerald-700">
                        <BadgeCheck className="h-3.5 w-3.5" /> Yes
                      </span>
                    ) : (
                      <span className="text-[12.5px] text-ink-500">No</span>
                    )}
                  </td>
                  <td className="px-3 py-3 font-semibold text-ink-900">{u.listings}</td>
                  <td className="px-3 py-3 text-[12.5px] text-ink-500">{formatRelativeTime(u.joinedAt)}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLE[u.status]}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button aria-label="More" className="grid h-8 w-8 place-items-center rounded-lg text-ink-700 hover:bg-ink-100">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
