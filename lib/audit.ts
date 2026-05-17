import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import type { Session } from "./session";

export type AuditAction =
  | "property.approve"
  | "property.reject"
  | "property.pause"
  | "property.resume"
  | "property.verify"
  | "property.update"
  | "property.delete"
  | "user.create"
  | "user.update"
  | "user.role"
  | "user.suspend"
  | "user.reactivate"
  | "user.delete";

/**
 * Record a single admin action. Fire-and-forget — never throws, never blocks
 * the API response on log failures. Disabled when USE_DB ≠ 1.
 */
export async function recordAudit(
  session: Session,
  action: AuditAction,
  targetType: "property" | "user",
  targetId: string,
  meta?: Prisma.InputJsonValue,
): Promise<void> {
  if (process.env.USE_DB !== "1") return;
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId: session.uid,
        actorEmail: session.email ?? null,
        action,
        targetType,
        targetId,
        meta: meta ?? undefined,
      },
    });
  } catch (err) {
    console.warn("[audit] write failed:", (err as Error).message);
  }
}
