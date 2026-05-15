/**
 * Process-local store, HMR-stable. Used by mock API routes while we wait for
 * the real Postgres wiring. Survives Next.js fast-refresh via globalThis.
 */
import type { VisitRequest } from "@/lib/mock-dashboard";

export type AdminDecisionStatus = "approved" | "rejected" | "cleared" | "removed";

export interface AdminDecision {
  id: string;                  // moderation row id OR property id (fraud)
  scope: "moderation" | "fraud";
  status: AdminDecisionStatus;
  by?: string;                 // admin uid
  at: number;
  note?: string;
}

interface Stores {
  visitRequests: Map<string, VisitRequest>;
  leadReveals: Map<string, { propertyId: string; at: number }[]>; // key: identity
  events: { name: string; at: number; props: Record<string, unknown> }[];
  fraudFlags: Map<string, string[]>; // propertyId -> reasons
  adminDecisions: Map<string, AdminDecision>; // key: `${scope}:${id}`
}

const g = globalThis as unknown as { _akpStore?: Stores };
export const store: Stores =
  g._akpStore ??
  (g._akpStore = {
    visitRequests: new Map(),
    leadReveals: new Map(),
    events: [],
    fraudFlags: new Map(),
    adminDecisions: new Map(),
  });

export function decisionKey(scope: "moderation" | "fraud", id: string) {
  return `${scope}:${id}`;
}
