import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { humanizeEnum, fmtEur, fmtKm, fmtDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/empty";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { ListingLifecycleActions } from "./listing-actions";

export default async function PartnerListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("PARTNER");
  const { id } = await params;
  const listing = await prisma.listing.findFirst({ where: { id, orgId: user.orgId! }, include: { nearbyProject: true } });
  if (!listing) notFound();
  // Listing-scoped vault docs are polymorphic (no relation) — fetch separately.
  const documents = await prisma.document.findMany({ where: { ownerType: "LISTING", ownerId: id }, orderBy: { createdAt: "desc" } });

  const infra = [
    ["Parking", `${humanizeEnum(listing.parkingType)} · ${listing.parkingSpaces} bays`],
    ["Axle load", listing.parkingLoadRatingT != null ? `${listing.parkingLoadRatingT} t` : "—"],
    ["Storage", `${humanizeEnum(listing.storageClass)} · ${listing.storageAreaSqm} m²`],
    ["Fenced yard", listing.hasFencedYard ? "Yes" : "No"],
    ["Insured outbuilding", listing.hasInsuredOutbuilding ? "Yes" : "No"],
    ["Heavy-vehicle access", listing.hasHeavyVehicleAccess ? "Yes" : "No"],
    ["Laydown yard", listing.hasLaydownYard ? "Yes" : "No"],
    ["Three-phase power", listing.hasThreePhasePower ? "Yes" : "No"],
    ["Workshop", listing.hasWorkshop ? "Yes" : "No"],
    ["Laundry", listing.hasLaundry ? "Yes" : "No"],
    ["Mess room", listing.hasMessRoom ? "Yes" : "No"],
    ["Wi-Fi", listing.hasWifi ? "Yes" : "No"],
    ["CCTV", listing.hasCCTV ? "Yes" : "No"],
  ] as const;

  return (
    <div>
      <PageHeader
        title={listing.title}
        description={
          listing.city
            ? `${listing.city}, ${listing.country} · ${humanizeEnum(listing.propertyType)}`
            : `${listing.country} · ${humanizeEnum(listing.propertyType)}`
        }
        actions={
          <div className="flex items-center gap-2">
            <ButtonLink href="/partner/listings" variant="outline" size="sm">Back</ButtonLink>
            <ButtonLink href={`/partner/listings/${listing.id}/edit`} variant="subtle" size="sm">Edit</ButtonLink>
          </div>
        }
      />

      <div className="flex items-center gap-2 text-sm text-ink-500">
        <StatusBadge status={listing.status} />
        {listing.publishedAt && <span>Published {fmtDate(listing.publishedAt)}</span>}
        <span>Listing ID {listing.id.slice(-8)}</span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Description</CardTitle></CardHeader>
          <CardBody>
            <p className="whitespace-pre-line text-sm text-ink-700">{listing.description}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Pricing & stay</CardTitle></CardHeader>
          <CardBody className="space-y-2 text-sm">
            <Row label="Monthly rate" value={fmtEur(listing.monthlyRateCents)} />
            <Row label="Infra premium" value={fmtEur(listing.infraPremiumCents)} />
            <Row label="Min stay" value={`${listing.minStayMonths} mo`} />
            <Row label="Max stay" value={`${listing.maxStayMonths} mo`} />
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Capacity</CardTitle></CardHeader>
          <CardBody className="space-y-2 text-sm">
            <Row label="Sleeps" value={String(listing.sleepsTotal)} />
            <Row label="Bedrooms" value={String(listing.bedrooms)} />
            <Row label="Bathrooms" value={String(listing.bathrooms)} />
          </CardBody>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Secured infrastructure</CardTitle></CardHeader>
          <CardBody>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
              {infra.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2 border-b border-ink-50 pb-1">
                  <dt className="text-ink-500">{k}</dt>
                  <dd className="font-medium text-ink-800 text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>
      </div>

      {(listing.nearbyProject || listing.nearbyProjectName) && (
        <Card className="mt-4">
          <CardHeader><CardTitle>Nearby project</CardTitle></CardHeader>
          <CardBody className="space-y-2 text-sm">
            <Row label="Project" value={listing.nearbyProject?.name ?? listing.nearbyProjectName ?? "—"} />
            <Row label="Type" value={humanizeEnum(listing.nearbyProject?.type ?? listing.nearbyProjectType ?? "")} />
            <Row label="Distance" value={fmtKm(listing.distanceToProjectKm)} />
          </CardBody>
        </Card>
      )}

      <Card className="mt-4">
        <CardHeader><CardTitle>Insurance posture</CardTitle></CardHeader>
        <CardBody className="space-y-2 text-sm">
          <Row label="Status" value={humanizeEnum(listing.insuranceStatus)} />
          <Row label="Provider" value={listing.insuranceProvider ?? "—"} />
          <Row label="Insured amount" value={listing.insuranceAmountEurCents ? fmtEur(listing.insuranceAmountEurCents) : "—"} />
        </CardBody>
      </Card>

      {documents.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Listing-scoped documents</CardTitle>
            <ButtonLink href="/partner/docs" variant="ghost" size="sm">Go to vault</ButtonLink>
          </CardHeader>
          <CardBody>
            <ul className="space-y-1.5 text-sm">
              {documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between">
                  <span className="text-ink-800">{d.title}</span>
                  <StatusBadge status={d.status} />
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {listing.status === "ARCHIVED" && (
        <p className="mt-6 text-sm text-ink-500">This listing is archived and no longer visible to procurement.</p>
      )}

      <Card className="mt-4">
        <CardHeader><CardTitle>Lifecycle</CardTitle></CardHeader>
        <CardBody>
          <ListingLifecycleActions id={listing.id} status={listing.status} />
        </CardBody>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-500">{label}</span>
      <span className="font-medium text-ink-800">{value}</span>
    </div>
  );
}
