import { notFound } from "next/navigation";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatThread } from "@/components/chat/ChatThread";
import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from "@/lib/mock-dashboard";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatThreadPage({ params }: PageProps) {
  const { id } = await params;
  const conv = MOCK_CONVERSATIONS.find((c) => c.id === id);
  if (!conv) notFound();
  const messages = MOCK_MESSAGES[id] ?? [];

  return (
    <div className="mx-auto max-w-7xl px-0 lg:px-6">
      <div className="grid h-[calc(100vh-64px)] grid-cols-1 overflow-hidden border-ink-200/70 bg-white lg:my-6 lg:rounded-3xl lg:border lg:shadow-card lg:grid-cols-[340px_1fr]">
        <aside className="hidden border-r border-ink-200/70 lg:block">
          <ConversationList conversations={MOCK_CONVERSATIONS} activeId={id} />
        </aside>

        <ChatThread conversation={conv} initialMessages={messages} />
      </div>
    </div>
  );
}
