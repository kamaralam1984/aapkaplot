"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, Heart, MapPin, MessageCircle, Menu, X, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "./Logo";
import { Container } from "./Container";
import { LanguageToggle } from "./LanguageToggle";
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

        {/* Location selector */}
        <button
          type="button"
          className="hidden h-10 items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3.5 text-sm font-medium text-ink-700 shadow-soft transition hover:border-brand-500/40 hover:text-ink-900 md:inline-flex"
        >
          <MapPin className="h-4 w-4 text-brand-500" />
          Kolkata
          <ChevronDown className="h-4 w-4 text-ink-400" />
        </button>

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
          <button className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[14px] font-medium text-ink-700 transition hover:bg-ink-100/70 hover:text-ink-900">
            {t("nav.more")} <ChevronDown className="h-4 w-4 text-ink-400" />
          </button>
        </nav>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-2">
          <LanguageToggle className="hidden md:inline-flex" />
          <Button variant="outline" size="sm" className="hidden md:inline-flex">
            {t("nav.post")}
          </Button>
          <IconButton aria-label="Saved" className="hidden md:grid">
            <Heart className="h-[18px] w-[18px]" />
          </IconButton>
          <IconButton aria-label="Messages" className="hidden md:grid">
            <MessageCircle className="h-[18px] w-[18px]" />
          </IconButton>
          <Link
            href="/auth/login"
            className="hidden h-10 items-center gap-2 rounded-xl border border-ink-200 bg-white px-3.5 text-sm font-medium text-ink-800 shadow-soft transition hover:border-brand-500/40 md:inline-flex"
          >
            <User className="h-4 w-4 text-ink-500" />
            {t("nav.signin")}
          </Link>
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

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-ink-200/70 bg-white/95 backdrop-blur-xl"
          >
            <Container className="flex flex-col gap-1 py-3">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink-800 hover:bg-ink-100"
                >
                  {l.label}
                </Link>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-ink-200/70 pt-3">
                <Button variant="outline" size="md">Post Property</Button>
                <Button variant="primary" size="md">Sign In / Register</Button>
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
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
