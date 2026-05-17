"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, ChevronDown, LayoutDashboard, ListChecks, ShieldCheck, Settings, LogOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionLite {
  uid: string;
  name?: string;
  email?: string;
  role?: "buyer" | "seller" | "agent" | "admin" | "super_admin";
}

/**
 * Navbar right-side user widget.
 *  • Calls /api/auth/me on mount to know whether the visitor is signed in.
 *  • Logged-out → "Sign In" link (same shape as the previous static button).
 *  • Logged-in  → avatar pill with a dropdown to /me, /sell/listings,
 *                 /admin (super admins), /me/settings and Sign out.
 *
 * The previous Navbar always rendered "Sign In" — sellers signing in with
 * Google saw the chip persist on every page and assumed they'd been logged
 * out. This component fixes that by reading the session cookie via the
 * existing /api/auth/me endpoint.
 */
export function UserMenu({ className }: { className?: string }) {
  const [session, setSession] = useState<SessionLite | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await r.json().catch(() => ({}));
        if (!cancelled) setSession(data?.session ?? null);
      } catch {
        if (!cancelled) setSession(null);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // First-paint shimmer (avoids hydration mismatch + Sign-In flash on slow networks).
  if (session === undefined) {
    return (
      <div
        className={cn(
          "hidden h-10 w-28 items-center gap-2 rounded-xl border border-ink-200 bg-ink-100/60 md:inline-flex",
          className,
        )}
        aria-hidden
      />
    );
  }

  if (!session) {
    return (
      <Link
        href="/auth/login"
        className={cn(
          "hidden h-10 items-center gap-2 rounded-xl border border-ink-200 bg-white px-3.5 text-sm font-medium text-ink-800 shadow-soft transition hover:border-brand-500/40 md:inline-flex",
          className,
        )}
      >
        <User className="h-4 w-4 text-ink-500" />
        Sign In
      </Link>
    );
  }

  const initials = (session.name || session.email || "U")
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const role = session.role ?? "buyer";
  const isAdmin = role === "admin" || role === "super_admin";

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.refresh();
      setSession(null);
      setOpen(false);
      router.push("/");
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="hidden h-10 items-center gap-2 rounded-xl border border-ink-200 bg-white px-2 pr-2.5 text-sm font-semibold text-ink-800 shadow-soft transition hover:border-brand-500/40 md:inline-flex"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-gradient text-[12px] font-bold text-white">
          {initials}
        </span>
        <span className="max-w-[10ch] truncate">{session.name || session.email}</span>
        <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-60 rounded-2xl border border-ink-200 bg-white p-1.5 shadow-lift" role="menu">
          <div className="px-3 py-2">
            <p className="truncate text-[13px] font-bold text-ink-900">{session.name || "—"}</p>
            <p className="truncate text-[11.5px] text-ink-500">{session.email}</p>
            {role !== "buyer" && (
              <span className="mt-1 inline-flex rounded-full bg-ink-100 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-700">
                {role.replace("_", " ")}
              </span>
            )}
          </div>

          <div className="my-1 h-px bg-ink-200/70" />

          <MenuLink href="/me" icon={<LayoutDashboard className="h-4 w-4" />} onClick={() => setOpen(false)}>
            Dashboard
          </MenuLink>
          <MenuLink href="/sell/listings" icon={<ListChecks className="h-4 w-4" />} onClick={() => setOpen(false)}>
            My listings
          </MenuLink>
          {isAdmin && (
            <MenuLink href="/admin" icon={<ShieldCheck className="h-4 w-4" />} onClick={() => setOpen(false)}>
              Admin panel
            </MenuLink>
          )}
          <MenuLink href="/me/settings" icon={<Settings className="h-4 w-4" />} onClick={() => setOpen(false)}>
            Settings
          </MenuLink>

          <div className="my-1 h-px bg-ink-200/70" />

          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
            role="menuitem"
          >
            {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href, icon, onClick, children,
}: {
  href: string;
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      role="menuitem"
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-800 transition hover:bg-ink-100/70"
    >
      <span className="text-ink-500">{icon}</span>
      {children}
    </Link>
  );
}
