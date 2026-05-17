import { notFound } from "next/navigation";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatThread } from "@/components/chat/ChatThread";
import { ChatLive } from "@/components/chat/ChatLive";
import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from "@/lib/mock-dashboard";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

async function loadLive(id: string, uid: string) {
  if (process.env.USE_DB !== "1") return null;
  try {
    const lead = await prisma.lead.findUnique({
      where: { id },
      select: {
        id: true,
        fromUserId: true,
        toUserId: true,
        fromUser: { select: { name: true, phone: true } },
        toUser: { select: { name: true, phone: true } },
        property: { select: { title: true } },
      },
    });
    if (!lead) return null;
    if (lead.fromUserId !== uid && lead.toUserId !== uid) return null;
    const other = lead.fromUserId === uid ? lead.toUser : lead.fromUser;
    return {
      leadId: lead.id,
      withName: other.name ?? other.phone ?? "Conversation",
      propertyTitle: lead.property?.title ?? undefined,
    };
  } catch {
    return null;
  }
}

export default async function ChatThreadPage({ params }: PageProps) {
  const { id } = await params;

  // 1. Mock conversation (legacy demo IDs like "c_1").
  const conv = MOCK_CONVERSATIONS.find((c) => c.id === id);
  if (conv) {
    const messages = MOCK_MESSAGES[id] ?? [];
    return (
      <Shell activeId={id}>
        <ChatThread conversation={conv} initialMessages={messages} />
      </Shell>
    );
  }

  // 2. Real DB-backed lead thread.
  const session = await getSession();
  if (!session) notFound();
  const live = await loadLive(id, session.uid);
  if (!live) notFound();

  return (
    <Shell activeId={id}>
      <ChatLive
        leadId={live.leadId}
        meId={session.uid}
        withName={live.withName}
        propertyTitle={live.propertyTitle}
      />
    </Shell>
  );
}

function Shell({ activeId, children }: { activeId: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-0 lg:px-6">
      <div className="grid h-[calc(100vh-64px)] grid-cols-1 overflow-hidden border-ink-200/70 bg-white lg:my-6 lg:rounded-3xl lg:border lg:shadow-card lg:grid-cols-[340px_1fr]">
        <aside className="hidden border-r border-ink-200/70 lg:block">
          <ConversationList conversations={MOCK_CONVERSATIONS} activeId={activeId} />
        </aside>
        {children}
      </div>
    </div>
  );
}
