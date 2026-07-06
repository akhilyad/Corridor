"use server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types";
import { takeRateConfigSchema, parseZod } from "@/lib/schemas";

/**
 * Platform-admin actions.
 *
 * Take-rate configuration is the single economic knob the operator has: it
 * retunes every deployment's corridor take, host commission, SaaS fee and VAT
 * in one row. Recomputes are lazy (next read picks up the live config via
 * `getActiveConfigFor`), so a change affects new invoices/quotes immediately.
 */

export async function updateTakeRateConfigAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await getSession();
  if (!user || !can(user, "takeRate:configure")) {
    return { ok: false, error: "Only platform admins can reconfigure take rates." };
  }

  const raw = {
    hostCommissionBps: formData.get("hostCommissionBps"),
    hostWaiveFirst90Days: formData.get("hostWaiveFirst90Days") === "on" || formData.get("hostWaiveFirst90Days") === "true",
    enterpriseTakeBpsMin: formData.get("enterpriseTakeBpsMin"),
    enterpriseTakeBpsMax: formData.get("enterpriseTakeBpsMax"),
    enterpriseTakeBpsDefault: formData.get("enterpriseTakeBpsDefault"),
    saasFeeCentsPerSiteMonth: formData.get("saasFeeCentsPerSiteMonth"),
    vatBps: formData.get("vatBps"),
  };
  const parsed = parseZod(takeRateConfigSchema, raw);
  if (!parsed.ok) return { ok: false, error: Object.values(parsed.errors)[0] ?? "Invalid take-rate configuration." };

  // Exactly one active row exists; create on first run, otherwise mutate in place.
  const existing = await prisma.takeRateConfig.findFirst({ where: { isActive: true } });
  let configId: string;
  if (existing) {
    const updated = await prisma.takeRateConfig.update({
      where: { id: existing.id },
      data: { ...parsed.data, updatedByUserId: user.id, updatedAt: new Date() },
    });
    configId = updated.id;
  } else {
    const created = await prisma.takeRateConfig.create({
      data: { ...parsed.data, isActive: true, updatedByUserId: user.id },
    });
    configId = created.id;
  }

  await logAudit({
    userId: user.id,
    action: "admin.takeRate.update",
    entityType: "takeRateConfig",
    entityId: configId,
    meta: parsed.data,
  });
  // Bump every dashboard that renders corridor economics so caches drop.
  revalidatePath("/admin");
  revalidatePath("/admin/take-rate");
  revalidatePath("/calculator");
  revalidatePath("/pricing");
  return { ok: true, data: { id: configId } };
}
