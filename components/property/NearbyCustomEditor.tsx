"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PoiCategory } from "@/lib/property-poi";

type Category = PoiCategory;

interface NearbyEntry {
  id: string;
  name: string;
  category: Category;
  distanceKm: number;
}

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: "school",          label: "🏫 School" },
  { value: "college",         label: "🎓 College" },
  { value: "hospital",        label: "🏥 Hospital" },
  { value: "place_of_worship",label: "🛕 Mandir / Mosque / Church" },
  { value: "park",            label: "🌳 Park / Garden" },
  { value: "market",          label: "🏪 Market / Bazaar" },
  { value: "railway",         label: "🚂 Railway Station" },
  { value: "bus_stop",        label: "🚌 Bus Stop / Stand" },
  { value: "airport",         label: "✈️ Airport" },
  { value: "bank",            label: "🏦 Bank" },
  { value: "atm",             label: "💳 ATM" },
  { value: "fuel",            label: "⛽ Petrol Pump" },
  { value: "police",          label: "🚔 Police Station" },
  { value: "mall",            label: "🛍️ Mall" },
  { value: "supermarket",     label: "🛒 Supermarket" },
  { value: "restaurant",      label: "🍽️ Restaurant" },
  { value: "tourism",         label: "🏛️ Tourist Spot" },
  { value: "historical",      label: "🏺 Heritage Site" },
];

interface Props {
  propertyId: string;
  initial: NearbyEntry[];
}

export function NearbyCustomEditor({ propertyId, initial }: Props) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<NearbyEntry[]>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [form, setForm] = useState<{ name: string; category: Category; distanceKm: string }>({
    name: "", category: "school", distanceKm: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  function addOrUpdate() {
    if (!form.name.trim() || !form.distanceKm) return;
    const km = parseFloat(form.distanceKm);
    if (isNaN(km) || km < 0) return;

    if (editingId) {
      setEntries((e) => e.map((x) => x.id === editingId ? { ...x, ...form, distanceKm: km } : x));
      setEditingId(null);
    } else {
      setEntries((e) => [...e, { id: crypto.randomUUID(), ...form, distanceKm: km }]);
    }
    setForm({ name: "", category: "school", distanceKm: "" });
  }

  function startEdit(entry: NearbyEntry) {
    setEditingId(entry.id);
    setForm({ name: entry.name, category: entry.category, distanceKm: String(entry.distanceKm) });
  }

  function remove(id: string) {
    setEntries((e) => e.filter((x) => x.id !== id));
    if (editingId === id) { setEditingId(null); setForm({ name: "", category: "school", distanceKm: "" }); }
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/seller/property/nearby-custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, entries }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 text-[12.5px] font-semibold text-ink-600 transition hover:border-brand-500/40 hover:text-brand-700"
      >
        <Pencil className="h-3.5 w-3.5" />
        {entries.length > 0 ? `Manage nearby (${entries.length})` : "Add nearby places"}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-lg rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ink-200 px-5 py-4">
              <div>
                <h3 className="text-[15px] font-bold text-ink-900">Nearby places</h3>
                <p className="text-[12px] text-ink-500">Add places that aren't on OpenStreetMap</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-5">
              {/* Add / Edit form */}
              <div className="rounded-xl border border-ink-200 bg-ink-50/50 p-3.5">
                <p className="mb-2 text-[11.5px] font-semibold text-ink-600">
                  {editingId ? "Edit entry" : "Add new place"}
                </p>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Name (e.g. Ram Mandir, City School)"
                    className="h-9 w-full rounded-lg border border-ink-200 bg-white px-3 text-[13px] placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  <div className="flex gap-2">
                    <select
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Category }))}
                      className="h-9 flex-1 rounded-lg border border-ink-200 bg-white px-2 text-[13px] focus:border-brand-500 focus:outline-none"
                    >
                      {CATEGORY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <div className="relative w-28">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={form.distanceKm}
                        onChange={(e) => setForm((f) => ({ ...f, distanceKm: e.target.value }))}
                        placeholder="0.5"
                        className="h-9 w-full rounded-lg border border-ink-200 bg-white pl-3 pr-8 text-[13px] placeholder:text-ink-400 focus:border-brand-500 focus:outline-none"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-ink-400">km</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={addOrUpdate}
                      disabled={!form.name.trim() || !form.distanceKm}
                      className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-600 text-[13px] font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {editingId ? "Update" : "Add"}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={() => { setEditingId(null); setForm({ name: "", category: "school", distanceKm: "" }); }}
                        className="h-8 rounded-lg border border-ink-200 px-3 text-[13px] text-ink-600 hover:bg-ink-50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Existing entries */}
              {entries.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-[11.5px] font-semibold text-ink-500">Added ({entries.length})</p>
                  {entries.map((e) => (
                    <div key={e.id} className={cn("flex items-center gap-2 rounded-xl border px-3 py-2", editingId === e.id ? "border-brand-400 bg-brand-50" : "border-ink-200 bg-white")}>
                      <span className="flex-1 min-w-0">
                        <span className="block truncate text-[13px] font-semibold text-ink-900">{e.name}</span>
                        <span className="text-[11.5px] text-ink-500">
                          {CATEGORY_OPTIONS.find((o) => o.value === e.category)?.label} · {e.distanceKm} km
                        </span>
                      </span>
                      <button type="button" onClick={() => startEdit(e)} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => remove(e.id)} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-ink-400 hover:bg-rose-50 hover:text-rose-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-ink-200 px-5 py-3">
              <button type="button" onClick={() => setOpen(false)} className="h-9 rounded-xl border border-ink-200 px-4 text-[13px] font-semibold text-ink-600 hover:bg-ink-50">
                Close
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-5 text-[13px] font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saved ? "Saved!" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
