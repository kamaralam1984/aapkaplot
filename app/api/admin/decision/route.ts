import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import {
  store,
  decisionKey,
  type AdminDecisionStatus,
} from "@/server/in-memory-store";

const Body = z.object({
  id: z.string().min(1),
  scope: z.enum(["moderation", "fraud"]),
  status: z.enum(["approved", "rejected", "cleared", "removed"]),
  note: z.string().max(280).optional(),
});

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;
  const { session } = guard;

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id, scope, status, note } = parsed.data;
  const key = decisionKey(scope, id);
  store.adminDecisions.set(key, {
    id,
    scope,
    status: status as AdminDecisionStatus,
    by: session.uid,
    at: Date.now(),
    note,
  });

  return NextResponse.json({ ok: true, decision: store.adminDecisions.get(key) });
}

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  const url = new URL(req.url);
  const scope = url.searchParams.get("scope");
  let list = [...store.adminDecisions.values()];
  if (scope === "moderation" || scope === "fraud") {
    list = list.filter((d) => d.scope === scope);
  }
  return NextResponse.json({ decisions: list.sort((a, b) => b.at - a.at) });
}
