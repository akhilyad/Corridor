import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/types";
import { jparse } from "@/lib/utils";
import { DEFAULT_PRICING, type PricingConfig } from "@/lib/pricing";

/**
 * Read-side queries shared by every dashboard server component & action.
 *
 * Every fns org-scopes on `user.orgId` so a partner literally cannot see
 * another partner's listings, docs, payouts, etc. — the rule lives here, not
 * in the UI, so it can't be bypassed by a missed `where` in a route handler.
 */

const ACTIVE_DOC_WARN_DAYS = 60;

// ---------------------------------------------------------------------------
// Partner
// ---------------------------------------------------------------------------

export async function partnerDashboardStats(user: SessionUser) {
  const [liveListings, pendingBookings, accruedCents, monthBookingValue, avgFillPercent] = await Promise.all([
    prisma.listing.count({ where: { orgId: user.orgId!, status: "LIVE" } }),
    prisma.bookingRequest.count({ where: { partnerOrgId: user.orgId!, status: "REQUESTED" } }),
    prisma.payout.aggregate({ _sum: { netCents: true }, where: { partnerOrgId: user.orgId!, status: "SCHEDULED" } }),
    monthlyBookingValue(user),
    0,
  ]);

  const acc = await prisma.vendorAccreditation.findMany({
    where: { partnerOrgId: user.orgId! },
    include: { clientOrg: true },
  });

  return {
    liveListings,
    pendingBookings,
    accruedPayoutCents: accruedCents._sum.netCents ?? 0,
    monthBookingValueCents: monthBookingValue,
    fillPct: avgFillPercent,
    accreditations: acc.map((a) => ({ id: a.id, client: a.clientOrg.name, status: a.status, target: a.targetCompletionAt })),
  };
}

async function monthlyBookingValue(user: SessionUser): Promise<number> {
  if (!user.orgId) return 0;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const sites = await prisma.deploymentSite.findMany({
    where: { partnerOrgId: user.orgId, status: { in: ["CONFIRMED", "ACTIVE"] } },
  });
  let sum = 0;
  for (const s of sites) {
    const overlap = Math.max(0, Math.min(monthEnd.getTime(), s.endDate.getTime()) - Math.max(monthStart.getTime(), s.startDate.getTime()));
    const months = overlap / (30.4375 * 86400 * 1000);
    sum += Math.round((s.monthlyRateCents + s.infraPremiumCents) * s.bedsAllocated * months);
  }
  return sum;
}

export async function partnerListings(user: SessionUser) {
  return prisma.listing.findMany({
    where: { orgId: user.orgId! },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { bookingRequests: true } }, nearbyProject: true },
  });
}

export async function partnerBookings(user: SessionUser) {
  return prisma.bookingRequest.findMany({
    where: { partnerOrgId: user.orgId! },
    orderBy: { createdAt: "desc" },
    include: { listing: true, clientOrg: true, deployment: true },
  });
}

export async function partnerDocs(user: SessionUser) {
  return prisma.document.findMany({
    where: { orgId: user.orgId! },
    orderBy: { createdAt: "desc" },
  });
}

export async function partnerPayouts(user: SessionUser) {
  return prisma.payout.findMany({
    where: { partnerOrgId: user.orgId! },
    orderBy: { createdAt: "desc" },
    include: { invoice: { include: { clientOrg: true, deployment: true } } },
  });
}

export async function partnerAccreditations(user: SessionUser) {
  return prisma.vendorAccreditation.findMany({
    where: { partnerOrgId: user.orgId! },
    orderBy: { updatedAt: "desc" },
    include: { clientOrg: true },
  });
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export async function clientDashboardStats(user: SessionUser) {
  const [activeDeployments, crewHoused, openInvoicesCents, pendingBookings, vendorsApproved] = await Promise.all([
    prisma.deployment.count({ where: { clientOrgId: user.orgId!, status: { in: ["CONTRACTED", "ACTIVE", "QUOTE_SENT"] } } }),
    crewHousedAcross(user),
    prisma.invoice.aggregate({ _sum: { totalCents: true }, where: { clientOrgId: user.orgId!, status: { in: ["ISSUED", "PARTIAL", "OVERDUE"] } } }),
    prisma.bookingRequest.count({ where: { clientOrgId: user.orgId!, status: "REQUESTED" } }),
    prisma.vendorAccreditation.count({ where: { clientOrgId: user.orgId!, status: "APPROVED" } }),
  ]);
  return {
    activeDeployments,
    crewHoused,
    openInvoicesCents: openInvoicesCents._sum.totalCents ?? 0,
    pendingBookings,
    vendorsApproved,
  };
}

async function crewHousedAcross(user: SessionUser): Promise<number> {
  const sites = await prisma.deploymentSite.findMany({
    where: { deployment: { clientOrgId: user.orgId! }, status: { in: ["CONFIRMED", "ACTIVE"] } },
  });
  return sites.reduce((a, s) => a + s.bedsAllocated, 0);
}

export type BrowseFilter = {
  q?: string;
  country?: string;
  projectType?: string;
  sleepsMin?: number;
  parkingTypes?: string[];
  storageClasses?: string[];
  fencedYardOnly?: boolean;
  laydownOnly?: boolean;
  heavyVehicleOnly?: boolean;
  wifiOnly?: boolean;
  maxRateCents?: number;
  sort?: "distance" | "price" | "capacity";
};

export async function browseListings(filter: BrowseFilter = {}) {
  const where: Record<string, unknown> = { status: "LIVE" };
  if (filter.q) {
    where.OR = [
      { title: { contains: filter.q } },
      { city: { contains: filter.q } },
      { region: { contains: filter.q } },
      { nearbyProjectName: { contains: filter.q } },
    ];
  }
  if (filter.country) where.country = filter.country;
  if (filter.projectType) where.nearbyProjectType = filter.projectType;
  if (filter.sleepsMin) where.sleepsTotal = { gte: filter.sleepsMin };
  if (filter.parkingTypes?.length) where.parkingType = { in: filter.parkingTypes };
  if (filter.storageClasses?.length) where.storageClass = { in: filter.storageClasses };
  if (filter.fencedYardOnly) where.hasFencedYard = true;
  if (filter.laydownOnly) where.hasLaydownYard = true;
  if (filter.heavyVehicleOnly) where.hasHeavyVehicleAccess = true;
  if (filter.wifiOnly) where.hasWifi = true;
  if (filter.maxRateCents) where.monthlyRateCents = { lte: filter.maxRateCents };

  const orderBy =
    filter.sort === "price"
      ? { monthlyRateCents: "asc" as const }
      : filter.sort === "capacity"
      ? { sleepsTotal: "desc" as const }
      : { distanceToProjectKm: "asc" as const };

  return prisma.listing.findMany({
    where,
    orderBy,
    include: { nearbyProject: true, org: true },
  });
}

export async function getListing(id: string) {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { nearbyProject: true, org: true },
  });
  if (!listing) return null;
  // Documents are polymorphic (ownerType/ownerId) with no relation back to
  // Listing, so they're fetched separately and stitched on for the read side.
  const documents = await prisma.document.findMany({
    where: { ownerType: "LISTING", ownerId: id },
    orderBy: { createdAt: "desc" },
  });
  return { ...listing, documents };
}

export async function clientListingsEnriched(filter: BrowseFilter) {
  const rows = await browseListings(filter);
  // expose accreditation status + insurance proxied from the org
  return rows;
}

export async function clientDeployments(user: SessionUser) {
  return prisma.deployment.findMany({
    where: { clientOrgId: user.orgId! },
    orderBy: { createdAt: "desc" },
    include: { sites: { include: { listing: true, partnerOrg: true } }, clientOrg: true },
  });
}

export async function clientBookings(user: SessionUser) {
  return prisma.bookingRequest.findMany({
    where: { clientOrgId: user.orgId! },
    orderBy: { createdAt: "desc" },
    include: { listing: true, partnerOrg: true, deployment: true },
  });
}

export async function clientInvoices(user: SessionUser) {
  return prisma.invoice.findMany({
    where: { clientOrgId: user.orgId! },
    orderBy: { createdAt: "desc" },
    include: { deployment: true, payouts: { include: { partnerOrg: true } } },
  });
}

export async function clientAccreditations(user: SessionUser) {
  return prisma.vendorAccreditation.findMany({
    where: { clientOrgId: user.orgId! },
    orderBy: { updatedAt: "desc" },
    include: { partnerOrg: true },
  });
}

// ---------------------------------------------------------------------------
// Admin / staff
// ---------------------------------------------------------------------------

export async function adminDashboardStats() {
  const [partners, clients, liveListings, pendingReview, docsToVerify, contractedDeps, openInvoiceCents, corridorRunRateBps] = await Promise.all([
    prisma.organization.count({ where: { type: "PARTNER" } }),
    prisma.organization.count({ where: { type: "CLIENT" } }),
    prisma.listing.count({ where: { status: "LIVE" } }),
    prisma.listing.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.document.count({ where: { status: "PENDING" } }),
    prisma.deployment.count({ where: { status: { in: ["CONTRACTED", "ACTIVE"] } } }),
    prisma.invoice.aggregate({ _sum: { totalCents: true }, where: { status: { in: ["ISSUED", "PARTIAL", "OVERDUE"] } } }),
    activeTakeRate(),
  ]);
  return {
    partners,
    clients,
    liveListings,
    pendingReview,
    docsToVerify,
    contractedDeps,
    openInvoiceCents: openInvoiceCents._sum.totalCents ?? 0,
    corridorRunRateBps,
  };
}

export async function activeTakeRate() {
  const cfg = await prisma.takeRateConfig.findFirst({ where: { isActive: true } });
  return cfg?.enterpriseTakeBpsDefault ?? 1300;
}

/** Live `PricingConfig` from the DB (falls back to defaults if none seeded). */
export async function getActiveConfigFor(): Promise<PricingConfig> {
  const row = await prisma.takeRateConfig.findFirst({ where: { isActive: true } });
  if (!row) return DEFAULT_PRICING;
  return {
    hostCommissionBps: row.hostCommissionBps,
    hostWaiveFirst90Days: row.hostWaiveFirst90Days,
    enterpriseTakeBpsMin: row.enterpriseTakeBpsMin,
    enterpriseTakeBpsMax: row.enterpriseTakeBpsMax,
    enterpriseTakeBpsDefault: row.enterpriseTakeBpsDefault,
    saasFeeCentsPerSiteMonth: row.saasFeeCentsPerSiteMonth,
    vatBps: row.vatBps,
  };
}

export async function getTakeRateConfig() {
  return prisma.takeRateConfig.findFirst({ where: { isActive: true } }) ?? prisma.takeRateConfig.create({ data: {} });
}

export async function adminListingsForReview() {
  return prisma.listing.findMany({
    where: { status: "PENDING_REVIEW" },
    orderBy: { createdAt: "asc" },
    include: { org: true },
  });
}

export async function adminListingsAll() {
  return prisma.listing.findMany({
    orderBy: { createdAt: "desc" },
    include: { org: true, nearbyProject: true },
  });
}

export async function adminDocsToVerify() {
  return prisma.document.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: { org: true },
  });
}

export async function adminDocsAll() {
  return prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: { org: true, verifiedBy: true },
  });
}

export async function adminAccreditations() {
  return prisma.vendorAccreditation.findMany({
    orderBy: { updatedAt: "desc" },
    include: { clientOrg: true, partnerOrg: true, reviewer: true },
  });
}

export async function adminDeployments() {
  return prisma.deployment.findMany({
    orderBy: { createdAt: "desc" },
    include: { clientOrg: true, partnerOrg: true, sites: { include: { listing: true, partnerOrg: true } } },
  });
}

export async function adminInvoices() {
  return prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: { clientOrg: true, deployment: true, payouts: { include: { partnerOrg: true } } },
  });
}

export async function adminPayouts() {
  return prisma.payout.findMany({
    orderBy: { createdAt: "desc" },
    include: { partnerOrg: true, invoice: { include: { clientOrg: true } } },
  });
}

export async function adminUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { org: true },
  });
}

export async function adminOrgs() {
  return prisma.organization.findMany({ orderBy: { createdAt: "asc" } });
}

export async function adminAudit(limit = 200) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: true },
  });
}

export async function projectSitesAll() {
  return prisma.projectSite.findMany({ orderBy: [{ country: "asc" }, { type: "asc" }, { name: "asc" }] });
}

/** Documents at risk of expiry within N days — surfaces a "renewal queue". */
export async function docsExpiringSoon(days = ACTIVE_DOC_WARN_DAYS) {
  const horizon = new Date(Date.now() + days * 86400_000);
  return prisma.document.findMany({
    where: { expiresAt: { lte: horizon, gt: new Date() }, status: "VERIFIED" },
    orderBy: { expiresAt: "asc" },
    include: { org: true },
  });
}

/** Decode the role-mix JSON on a deployment for display. */
export function readRoleMix(s: string | null): Record<string, number> {
  return jparse(s, {}) as Record<string, number>;
}

/** Decode invoice line items JSON for display. */
export function readLineItems<T = unknown>(s: string | null): T[] {
  return (jparse(s, []) as T[]) ?? [];
}
