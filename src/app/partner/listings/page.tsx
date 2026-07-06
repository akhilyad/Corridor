import Link from "next/link";
import { requireRole } from "@/lib/session";
import { partnerListings } from "@/lib/queries";
import { humanizeEnum, fmtEur, fmtKm } from "@/lib/utils";
import { PageHeader } from "@/components/ui/empty";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Inbox } from "lucide-react";

export default async function PartnerListingsPage() {
  const user = await requireRole("PARTNER");
  const listings = await partnerListings(user);

  return (
    <div>
      <PageHeader
        title="My listings"
        description="Your housing + secured-yard assets. Click to edit, submit for review, or archive."
        actions={<ButtonLink href="/partner/listings/new" size="sm">+ New listing</ButtonLink>}
      />
      {listings.length === 0 ? (
        <Card>
          <CardBody className="py-14 text-center text-sm text-ink-500">
            No listings yet.{" "}
            <Link href="/partner/listings/new" className="font-medium text-weld-700">Create your first one</Link>.
          </CardBody>
        </Card>
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>Title</TH>
                <TH>Location</TH>
                <TH>Capacity / infra</TH>
                <TH>Rate</TH>
                <TH>Bookings</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {listings.map((l) => (
                <TR key={l.id}>
                  <TD>
                    <Link href={`/partner/listings/${l.id}`} className="font-medium text-ink-900 hover:text-weld-700">
                      {l.title}
                    </Link>
                    <div className="text-xs text-ink-400">{humanizeEnum(l.propertyType)}</div>
                  </TD>
                  <TD>
                    <div className="text-ink-800">{l.city || l.region || l.country}</div>
                    {l.nearbyProjectName && (
                      <div className="text-xs text-ink-400">
                        {l.distanceToProjectKm != null ? `${fmtKm(l.distanceToProjectKm)} from ` : "near "}
                        {l.nearbyProjectName}
                      </div>
                    )}
                  </TD>
                  <TD>
                    <div className="text-ink-800">Sleeps {l.sleepsTotal}</div>
                    <div className="text-xs text-ink-400">
                      {l.parkingType !== "NONE" ? `${humanizeEnum(l.parkingType)}, ${l.parkingSpaces} bays` : "No parking"}
                      {l.hasHeavyVehicleAccess ? " · HGV access" : ""}
                    </div>
                  </TD>
                  <TD>
                    <div className="text-ink-800">{fmtEur(l.monthlyRateCents)}/mo</div>
                    {l.infraPremiumCents > 0 && <div className="text-xs text-ink-400">+{fmtEur(l.infraPremiumCents)} infra</div>}
                  </TD>
                  <TD>
                    <span className="inline-flex items-center gap-1 text-ink-600">
                      <Inbox className="h-3.5 w-3.5 text-ink-400" /> {l._count.bookingRequests}
                    </span>
                  </TD>
                  <TD><StatusBadge status={l.status} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
