"use client";

import { useEffect, useState, useCallback } from "react";

const KEY = "akp.favorites.v1";

function read(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(KEY);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function write(set: Set<string>) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...set]));
    window.dispatchEvent(new CustomEvent("akp:favorites-change"));
  } catch {
    // localStorage might be blocked — ignore
  }
}

async function fetchServerIds(): Promise<string[] | null> {
  try {
    const res = await fetch("/api/favorites", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.ids) ? data.ids : null;
  } catch {
    return null;
  }
}

/**
 * Optimistic favorite toggle:
 *  - localStorage is the source of truth for instant UI feedback.
 *  - When a session exists, the server merges + persists in Postgres.
 *    On first mount, server state is unioned in (so favorites follow the
 *    user across devices the next session they sign in).
 *  - If the API is offline / unauthenticated, we silently stay local-only.
 */
export function useFavorites() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds([...read()]);
    const sync = () => setIds([...read()]);
    window.addEventListener("akp:favorites-change", sync);
    window.addEventListener("storage", sync);

    fetchServerIds().then((serverIds) => {
      if (!serverIds) return;
      const cur = read();
      let changed = false;
      for (const id of serverIds) {
        if (!cur.has(id)) {
          cur.add(id);
          changed = true;
        }
      }
      if (changed) write(cur);
    });

    return () => {
      window.removeEventListener("akp:favorites-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback((id: string) => {
    const cur = read();
    const willSave = !cur.has(id);
    if (willSave) cur.add(id);
    else cur.delete(id);
    write(cur);

    if (willSave) {
      fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: id }),
      }).catch(() => {});
    } else {
      fetch(`/api/favorites?propertyId=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
    }
  }, []);

  const remove = useCallback((id: string) => {
    const cur = read();
    if (!cur.has(id)) return;
    cur.delete(id);
    write(cur);
    fetch(`/api/favorites?propertyId=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
  }, []);

  return { ids, has, toggle, remove };
}
