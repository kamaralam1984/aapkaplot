"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface PropertyAboutProps {
  description: string;
  highlights?: string[];
}

export function PropertyAbout({ description, highlights }: PropertyAboutProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = description.length > 280;

  return (
    <section className="surface-card mt-6 p-5 lg:p-6" aria-labelledby="about-title">
      <h2 id="about-title" className="text-[15px] font-bold text-ink-900">
        About this property
      </h2>

      <motion.p
        layout
        className="mt-3 text-[14px] leading-relaxed text-ink-700"
      >
        {expanded || !isLong ? description : `${description.slice(0, 260)}…`}
      </motion.p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-[13px] font-semibold text-brand-600 hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}

      {highlights && highlights.length > 0 && (
        <div className="mt-5 border-t border-ink-200/70 pt-4">
          <h3 className="text-[12.5px] font-semibold uppercase tracking-wider text-ink-500">
            What we love
          </h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {highlights.map((h, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -6 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                className="flex items-start gap-2 text-[13.5px] text-ink-700"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                {h}
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
