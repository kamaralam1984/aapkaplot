"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, MapPin, X, Mic, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { suggestLocations } from "@/lib/locations";

interface LocationAutocompleteProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
  placeholder?: string;
  size?: "md" | "lg";
}

export function LocationAutocomplete({
  value,
  onChange,
  onSubmit,
  placeholder = "Search city, locality or property",
  size = "md",
}: LocationAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [listening, setListening] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => suggestLocations(value), [value]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const submit = (v: string) => {
    onChange(v);
    onSubmit(v);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(-1, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && items[active]) submit(items[active].label);
      else submit(value);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const startVoice = () => {
    const w = window as unknown as { webkitSpeechRecognition?: any; SpeechRecognition?: any };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setUnsupported(true);
      setTimeout(() => setUnsupported(false), 2200);
      return;
    }
    const rec = new SR();
    rec.lang = "en-IN";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e: any) => {
      const transcript = e.results?.[0]?.[0]?.transcript ?? "";
      if (transcript) {
        onChange(transcript);
        submit(transcript);
      }
    };
    rec.start();
  };

  const heightCls = size === "lg" ? "h-12" : "h-11";

  return (
    <div ref={wrapperRef} className="relative">
      <label
        className={cn(
          "relative flex items-center rounded-xl border border-ink-200 bg-white px-3 shadow-soft transition focus-within:border-brand-500 focus-within:shadow-ring",
          heightCls
        )}
      >
        <Search className="h-[18px] w-[18px] text-ink-400" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="ml-2 w-full bg-transparent text-[14px] placeholder:text-ink-400 focus:outline-none"
          aria-autocomplete="list"
          aria-expanded={open}
          role="combobox"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear"
            className="grid h-7 w-7 place-items-center rounded-full text-ink-500 hover:bg-ink-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={startVoice}
          aria-label="Voice search"
          title={unsupported ? "Voice search unsupported in this browser" : "Voice search"}
          className={cn(
            "grid h-8 w-8 place-items-center rounded-full transition",
            listening
              ? "bg-rose-500 text-white shadow-glow"
              : "text-ink-500 hover:bg-ink-100"
          )}
        >
          {listening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
        </button>
      </label>

      <AnimatePresence>
        {open && items.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            role="listbox"
            className="absolute left-0 right-0 z-30 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-ink-200 bg-white p-1 shadow-lift"
          >
            {items.map((item, i) => {
              const isActive = i === active;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => submit(item.label)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition",
                      isActive ? "bg-brand-50 text-brand-800" : "hover:bg-ink-100/60"
                    )}
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                      <MapPin className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-ink-900">
                        {item.label}
                      </span>
                      <span className="block truncate text-[11.5px] text-ink-500 capitalize">
                        {item.type}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
        {unsupported && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute left-0 right-0 mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-[12px] text-amber-800"
          >
            Voice search is not supported in this browser.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
