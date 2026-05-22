"use client";

import { useState, useEffect } from "react";

const SIGNALS = [
  "🔥 3 buyers viewed this area in the last hour",
  "👁 142 people browsing properties right now",
  "⚡ 2 site visits booked today in Patna",
  "📈 Prices up 4% this month in Ranchi",
];

export function UrgencySignals() {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % SIGNALS.length);
        setVisible(true);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-amber-50 border-y border-amber-100 py-2.5 px-4">
      <div className="max-w-5xl mx-auto flex items-center justify-center">
        <p
          className="text-xs sm:text-sm text-amber-800 font-medium text-center transition-opacity duration-400"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {SIGNALS[current]}
        </p>
      </div>
    </div>
  );
}
