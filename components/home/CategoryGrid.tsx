"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trees, Building, Home as HomeIcon, Building2, Sprout, House,
  Castle, Store, Briefcase, Warehouse, Upload, ArrowRight,
} from "lucide-react";
import { PROPERTY_CATEGORIES } from "@/lib/mock-data";
import { Container } from "@/components/layout/Container";

const ICONS: Record<string, React.ReactNode> = {
  trees: <Trees className="h-6 w-6" />,
  building: <Building className="h-6 w-6" />,
  home: <HomeIcon className="h-6 w-6" />,
  "building-2": <Building2 className="h-6 w-6" />,
  sprout: <Sprout className="h-6 w-6" />,
  house: <House className="h-6 w-6" />,
  castle: <Castle className="h-6 w-6" />,
  store: <Store className="h-6 w-6" />,
  briefcase: <Briefcase className="h-6 w-6" />,
  warehouse: <Warehouse className="h-6 w-6" />,
};

const ICON_TONE: Record<string, string> = {
  plot:        "bg-amber-50 text-amber-600",
  flat:        "bg-sky-50 text-sky-600",
  house:       "bg-emerald-50 text-emerald-600",
  commercial:  "bg-violet-50 text-violet-600",
  agriculture: "bg-lime-50 text-lime-600",
  independent: "bg-rose-50 text-rose-600",
  villa:       "bg-amber-50 text-amber-600",
  shop:        "bg-pink-50 text-pink-600",
  office:      "bg-blue-50 text-blue-600",
  warehouse:   "bg-slate-100 text-slate-700",
};

export function CategoryGrid() {
  return (
    <section className="mt-10 lg:mt-14">
      <Container size="wide">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11">
          {PROPERTY_CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.025 }}
            >
              <Link
                href={`/${cat.id}`}
                className="group flex h-[120px] flex-col items-center justify-center gap-2.5 rounded-2xl border border-ink-200/70 bg-white p-3 text-center shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-card"
              >
                <span
                  className={`grid h-12 w-12 place-items-center rounded-xl ${ICON_TONE[cat.id] ?? "bg-ink-100 text-ink-700"} transition group-hover:scale-105`}
                >
                  {ICONS[cat.icon]}
                </span>
                <span className="text-[12.5px] font-semibold leading-tight text-ink-800">
                  {cat.label}
                </span>
              </Link>
            </motion.div>
          ))}

          {/* CTA tile */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.3 }}
            className="col-span-3 sm:col-span-4 md:col-span-6 lg:col-span-1"
          >
            <Link
              href="/sell"
              className="group flex h-[120px] flex-col items-center justify-center gap-1 rounded-2xl bg-brand-gradient p-3 text-center text-white shadow-glow transition hover:brightness-105 lg:items-start lg:p-3.5 lg:text-left"
            >
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold uppercase tracking-wider opacity-90">
                <Upload className="h-3.5 w-3.5" /> Post Property Free
              </span>
              <span className="text-[12.5px] leading-tight text-white/90">
                Reach thousands of buyers
              </span>
              <span className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold underline-offset-2 group-hover:underline">
                Post Now <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
