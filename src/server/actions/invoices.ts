"use server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import type { ActionResult, InvoiceStatus, PayoutStatus } from "@/lib/types";
import { jstr, monthsBetween } from "@/lib/utils";
import { getActiveConfigFor } from "@/lib/queries";
import { computeDeploymentEconomics, type SiteInput } from "@/lib/pricing";

/**
 * Consolidated multi-site invoicing — the procurement settlement surface.
 *
 * One Invoice rolls up every confirmed DeploymentSite under a deployment for a
 * billing window. Money is computed by the *same* `computeDeploymentEconomics`
 * used by the marketing calculator, so the client's invoice reproduces the
 * whitepaper §3.3 economics exactly: gross housing+infra, +13% enterprise take,
 * +€750/site/mo SaaS fee, +19% VAT. Per-site Payout rows (one per partner) are
 * minted at issue time so the partner dashboard's "accrued payout" updates
 * instantly.
 */

function clampDate(v: Date | string): Date {
  return v instanceof Date ? v : new Date(v);
}

function overlapMonths(siteStart: Date, siteEnd: Date, winStart: Date, winEnd: Date): number {
  const s = siteStart.getTime() > winStart.getTime() ? siteStart.getTime() : winStart.getTime();
  const e = siteEnd.getTime() < winEnd.getTime() ? siteEnd.getTime() : winEnd.getTime();
  if (e <= s) return 0;
  const days = (e - s) / 86400_000;
  // Use the same 30.4375 normalisation as the pricing engine so figures tie out.
  return days / 30.4375;
}

export async function issueInvoiceAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string; number: string }>> {
  const user = await getSession();
  if (!user) return { ok: false, error: "Not signed in." };
  const deploymentId = String(formData.get("deploymentId") ?? "");
  if (!deploymentId) return { ok: false, error: "Select a deployment to invoice." };

  const deployment = await prisma.deployment.findUnique({
    where: { id: deploymentId },
    include: { sites: { include: { listing: true } } },
  });
  if (!deployment) return { ok: false, error: "Deployment not found." };
  if (deployment.clientOrgId !== user.orgId && user.role !== "ADMIN" && user.role !== "STAFF") {
    return { ok: false, error: "Only the deployment's client can invoice it." };
  }

  // Billing window defaults to the full deployment span; staff can pass a slice.
  const periodStart = formData.get("periodStart")
    ? new Date(String(formData.get("periodStart")))
    : clampDate(deployment.startDate);
  const periodEnd = formData.get("periodEnd")
    ? new Date(String(formData.get("periodEnd")))
    : clampDate(deployment.endDate);
  if (!(periodEnd > periodStart)) return { ok: false, error: "Billing period end must be after start." };

  const activeSites = deployment.sites.filter((s) => s.status === "CONFIRMED" || s.status === "ACTIVE");
  if (activeSites.length === 0) return { ok: false, error: "No confirmed sites to invoice. Mark sites confirmed first." };

  const cfg = await getActiveConfigFor();

  // Build per-site inputs, clamping each site's window to the billing period so
  // a NET-30 monthly slice still closes to a full-period invoice when summed.
  const siteInputs: SiteInput[] = [];
  const lines: Record<string, unknown>[] = [];
  for (const s of activeSites) {
    const ss = clampDate(s.startDate);
    const se = clampDate(s.endDate);
    const months = overlapMonths(ss, se, periodStart, periodEnd);
    if (months <= 0) continue;
    siteInputs.push({
      monthlyRateCents: s.monthlyRateCents,
      infraPremiumCents: s.infraPremiumCents,
      units: s.bedsAllocated,
      startDate: periodStart,
      endDate: periodEnd,
      hostIsNewAndWithinWaiver: false,
      enterpriseTakeBps: s.enterpriseTakeBps,
    });
    const grossCents = Math.round((s.monthlyRateCents + s.infraPremiumCents) * s.bedsAllocated * months);
    const takeBps = Math.min(cfg.enterpriseTakeBpsMax, Math.max(cfg.enterpriseTakeBpsMin, s.enterpriseTakeBps));
    const takeCents = Math.round((grossCents * takeBps) / 10000);
    const commissionCents = Math.round((grossCents * cfg.hostCommissionBps) / 10000);
    lines.push({
      siteId: s.id,
      listingTitle: s.listing?.title ?? "Listing",
      partnerOrgId: s.partnerOrgId,
      beds: s.bedsAllocated,
      months: Number(months.toFixed(3)),
      rateCents: s.monthlyRateCents,
      infraCents: s.infraPremiumCents,
      grossCents,
      takeBps,
      takeCents,
      saasCents: Math.round(cfg.saasFeeCentsPerSiteMonth * months),
      partnerNetCents: grossCents - commissionCents,
    });
  }
  if (siteInputs.length === 0) {
    return { ok: false, error: "No sites overlap the billing period." };
  }

  const econ = computeDeploymentEconomics(siteInputs, cfg);

  const year = periodStart.getUTCFullYear();
  const seq = (await prisma.invoice.count({ where: { billingPeriodStart: { gte: new Date(`${year}-01-01T00:00:00Z`) } } })) + 1;
  const invoiceNumber = `INV-${year}-${String(seq).padStart(4, "0")}`;

  const issuedAt = new Date();
  const dueAt = new Date(issuedAt.getTime() + 30 * 86400_000); // NET 30

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      clientOrgId: deployment.clientOrgId,
      deploymentId,
      issuedById: user.id,
      billingPeriodStart: periodStart,
      billingPeriodEnd: periodEnd,
      status: "ISSUED" as InvoiceStatus,
      subtotalCents: econ.totalGrossCents,
      corridorTakeCents: econ.totalEnterpriseTakeCents,
      corridorSaasFeeCents: econ.totalSaasCents,
      vatBps: cfg.vatBps,
      vatCents: econ.vatCents,
      totalCents: econ.clientTotalCents,
      lineItems: jstr(lines),
      issuedAt,
      dueAt,
      notes: String(formData.get("notes") ?? "").slice(0, 1000) || null,
    },
  });

  // Mint one payout per site/partner. SCHEDULED accrues on the partner dashboard.
  await prisma.payout.createMany({
    data: lines.map((l) => ({
      partnerOrgId: String(l.partnerOrgId),
      invoiceId: invoice.id,
      grossCents: Number(l.grossCents),
      commissionCents: Math.round((Number(l.grossCents) * cfg.hostCommissionBps) / 10000),
      netCents: Number(l.partnerNetCents),
      status: "SCHEDULED" as PayoutStatus,
      scheduledFor: dueAt,
    })),
  });

  await logAudit({
    userId: user.id,
    action: "invoice.issue",
    entityType: "invoice",
    entityId: invoice.id,
    meta: { invoiceNumber, deploymentId, totalCents: econ.clientTotalCents, sites: lines.length },
  });
  revalidatePath("/client/invoices");
  revalidatePath("/partner/payouts");
  revalidatePath("/admin/invoices");
  return { ok: true, data: { id: invoice.id, number: invoiceNumber } };
}

export async function markInvoicePaidAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getSession();
  if (!user) return { ok: false, error: "Not signed in." };
  const id = String(formData.get("id") ?? "");
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) return { ok: false, error: "Invoice not found." };
  if (invoice.clientOrgId !== user.orgId && user.role !== "ADMIN" && user.role !== "STAFF") {
    return { ok: false, error: "Not permitted." };
  }
  if (invoice.status === "PAID") return { ok: false, error: "Invoice already paid." };
  if (invoice.status === "VOID") return { ok: false, error: "Cannot pay a voided invoice." };

  const paidAt = new Date();
  await prisma.$transaction([
    prisma.invoice.update({ where: { id }, data: { status: "PAID" as InvoiceStatus, paidAt } }),
    prisma.payout.updateMany({ where: { invoiceId: id }, data: { status: "PAID" as PayoutStatus, paidAt } }),
  ]);
  await logAudit({ userId: user.id, action: "invoice.paid", entityType: "invoice", entityId: id, meta: { totalCents: invoice.totalCents } });
  revalidatePath("/client/invoices");
  revalidatePath("/partner/payouts");
  revalidatePath("/admin/invoices");
  return { ok: true, data: null };
}

export async function voidInvoiceAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getSession();
  if (!user) return { ok: false, error: "Not signed in." };
  const id = String(formData.get("id") ?? "");
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) return { ok: false, error: "Invoice not found." };
  // Only the issuing client or platform staff can void.
  if (invoice.clientOrgId !== user.orgId && !can(user, "invoice:verify")) {
    return { ok: false, error: "Not permitted." };
  }
  if (invoice.status === "PAID") return { ok: false, error: "Cannot void a paid invoice — refund manually instead." };

  await prisma.$transaction([
    prisma.invoice.update({ where: { id }, data: { status: "VOID" as InvoiceStatus } }),
    prisma.payout.updateMany({ where: { invoiceId: id, status: { in: ["SCHEDULED", "PENDING"] } }, data: { status: "FAILED" as PayoutStatus } }),
  ]);
  await logAudit({ userId: user.id, action: "invoice.void", entityType: "invoice", entityId: id });
  revalidatePath("/client/invoices");
  revalidatePath("/partner/payouts");
  revalidatePath("/admin/invoices");
  return { ok: true, data: null };
}
