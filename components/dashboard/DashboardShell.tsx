"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, ChevronDown, Menu, X, Search, LogOut,
  LayoutDashboard, Heart, CalendarDays, BellRing, Sparkles, MessagesSquare, Settings,
  ListChecks, Inbox, BarChart3, Plus, Rocket,
  ShieldAlert, Users, Activity, Megaphone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { cn } from "@/lib/utils";

// ── Icon registry — server layouts pass a `string` key, the shell renders it.
// This avoids the "Functions cannot be passed to Client Components" boundary
// error you get when handing a Lucide component reference across the line.
const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  heart: Heart,
  calendar: CalendarDays,
  bell: BellRing,
  sparkles: Sparkles,
  messages: MessagesSquare,
  settings: Settings,
  listings: ListChecks,
  inbox: Inbox,
  analytics: BarChart3,
  plus: Plus,
  rocket: Rocket,
  shield: ShieldAlert,
  users: Users,
  activity: Activity,
  ads: Megaphone,
};

export type DashboardIconKey = keyof typeof ICONS;

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: DashboardIconKey;
  badge?: number | string;
}

interface DashboardShellProps {
  brand: { label: string; tone: "emerald" | "sky" | "violet" };
  nav: DashboardNavItem[];
  user: { name: string; phone?: string; role?: string };
  children: React.ReactNode;
}

const TONE_RING: Record<DashboardShellProps["brand"]["tone"], string> = {
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
  sky: "bg-sky-50 text-sky-700 border-sky-200/70",
  violet: "bg-violet-50 text-violet-700 border-violet-200/70",
};

export function DashboardShell({ brand, nav, user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  return (
    <div className="grid min-h-screen bg-surface-subtle lg:grid-cols-[260px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 z-30 hidden h-screen flex-col border-r border-ink-200/70 bg-white lg:flex">
        <div className="border-b border-ink-200/70 px-5 py-5">
          <Logo />
          <span
            className={cn(
              "mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
              TONE_RING[brand.tone]
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {brand.label}
          </span>
        </div>
        <NavList items={nav} pathname={pathname} />
        <UserPanel user={user} onLogout={logout} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-ink-200/70 bg-white/95 px-4 backdrop-blur-xl lg:hidden">
        <Logo />
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            className="grid h-10 w-10 place-items-center rounded-xl border border-ink-200 bg-white text-ink-700 shadow-soft"
          >
            <Bell className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-ink-200 bg-white text-ink-700 shadow-soft"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 280 }}
              className="fixed inset-y-0 left-0 z-[90] flex w-[280px] flex-col bg-white shadow-lift lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-ink-200/70 px-5 py-4">
                <Logo />
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setMobileOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-full bg-ink-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <NavList items={nav} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
              <UserPanel user={user} onLogout={logout} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="min-w-0">
        {/* Desktop top bar */}
        <div className="sticky top-0 z-20 hidden h-16 items-center justify-between border-b border-ink-200/70 bg-white/85 px-6 backdrop-blur-xl lg:flex">
          <div className="relative h-10 max-w-md flex-1 ">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              placeholder="Search listings, leads, users…"
              className="h-10 w-full rounded-xl border border-ink-200 bg-white pl-9 pr-3 text-[13.5px] placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Notifications"
              className="relative grid h-10 w-10 place-items-center rounded-xl border border-ink-200 bg-white text-ink-700 shadow-soft hover:border-brand-500/40"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
            </button>
          </div>
        </div>

        <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </div>
    </div>
  );
}

function NavList({
  items,
  pathname,
  onNavigate,
}: {
  items: DashboardNavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      <ul className="space-y-1">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href + "/"));
          const Icon = ICONS[item.icon] ?? LayoutDashboard;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-700 hover:bg-ink-100/60"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    active ? "text-brand-600" : "text-ink-500 group-hover:text-ink-800"
                  )}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge != null && (
                  <span
                    className={cn(
                      "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10.5px] font-bold",
                      active
                        ? "bg-brand-500 text-white"
                        : "bg-ink-200 text-ink-700"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function UserPanel({
  user,
  onLogout,
}: {
  user: { name: string; phone?: string; role?: string };
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-ink-200/70 p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-ink-100/60"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-gradient text-[13px] font-bold text-white">
          {user.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold text-ink-900">
            {user.name}
          </span>
          <span className="block truncate text-[11.5px] text-ink-500">
            {user.phone ?? user.role ?? "Account"}
          </span>
        </span>
        <ChevronDown className={cn("h-4 w-4 text-ink-400 transition", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-1 space-y-1 rounded-xl bg-ink-50/70 p-1">
          <Link
            href="/me/settings"
            className="block rounded-lg px-3 py-2 text-[12.5px] font-medium text-ink-700 hover:bg-white"
          >
            Account settings
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12.5px] font-medium text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
