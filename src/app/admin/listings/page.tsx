import { requireRole } from "@/lib/session";
import { adminListingsAll } from "@/lib/queries";
import { humanizeEnum, fmtEur, fmtDate } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui/empty";
import { Card, CardBody } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Home } from "lucide-react";
import { ApproveListingButton, SuspendListingButton } from "./listing-actions";

export default async function AdminListingsPage() {
  const user = await requireRole("ADMIN", "STAFF");
  // Fetch shape only — re-resolved inside the action islands for authz.
  void user;
  const listings = await adminListingsAll();

  return (
    <div>
      <PageHeader
        title="Listings"
        description="Every supply listing across the platform. Approve PENDING_REVIEW to publish to the marketplace; suspend LIVE listings that breach policy."
      />
      {listings.length === 0 ? (
        <EmptyState icon={<Home className="h-8 w-8" />} title="No listings yet" description="Partner listings will appear here once partners create them." />
      ) : (
        <Card>
          <CardBody className="p-0">
            <Table>
              <THead>
                <TR>
                  <TH>Listing</TH>
                  <TH>Partner</TH>
                  <TH>Location</TH>
                  <TH>Sleeps</TH>
                  <TH>Parking</TH>
                  <TH>Rate</TH>
                  <TH>Status</TH>
                  <TH>Submitted</TH>
                  <TH>Actions</TH>
                </TR>
              </THead>
              <TBody>
                {listings.length === 0 ? (
                  <EmptyRow colSpan={9} message="No listings" />
                ) : (
                  listings.map((l) => (
                    <TR key={l.id}>
                      <TD>
                        <div className="font-medium text-ink-900">{l.title}</div>
                        <div className="text-xs text-ink-500">{humanizeEnum(l.propertyType)}</div>
                      </TD>
                      <TD>{l.org.name}</TD>
                      <TD>
                        <div className="text-ink-800">{l.city ?? l.region ?? "—"}</div>
                        <div className="text-xs text-ink-500">{l.country}</div>
                      </TD>
                      <TD>{l.sleepsTotal}</TD>
                      <TD>
                        <Badge tone="neutral">{humanizeEnum(l.parkingType)}</Badge>
                      </TD>
                      <TD>
                        <div className="text-ink-800">{fmtEur(l.monthlyRateCents)}/mo</div>
                        {l.infraPremiumCents > 0 && (
                          <div className="text-xs text-ink-500">+{fmtEur(l.infraPremiumCents)} infra</div>
                        )}
                      </TD>
                      <TD>
                        <Badge tone={toneFor(l.status)}>{prettyStatus(l.status)}</Badge>
                      </TD>
                      <TD className="text-ink-500">{fmtDate(l.createdAt)}</TD>
                      <TD>
                        {l.status === "PENDING_REVIEW" ? (
                          <ApproveListingButton id={l.id} />
                        ) : l.status === "LIVE" ? (
                          <SuspendListingButton id={l.id} />
                        ) : (
                          <span className="text-xs text-ink-400">—</span>
                        )}
                      </TD>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function toneFor(s: string): "green" | "amber" | "red" | "neutral" {
  if (s === "LIVE") return "green";
  if (s === "PENDING_REVIEW") return "amber";
  if (s === "SUSPENDED" || s === "ARCHIVED") return "red";
  return "neutral";
}

function prettyStatus(s: string): string {
  return s
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}
