"use server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import type { ActionResult, BookingStatus } from "@/lib/types";
import { bookingRequestSchema, parseZod } from "@/lib/schemas";

/**
 * Booking-request lifecycle:
 *
 *   REQUESTED → PARTNER_ACCEPTED → (client confirms) → CONTRACTED
 *   REQUESTED → PARTNER_DECLINED
 *   REQUESTED → COUNTERED (partner proposes different terms) → PARTNER_ACCEPTED
 *
 * A booking optionally links to a deployment; the consolidated invoice later
 * rolls up all confirmed bookings under that deployment.
 */

export async function requestBookingAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ listingId: string }>> {
  const user = await getSession();
  if (!user || !can(user, "deployment:create")) return { ok: false, error: "Only procurement clients can request bookings." };

  const raw = {
    listingId: formData.get("listingId"),
    deploymentId: formData.get("deploymentId") || "",
    requestedMoveIn: formData.get("requestedMoveIn"),
    requestedMoveOut: formData.get("requestedMoveOut"),
    headcount: formData.get("headcount"),
    proposedMonthlyCents: formData.get("proposedMonthlyCents") || undefined,
    message: formData.get("message") || "",
  };
  const parsed = parseZod(bookingRequestSchema, raw);
  if (!parsed.ok) return { ok: false, error: Object.values(parsed.errors)[0] ?? "Invalid booking request" };

  const listing = await prisma.listing.findUnique({ where: { id: parsed.data.listingId } });
  if (!listing || listing.status !== "LIVE") return { ok: false, error: "That listing is not available." };

  const here = await prisma.bookingRequest.create({
    data: {
      listingId: listing.id,
      deploymentId: parsed.data.deploymentId || null,
      clientOrgId: user.orgId!,
      partnerOrgId: listing.orgId,
      requestedByUserId: user.id,
      status: "REQUESTED" as BookingStatus,
      requestedMoveIn: parsed.data.requestedMoveIn,
      requestedMoveOut: parsed.data.requestedMoveOut,
      headcount: parsed.data.headcount,
      proposedMonthlyCents: parsed.data.proposedMonthlyCents,
      message: parsed.data.message ?? null,
    },
  });
  await logAudit({ userId: user.id, action: "booking.request", entityType: "bookingRequest", entityId: here.id, meta: { listingId: listing.id } });
  revalidatePath("/partner/bookings");
  revalidatePath("/client/bookings");
  return { ok: true, data: { listingId: listing.id } };
}

export async function respondBookingAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getSession();
  if (!user) return { ok: false, error: "Not signed in." };
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? ""); // accept | decline | counter
  const counterMonthlyCents = formData.get("counterMonthlyCents") ? Number(formData.get("counterMonthlyCents")) : undefined;

  const br = await prisma.bookingRequest.findUnique({ where: { id }, include: { listing: true } });
  if (!br) return { ok: false, error: "Booking not found." };
  // Partner responds to bookings on their listings
  if (br.partnerOrgId !== user.orgId && user.role !== "ADMIN") return { ok: false, error: "Not permitted." };

  let status: BookingStatus;
  if (decision === "accept") status = "PARTNER_ACCEPTED";
  else if (decision === "decline") status = "PARTNER_DECLINED";
  else if (decision === "counter") status = "COUNTERED";
  else return { ok: false, error: "Unknown decision." };

  await prisma.bookingRequest.update({
    where: { id },
    data: { status, counterMonthlyCents: counterMonthlyCents ?? br.counterMonthlyCents, respondedAt: new Date() },
  });
  await logAudit({ userId: user.id, action: `booking.${decision}`, entityType: "bookingRequest", entityId: id, meta: { status, counter: counterMonthlyCents } });
  revalidatePath("/partner/bookings");
  revalidatePath("/client/bookings");
  return { ok: true, data: null };
}

export async function contractBookingAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getSession();
  if (!user) return { ok: false, error: "Not signed in." };
  const id = String(formData.get("id") ?? "");
  const br = await prisma.bookingRequest.findUnique({ where: { id } });
  if (!br) return { ok: false, error: "Booking not found." };
  if (br.clientOrgId !== user.orgId && user.role !== "ADMIN") return { ok: false, error: "Not permitted." };
  if (br.status !== "PARTNER_ACCEPTED" && br.status !== "COUNTERED") return { ok: false, error: "Partner hasn't accepted yet." };

  await prisma.bookingRequest.update({ where: { id }, data: { status: "CONTRACTED" as BookingStatus } });
  await logAudit({ userId: user.id, action: "booking.contract", entityType: "bookingRequest", entityId: id });
  revalidatePath("/client/bookings");
  revalidatePath("/partner/bookings");
  return { ok: true, data: null };
}

export async function withdrawBookingAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getSession();
  if (!user) return { ok: false, error: "Not signed in." };
  const id = String(formData.get("id") ?? "");
  const br = await prisma.bookingRequest.findUnique({ where: { id } });
  if (!br) return { ok: false, error: "Booking not found." };
  if (br.clientOrgId !== user.orgId && user.role !== "ADMIN") return { ok: false, error: "Not permitted." };
  await prisma.bookingRequest.update({ where: { id }, data: { status: "WITHDRAWN" as BookingStatus } });
  await logAudit({ userId: user.id, action: "booking.withdraw", entityType: "bookingRequest", entityId: id });
  revalidatePath("/client/bookings");
  return { ok: true, data: null };
}
