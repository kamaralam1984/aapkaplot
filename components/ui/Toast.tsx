"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, AlertTriangle, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastKind = "success" | "info" | "warning" | "error";

interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
}

interface ToastContextValue {
  show: (t: Omit<Toast, "id"> & { id?: string }) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const ICON: Record<ToastKind, React.ReactNode> = {
  success: <CheckCircle2 className="h-[18px] w-[18px]" />,
  info:    <Info className="h-[18px] w-[18px]" />,
  warning: <AlertTriangle className="h-[18px] w-[18px]" />,
  error:   <AlertCircle className="h-[18px] w-[18px]" />,
};

const TONE: Record<ToastKind, string> = {
  success: "bg-emerald-500 text-white",
  info:    "bg-ink-900 text-white",
  warning: "bg-amber-500 text-white",
  error:   "bg-rose-500 text-white",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setToasts((cur) => cur.filter((x) => x.id !== id));
  }, []);

  const show = useCallback(
    (t: Omit<Toast, "id"> & { id?: string }) => {
      const id = t.id ?? Math.random().toString(36).slice(2);
      setToasts((cur) => [...cur.slice(-3), { ...t, id }]);
      const dur = t.duration ?? 3500;
      if (dur > 0) {
        const handle = setTimeout(() => dismiss(id), dur);
        timers.current.set(id, handle);
      }
      return id;
    },
    [dismiss]
  );

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t));
      timers.current.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-4 right-4 z-[120] flex w-full max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.94 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="pointer-events-auto overflow-hidden rounded-2xl border border-white/40 bg-white shadow-lift"
            >
              <div className="flex items-start gap-3 p-3 pr-2">
                <span className={cn("mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl", TONE[t.kind])}>
                  {ICON[t.kind]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-bold text-ink-900">{t.title}</p>
                  {t.description && (
                    <p className="mt-0.5 text-[12px] leading-snug text-ink-600">{t.description}</p>
                  )}
                  {t.action && (
                    <button
                      type="button"
                      onClick={() => {
                        t.action!.onClick();
                        dismiss(t.id);
                      }}
                      className="mt-1.5 inline-flex h-7 items-center gap-1 rounded-lg bg-ink-900 px-2.5 text-[11.5px] font-bold text-white hover:bg-ink-800"
                    >
                      {t.action.label}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss"
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-ink-500 hover:bg-ink-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
