import { z } from "zod";

/**
 * Zod schemas — the single source of truth for input validation across server
 * actions and client forms. A form gets a `useForm`-friendly `Resolver`-style
 * adapter on top (see components), but here we keep them framework-agnostic.
 */

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(200),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(120),
  email: emailSchema,
  password: z.string().min(8, "At least 8 characters").max(200),
  role: z.enum(["PARTNER", "CLIENT"]),
  companyName: z.string().trim().min(2, "Enter your organization name").max(160),
  country: z.string().trim().min(2).max(2),
  vatId: z.string().trim().max(40).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
});

export const listingSchema = z.object({
  title: z.string().trim().min(4, "Title must be at least 4 characters").max(160),
  description: z.string().trim().min(20, "Description must be at least 20 characters").max(4000),
  propertyType: z.enum([
    "HOUSE",
    "FARMHOUSE",
    "APARTMENT_BLOCK",
    "AGRI_BUILDING",
    "COMMERCIAL_UNIT",
    "MODULAR_CAMP",
  ]),
  country: z.string().trim().length(2),
  region: z.string().trim().max(80).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
  addressLine: z.string().trim().max(200).optional().or(z.literal("")),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  nearbyProjectType: z
    .enum(["WIND_OFFSHORE", "WIND_ONSHORE", "SOLAR", "DATACENTER", "SUBSTATION", "HYDRO", "H2", "GRID", "MIXED"])
    .optional(),
  nearbyProjectId: z.string().optional().or(z.literal("")),
  nearbyProjectName: z.string().trim().max(160).optional().or(z.literal("")),
  distanceToProjectKm: z.coerce.number().min(0).max(2000).optional(),

  sleepsTotal: z.coerce.number().int().min(1, "Must sleep at least 1").max(5000),
  bedrooms: z.coerce.number().int().min(0).max(2000),
  bathrooms: z.coerce.number().int().min(0).max(500),

  parkingType: z.enum(["NONE", "OPEN", "FENCED", "BARN", "GRAIN_STORE", "MACHINERY_SHED", "LAYDOWN_YARD"]),
  parkingSpaces: z.coerce.number().int().min(0).max(5000),
  parkingLoadRatingT: z.coerce.number().min(0).max(500).optional(),
  storageClass: z.enum(["NONE", "BASIC", "SECURE", "INSURED_SECURE"]),
  storageAreaSqm: z.coerce.number().int().min(0).max(200000),

  hasFencedYard: z.coerce.boolean().optional().default(false),
  hasInsuredOutbuilding: z.coerce.boolean().optional().default(false),
  hasHeavyVehicleAccess: z.coerce.boolean().optional().default(false),
  hasLaydownYard: z.coerce.boolean().optional().default(false),
  hasThreePhasePower: z.coerce.boolean().optional().default(false),
  hasWorkshop: z.coerce.boolean().optional().default(false),
  hasLaundry: z.coerce.boolean().optional().default(false),
  hasMessRoom: z.coerce.boolean().optional().default(false),
  hasWifi: z.coerce.boolean().optional().default(false),
  hasCCTV: z.coerce.boolean().optional().default(false),

  insuranceStatus: z.enum(["NONE", "SELF_INSURED", "INSURED"]),
  insuranceProvider: z.string().trim().max(120).optional().or(z.literal("")),
  insuranceAmountEurCents: z.coerce.number().int().min(0).optional(),

  monthlyRateCents: z.coerce.number().int().min(0, "Rate must be positive"),
  infraPremiumCents: z.coerce.number().int().min(0).max(5_000_000_00),
  minStayMonths: z.coerce.number().int().min(1).max(36),
  maxStayMonths: z.coerce.number().int().min(1).max(36),

  status: z.enum(["DRAFT", "PENDING_REVIEW", "LIVE", "SUSPENDED", "ARCHIVED"]).optional(),
});

export const deploymentSchema = z.object({
  projectName: z.string().trim().min(3, "Project name too short").max(160),
  projectType: z.enum(["WIND_OFFSHORE", "WIND_ONSHORE", "SOLAR", "DATACENTER", "SUBSTATION", "HYDRO", "H2", "GRID", "MIXED"]),
  projectCountry: z.string().trim().length(2),
  projectRegion: z.string().trim().max(80).optional().or(z.literal("")),
  crewSize: z.coerce.number().int().min(1, "Crew must be at least 1").max(5000),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  housingBudgetCentsPerPersonMonth: z.coerce.number().int().min(0).optional(),
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
}).refine((d) => d.endDate > d.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

export const deploymentSiteSchema = z.object({
  listingId: z.string().min(1, "Select a listing"),
  bedsAllocated: z.coerce.number().int().min(1).max(5000),
  monthlyRateCents: z.coerce.number().int().min(0),
  infraPremiumCents: z.coerce.number().int().min(0),
  commissionBps: z.coerce.number().int().min(0).max(5000),
  enterpriseTakeBps: z.coerce.number().int().min(0).max(5000),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).refine((d) => d.endDate > d.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

export const bookingRequestSchema = z.object({
  listingId: z.string().min(1),
  deploymentId: z.string().optional().or(z.literal("")),
  requestedMoveIn: z.coerce.date(),
  requestedMoveOut: z.coerce.date(),
  headcount: z.coerce.number().int().min(1).max(5000),
  proposedMonthlyCents: z.coerce.number().int().min(0).optional(),
  message: z.string().trim().max(4000).optional().or(z.literal("")),
}).refine((d) => d.requestedMoveOut > d.requestedMoveIn, {
  message: "Move-out must be after move-in",
  path: ["requestedMoveOut"],
});

export const docCategorySchema = z.enum([
  "INSURANCE_CERT",
  "PUBLIC_LIABILITY",
  "EMPLOYER_LIABILITY",
  "SAFETY_ATTESTATION",
  "BACKGROUND_CHECK",
  "FIRE_SAFETY",
  "GAS_ELEC_CERT",
  "FOOD_HYGIENE",
  "ISO_45001",
  "ISO_9001",
  "ACCREDITATION",
  "CONTRACT",
  "OTHER",
]);

export const takeRateConfigSchema = z.object({
  hostCommissionBps: z.coerce.number().int().min(0).max(5000),
  hostWaiveFirst90Days: z.coerce.boolean(),
  enterpriseTakeBpsMin: z.coerce.number().int().min(0).max(5000),
  enterpriseTakeBpsMax: z.coerce.number().int().min(0).max(5000),
  enterpriseTakeBpsDefault: z.coerce.number().int().min(0).max(5000),
  saasFeeCentsPerSiteMonth: z.coerce.number().int().min(0).max(10_000_000),
  vatBps: z.coerce.number().int().min(0).max(10000),
}).refine((c) => c.enterpriseTakeBpsMax >= c.enterpriseTakeBpsMin, {
  message: "Max take must be ≥ min take",
  path: ["enterpriseTakeBpsMax"],
});

export function flattenZodError(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function parseZod<T>(schema: z.ZodType<T>, raw: unknown): { ok: true; data: T } | { ok: false; errors: Record<string, string> } {
  const parsed = schema.safeParse(raw);
  if (parsed.success) return { ok: true, data: parsed.data };
  return { ok: false, errors: flattenZodError(parsed.error) };
}
