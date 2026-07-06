/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

/**
 * Corridor seed.
 *
 * Builds a credible demo slice of the European EPC workforce-housing market on
 * top of the whitepaper's named entities (ib vogt, Vattenfall, Siemens Energy,
 * Google, AWS, Civeo, Target Hospitality, Wunderflats) and well-known public
 * German / Benelux offshore-wind projects, base ports and data-center hubs.
 *
 * Project capacities, capex figures and contracts below are *illustrative
 * demo numbers* consistent with the whitepaper's market sizing — they are not
 * audit-grade. The point is to populate the schema end-to-end so the product
 * surfaces (search, quotes, consolidated invoicing, accreditation tracker,
 * pricing calculator) all have something to render.
 *
 * Demo password for every seeded user is printed at the end of the run.
 */

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Corridor2026!";

async function main() {
  console.log("⏳ Seeding Corridor…");

  // ---- pricing config (single active row) ----
  const config = await prisma.takeRateConfig.create({
    data: {
      hostCommissionBps: 900,
      hostWaiveFirst90Days: true,
      enterpriseTakeBpsMin: 1200,
      enterpriseTakeBpsMax: 1500,
      enterpriseTakeBpsDefault: 1300,
      saasFeeCentsPerSiteMonth: 75_000,
      vatBps: 1900,
      isActive: true,
    },
  });

  // ---- Project site catalogue ----
  const sites = await seedProjectSites();

  // ---- Organizations ----
  const corridor = await prisma.organization.create({
    data: {
      type: "PARTNER",
      name: "Corridor",
      legalName: "Corridor Workforce Housing GmbH (demo)",
      country: "DE",
      vatId: "DE000000000",
      contactEmail: "ops@corridor.example",
      addressLine: "Im Corridor 1",
      postalCode: "28195",
      city: "Bremen",
      region: "Bremen",
      accreditationStatus: "APPROVED",
    },
  });

  const partners = await partnersCatalog(sites);
  const clients = await clientsCatalog();

  // ---- Users ----
  const admin = await prisma.user.create({
    data: {
      email: "ops@corridor.example",
      passwordHash: await hash(DEMO_PASSWORD, 10),
      name: "Corridor Ops",
      role: "ADMIN",
      orgId: corridor.id,
      isActive: true,
    },
  });
  const staff = await prisma.user.create({
    data: {
      email: "compliance@corridor.example",
      passwordHash: await hash(DEMO_PASSWORD, 10),
      name: "Corridor Compliance",
      role: "STAFF",
      orgId: corridor.id,
    },
  });

  const partnerUsers: Awaited<ReturnType<typeof prisma.user.create>>[] = [];
  for (const p of partners) {
    const u = await prisma.user.create({
      data: {
        email: p.contactEmail.replace(/\+.*$/, ""),
        passwordHash: await hash(DEMO_PASSWORD, 10),
        name: p.userName,
        role: "PARTNER",
        orgId: p.id,
        phone: "+49 421 0000000",
      },
    });
    partnerUsers.push(u);
  }

  const clientUsers: Awaited<ReturnType<typeof prisma.user.create>>[] = [];
  for (const c of clients) {
    const u = await prisma.user.create({
      data: {
        email: c.contactEmail.replace(/\+.*$/, ""),
        passwordHash: await hash(DEMO_PASSWORD, 10),
        name: c.userName,
        role: "CLIENT",
        orgId: c.id,
      },
    });
    clientUsers.push(u);
  }

  // ---- Listings ----
  const listings = await seedListings({ partners, partnerUsers, sites });

  // ---- Compliance docs ----
  await seedDocuments({ partners, listings, admin, staff });

  // ---- Vendor accreditations ----
  await seedAccreditations({ partners, clients, staff });

  // ---- Deployments + sites + booking requests ----
  const deployments = await seedDeployments({ clients, clientUsers, partnerUsers, partners, listings, sites });

  // ---- Invoices + payouts ----
  await seedInvoices({ deployments, clients, partnerUsers, admin, config });

  // ---- Audit log ----
  await prisma.auditLog.createMany({
    data: [
      { action: "platform.bootstrapped", entityType: "system", userId: admin.id, meta: JSON.stringify({ ts: new Date().toISOString() }) },
      { action: "takeRate.configured", entityType: "TakeRateConfig", entityId: config.id, userId: admin.id },
    ],
  });

  console.log("\n✅ Seed complete.\n");
  console.log("Demo login (every user):");
  console.log("  ops@corridor.example          → ADMIN (Corridor Ops)");
  console.log("  compliance@corridor.example    → STAFF");
  for (const p of partners) console.log(`  ${p.contactEmail.replace(/\+.*$/, "")}    → PARTNER  @ ${p.name}`);
  for (const c of clients) console.log(`  ${c.contactEmail.replace(/\+.*$/, "")}    → CLIENT   @ ${c.name}`);
  console.log(`  password: ${DEMO_PASSWORD}\n`);
}

// ---------------------------------------------------------------------------
// Project sites
// ---------------------------------------------------------------------------

async function seedProjectSites() {
  const raw = [
    { code: "DE-BRK-OF", name: "Borkum Riffgrund West", type: "WIND_OFFSHORE", country: "DE", region: "Niedersachsen", lat: 53.6, lng: 6.4, capacityMw: 277, ownerOrDeveloper: "Ørsted" },
    { code: "DE-ARK-OF", name: "Arkona (Baltic)", type: "WIND_OFFSHORE", country: "DE", region: "Mecklenburg-Vorpommern", lat: 54.7, lng: 13.8, capacityMw: 385, ownerOrDeveloper: "EON / Vattenfall" },
    { code: "DE-WIK-OF", name: "Wikinger (Baltic)", type: "WIND_OFFSHORE", country: "DE", region: "Mecklenburg-Vorpommern", lat: 54.9, lng: 14.1, capacityMw: 350, ownerOrDeveloper: "Iberdrola" },
    { code: "DE-HE3-OF", name: "He Dreiht (EnBW)", type: "WIND_OFFSHORE", country: "DE", region: "Niedersachsen", lat: 54.2, lng: 6.5, capacityMw: 960, ownerOrDeveloper: "EnBW" },
    { code: "DE-N1-OF", name: "Nordsee One", type: "WIND_OFFSHORE", country: "DE", region: "Niedersachsen", lat: 53.8, lng: 6.2, capacityMw: 332, ownerOrDeveloper: "Nordsee One GmbH / Northland" },
    { code: "DE-BOR-ON", name: "Bornstedt onshore cluster", type: "WIND_ONSHORE", country: "DE", region: "Sachsen-Anhalt", lat: 51.8, lng: 11.7, capacityMw: 220, ownerOrDeveloper: "EWE" },
    { code: "DE-BRA-SO", name: "Brandenburg solar park cluster", type: "SOLAR", country: "DE", region: "Brandenburg", lat: 52.3, lng: 13.4, capacityMw: 300, ownerOrDeveloper: "EnBW / ib vogt" },
    { code: "DE-BAY-SO", name: "Bavaria agrivoltaic pipeline", type: "SOLAR", country: "DE", region: "Bayern", lat: 48.8, lng: 11.4, capacityMw: 150, ownerOrDeveloper: "ib vogt" },
    { code: "DE-FRA-DC", name: "Frankfurt (FRA) hyperscaler campus", type: "DATACENTER", country: "DE", region: "Hessen", lat: 50.04, lng: 8.6, capacityMw: 480, ownerOrDeveloper: "AWS / Equinix / others" },
    { code: "DE-HAN-DC", name: "Hanau (Hesse) campus", type: "DATACENTER", country: "DE", region: "Hessen", lat: 50.13, lng: 8.92, capacityMw: 300, ownerOrDeveloper: "Google" },
    { code: "DE-BER-DC", name: "Berlin (BER) data center cluster", type: "DATACENTER", country: "DE", region: "Berlin", lat: 52.36, lng: 13.5, capacityMw: 350, ownerOrDeveloper: "Microsoft / others" },
    { code: "DE-BSH-DC", name: "Hamburg — Hamburg-Moorburg conversion", type: "DATACENTER", country: "DE", region: "Hamburg", lat: 53.5, lng: 9.93, capacityMw: 500, ownerOrDeveloper: "Meta" },
    { code: "NL-AMS-DC", name: "Amsterdam (AMS) hyperscaler ring", type: "DATACENTER", country: "NL", region: "Noord-Holland", lat: 52.3, lng: 4.9, capacityMw: 600, ownerOrDeveloper: "Microsoft / Oracle" },
    { code: "NL-EE-DC", name: "Eemshaven (Groningen) campus", type: "DATACENTER", country: "NL", region: "Groningen", lat: 53.43, lng: 6.83, capacityMw: 700, ownerOrDeveloper: "Google" },
    { code: "DE-BRH-PORT", name: "Bremerhaven base & laydown", type: "PORT", country: "DE", region: "Bremen", lat: 53.54, lng: 8.58, capacityMw: null, ownerOrDeveloper: "bremenports" },
    { code: "DE-CUX-PORT", name: "Cuxhaven base & laydown", type: "PORT", country: "DE", region: "Niedersachsen", lat: 53.87, lng: 8.7, capacityMw: null, ownerOrDeveloper: "Niedersachsen Ports" },
    { code: "DE-EMD-PORT", name: "Emden base & laydown", type: "PORT", country: "DE", region: "Niedersachsen", lat: 53.36, lng: 7.21, capacityMw: null, ownerOrDeveloper: "Niedersachsen Ports" },
    { code: "DE-ROS-PORT", name: "Rostock (Sassnitz-Mukran) base", type: "PORT", country: "DE", region: "Mecklenburg-Vorpommern", lat: 54.14, lng: 13.78, capacityMw: null, ownerOrDeveloper: "Rostock Port" },
  ];

  const out: Record<string, any> = {};
  for (const r of raw) {
    out[r.code] = await prisma.projectSite.create({ data: r });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Partner organizations (supply)
// ---------------------------------------------------------------------------

type PartnerSeed = Awaited<ReturnType<typeof prisma.organization.create>> & { userName: string };
type ClientSeed = Awaited<ReturnType<typeof prisma.organization.create>> & { userName: string };

async function partnersCatalog(_sites: any): Promise<PartnerSeed[]> {
  const defs = [
    { name: "Nordsee Hofapartments", region: "Niedersachsen", city: "Norden", postal: "26506", lat: 53.6, lng: 7.2, userName: "Mareike Petersen", description: "Furnished farmhouse portfolio on the East Frisian coast — fenced yards, barn storage near Emden / Nordsee One.", createdAt: "2025-11-01", contact: "partner1@corridor.example", commod: "FARMHOUSE", iSec: "YES" },
    { name: "Wurster Küsten-Lodges", region: "Niedersachsen", city: "Cuxhaven", postal: "27474", lat: 53.87, lng: 8.7, userName: "Bert Schröder", description: "Modular crew lodges + laydown yard 6km from the Cuxhaven base port; built for monopile staging crews.", createdAt: "2025-12-01", contact: "partner2@corridor.example", commod: "MODULAR_CAMP", iSec: "YES" },
    { name: "Wesermarsch Agrar & Yard", region: "Bremen", city: "Bremerhaven", postal: "27572", lat: 53.55, lng: 8.6, userName: "Anke Brandt", description: "Agri landowner converting machinery sheds + grain stores near Bremerhaven base into insured secure storage.", createdAt: "2025-10-15", contact: "partner3@corridor.example", commod: "AGRI_BUILDING", iSec: "YES" },
    { name: "Ostsee Werksunterkünfte", region: "Mecklenburg-Vorpommern", city: "Sassnitz", postal: "18546", lat: 54.5, lng: 13.6, userName: "Lars Vendt", description: "Apartment + commercial blocks near Mukran & Rostock ports staging Wikinger / Arkona crews.", createdAt: "2026-01-05", contact: "partner4@corridor.example", commod: "APARTMENT_BLOCK", iSec: "NO" },
    { name: "Hanse Workforce Quarters", region: "Hamburg", city: "Hamburg", postal: "21079", lat: 53.46, lng: 9.99, userName: "Petra Olsen", description: "Commercial-unit conversions + fenced yard hire near Hamburg / Berlin data-center build clusters.", createdAt: "2026-02-10", contact: "partner5@corridor.example", commod: "COMMERCIAL_UNIT", iSec: "NO" },
    { name: "Rhein-Main Extended Stay Farm", region: "Hessen", city: "Hanau", postal: "63452", lat: 50.14, lng: 8.95, userName: "Jonas Klein", description: "Farmhouse + insured outbuilding complex 14km from the Hanau (Hesse) hyperscaler campus.", createdAt: "2026-03-01", contact: "partner6@corridor.example", commod: "FARMHOUSE", iSec: "PENDING" },
  ];

  const out: PartnerSeed[] = [];
  for (const d of defs) {
    const org = await prisma.organization.create({
      data: {
        type: "PARTNER",
        name: d.name,
        legalName: d.name + " GmbH",
        country: "DE",
        vatId: `DE${Math.floor(100000000 + Math.random() * 899999999)}`,
        contactEmail: d.contact !== "partner6@corridor.example" ? d.contact : d.contact,
        phone: "+49 421 0000000",
        description: d.description,
        addressLine: `Musterstrasse 1`,
        postalCode: d.postal,
        city: d.city,
        region: d.region,
        accreditationStatus: d.iSec === "YES" ? "APPROVED" : d.iSec === "PENDING" ? "IN_REVIEW" : "PENDING",
        createdAt: new Date(d.createdAt),
      },
    }) as PartnerSeed;
    (org as any).userName = d.userName;
    out.push(org);
  }
  return out;
}

async function clientsCatalog(): Promise<ClientSeed[]> {
  const defs = [
    { name: "ib vogt GmbH", type: "WIND_OFFSHORE", city: "Berlin", region: "Berlin", country: "DE", contact: "client1@corridor.example", userName: "Rami Saade (EPC logistics)", description: "Berlin-HQ solar + offshore developer. Whitepaper §6 design-partner relationship." },
    { name: "Vattenfall Windkraft", type: "WIND_OFFSHORE", city: "Hamburg", region: "Hamburg", country: "DE", contact: "client2@corridor.example", userName: "Sven Lindqvist (offshore logistics)", description: "Nordsee One construction partner; Norfolk Boreas FID-halt cited in whitepaper §8 as cycle risk." },
    { name: "Siemens Energy AG", type: "WIND_OFFSHORE", city: "Erlangen", region: "Bayern", country: "DE", contact: "client3@corridor.example", userName: "Dr. K. Hofmann (grid & substation mobilisation)", description: "Converter station packages for HVDC grid links to offshore wind." },
    { name: "AWS Data Services Germany", type: "DATACENTER", city: "Frankfurt", region: "Hessen", country: "DE", contact: "client4@corridor.example", userName: "M. Reuter (FRA15/FR20 data center ops)", description: "Frankfurt FRA15/FR20 build; parallel AWS ops hiring track overlaps Corridor's GTM." },
    { name: "Google Germany DC", type: "DATACENTER", city: "Hanau", region: "Hessen", country: "DE", contact: "client5@corridor.example", userName: "A. Vogel (Hanau campus build)", description: "€5.5bn German DC commitment 2026-2029 (whitepaper §3.1); Hanau campus EPC." },
    { name: "Nordex/Vestas Joint EPC partnership", type: "WIND_OFFSHORE", city: "Hamburg", region: "Hamburg", country: "DE", contact: "client6@corridor.example", userName: "T. Ahrens (turbine logistics)", description: "Onshore-to-offshore turbine delivery across Bremerhaven + Rostock bases." },
  ];

  const out: ClientSeed[] = [];
  for (const d of defs) {
    const org = await prisma.organization.create({
      data: {
        type: "CLIENT",
        name: d.name,
        legalName: d.name + (d.name.endsWith("AG") || d.name.endsWith("GmbH") ? "" : " GmbH"),
        country: d.country,
        vatId: `DE${Math.floor(100000000 + Math.random() * 899999999)}`,
        contactEmail: d.contact,
        phone: "+49 30 0000000",
        description: d.description,
        city: d.city,
        region: d.region,
        accreditationStatus: "APPROVED",
        takeRateOverrideBps: null,
      },
    }) as ClientSeed;
    (org as any).userName = d.userName;
    out.push(org);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

async function seedListings({ partners, partnerUsers, sites }: { partners: PartnerSeed[]; partnerUsers: any[]; sites: any }) {
  const L = (i: number) => partnerUsers[i % partnerUsers.length]?.id;
  const defs = [
    { partnerIdx: 0, title: "Norden farmhouse — 14 crew + fenced yard + insured barn near Emden",
      propertyType: "FARMHOUSE", country: "DE", region: "Niedersachsen", city: "Norden", postalCode: "26506",
      pType: "WIND_OFFSHORE", pId: sites["DE-N1-OF"].id, pName: "Nordsee One", distKm: 9,
      sleeps: 14, bedrooms: 6, bathrooms: 3,
      parkingType: "FENCED", parkingSpaces: 12, parkingLoadT: 18, storageClass: "INSURED_SECURE", storageArea: 320,
      fenced: true, outbuilding: true, heavyVeh: true, laydown: false, threePhase: true, workshop: true, laundry: true, mess: true, wifi: true, cctv: true,
      insStatus: "INSURED", insProvider: "Allianz EPC Shield", insAmount: 2_000_000_00,
      rate: 8_400_00, infra: 1_600_00, min: 3, max: 18, status: "LIVE" },
    { partnerIdx: 1, title: "Cuxhaven modular lodge campus — 60 beds + 2,000m² laydown yard 6km from base port",
      propertyType: "MODULAR_CAMP", country: "DE", region: "Niedersachsen", city: "Cuxhaven", postalCode: "27474",
      pType: "WIND_OFFSHORE", pId: sites["DE-CUX-PORT"].id, pName: "Cuxhaven base & laydown", distKm: 6,
      sleeps: 60, bedrooms: 30, bathrooms: 14,
      parkingType: "LAYDOWN_YARD", parkingSpaces: 40, parkingLoadT: 60, storageClass: "SECURE", storageArea: 2000,
      fenced: true, outbuilding: true, heavyVeh: true, laydown: true, threePhase: true, workshop: true, laundry: true, mess: true, wifi: true, cctv: true,
      insStatus: "INSURED", insProvider: "HDI Global EPC", insAmount: 5_000_000_00,
      rate: 38_000_00, infra: 12_000_00, min: 3, max: 18, status: "LIVE" },
    { partnerIdx: 2, title: "Bremerhaven machinery shed conversion — secure storage + crew house near base",
      propertyType: "AGRI_BUILDING", country: "DE", region: "Bremen", city: "Bremerhaven", postalCode: "27572",
      pType: "WIND_OFFSHORE", pId: sites["DE-BRH-PORT"].id, pName: "Bremerhaven base & laydown", distKm: 4,
      sleeps: 18, bedrooms: 8, bathrooms: 4,
      parkingType: "BARN", parkingSpaces: 16, parkingLoadT: 24, storageClass: "INSURED_SECURE", storageArea: 850,
      fenced: true, outbuilding: true, heavyVeh: true, laydown: true, threePhase: true, workshop: true, laundry: false, mess: false, wifi: true, cctv: true,
      insStatus: "INSURED", insProvider: "Allianz EPC Shield", insAmount: 1_500_000_00,
      rate: 11_200_00, infra: 2_400_00, min: 2, max: 18, status: "PENDING_REVIEW" },
    { partnerIdx: 3, title: "Sassnitz apartment block — 22 flats near Mukran base (no yard — risk-flagged)",
      propertyType: "APARTMENT_BLOCK", country: "DE", region: "Mecklenburg-Vorpommern", city: "Sassnitz", postalCode: "18546",
      pType: "WIND_OFFSHORE", pId: sites["DE-ROS-PORT"].id, pName: "Rostock (Sassnitz-Mukran) base", distKm: 18,
      sleeps: 40, bedrooms: 22, bathrooms: 22,
      parkingType: "OPEN", parkingSpaces: 20, parkingLoadT: null, storageClass: "BASIC", storageArea: 60,
      fenced: false, outbuilding: false, heavyVeh: false, laydown: false, threePhase: false, workshop: false, laundry: false, mess: false, wifi: true, cctv: false,
      insStatus: "SELF_INSURED", insProvider: null, insAmount: null,
      rate: 21_000_00, infra: 0, min: 1, max: 12, status: "LIVE" },
    { partnerIdx: 4, title: "Hamburg commercial-unit conversion — fenced yard for DC build crews, Moorburg-adjacent",
      propertyType: "COMMERCIAL_UNIT", country: "DE", region: "Hamburg", city: "Hamburg", postalCode: "21079",
      pType: "DATACENTER", pId: sites["DE-BSH-DC"].id, pName: "Hamburg — Hamburg-Moorburg conversion", distKm: 8,
      sleeps: 24, bedrooms: 10, bathrooms: 6,
      parkingType: "FENCED", parkingSpaces: 28, parkingLoadT: 12, storageClass: "SECURE", storageArea: 1200,
      fenced: true, outbuilding: true, heavyVeh: true, laydown: true, threePhase: true, workshop: false, laundry: true, mess: true, wifi: true, cctv: true,
      insStatus: "INSURED", insProvider: "AXA Corporate Solutions", insAmount: 4_000_000_00,
      rate: 26_000_00, infra: 6_500_00, min: 3, max: 18, status: "LIVE" },
    { partnerIdx: 5, title: "Hanau farmhouse + insured outbuilding — DRP/EPC base for Hesse hyperscaler campus",
      propertyType: "FARMHOUSE", country: "DE", region: "Hessen", city: "Hanau", postalCode: "63452",
      pType: "DATACENTER", pId: sites["DE-HAN-DC"].id, pName: "Hanau (Hesse) campus", distKm: 14,
      sleeps: 20, bedrooms: 9, bathrooms: 5,
      parkingType: "GRAIN_STORE", parkingSpaces: 18, parkingLoadT: 30, storageClass: "INSURED_SECURE", storageArea: 600,
      fenced: true, outbuilding: true, heavyVeh: true, laydown: true, threePhase: true, workshop: true, laundry: true, mess: false, wifi: true, cctv: true,
      insStatus: "SELF_INSURED", insProvider: null, insAmount: null,
      rate: 16_000_00, infra: 4_200_00, min: 4, max: 18, status: "PENDING_REVIEW" },
    { partnerIdx: 0, title: "Aurich farmhouse — 10 rigger beds + insured machinery shed near Borkum Riffgrund",
      propertyType: "FARMHOUSE", country: "DE", region: "Niedersachsen", city: "Aurich", postalCode: "26603",
      pType: "WIND_OFFSHORE", pId: sites["DE-BRK-OF"].id, pName: "Borkum Riffgrund West", distKm: 22,
      sleeps: 10, bedrooms: 5, bathrooms: 2,
      parkingType: "MACHINERY_SHED", parkingSpaces: 8, parkingLoadT: 18, storageClass: "SECURE", storageArea: 280,
      fenced: true, outbuilding: true, heavyVeh: true, laydown: false, threePhase: true, workshop: true, laundry: true, mess: false, wifi: true, cctv: false,
      insStatus: "INSURED", insProvider: "Allianz EPC Shield", insAmount: 1_000_000_00,
      rate: 6_800_00, infra: 1_200_00, min: 3, max: 18, status: "LIVE" },
  ];

  const out: any[] = [];
  for (let i = 0; i < defs.length; i++) {
    const d = defs[i];
    const org = partners[d.partnerIdx];
    const creator = organizationUserForPartner(org, partnerUsers, i, L);
    const created = await prisma.listing.create({
      data: {
        orgId: org.id,
        createdById: creator,
        title: d.title,
        description: d.title + " — " + structuredSpec(d),
        propertyType: d.propertyType,
        country: d.country,
        region: d.region,
        city: d.city,
        postalCode: d.postalCode,
        addressLine: `${d.city} ${d.postalCode}`,
        nearbyProjectType: d.pType,
        nearbyProjectId: d.pId,
        nearbyProjectName: d.pName,
        distanceToProjectKm: d.distKm,
        sleepsTotal: d.sleeps,
        bedrooms: d.bedrooms,
        bathrooms: d.bathrooms,
        parkingType: d.parkingType,
        parkingSpaces: d.parkingSpaces,
        parkingLoadRatingT: d.parkingLoadT,
        storageClass: d.storageClass,
        storageAreaSqm: d.storageArea,
        hasFencedYard: d.fenced,
        hasInsuredOutbuilding: d.outbuilding,
        hasHeavyVehicleAccess: d.heavyVeh,
        hasLaydownYard: d.laydown,
        hasThreePhasePower: d.threePhase,
        hasWorkshop: d.workshop,
        hasLaundry: d.laundry,
        hasMessRoom: d.mess,
        hasWifi: d.wifi,
        hasCCTV: d.cctv,
        insuranceStatus: d.insStatus,
        insuranceProvider: d.insProvider,
        insuranceAmountEurCents: d.insAmount,
        monthlyRateCents: d.rate,
        infraPremiumCents: d.infra,
        minStayMonths: d.min,
        maxStayMonths: d.max,
        status: d.status,
        publishedAt: d.status === "LIVE" ? new Date() : null,
      },
    });
    out.push(created);
  }
  return out;
}

function organizationUserForPartner(org: any, partnerUsers: any[], i: number, fallback: (i: number) => any): string {
  // match user created earlier for this partner by the orgId we set on the user
  const u = partnerUsers.find((u: any) => u.orgId === org.id);
  return u?.id ?? fallback(i);
}

function structuredSpec(d: any): string {
  return `Parking ${d.parkingType} (${d.parkingSpaces} spaces), storage ${d.storageClass} (${d.storageArea}m²), fenced=${d.fenced}, laydown=${d.laydown}, insured outbuilding=${d.outbuilding}, 3-phase=${d.threePhase}, sleeps ${d.sleeps}.`;
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

async function seedDocuments({ partners, listings, admin, staff }: { partners: PartnerSeed[]; listings: any[]; admin: any; staff: any }) {
  const now = new Date();
  const issuer = (org: any) => org.accreditationStatus === "APPROVED" ? "HDI Global" : null;
  const amount = (org: any) => org.accreditationStatus === "APPROVED" ? 5_000_000_00 : null;

  for (let i = 0; i < partners.length; i++) {
    const org = partners[i];
    const mk = async (category: string, title: string, daysOffset: number) => {
      const verified = org.accreditationStatus === "APPROVED";
      return prisma.document.create({
        data: {
          ownerType: "PARTNER",
          ownerId: org.id,
          orgId: org.id,
          category,
          title,
          fileName: `${category.toLowerCase()}.pdf`,
          storagePath: `${org.id}/${category.toLowerCase()}-${i}.pdf`,
          mimeType: "application/pdf",
          sizeBytes: 240_000 + i * 1024,
          issuedAt: new Date(now.getTime() - daysOffset * 86400_000),
          expiresAt: new Date(now.getTime() + (daysOffset > 200 ? -1 : 365 - daysOffset) * 86400_000),
          status: verified ? "VERIFIED" : "PENDING",
          uploadedById: admin.id,
          verifiedById: verified ? staff.id : null,
          verifiedAt: verified ? new Date(now.getTime() - 7 * 86400_000) : null,
          notes: verified ? "Cover until next renewal cycle." : "Awaiting compliance review.",
        },
      });
    };
    await mk("PUBLIC_LIABILITY", "Public liability certificate", 30);
    await mk("EMPLOYER_LIABILITY", "Employer liability certificate", 30);
    await mk("SAFETY_ATTESTATION", "HSE safety attestation (BG Bau)", 90);
    await mk("INSURANCE_CERT", "Combined insurance schedule", 60);
    await mk("FIRE_SAFETY", "Fire safety attestation", 120);
    void issuer; void amount;
  }

  // a few per-listing storage certs on the flagship listings
  for (const listId of [listings[1].id, listings[4].id]) {
    await prisma.document.create({
      data: {
        ownerType: "LISTING",
        ownerId: listId,
        orgId: listings[1].orgId,
        category: "GAS_ELEC_CERT",
        title: "Electrical inspection — laydown yard distribution",
        fileName: "elec-inspection.pdf",
        storagePath: `${listId}/elec.pdf`,
        mimeType: "application/pdf",
        sizeBytes: 90_000,
        status: "VERIFIED",
        uploadedById: admin.id,
        verifiedById: staff.id,
        verifiedAt: new Date(now.getTime() - 3 * 86400_000),
        expiresAt: new Date(now.getTime() + 360 * 86400_000),
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Vendor accreditations
// ---------------------------------------------------------------------------

async function seedAccreditations({ partners, clients, staff }: { partners: PartnerSeed[]; clients: ClientSeed[]; staff: any }) {
  const statuses = ["APPROVED", "IN_REVIEW", "CONDITIONAL", "NOT_STARTED"] as const;
  for (let p = 0; p < partners.length; p++) {
    for (let c = 0; c < Math.min(2, clients.length); c++) {
      const st = statuses[(p + c) % statuses.length];
      const started = st === "APPROVED" ? new Date("2025-09-01") : st === "IN_REVIEW" ? new Date("2026-02-01") : st === "CONDITIONAL" ? new Date("2025-12-01") : null;
      await prisma.vendorAccreditation.create({
        data: {
          clientOrgId: clients[c].id,
          partnerOrgId: partners[p].id,
          status: st,
          cycleStartedAt: started,
          expectedDurationDays: 270,
          targetCompletionAt: started ? new Date(started.getTime() + 270 * 86400_000) : null,
          completedAt: st === "APPROVED" ? new Date("2026-03-15") : null,
          reviewerUserId: staff.id,
          requiredDocCategories: JSON.stringify(["INSURANCE_CERT", "PUBLIC_LIABILITY", "EMPLOYER_LIABILITY", "SAFETY_ATTESTATION", "FIRE_SAFETY", "BACKGROUND_CHECK"]),
          notes: st === "APPROVED" ? "On approved-vendor list. Active." : st === "CONDITIONAL" ? "Conditional pending ISO 45001 renewal." : "Compliance review in progress.",
        },
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Deployments
// ---------------------------------------------------------------------------

async function seedDeployments({ clients, clientUsers, partnerUsers, partners, listings, sites }: { clients: ClientSeed[]; clientUsers: any[]; partnerUsers: any[]; partners: PartnerSeed[]; listings: any[]; sites: any }) {
  const out: any[] = [];
  const today = new Date();

  // 1) Whitepaper-scale offshore wind deployment (600 crew, 9 months)
  const ibVogt = clients.find((c) => c.name.startsWith("ib vogt")) ?? clients[0];
  const cuxLodge = listings.find((l) => l.title.includes("Cuxhaven modular lodge"));
  const norden = listings.find((l) => l.title.includes("Norden farmhouse"));
  const aurich = listings.find((l) => l.title.includes("Aurich farmhouse"));
  const cu = clientUsers.find((u) => u.orgId === ibVogt.id) ?? clientUsers[0];
  const pool = [cuxLodge, norden, aurich].filter(Boolean);

  if (pool.length) {
    const start = new Date(today.getTime() + 21 * 86400_000);
    const end = new Date(start.getTime() + 9 * 30.4375 * 86400_000);
    const code = `COR-${ibVogt.name.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, "")}-${2100 + out.length}`;
    const dep = await prisma.deployment.create({
      data: {
        deploymentCode: code,
        clientOrgId: ibVogt.id,
        createdByUserId: cu.id,
        projectName: "Nordsee One → Borkum Riffgrund offshore crew mobilisation",
        projectType: "WIND_OFFSHORE",
        projectCountry: "DE",
        projectRegion: "Niedersachsen",
        crewSize: 600,
        roleMix: JSON.stringify({ riggers: 120, electricians: 140, vesselCrew: 120, hse: 40, support: 180 }),
        startDate: start,
        endDate: end,
        housingBudgetCentsPerPersonMonth: 1_600_00,
        status: "CONTRACTED",
        partnerOrgId: pool[0].orgId,
        notes: "Whitepaper §3.3 worked-example scenario (600 crew × 9 months × €1,400 all-in).",
      },
    });
    // sites: split crew across the flagship infra-equipped listings
    const units = [40, 8, 6];
    const rates = [38_000_00, 8_400_00, 6_800_00];
    const infras = [12_000_00, 1_600_00, 1_200_00];
    for (let i = 0; i < pool.length; i++) {
      await prisma.deploymentSite.create({
        data: {
          deploymentId: dep.id,
          listingId: pool[i].id,
          partnerOrgId: pool[i].orgId,
          bedsAllocated: units[i],
          monthlyRateCents: rates[i],
          infraPremiumCents: infras[i],
          commissionBps: 900,
          enterpriseTakeBps: 1300,
          startDate: start,
          endDate: end,
          status: "CONFIRMED",
        },
      });
      await prisma.bookingRequest.create({
        data: {
          listingId: pool[i].id,
          deploymentId: dep.id,
          clientOrgId: ibVogt.id,
          partnerOrgId: pool[i].orgId,
          requestedByUserId: cu.id,
          status: "CONTRACTED",
          requestedMoveIn: start,
          requestedMoveOut: end,
          headcount: units[i],
          proposedMonthlyCents: rates[i] + infras[i],
          respondedAt: new Date(),
          message: "Offshore crew mobilisation under framework agreement.",
        },
      });
    }
    out.push({ dep, pool });
  }

  // 2) Hyperscaler data center build (Hamburg Moorburg, 240 crew, 12 months)
  const google = clients.find((c) => c.name.startsWith("Google")) ?? clients[clients.length - 1];
  const hhCommercial = listings.find((l) => l.title.includes("Hamburg commercial-unit"));
  const hanauFarm = listings.find((l) => l.title.includes("Hanau farmhouse"));
  const gu = clientUsers.find((u) => u.orgId === google.id) ?? clientUsers[clientUsers.length - 1];
  const pool2 = [hhCommercial, hanauFarm].filter(Boolean);
  if (pool2.length) {
    const start = new Date(today.getTime() + 5 * 86400_000);
    const end = new Date(start.getTime() + 12 * 30.4375 * 86400_000);
    const code = `COR-${google.name.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, "")}-${2101}`;
    const dep = await prisma.deployment.create({
      data: {
        deploymentCode: code,
        clientOrgId: google.id,
        createdByUserId: gu.id,
        projectName: "Hanau + Hamburg-Moorburger DC construction crew housing",
        projectType: "DATACENTER",
        projectCountry: "DE",
        projectRegion: "Hessen/Hamburg",
        crewSize: 240,
        roleMix: JSON.stringify({ structural: 90, mep: 80, fitOut: 50, security: 20 }),
        startDate: start,
        endDate: end,
        housingBudgetCentsPerPersonMonth: 2_000_00,
        status: "QUOTE_SENT",
        partnerOrgId: pool2[0].orgId,
        notes: "2-site consolidated quote; mirrors Target Hospitality $132M single-DC scale at smaller crew.",
      },
    });
    const units = [24, 16];
    const rates = [26_000_00, 16_000_00];
    const infras = [6_500_00, 4_200_00];
    for (let i = 0; i < pool2.length; i++) {
      await prisma.deploymentSite.create({
        data: {
          deploymentId: dep.id,
          listingId: pool2[i].id,
          partnerOrgId: pool2[i].orgId,
          bedsAllocated: units[i],
          monthlyRateCents: rates[i],
          infraPremiumCents: infras[i],
          commissionBps: 900,
          enterpriseTakeBps: 1300,
          startDate: start,
          endDate: end,
          status: "QUOTE",
        },
      });
      await prisma.bookingRequest.create({
        data: {
          listingId: pool2[i].id,
          deploymentId: dep.id,
          clientOrgId: google.id,
          partnerOrgId: pool2[i].orgId,
          requestedByUserId: gu.id,
          status: "REQUESTED",
          requestedMoveIn: start,
          requestedMoveOut: end,
          headcount: units[i],
          proposedMonthlyCents: rates[i] + infras[i],
          message: "DC construction crew housing under consolidated RFP.",
        },
      });
    }
    out.push({ dep: dep, pool: pool2 });
  }

  void partnerUsers; void partners;
  return out;
}

// ---------------------------------------------------------------------------
// Invoices + payouts
// ---------------------------------------------------------------------------

async function seedInvoices({ deployments, admin, config }: { deployments: any[]; clients: ClientSeed[]; partnerUsers: any[]; admin: any; config: any }) {
  if (!deployments.length) return;
  const now = new Date();
  const dep = deployments[0].dep;
  const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const sites = await prisma.deploymentSite.findMany({
    where: { deploymentId: dep.id },
    include: { listing: true },
  });
  if (!sites.length) return;

  const vatBps = config.vatBps;
  let subtotal = 0;
  let take = 0;
  let saas = 0;
  const lineItems: any[] = [];
  for (const s of sites) {
    const months = Math.max(1, Math.round((monthEnd.getTime() - monthStart.getTime()) / (30.4375 * 86400_000)));
    const gross = (s.monthlyRateCents + s.infraPremiumCents) * s.bedsAllocated * months;
    const t = Math.round((gross * s.enterpriseTakeBps) / 10000);
    const siteSaas = 75_000 * months;
    subtotal += gross;
    take += t;
    saas += siteSaas;
    lineItems.push({
      siteId: s.id,
      listingTitle: s.listing.title,
      partnerOrgId: s.partnerOrgId,
      beds: s.bedsAllocated,
      months: Number(months.toFixed(3)),
      days: Math.round(months * 30.4375),
      rateCents: s.monthlyRateCents,
      infraCents: s.infraPremiumCents,
      grossCents: gross,
      takeBps: s.enterpriseTakeBps,
      takeCents: t,
      saasCents: siteSaas,
      partnerNetCents: gross - Math.round((gross * s.commissionBps) / 10000),
    });
  }
  const subtotal2 = subtotal + take + saas;
  const vat = Math.round((subtotal2 * vatBps) / 10000);
  const total = subtotal2 + vat;

  const inv = await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-${dep.deploymentCode}-${(1000).toString()}`,
      clientOrgId: dep.clientOrgId,
      deploymentId: dep.id,
      issuedById: admin.id,
      billingPeriodStart: monthStart,
      billingPeriodEnd: monthEnd,
      status: "ISSUED",
      subtotalCents: subtotal,
      corridorTakeCents: take,
      corridorSaasFeeCents: saas,
      vatBps,
      vatCents: vat,
      totalCents: total,
      lineItems: JSON.stringify(lineItems),
      issuedAt: now,
      dueAt: new Date(now.getTime() + 14 * 86400_000),
    },
  });

  // payouts per partner site on this invoice
  for (const s of sites) {
    const li = lineItems.find((l: any) => l.siteId === s.id)!;
    const commission = Math.round((li.grossCents * s.commissionBps) / 10000);
    await prisma.payout.create({
      data: {
        partnerOrgId: s.partnerOrgId,
        invoiceId: inv.id,
        grossCents: li.grossCents,
        commissionCents: commission,
        netCents: li.grossCents - commission,
        status: "SCHEDULED",
        scheduledFor: new Date(now.getTime() + 5 * 86400_000),
      },
    });
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
