"use server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import type { ActionResult, DeploymentStatus, DeploymentSiteStatus, BookingStatus } from "@/lib/types";
import { deploymentSchema, deploymentSiteSchema, bookingRequestSchema, parseZod } from "@/lib/schemas";
import { computeDeploymentEconomics, clampTakeBps } from "@/lib/pricing";
import { getActiveConfigFor } from "@/lib/queries";

// ---------------------------------------------------------------------------
// Deployments (client side)
// ---------------------------------------------------------------------------

export async function createDeploymentAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string; code: string }>> {
  const user = await getSession();
  if (!user || !can(user, "deployment:create")) return { ok: false, error: "Sign in as a procurement client to create a deployment." };

  const raw = {
    projectName: formData.get("projectName"),
    projectType: formData.get("projectType"),
    projectCountry: formData.get("projectCountry") ?? "DE",
    projectRegion: formData.get("projectRegion") || "",
    crewSize: formData.get("crewSize"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    housingBudgetCentsPerPersonMonth: formData.get("housingBudgetCentsPerPersonMonth") || undefined,
    notes: formData.get("notes") || "",
  };
  const parsed = parseZod(deploymentSchema, raw);
  if (!parsed.ok) return { ok: false, error: Object.values(parsed.errors)[0] ?? "Invalid deployment data" };

  const prefix = user.orgName
    ? user.orgName.split(/[^A-Za-z0-9]/)[0]?.toUpperCase().slice(0, 4) ?? "DEP"
    : "DEP";
  const count = await prisma.deployment.count({ where: { clientOrgId: user.orgId! } });
  const code = `COR-${prefix}-${2100 + count}`;

  const dep = await prisma.deployment.create({
    data: {
      deploymentCode: code,
      clientOrgId: user.orgId!,
      createdByUserId: user.id,
      projectName: parsed.data.projectName,
      projectType: parsed.data.projectType,
      projectCountry: parsed.data.projectCountry,
      projectRegion: parsed.data.projectRegion ?? null,
      crewSize: parsed.data.crewSize,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      housingBudgetCentsPerPersonMonth: parsed.data.housingBudgetCentsPerPersonMonth,
      status: "DRAFT" as DeploymentStatus,
      notes: parsed.data.notes ?? null,
    },
  });
  await logAudit({ userId: user.id, action: "deployment.create", entityType: "deployment", entityId: dep.id, meta: { code } });
  revalidatePath("/client/deployments");
  return { ok: true, data: { id: dep.id, code } };
}

export async function addDeploymentSiteAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ deploymentId: string }>> {
  const user = await getSession();
  if (!user || !can(user, "deployment:create")) return { ok: false, error: "Not permitted." };

  const deploymentId = String(formData.get("deploymentId") ?? "");
  const deployment = await prisma.deployment.findUnique({ where: { id: deploymentId }, include: { sites: { include: { listing: true } } } });
  if (!deployment || deployment.clientOrgId !== user.orgId) return { ok: false, error: "Deployment not found." };

  const listingId = String(formData.get("listingId") ?? "");
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.status !== "LIVE") return { ok: false, error: "Selected listing is not available." };

  const cfg = await getActiveConfigFor();
  const raw = {
    listingId,
    bedsAllocated: formData.get("bedsAllocated"),
    monthlyRateCents: formData.get("monthlyRateCents") ?? listing.monthlyRateCents,
    infraPremiumCents: formData.get("infraPremiumCents") ?? listing.infraPremiumCents,
    commissionBps: formData.get("commissionBps") ?? cfg.hostCommissionBps,
    enterpriseTakeBps: formData.get("enterpriseTakeBps") ?? cfg.enterpriseTakeBpsDefault,
    startDate: formData.get("startDate") ?? deployment.startDate,
    endDate: formData.get("endDate") ?? deployment.endDate,
  };
  const parsed = parseZod(deploymentSiteSchema, raw);
  if (!parsed.ok) return { ok: false, error: Object.values(parsed.errors)[0] ?? "Invalid site data" };

  const site = await prisma.deploymentSite.create({
    data: {
      deploymentId,
      listingId: listing.id,
      partnerOrgId: listing.orgId,
      bedsAllocated: parsed.data.bedsAllocated,
      monthlyRateCents: parsed.data.monthlyRateCents,
      infraPremiumCents: parsed.data.infraPremiumCents,
      commissionBps: Math.min(5000, Math.max(0, parsed.data.commissionBps)),
      enterpriseTakeBps: clampTakeBps(parsed.data.enterpriseTakeBps, cfg),
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      status: "QUOTE" as DeploymentSiteStatus,
    },
  });

  // Recompute+snapshot deployment-level corridor economics so the read side
  // never has to re-derive the whitepaper math on every render.
  await recomputeDeploymentEconomics(deploymentId);
  await logAudit({ userId: user.id, action: "deployment.addSite", entityType: "deploymentSite", entityId: site.id, meta: { listingId, beds: parsed.data.bedsAllocated } });
  revalidatePath(`/client/deployments/${deploymentId}`);
  revalidatePath("/client/deployments");
  return { ok: true, data: { deploymentId } };
}

export async function removeDeploymentSiteAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getSession();
  if (!user) return { ok: false, error: "Not signed in." };
  const siteId = String(formData.get("siteId") ?? "");
  const site = await prisma.deploymentSite.findUnique({ where: { id: siteId }, include: { deployment: true } });
  if (!site || site.deployment.clientOrgId !== user.orgId) return { ok: false, error: "Not permitted." };
  await prisma.deploymentSite.delete({ where: { id: siteId } });
  await recomputeDeploymentEconomics(site.deploymentId);
  await logAudit({ userId: user.id, action: "deployment.removeSite", entityType: "deploymentSite", entityId: siteId });
  revalidatePath(`/client/deployments/${site.deploymentId}`);
  revalidatePath("/client/deployments");
  return { ok: true, data: null };
}

export async function setDeploymentStatusAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getSession();
  if (!user) return { ok: false, error: "Not signed in." };
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as DeploymentStatus;
  const dep = await prisma.deployment.findUnique({ where: { id } });
  if (!dep || (dep.clientOrgId !== user.orgId && user.role !== "ADMIN")) return { ok: false, error: "Not permitted." };
  await prisma.deployment.update({ where: { id }, data: { status } });
  if (status === "CONTRACTED") {
    await prisma.deploymentSite.updateMany({ where: { deploymentId: id, status: "QUOTE" }, data: { status: "CONFIRMED" as DeploymentSiteStatus } });
  }
  await logAudit({ userId: user.id, action: "deployment.setStatus", entityType: "deployment", entityId: id, meta: { status } });
  revalidatePath(`/client/deployments/${id}`);
  revalidatePath("/client/deployments");
  return { ok: true, data: null };
}

/** Snapshot the full corridor economics onto the deployment row. */
async function recomputeDeploymentEconomics(deploymentId: string) {
  const dep = await prisma.deployment.findUnique({ where: { id: deploymentId }, include: { sites: true } });
  if (!dep) return;
  const cfg = await getActiveConfigFor();
  const sites = dep.sites.map((s) => ({
    monthlyRateCents: s.monthlyRateCents,
    infraPremiumCents: s.infraPremiumCents,
    units: s.bedsAllocated,
    startDate: s.startDate,
    endDate: s.endDate,
    hostIsNewAndWithinWaiver: false,
    enterpriseTakeBps: s.enterpriseTakeBps,
  }));
  const econ = computeDeploymentEconomics(sites, cfg);
  await prisma.deployment.update({
    where: { id: deploymentId },
    data: {
      totalGrossCents: econ.totalGrossCents,
      corridorTakeCents: econ.totalEnterpriseTakeCents,
      corridorSaasFeeCents: econ.totalSaasCents,
      totalNetToCorridorCents: econ.totalCorridorRevenueCents,
    },
  });
}
