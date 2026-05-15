"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";
import type { Conversation } from "@/lib/mock-dashboard";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";

interface ConversationListProps {
  conversations: Conversation[];
  activeId?: string;
}

export function ConversationList({ conversations, activeId }: ConversationListProps) {
  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-ink-200/70 px-4 py-3">
        <h2 className="text-[15px] font-bold text-ink-900">Messages</h2>
        <div className="mt-2 relative h-10">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            placeholder="Search conversations…"
            className="h-10 w-full rounded-xl border border-ink-200 bg-white pl-9 pr-3 text-[13px] placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
          />
        </div>
      </header>

      <ul className="flex-1 overflow-y-auto">
        {conversations.map((c) => {
          const active = c.id === activeId;
          return (
            <li key={c.id}>
              <Link
                href={`/chat/${c.id}`}
                className={cn(
                  "flex items-start gap-3 border-b border-ink-200/70 px-4 py-3 transition",
                  active ? "bg-brand-50/70" : "hover:bg-ink-100/60"
                )}
              >
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-ink-100">
                  {c.withAvatar ? (
                    <Image src={c.withAvatar} alt={c.withName} fill sizes="44px" className="object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-brand-gradient text-[14px] font-bold text-white">
                      {c.withName.slice(0, 1)}
                    </div>
                  )}
                  {c.unread > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white"
                    >
                      {c.unread}
                    </motion.span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="inline-flex items-center gap-1 truncate text-[13.5px] font-bold text-ink-900">
                      {c.withName}
                      <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    </p>
                    <span className="shrink-0 text-[11px] text-ink-500">
                      {formatRelativeTime(c.lastAt)}
                    </span>
                  </div>
                  <p className="truncate text-[12.5px] text-ink-500 capitalize">
                    {c.withRole === "support" ? "AapKaPlot · support" : c.withRole}
                  </p>
                  <p className={cn("truncate text-[12.5px]", c.unread > 0 ? "font-semibold text-ink-900" : "text-ink-500")}>
                    {c.lastMessage}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
