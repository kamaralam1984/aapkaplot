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

/** Subscribe to favorites changes across components + tabs. */
export function useFavorites() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds([...read()]);
    const sync = () => setIds([...read()]);
    window.addEventListener("akp:favorites-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("akp:favorites-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback((id: string) => {
    const cur = read();
    if (cur.has(id)) cur.delete(id);
    else cur.add(id);
    write(cur);
  }, []);

  const remove = useCallback((id: string) => {
    const cur = read();
    cur.delete(id);
    write(cur);
  }, []);

  return { ids, has, toggle, remove };
}
