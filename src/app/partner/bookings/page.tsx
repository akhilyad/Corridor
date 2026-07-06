import Link from "next/link";
import { requireRole } from "@/lib/session";
import { partnerBookings } from "@/lib/queries";
import { fmtEur, fmtDate } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui/empty";
import { Card, CardBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Inbox } from "lucide-react";
import { BookingResponseCard } from "./respond-card";

export default async function PartnerBookingsPage() {
  const user = await requireRole("PARTNER");
  const bookings = await partnerBookings(user);

  return (
    <div>
      <PageHeader
        title="Booking requests"
        description="Procurement clients asking to place crews in your live listings. Accept, decline or counter — the client then confirms to contract."
      />
      {bookings.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-8 w-8" />}
          title="No booking requests"
          description="When a procurement client requests space in one of your live listings it'll land here."
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id}>
              <CardBody className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link href={`/partner/listings/${b.listingId}`} className="font-medium text-ink-900 hover:text-weld-700">
                      {b.listing.title}
                    </Link>
                    <div className="text-sm text-ink-500">
                      from <span className="text-ink-700">{b.clientOrg.name}</span>
                      {b.deployment ? ` · ${b.deployment.projectName}` : ""}
                    </div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
                  <Meta label="Move-in" value={fmtDate(b.requestedMoveIn)} />
                  <Meta label="Move-out" value={fmtDate(b.requestedMoveOut)} />
                  <Meta label="Crew" value={String(b.headcount)} />
                  <Meta
                    label="Proposed"
                    value={b.proposedMonthlyCents ? `${fmtEur(b.proposedMonthlyCents)}/mo` : "Listing rate"}
                  />
                </div>

                {b.counterMonthlyCents != null && (
                  <div className="text-xs text-ink-500">
                    Your last counter: <span className="font-medium text-ink-800">{fmtEur(b.counterMonthlyCents)}/mo</span>
                  </div>
                )}

                {b.message && <p className="rounded-lg bg-ink-50 p-3 text-sm text-ink-700">{b.message}</p>}

                {b.status === "REQUESTED" && <BookingResponseCard id={b.id} />}
                {b.status === "PARTNER_ACCEPTED" && (
                  <p className="text-sm text-ink-600">
                    Accepted — waiting on {b.clientOrg.name} to confirm and contract the booking.
                  </p>
                )}
                {b.status === "COUNTERED" && (
                  <p className="text-sm text-ink-600">Counter sent — waiting on {b.clientOrg.name} to respond.</p>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-ink-400">{label}</div>
      <div className="text-ink-800">{value}</div>
    </div>
  );
}
