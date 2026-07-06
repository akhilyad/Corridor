import Link from "next/link";
import { requireRole } from "@/lib/session";
import { clientBookings } from "@/lib/queries";
import { humanizeEnum, fmtEur, fmtDate } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui/empty";
import { Card, CardBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Inbox } from "lucide-react";
import { ContractButton, WithdrawButton } from "./booking-actions";

export default async function ClientBookingsPage() {
  const user = await requireRole("CLIENT");
  const bookings = await clientBookings(user);

  return (
    <div>
      <PageHeader
        title="Booking requests"
        description="Your requests to host crews in partner listings. When a host accepts or counters, confirm to lock the contract."
        actions={<Link href="/client/browse" className="text-sm font-medium text-weld-700">Browse listings →</Link>}
      />
      {bookings.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-8 w-8" />}
          title="No booking requests"
          description="Find a listing on the marketplace and send a booking request to kick off a stay."
          action={<Link href="/client/browse" className="text-sm font-medium text-weld-700">Browse listings</Link>}
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id}>
              <CardBody className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link href={`/client/browse/${b.listingId}`} className="font-medium text-ink-900 hover:text-weld-700">
                      {b.listing.title}
                    </Link>
                    <div className="text-sm text-ink-500">
                      to <span className="text-ink-700">{b.partnerOrg.name}</span>
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
                    Host countered at <span className="font-semibold text-weld-700">{fmtEur(b.counterMonthlyCents)}/mo</span>
                  </div>
                )}

                {b.message && <p className="rounded-lg bg-ink-50 p-3 text-sm text-ink-700">{b.message}</p>}

                <BookingActions status={b.status} id={b.id} partner={b.partnerOrg.name} />
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function BookingActions({ status, id, partner }: { status: string; id: string; partner: string }) {
  if (status === "REQUESTED") {
    return (
      <div className="flex items-center gap-3 border-t border-ink-100 pt-3">
        <WithdrawButton id={id} />
        <p className="text-sm text-ink-500">Awaiting {partner}'s response.</p>
      </div>
    );
  }
  if (status === "PARTNER_ACCEPTED" || status === "COUNTERED") {
    return (
      <div className="flex items-center gap-3 border-t border-ink-100 pt-3">
        <ContractButton id={id} />
        <WithdrawButton id={id} />
      </div>
    );
  }
  if (status === "CONTRACTED") {
    return <p className="border-t border-ink-100 pt-3 text-sm text-emerald-700">Contracted — this booking is locked in.</p>;
  }
  if (status === "PARTNER_DECLINED") {
    return <p className="border-t border-ink-100 pt-3 text-sm text-red-600">Host declined this request.</p>;
  }
  if (status === "WITHDRAWN") {
    return <p className="border-t border-ink-100 pt-3 text-sm text-ink-500">Withdrawn.</p>;
  }
  return null;
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-ink-400">{label}</div>
      <div className="text-ink-800">{value}</div>
    </div>
  );
}
