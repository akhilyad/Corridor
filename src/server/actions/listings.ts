"use server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { can } from "@/lib/permissions";
import { listingSchema, parseZod } from "@/lib/schemas";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import type { ActionResult, ListingStatus } from "@/lib/types";

/**
 * Listing server actions.
 *
 * Every mutation re-resolves the session (server actions default to
 * `useActionState`, so identity can never be trusted from client formData) and
 * enforces capability + org ownership. This is the second lock; the
 * middleware role-prefix gate is the first.
 */

function formToListingInput(formData: FormData) {
  const num = (k: string) => (formData.get(k) === "" || formData.get(k) === null ? undefined : Number(formData.get(k)));
  const str = (k: string) => (formData.get(k) === "" ? undefined : String(formData.get(k) ?? ""));
  const bool = (k: string) => formData.get(k) === "on" || formData.get(k) === "true";
  const date = (k: string) => (formData.get(k) === "" ? undefined : String(formData.get(k) ?? ""));

  return {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    propertyType: String(formData.get("propertyType") ?? "HOUSE"),
    country: String(formData.get("country") ?? "DE"),
    region: str("region") ?? "",
    city: str("city") ?? "",
    postalCode: str("postalCode") ?? "",
    addressLine: str("addressLine") ?? "",
    lat: num("lat"),
    lng: num("lng"),
    nearbyProjectType: str("nearbyProjectType"),
    nearbyProjectId: str("nearbyProjectId"),
    nearbyProjectName: str("nearbyProjectName"),
    distanceToProjectKm: num("distanceToProjectKm"),
    sleepsTotal: num("sleepsTotal") ?? 1,
    bedrooms: num("bedrooms") ?? 0,
    bathrooms: num("bathrooms") ?? 0,
    parkingType: String(formData.get("parkingType") ?? "NONE"),
    parkingSpaces: num("parkingSpaces") ?? 0,
    parkingLoadRatingT: num("parkingLoadRatingT"),
    storageClass: String(formData.get("storageClass") ?? "NONE"),
    storageAreaSqm: num("storageAreaSqm") ?? 0,
    hasFencedYard: bool("hasFencedYard"),
    hasInsuredOutbuilding: bool("hasInsuredOutbuilding"),
    hasHeavyVehicleAccess: bool("hasHeavyVehicleAccess"),
    hasLaydownYard: bool("hasLaydownYard"),
    hasThreePhasePower: bool("hasThreePhasePower"),
    hasWorkshop: bool("hasWorkshop"),
    hasLaundry: bool("hasLaundry"),
    hasMessRoom: bool("hasMessRoom"),
    hasWifi: bool("hasWifi"),
    hasCCTV: bool("hasCCTV"),
    insuranceStatus: String(formData.get("insuranceStatus") ?? "NONE"),
    insuranceProvider: str("insuranceProvider"),
    insuranceAmountEurCents: num("insuranceAmountEurCents"),
    monthlyRateCents: num("monthlyRateCents") ?? 0,
    infraPremiumCents: num("infraPremiumCents") ?? 0,
    minStayMonths: num("minStayMonths") ?? 1,
    maxStayMonths: num("maxStayMonths") ?? 18,
  };
}

export async function createListingAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await getSession();
  if (!user || !can(user, "listing:create")) return { ok: false, error: "Sign in as a supply partner to list a property." };
  const parsed = parseZod(listingSchema, formToListingInput(formData));
  if (!parsed.ok) return { ok: false, error: Object.values(parsed.errors)[0] ?? "Invalid listing data" };

  const listing = await prisma.listing.create({
    data: { ...parsed.data, orgId: user.orgId!, createdById: user.id, status: "DRAFT" },
  });
  await logAudit({ userId: user.id, action: "listing.create", entityType: "listing", entityId: listing.id });
  revalidatePath("/partner/listings");
  revalidatePath("/client/browse");
  return { ok: true, data: { id: listing.id } };
}

export async function updateListingAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await getSession();
  const id = String(formData.get("id") ?? "");
  if (!user) return { ok: false, error: "Not signed in." };
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing || listing.orgId !== user.orgId) return { ok: false, error: "Listing not found." };
  if (!can(user, "listing:updateOwn")) return { ok: false, error: "Not permitted." };

  const parsed = parseZod(listingSchema, formToListingInput(formData));
  if (!parsed.ok) return { ok: false, error: Object.values(parsed.errors)[0] ?? "Invalid listing data" };

  const updated = await prisma.listing.update({ where: { id }, data: parsed.data });
  await logAudit({ userId: user.id, action: "listing.update", entityType: "listing", entityId: id });
  revalidatePath(`/partner/listings/${id}`);
  revalidatePath("/partner/listings");
  revalidatePath("/client/browse");
  return { ok: true, data: { id: updated.id } };
}

export async function submitListingForReviewAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getSession();
  const id = String(formData.get("id") ?? "");
  if (!user) return { ok: false, error: "Not signed in." };
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing || listing.orgId !== user.orgId) return { ok: false, error: "Listing not found." };
  await prisma.listing.update({ where: { id }, data: { status: "PENDING_REVIEW" as ListingStatus } });
  await logAudit({ userId: user.id, action: "listing.submit", entityType: "listing", entityId: id });
  revalidatePath("/partner/listings");
  revalidatePath("/admin/listings");
  return { ok: true, data: null };
}

export async function archiveListingAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getSession();
  const id = String(formData.get("id") ?? "");
  if (!user) return { ok: false, error: "Not signed in." };
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing || listing.orgId !== user.orgId) return { ok: false, error: "Listing not found." };
  await prisma.listing.update({ where: { id }, data: { status: "ARCHIVED" as ListingStatus } });
  await logAudit({ userId: user.id, action: "listing.archive", entityType: "listing", entityId: id });
  revalidatePath("/partner/listings");
  revalidatePath("/client/browse");
  return { ok: true, data: null };
}

/** Admin / staff approve → flips to LIVE. */
export async function approveListingAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getSession();
  const id = String(formData.get("id") ?? "");
  if (!user || !can(user, "listing:approve")) return { ok: false, error: "Only platform staff can approve listings." };
  await prisma.listing.update({ where: { id }, data: { status: "LIVE" as ListingStatus, publishedAt: new Date() } });
  await logAudit({ userId: user.id, action: "listing.approve", entityType: "listing", entityId: id });
  revalidatePath("/admin/listings");
  revalidatePath("/client/browse");
  return { ok: true, data: null };
}

export async function suspendListingAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getSession();
  const id = String(formData.get("id") ?? "");
  if (!user || !can(user, "listing:approve")) return { ok: false, error: "Only platform staff can suspend listings." };
  await prisma.listing.update({ where: { id }, data: { status: "SUSPENDED" as ListingStatus } });
  await logAudit({ userId: user.id, action: "listing.suspend", entityType: "listing", entityId: id });
  revalidatePath("/admin/listings");
  revalidatePath("/client/browse");
  return { ok: true, data: null };
}
