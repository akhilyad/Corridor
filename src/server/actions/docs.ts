"use server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import type { ActionResult, DocStatus } from "@/lib/types";
import { docCategorySchema } from "@/lib/schemas";
import { saveUpload, ALLOWED_DOC_MIMES, MAX_DOC_BYTES, hasValidMagic } from "@/lib/storage";

/**
 * Compliance document vault actions.
 *
 * Uploads flow through the storage abstraction (local FS by default; swap the
 * body for S3/R2 in prod without touching call sites). Mime + size are enforced
 * server-side — never trust a client-provided content-type label.
 */

export async function uploadDocAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await getSession();
  if (!user) return { ok: false, error: "Not signed in." };

  const categoryRaw = String(formData.get("category") ?? "");
  const catParsed = docCategorySchema.safeParse(categoryRaw);
  if (!catParsed.success) return { ok: false, error: "Invalid document category." };
  const category = catParsed.data;

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Select a file to upload." };
  if (file.size > MAX_DOC_BYTES) return { ok: false, error: `File exceeds ${Math.round(MAX_DOC_BYTES / 1024 / 1024)} MiB limit.` };
  // The browser's File.type is the real MIME type as detected by the UA; not a
  // raw header we control, so it's safe to compare against (and we re-check
  // bytes for the common magic numbers below).
  if (!ALLOWED_DOC_MIMES.includes(file.type) && file.type !== "application/octet-stream") {
    return { ok: false, error: "Only PDF, PNG, JPEG or WEBP are accepted." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasValidMagic(bytes, file.type)) {
    return { ok: false, error: "File contents don't match the declared type." };
  }

  const ownerType = String(formData.get("ownerType") ?? "PARTNER");
  const ownerId = String(formData.get("ownerId") ?? user.orgId ?? "");

  // Org-scope: a partner can only upload to their own org (or a listing they
  // own). Admins can upload on behalf of any org.
  let orgId = user.orgId!;
  if (ownerType === "LISTING") {
    const listing = await prisma.listing.findUnique({ where: { id: ownerId } });
    if (!listing) return { ok: false, error: "Listing not found." };
    if (listing.orgId !== user.orgId && user.role !== "ADMIN") return { ok: false, error: "Not permitted." };
    orgId = listing.orgId;
  } else if (user.role !== "ADMIN" && ownerId !== user.orgId) {
    return { ok: false, error: "Not permitted." };
  }

  const relDir = `vault/${orgId}`;
  const { storagePath, sizeBytes, mimeType } = await saveUpload(relDir, file.name, bytes);

  const expiresRaw = formData.get("expiresAt");
  const issuedRaw = formData.get("issuedAt");
  const title = String(formData.get("title") ?? file.name).slice(0, 200);

  const doc = await prisma.document.create({
    data: {
      ownerType,
      ownerId,
      orgId,
      category,
      title,
      fileName: file.name,
      storagePath,
      mimeType,
      sizeBytes,
      issuedAt: issuedRaw ? new Date(String(issuedRaw)) : null,
      expiresAt: expiresRaw ? new Date(String(expiresRaw)) : null,
      status: "PENDING" as DocStatus,
      uploadedById: user.id,
    },
  });
  await logAudit({ userId: user.id, action: "doc.upload", entityType: "document", entityId: doc.id, meta: { category, ownerType, bytes: sizeBytes } });
  revalidatePath("/partner/docs");
  revalidatePath("/admin/docs");
  return { ok: true, data: { id: doc.id } };
}

export async function verifyDocAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getSession();
  if (!user || !can(user, "doc:verify")) return { ok: false, error: "Only compliance staff can verify documents." };
  const id = String(formData.get("id") ?? "");
  const notes = String(formData.get("notes") ?? "").slice(0, 500) || null;
  await prisma.document.update({
    where: { id },
    data: { status: "VERIFIED" as DocStatus, verifiedById: user.id, verifiedAt: new Date(), notes },
  });
  await logAudit({ userId: user.id, action: "doc.verify", entityType: "document", entityId: id });
  revalidatePath("/admin/docs");
  revalidatePath("/partner/docs");
  // Verifying a vault doc may unblock an accreditation review → re-render tracker.
  revalidatePath("/admin/accreditation");
  revalidatePath("/partner/accreditation");
  return { ok: true, data: null };
}

export async function rejectDocAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getSession();
  if (!user || !can(user, "doc:verify")) return { ok: false, error: "Only compliance staff can reject documents." };
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").slice(0, 500) || null;
  await prisma.document.update({
    where: { id },
    data: { status: "REJECTED" as DocStatus, verifiedById: user.id, verifiedAt: new Date(), notes: reason },
  });
  await logAudit({ userId: user.id, action: "doc.reject", entityType: "document", entityId: id, meta: { reason } });
  revalidatePath("/admin/docs");
  revalidatePath("/partner/docs");
  revalidatePath("/admin/accreditation");
  return { ok: true, data: null };
}
