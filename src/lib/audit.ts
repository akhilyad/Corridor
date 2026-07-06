import { prisma } from "@/lib/db";
import { jstr } from "@/lib/utils";

/**
 * Thin audit-log writer. Fire-and-forget on intent — failures are swallowed
 * so they can never break a successful business write. Every privileged
 * mutation (listing approve, doc verify, invoice issue, take-rate config
 * change, accreditation status change) calls this.
 */

export async function logAudit(opts: {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: opts.userId ?? null,
        action: opts.action,
        entityType: opts.entityType,
        entityId: opts.entityId ?? null,
        meta: opts.meta ? jstr(safeJson(opts.meta)) : null,
      },
    });
  } catch {
    // audit must never throw on the request path
  }
}

/** Defensive fallback so weird meta values can't crash the serializer. */
function safeJson(v: unknown): unknown {
  try {
    JSON.stringify(v);
    return v;
  } catch {
    return { _unserializable: true };
  }
}
