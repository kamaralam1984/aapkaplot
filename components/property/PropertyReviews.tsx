"use client";

import { useEffect, useState } from "react";
import { Star, Loader2, MessageSquare, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  rating: number;
  body: string;
  createdAt: string;
  authorName: string;
}

interface Aggregate {
  count: number;
  average: number;
}

export function PropertyReviews({ propertyId }: { propertyId: string }) {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [agg, setAgg] = useState<Aggregate>({ count: 0, average: 0 });
  const [rating, setRating] = useState<number>(0);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const load = async () => {
    try {
      const res = await fetch(`/api/reviews?propertyId=${encodeURIComponent(propertyId)}`, { cache: "no-store" });
      if (!res.ok) {
        setReviews([]);
        return;
      }
      const data = await res.json();
      setReviews(data.reviews ?? []);
      setAgg(data.aggregate ?? { count: 0, average: 0 });
    } catch {
      setReviews([]);
    }
  };

  useEffect(() => {
    load();
  }, [propertyId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || body.trim().length < 4) {
      toast.show({ kind: "info", title: "Pick a rating and write a short review." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, rating, body: body.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        toast.show({ kind: "info", title: "Sign in to review", description: "Login and try again." });
        return;
      }
      if (res.status === 503 && data.error === "db_disabled") {
        toast.show({ kind: "info", title: "Reviews need DB", description: "Admin will enable USE_DB=1." });
        return;
      }
      if (!res.ok) {
        toast.show({ kind: "error", title: "Couldn't post", description: data.error ?? "Try again." });
        return;
      }
      toast.show({ kind: "success", title: "Review posted" });
      setBody("");
      setRating(0);
      load();
    } catch {
      toast.show({ kind: "error", title: "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="surface-card overflow-hidden">
      <header className="flex items-center gap-3 border-b border-ink-200/70 bg-white/60 p-4 backdrop-blur">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
          <MessageSquare className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold text-ink-900">Reviews & ratings</h3>
          <p className="text-[12.5px] text-ink-500">
            {agg.count > 0
              ? `${agg.average} avg · ${agg.count} review${agg.count === 1 ? "" : "s"}`
              : "Be the first to share your experience."}
          </p>
        </div>
        {agg.count > 0 && (
          <div className="text-right">
            <div className="flex items-center gap-1 text-amber-500">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={cn("h-4 w-4", n <= Math.round(agg.average) && "fill-current")}
                />
              ))}
            </div>
            <p className="text-[11px] text-ink-500">{agg.average} / 5</p>
          </div>
        )}
      </header>

      {/* Composer */}
      <form onSubmit={submit} className="space-y-3 border-b border-ink-200/70 p-4">
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] font-semibold text-ink-700">Your rating</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n === 1 ? "" : "s"}`}
                className="rounded-full p-1 hover:bg-amber-50"
              >
                <Star
                  className={cn(
                    "h-5 w-5 transition",
                    n <= rating ? "fill-amber-400 text-amber-500" : "text-ink-300"
                  )}
                />
              </button>
            ))}
          </div>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="What did you like or dislike? Be specific so others find it helpful."
          className="input min-h-[80px] resize-none"
        />
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={submitting || !rating || body.trim().length < 4}
            iconRight={submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          >
            {submitting ? "Posting…" : "Post review"}
          </Button>
        </div>
      </form>

      {/* List */}
      {reviews === null ? (
        <div className="flex h-24 items-center justify-center text-ink-500">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="p-6 text-center text-[13px] text-ink-500">
          No reviews yet — your post will appear here.
        </p>
      ) : (
        <ul className="divide-y divide-ink-200/70">
          <AnimatePresence initial={false}>
            {reviews.map((r) => (
              <motion.li
                key={r.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4"
              >
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-brand-gradient text-[12px] font-bold text-white">
                    {r.authorName.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink-900">{r.authorName}</p>
                    <p className="text-[11px] text-ink-500">
                      {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={cn("h-3.5 w-3.5", n <= r.rating ? "fill-amber-400 text-amber-500" : "text-ink-200")}
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-800">{r.body}</p>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}
