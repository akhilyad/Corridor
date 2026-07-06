import Link from "next/link";
import { requireRole } from "@/lib/session";
import { clientDashboardStats, clientDeployments, clientBookings } from "@/lib/queries";
import { humanizeEnum, fmtEurCompact, fmtEur, fmtDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/empty";
import { Stat } from "@/components/ui/stat";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Building2, Search, FileText, BadgeCheck, Inbox, Wallet, Home } from "lucide-react";

export default async function ClientDashboardPage() {
  const user = await requireRole("CLIENT");
  const [stats, deployments, bookings] = await Promise.all([
    clientDashboardStats(user),
    clientDeployments(user),
    clientBookings(user),
  ]);
  const recentDeps = deployments.slice(0, 5);
  const awaiting = bookings.filter((b) => b.status === "PARTNER_ACCEPTED" || b.status === "COUNTERED").slice(0, 5);

  return (
    <div>
      <PageHeader
        title={`Hi, ${user.name.split(" ")[0]}`}
        description={`${user.orgName} — procurement dashboard`}
        actions={<ButtonLink href="/client/deployments/new" size="sm">+ New deployment</ButtonLink>}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Active deployments" value={String(stats.activeDeployments)} sub="in progress" />
        <Stat label="Crew housed" value={String(stats.crewHoused)} sub="beds allocated" />
        <Stat label="Open invoices" value={fmtEurCompact(stats.openInvoicesCents)} sub="issued + overdue" />
        <Stat label="Pending bookings" value={String(stats.pendingBookings)} sub="awaiting partner" />
        <Stat label="Approved vendors" value={String(stats.vendorsApproved)} sub="accredited" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-2 gap-2">
            <ActionLink href="/client/browse" icon={<Search className="h-4 w-4" />} label="Browse listings" />
            <ActionLink href="/client/deployments" icon={<Building2 className="h-4 w-4" />} label="Deployments" />
            <ActionLink href="/client/bookings" icon={<Inbox className="h-4 w-4" />} label="Booking requests" />
            <ActionLink href="/client/invoices" icon={<FileText className="h-4 w-4" />} label="Invoices" />
            <ActionLink href="/client/accreditation" icon={<BadgeCheck className="h-4 w-4" />} label="Approved vendors" />
            <ActionLink href="/client/deployments/new" icon={<Home className="h-4 w-4" />} label="New deployment" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Awaiting your confirmation</CardTitle>
          </CardHeader>
          <CardBody>
            {awaiting.length === 0 ? (
              <p className="text-sm text-ink-500">
                No bookings awaiting your confirmation. When a host accepts or counters your request, it'll surface here for you to contract.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {awaiting.map((b) => (
                  <li key={b.id} className="flex items-center justify-between">
                    <Link href="/client/bookings" className="text-ink-800 hover:text-weld-700">
                      {b.listing.title}
                    </Link>
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-ink-400">{b.partnerOrg.name}</span>
                      <StatusBadge status={b.status} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Recent deployments</CardTitle>
        </CardHeader>
        <CardBody>
          {recentDeps.length === 0 ? (
            <p className="text-sm text-ink-500">
              No deployments yet.{" "}
              <Link href="/client/deployments/new" className="font-medium text-weld-700">
                Start one
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {recentDeps.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3">
                  <Link href={`/client/deployments/${d.id}`} className="text-ink-800 hover:text-weld-700">
                    <span className="font-mono text-xs text-ink-400">{d.deploymentCode}</span>
                    <span className="ml-2 font-medium">{d.projectName}</span>
                  </Link>
                  <span className="flex items-center gap-3">
                    <span className="text-xs text-ink-500">
                      {d.sites.length} site(s) · {d.crewSize} crew · {humanizeEnum(d.projectType)}
                    </span>
                    {d.totalGrossCents != null && <span className="text-xs text-ink-700">{fmtEurCompact(d.totalGrossCents)}</span>}
                    <StatusBadge status={d.status} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
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
