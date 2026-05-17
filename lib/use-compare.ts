"use client";

import { useEffect, useState, useCallback } from "react";

const KEY = "akp.compare.v1";
const MAX = 3;

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]).slice(0, MAX) : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids.slice(0, MAX)));
    window.dispatchEvent(new CustomEvent("akp:compare-change"));
  } catch {
    // localStorage might be blocked — ignore
  }
}

export function useCompare() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(read());
    const sync = () => setIds(read());
    window.addEventListener("akp:compare-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("akp:compare-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);
  const isFull = ids.length >= MAX;

  const add = useCallback((id: string) => {
    const cur = read();
    if (cur.includes(id)) return { ok: false, reason: "already" as const };
    if (cur.length >= MAX) return { ok: false, reason: "full" as const };
    write([...cur, id]);
    return { ok: true } as const;
  }, []);

  const remove = useCallback((id: string) => {
    const cur = read();
    if (!cur.includes(id)) return;
    write(cur.filter((x) => x !== id));
  }, []);

  const toggle = useCallback((id: string) => {
    const cur = read();
    if (cur.includes(id)) {
      write(cur.filter((x) => x !== id));
      return { ok: true, action: "removed" as const };
    }
    if (cur.length >= MAX) return { ok: false, reason: "full" as const };
    write([...cur, id]);
    return { ok: true, action: "added" as const };
  }, []);

  const clear = useCallback(() => write([]), []);

  return { ids, has, isFull, add, remove, toggle, clear, max: MAX };
}
