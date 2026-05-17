import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { getSession } from "@/lib/auth-server";
import { isSuperAdminRole } from "@/lib/session";
import { UserAdminActions } from "./UserAdminActions";
import { NewUserButton } from "./NewUserButton";

export const dynamic = "force-dynamic";

type SearchParams = { role?: string; suspended?: string; q?: string; page?: string };

const ROLE_STYLE: Record<string, string> = {
  BUYER:       "bg-ink-50 text-ink-700 border-ink-200",
  SELLER:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  AGENT:       "bg-sky-50 text-sky-700 border-sky-200",
  ADMIN:       "bg-violet-50 text-violet-700 border-violet-200",
  SUPER_ADMIN: "bg-rose-50 text-rose-700 border-rose-300",
};

const ROLE_OPTIONS = ["", "BUYER", "SELLER", "AGENT", "ADMIN", "SUPER_ADMIN"] as const;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const session = await getSession();
  const canChangePrivileged = isSuperAdminRole(session?.role);

  if (process.env.USE_DB !== "1") {
    return (
      <div className="space-y-6">
        <SectionHeader eyebrow="People" title="Users" subtitle="DB-off mode" />
        <div className="surface-card p-6 text-[13.5px] text-rose-700">
          DB is disabled (USE_DB ≠ 1). Set USE_DB=1 in .env.local and rebuild.
        </div>
      </div>
    );
  }

  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const pageSize = 25;
  const role = sp.role && ROLE_OPTIONS.includes(sp.role as never) && sp.role !== "" ? sp.role : undefined;
  const suspended = sp.suspended === "true" ? true : sp.suspended === "false" ? false : undefined;
  const q = sp.q?.trim() || undefined;

  const where: Prisma.UserWhereInput = {
    ...(role ? { role: role as Prisma.EnumUserRoleFilter["equals"] } : {}),
    ...(suspended !== undefined ? { suspended } : {}),
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
            { id: { equals: q } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" } as Prisma.UserOrderByWithRelationInput,
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: {
        id: true, email: true, phone: true, name: true,
        role: true, suspended: true, createdAt: true,
        _count: { select: { properties: true } },
      },
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <SectionHeader
          eyebrow="People"
          title="Users"
          subtitle={`Manage every user account. Total: ${total.toLocaleString("en-IN")}.`}
        />
        <NewUserButton canCreateAdmins={canChangePrivileged} />
      </div>

      <form className="surface-card flex flex-wrap items-end gap-3 p-4" method="get">
        <label className="block">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500">Search</span>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="email, name, phone or id"
            className="mt-1 h-10 w-72 rounded-lg border border-ink-200 px-3 text-[13px] focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
          />
        </label>
        <label className="block">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500">Role</span>
          <select name="role" defaultValue={role ?? ""} className="mt-1 h-10 w-40 rounded-lg border border-ink-200 px-2 text-[13px]">
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r === "" ? "All" : r}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500">Status</span>
          <select name="suspended" defaultValue={sp.suspended ?? ""} className="mt-1 h-10 w-36 rounded-lg border border-ink-200 px-2 text-[13px]">
            <option value="">All</option>
            <option value="false">Active</option>
            <option value="true">Suspended</option>
          </select>
        </label>
        <button type="submit" className="h-10 rounded-lg bg-ink-900 px-4 text-[13px] font-semibold text-white hover:bg-ink-800">
          Filter
        </button>
        <Link
          href="/admin/users"
          className="h-10 rounded-lg border border-ink-200 px-4 text-[13px] font-semibold text-ink-700 hover:bg-ink-50 inline-flex items-center"
        >
          Reset
        </Link>
      </form>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead className="bg-ink-50/60 text-[11px] uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-right">Listings</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink-500">No users.</td>
                </tr>
              )}
              {rows.map((u) => (
                <tr key={u.id} className={`border-t border-ink-200/60 hover:bg-ink-50/40 ${u.suspended ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-ink-900">{u.name ?? "—"}</div>
                    <div className="text-[11px] text-ink-400 font-mono">{u.id}</div>
                  </td>
                  <td className="px-4 py-3 text-[12.5px]">
                    <div className="text-ink-700">{u.email ?? "—"}</div>
                    <div className="text-ink-500">{u.phone?.startsWith("email:") ? "—" : u.phone ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${ROLE_STYLE[u.role] ?? ROLE_STYLE.BUYER}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{u._count.properties}</td>
                  <td className="px-4 py-3">
                    {u.suspended ? (
                      <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700">
                        Suspended
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <UserAdminActions
                      id={u.id}
                      role={u.role}
                      suspended={u.suspended}
                      isSelf={u.id === session?.uid}
                      canChangePrivileged={canChangePrivileged}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-ink-200/70 px-4 py-3 text-[12.5px] text-ink-600">
            <div>Page {page} of {pages} · {total.toLocaleString("en-IN")} users</div>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={{ query: { ...sp, page: String(page - 1) } }} className="rounded-lg border border-ink-200 px-3 py-1.5 hover:bg-ink-50">
                  ← Prev
                </Link>
              )}
              {page < pages && (
                <Link href={{ query: { ...sp, page: String(page + 1) } }} className="rounded-lg border border-ink-200 px-3 py-1.5 hover:bg-ink-50">
                  Next →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
