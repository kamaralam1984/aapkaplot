"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  id: string;
  title: string;
  city: string;
  priceInr: string;
  tag: string;
  tagLabel: string;
  tagColor: string;
  featuredUntil: string;
}

export function PromotionRow({ id, title, city, priceInr, tagLabel, tagColor, featuredUntil }: Props) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    if (!confirm(`Remove promotion for "${title}"?`)) return;
    setRemoving(true);
    await fetch(`/api/admin/promotions/${id}`, { method: "DELETE" });
    router.refresh();
  }

  const expiry = featuredUntil
    ? new Date(featuredUntil).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  return (
    <tr className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
      <td className="px-4 py-3 text-ink-800 font-medium max-w-[220px] truncate">{title}</td>
      <td className="px-4 py-3 text-ink-500">{city}</td>
      <td className="px-4 py-3 text-ink-700">{priceInr}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${tagColor}`}>
          {tagLabel}
        </span>
      </td>
      <td className="px-4 py-3 text-ink-400">{expiry}</td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={handleRemove}
          disabled={removing}
          className="text-[12px] text-rose-600 hover:text-rose-800 disabled:opacity-40 transition-colors"
        >
          {removing ? "Removing…" : "Remove"}
        </button>
      </td>
    </tr>
  );
}
