"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { Container } from "./Container";
import { LanguageToggle } from "./LanguageToggle";
import { LocationChip } from "./LocationChip";
import { MoreMenu } from "./MoreMenu";
import { UserMenu } from "./UserMenu";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const NAV_LINKS = [
  { href: "/search?intent=buy",       key: "nav.buy" },
  { href: "/search?intent=rent",      key: "nav.rent" },
  { href: "/search?intent=sell",      key: "nav.sell" },
  { href: "/search?kind=flat",        key: "nav.projects" },
  { href: "/search?kind=shop",        key: "nav.commercial" },
  { href: "/search?kind=agriculture", key: "nav.agriculture" },
];

export function Navbar() {
  const [elevated, setElevated] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useT();

  useEffect(() => {
    const onScroll = () => setElevated(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        elevated
          ? "bg-white/90 backdrop-blur-xl border-b border-ink-200/70 shadow-soft"
          : "bg-white/70 backdrop-blur-md border-b border-transparent"
      )}
    >
      <Container size="wide" className="flex h-16 items-center gap-4 lg:gap-6">
        <Logo />

        {/* Location selector — live device GPS with a manual-override popover.
            Clicking opens a small panel where the user can re-trigger
            geolocation or search for the right city when WiFi/IP geo has
            them in the wrong metro. */}
        <LocationChip />


        {/* Desktop nav */}
        <nav className="ml-2 hidden flex-1 items-center justify-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-[14px] font-medium text-ink-700 transition hover:bg-ink-100/70 hover:text-ink-900"
            >
              {t(l.key)}
            </Link>
          ))}
          <MoreMenu label={t("nav.more")} />
        </nav>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-2">
          <LanguageToggle className="hidden md:inline-flex" />
          <Link href="/sell/new" className="hidden md:inline-flex">
            <Button variant="outline" size="sm">{t("nav.post")}</Button>
          </Link>
          <IconButton aria-label="Saved" className="hidden md:grid">
            <Heart className="h-[18px] w-[18px]" />
          </IconButton>
          <IconButton aria-label="Messages" className="hidden md:grid">
            <MessageCircle className="h-[18px] w-[18px]" />
          </IconButton>
          {/* Session-aware: shows avatar + dropdown when signed in, or a
              Sign In link when anonymous. Reads /api/auth/me on mount. */}
          <UserMenu />
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-ink-200 bg-white shadow-soft md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>

      {/* Mobile menu — CSS transition instead of framer-motion to avoid
          pulling the motion runtime onto every page just for a fade. */}
      {mobileOpen && (
        <div className="akp-fade-in md:hidden border-t border-ink-200/70 bg-white/95 backdrop-blur-xl">
          <Container className="flex flex-col gap-1 py-3">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink-800 hover:bg-ink-100"
              >
                {t(l.key)}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-ink-200/70 pt-3">
              <Link href="/sell/new" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" size="md" className="w-full">Post Property</Button>
              </Link>
              <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                <Button variant="primary" size="md" className="w-full">Sign In / Register</Button>
              </Link>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}

function IconButton({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "grid h-10 w-10 place-items-center rounded-xl border border-ink-200 bg-white text-ink-700 shadow-soft transition hover:border-brand-500/40 hover:text-ink-900",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
