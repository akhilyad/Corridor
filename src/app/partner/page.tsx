import { requireRole } from "@/lib/session";
import { partnerDashboardStats } from "@/lib/queries";
import { fmtEurCompact, fmtDate, humanizeEnum } from "@/lib/utils";
import { PageHeader } from "@/components/ui/empty";
import { Stat } from "@/components/ui/stat";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Inbox, Wallet, Home, BadgeCheck } from "lucide-react";

export default async function PartnerDashboardPage() {
  const user = await requireRole("PARTNER");
  const stats = await partnerDashboardStats(user);

  return (
    <div>
      <PageHeader
        title={`Hi, ${user.name.split(" ")[0]}`}
        description={`${user.orgName} — supply partner dashboard`}
        actions={<ButtonLink href="/partner/listings/new" size="sm">+ New listing</ButtonLink>}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Live listings" value={stats.liveListings} sub="published" />
        <Stat label="Pending bookings" value={stats.pendingBookings} sub="awaiting your response" />
        <Stat label="Accrued payout" value={fmtEurCompact(stats.accruedPayoutCents)} sub="scheduled, NET-30" />
        <Stat label="Booking value / mo" value={fmtEurCompact(stats.monthBookingValueCents)} sub="confirmed sites this month" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-2 gap-2">
            <ActionLink href="/partner/listings" icon={<Home className="h-4 w-4" />} label="My listings" />
            <ActionLink href="/partner/docs" icon={<BadgeCheck className="h-4 w-4" />} label="Compliance vault" />
            <ActionLink href="/partner/bookings" icon={<Inbox className="h-4 w-4" />} label="Booking requests" />
            <ActionLink href="/partner/payouts" icon={<Wallet className="h-4 w-4" />} label="Payouts" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accreditation status</CardTitle>
          </CardHeader>
          <CardBody>
            {stats.accreditations.length === 0 ? (
              <p className="text-sm text-ink-500">No accreditation cycles yet. When a procurement client opens your approved-supplier cycle, it'll appear here.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {stats.accreditations.map((a) => (
                  <li key={a.id} className="flex items-center justify-between">
                    <span className="text-ink-800">{a.client}</span>
                    <span className="flex items-center gap-2">
                      <StatusBadge status={a.status} />
                      <span className="text-xs text-ink-400">target {fmtDate(a.target)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function ActionLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-2 rounded-lg border border-ink-200 p-3 text-sm font-medium text-ink-700 hover:border-weld-300 hover:bg-weld-50"
    >
      <span className="text-weld-600">{icon}</span>
      {label}
    </a>
  );
}
