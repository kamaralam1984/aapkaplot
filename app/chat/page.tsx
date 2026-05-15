import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { ConversationList } from "@/components/chat/ConversationList";
import { MOCK_CONVERSATIONS } from "@/lib/mock-dashboard";

export default function ChatIndex() {
  return (
    <div className="mx-auto max-w-7xl px-0 lg:px-6">
      <div className="grid h-[calc(100vh-64px)] grid-cols-1 overflow-hidden border-ink-200/70 bg-white lg:my-6 lg:rounded-3xl lg:border lg:shadow-card lg:grid-cols-[340px_1fr]">
        <aside className="border-r border-ink-200/70">
          <ConversationList conversations={MOCK_CONVERSATIONS} />
        </aside>

        <section className="hidden flex-col items-center justify-center bg-[radial-gradient(circle_at_center,#ecfdf5,#f8fafc_70%)] px-8 text-center lg:flex">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white text-brand-600 shadow-card">
            <MessagesSquare className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-display-md font-display text-ink-900">Your messages</h2>
          <p className="mt-2 max-w-sm text-[14px] text-ink-500">
            Pick a conversation on the left, or{" "}
            <Link href="/search" className="font-semibold text-brand-600 hover:underline">
              start a new one from a listing
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
