"use server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import type { ActionResult, AccreditationStatus } from "@/lib/types";
import { jstr } from "@/lib/utils";

/**
 * Vendor-accreditation actions — the EPC approved-supplier cycle.
 *
 * A client (EPC firm / hyperscaler) "accredits" a partner (housing vendor) so
 * the partner can bid on that client's deployments. The cycle is long
 * (whitepaper: 6–12 months, ~9 default) and gates downstream bookings, so it
 * gets its own tracker surface for both sides. Staff/admin run the review.
 */

const VALID_NEXT: Partial<Record<AccreditationStatus, AccreditationStatus[]>> = {
  NOT_STARTED: ["IN_REVIEW", "REJECTED"],
  PENDING: ["IN_REVIEW", "APPROVED", "REJECTED"],
  IN_REVIEW: ["CONDITIONAL", "APPROVED", "REJECTED", "NOT_STARTED"],
  CONDITIONAL: ["APPROVED", "REJECTED", "NOT_STARTED"],
  APPROVED: ["SUSPENDED"],
  REJECTED: ["NOT_STARTED", "IN_REVIEW"],
  SUSPENDED: ["APPROVED", "REJECTED"],
};

function isAccreditationStatus(s: string): s is AccreditationStatus {
  return ["NOT_STARTED", "IN_REVIEW", "CONDITIONAL", "APPROVED", "REJECTED", "SUSPENDED", "PENDING"].includes(s);
}

export async function createAccreditationAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await getSession();
  if (!user || !can(user, "accreditation:manage")) {
    return { ok: false, error: "Only compliance staff can open accreditation cycles." };
  }
  const clientOrgId = String(formData.get("clientOrgId") ?? "");
  const partnerOrgId = String(formData.get("partnerOrgId") ?? "");
  if (!clientOrgId || !partnerOrgId) return { ok: false, error: "Select both a client and a partner organisation." };
  if (clientOrgId === partnerOrgId) return { ok: false, error: "Client and partner must differ." };

  const [client, partner] = await Promise.all([
    prisma.organization.findUnique({ where: { id: clientOrgId } }),
    prisma.organization.findUnique({ where: { id: partnerOrgId } }),
  ]);
  if (!client || client.type !== "CLIENT") return { ok: false, error: "Client organisation not found." };
  if (!partner || partner.type !== "PARTNER") return { ok: false, error: "Partner organisation not found." };

  const expectedDurationDays = Number(formData.get("expectedDurationDays") ?? 270) || 270;
  const cycleStartedAt = new Date();
  const targetCompletionAt = new Date(cycleStartedAt.getTime() + expectedDurationDays * 86400_000);
  const requiredRaw = String(formData.get("requiredDocCategories") ?? "");
  const requiredDocCategories =
    requiredRaw
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 20) || null;

  try {
    const acc = await prisma.vendorAccreditation.create({
      data: {
        clientOrgId,
        partnerOrgId,
        status: "IN_REVIEW" as AccreditationStatus,
        cycleStartedAt,
        expectedDurationDays,
        targetCompletionAt,
        reviewerUserId: user.id,
        requiredDocCategories: requiredDocCategories ? jstr(requiredDocCategories) : null,
        notes: String(formData.get("notes") ?? "").slice(0, 1000) || null,
      },
    });
    await logAudit({ userId: user.id, action: "accreditation.create", entityType: "vendorAccreditation", entityId: acc.id, meta: { clientOrgId, partnerOrgId } });
    revalidatePath("/admin/accreditation");
    revalidatePath("/partner/accreditation");
    revalidatePath("/client/accreditation");
    return { ok: true, data: { id: acc.id } };
  } catch {
    // Enforced by @@unique([clientOrgId, partnerOrgId]).
    return { ok: false, error: "An accreditation cycle already exists for this client–partner pair." };
  }
}

export async function changeAccreditationStatusAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getSession();
  if (!user || !can(user, "accreditation:manage")) {
    return { ok: false, error: "Only compliance staff can change accreditation status." };
  }
  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("status") ?? "");
  if (!isAccreditationStatus(next)) return { ok: false, error: "Unknown accreditation status." };

  const acc = await prisma.vendorAccreditation.findUnique({ where: { id } });
  if (!acc) return { ok: false, error: "Accreditation record not found." };

  const current = (acc.status as AccreditationStatus) ?? "NOT_STARTED";
  const allowed = VALID_NEXT[current] ?? [];
  if (!allowed.includes(next)) {
    return { ok: false, error: `Cannot move ${current} → ${next}.` };
  }

  const data: Record<string, unknown> = {
    status: next as AccreditationStatus,
    reviewerUserId: user.id,
    notes: String(formData.get("notes") ?? "").slice(0, 1000) || null,
  };
  // Approving seals the cycle's completion date; restarting resets the clock.
  if (next === "APPROVED") data.completedAt = new Date();
  if (next === "IN_REVIEW" && !acc.cycleStartedAt) data.cycleStartedAt = new Date();
  if (next === "NOT_STARTED") {
    data.completedAt = null;
    data.cycleStartedAt = null;
  }

  await prisma.vendorAccreditation.update({ where: { id }, data });
  await logAudit({ userId: user.id, action: "accreditation.status", entityType: "vendorAccreditation", entityId: id, meta: { from: current, to: next } });

  revalidatePath("/admin/accreditation");
  revalidatePath("/partner/accreditation");
  revalidatePath("/client/accreditation");
  return { ok: true, data: null };
}
