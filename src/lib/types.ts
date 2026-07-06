/**
 * Shared application-level types. These mirror the Prisma schema string enums
 * so route handlers and server actions get type-checking *before* hitting the DB.
 */

export type Role = "ADMIN" | "PARTNER" | "CLIENT" | "STAFF";

export const ROLES: Role[] = ["ADMIN", "PARTNER", "CLIENT", "STAFF"];

export type OrgType = "PARTNER" | "CLIENT";

export type ListingStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "LIVE"
  | "SUSPENDED"
  | "ARCHIVED";

export type ParkingType =
  | "NONE"
  | "OPEN"
  | "FENCED"
  | "BARN"
  | "GRAIN_STORE"
  | "MACHINERY_SHED"
  | "LAYDOWN_YARD";

export type StorageClass = "NONE" | "BASIC" | "SECURE" | "INSURED_SECURE";

export type InsuranceStatus = "NONE" | "SELF_INSURED" | "INSURED";

export type PropertyType =
  | "HOUSE"
  | "FARMHOUSE"
  | "APARTMENT_BLOCK"
  | "AGRI_BUILDING"
  | "COMMERCIAL_UNIT"
  | "MODULAR_CAMP";

export type ProjectType =
  | "WIND_OFFSHORE"
  | "WIND_ONSHORE"
  | "SOLAR"
  | "DATACENTER"
  | "SUBSTATION"
  | "HYDRO"
  | "H2"
  | "GRID"
  | "MIXED";

export type DocCategory =
  | "INSURANCE_CERT"
  | "PUBLIC_LIABILITY"
  | "EMPLOYER_LIABILITY"
  | "SAFETY_ATTESTATION"
  | "BACKGROUND_CHECK"
  | "FIRE_SAFETY"
  | "GAS_ELEC_CERT"
  | "FOOD_HYGIENE"
  | "ISO_45001"
  | "ISO_9001"
  | "ACCREDITATION"
  | "CONTRACT"
  | "OTHER";

export type DocStatus =
  | "PENDING"
  | "VERIFIED"
  | "EXPIRING_SOON"
  | "EXPIRED"
  | "REJECTED";

export type DeploymentStatus =
  | "DRAFT"
  | "REQUESTED"
  | "QUOTE_SENT"
  | "CONTRACTED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED";

export type DeploymentSiteStatus =
  | "QUOTE"
  | "CONFIRMED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED";

export type BookingStatus =
  | "REQUESTED"
  | "PARTNER_ACCEPTED"
  | "PARTNER_DECLINED"
  | "COUNTERED"
  | "WITHDRAWN"
  | "CONTRACTED";

export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PARTIAL"
  | "PAID"
  | "OVERDUE"
  | "VOID";

export type AccreditationStatus =
  | "NOT_STARTED"
  | "IN_REVIEW"
  | "CONDITIONAL"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED"
  | "PENDING";

export type PayoutStatus = "PENDING" | "SCHEDULED" | "PAID" | "FAILED";

/** Public session shape used by client + middleware. */
export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  orgId: string | null;
  orgType: OrgType | null;
  orgName: string | null;
};

/** Result type used by server actions so the client can render errors. */
export type ActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string };
