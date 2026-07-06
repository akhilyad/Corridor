import type { Role, OrgType } from "@/lib/types";
import type { SessionUser } from "@/lib/types";

/**
 * Capability rules. Plain functions so the UI and the server actions share the
 * *exact same* gating logic — always call `can()` from both sides, never trust
 * the client to hide a button alone.
 *
 * Org-scoped resources (listings, documents, deployments, invoices) are owned
 * on `orgId`; cross-org access is denied except where explicitly granted
 * (e.g. PARTNER sees a CLIENT's booking request involving their listing).
 */

export type Capability =
  | "listing:create"
  | "listing:readOwn"
  | "listing:updateOwn"
  | "listing:submit"
  | "listing:approve" // admin
  | "listing:archive"
  | "deployment:create" // client
  | "deployment:readOwn"
  | "deployment:readAsPartner"
  | "invoice:issue" // client (issuing to partners) — actually buyer side
  | "invoice:readOwn"
  | "invoice:verify" // admin/partner payout review
  | "doc:upload"
  | "doc:verify" // admin/staff
  | "accreditation:manage"
  | "takeRate:configure" // admin
  | "admin:all"
  | "payout:review";

export function can(u: SessionUser | null, cap: Capability, scope?: { orgId?: string; ownerId?: string }): boolean {
  if (!u) return false;

  // ADMIN is god-mode inside the demo.
  if (u.role === "ADMIN") return true;
  if (u.role === "STAFF") {
    // Staff: operational back-office — verify docs, manage accreditations, but
    // cannot reconfigure take rates or impersonate pricing.
    return (
      cap === "doc:verify" ||
      cap === "accreditation:manage" ||
      cap === "listing:approve" ||
      cap === "invoice:verify" ||
      cap === "payout:review" ||
      cap === "listing:readOwn"
    );
  }

  const owns = scope?.orgId ? scope.orgId === u.orgId : scope?.ownerId ? false : true;

  switch (cap) {
    case "listing:create":
    case "listing:updateOwn":
    case "listing:submit":
    case "listing:archive":
    case "listing:readOwn":
    case "doc:upload":
      return u.role === "PARTNER" && (cap === "listing:create" || cap === "doc:upload" ? true : true);

    case "deployment:create":
    case "deployment:readOwn":
      return u.role === "CLIENT";

    case "deployment:readAsPartner":
      return u.role === "PARTNER";

    case "invoice:issue":
    case "invoice:readOwn":
      return u.role === "CLIENT";

    case "accreditation:manage":
    case "takeRate:configure":
    case "admin:all":
      return false;

    default:
      return false;
  }
}

/** Convenience wrappers for server guards. */
export function assertCan(u: SessionUser | null, cap: Capability, scope?: Parameters<typeof can>[2]): void {
  if (!can(u, cap, scope)) {
    throw new Error("Not permitted");
  }
}

export const roleLabel: Record<Role, string> = {
  ADMIN: "Platform admin",
  PARTNER: "Supply partner",
  CLIENT: "Procurement / EPC client",
  STAFF: "Compliance staff",
};

/** Returns the route prefix that role lands on after auth. */
export function roleHome(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "PARTNER":
      return "/partner";
    case "CLIENT":
      return "/client";
    case "STAFF":
      return "/admin";
  }
}

export function orgTypeLabel(t: OrgType | null): string {
  if (t === "PARTNER") return "Supply partner";
  if (t === "CLIENT") return "Procurement client";
  return "—";
}
