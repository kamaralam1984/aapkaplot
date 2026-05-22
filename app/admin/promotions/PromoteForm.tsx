"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

type SearchResult = {
  id: string;
  title: string;
  city: string;
  locality: string;
  priceInr: number;
  status: string;
};

type Tag = "best_deal" | "hot_nearby" | "featured";
const TAGS: { value: Tag; label: string }[] = [
  { value: "best_deal", label: "Best Deal" },
  { value: "hot_nearby", label: "Hot Nearby" },
  { value: "featured", label: "Featured" },
];
const DAYS_OPTIONS = [7, 14, 30];

function inr(n: number) {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function PromoteForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [tag, setTag] = useState<Tag>("best_deal");
  const [days, setDays] = useState(7);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!q.trim()) { setResults([]); setOpen(false); return; }
      const res = await fetch(`/api/admin/promotions/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.properties ?? []);
      setOpen(true);
    }, 300);
  }, []);

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setSelected(null);
    search(e.target.value);
  }

  function handleSelect(p: SearchResult) {
    setSelected(p);
    setQuery(p.title);
    setOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) { setError("Select a property first."); return; }
    setSubmitting(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/admin/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: selected.id, tag, days }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
    } else {
      setSuccess(`"${selected.title}" promoted for ${days} days as ${tag}.`);
      setSelected(null);
      setQuery("");
      setResults([]);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Search input */}
      <div className="relative">
        <label className="block text-xs font-medium text-ink-500 mb-1">Search property</label>
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Type property title or city…"
          className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm text-ink-800 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
        />
        {open && results.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full bg-white border border-zinc-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {results.map((p) => (
              <li
                key={p.id}
                onClick={() => handleSelect(p)}
                className="px-3 py-2.5 hover:bg-zinc-50 cursor-pointer border-b border-zinc-100 last:border-0"
              >
                <p className="text-sm font-medium text-ink-800 truncate">{p.title}</p>
                <p className="text-xs text-ink-400">
                  {p.city}{p.locality ? `, ${p.locality}` : ""} · {inr(p.priceInr)} · {p.status}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Tag selector */}
      <div>
        <label className="block text-xs font-medium text-ink-500 mb-2">Promotion tag</label>
        <div className="flex gap-2">
          {TAGS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTag(t.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                tag === t.value
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-white text-ink-600 border-zinc-300 hover:border-violet-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Days selector */}
      <div>
        <label className="block text-xs font-medium text-ink-500 mb-2">Duration</label>
        <div className="flex gap-2">
          {DAYS_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                days === d
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-white text-ink-600 border-zinc-300 hover:border-violet-400"
              }`}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-rose-600">{error}</p>}
      {success && <p className="text-xs text-emerald-600">{success}</p>}

      <button
        type="submit"
        disabled={submitting || !selected}
        className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {submitting ? "Promoting…" : "Promote"}
      </button>
    </form>
  );
}
