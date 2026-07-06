import Link from "next/link";
import { requireRole } from "@/lib/session";
import { adminDashboardStats, adminListingsForReview, adminDocsToVerify, adminAudit } from "@/lib/queries";
import { fmtEurCompact, fmtBps, humanizeEnum, fmtDateTime, jparse } from "@/lib/utils";
import { PageHeader } from "@/components/ui/empty";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Stat } from "@/components/ui/stat";
import { ShieldCheck, FileCheck2, Inbox, ArrowRight } from "lucide-react";

export default async function AdminDashboardPage() {
  const user = await requireRole("ADMIN", "STAFF");
  const [stats, reviewQueue, docQueue, audit] = await Promise.all([
    adminDashboardStats(),
    adminListingsForReview(),
    adminDocsToVerify(),
    adminAudit(8),
  ]);

  return (
    <div>
      <PageHeader
        title="Platform operations"
        description="Corridor back-office — listing review, compliance verification, accreditation cycles and take-rate configuration. Staff verify; admins retune economics."
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Partners" value={String(stats.partners)} sub="supply orgs" />
        <Stat label="Clients" value={String(stats.clients)} sub="procurement orgs" />
        <Stat label="Live listings" value={String(stats.liveListings)} sub={`${stats.pendingReview} pending review`} />
        <Stat label="Docs to verify" value={String(stats.docsToVerify)} sub="compliance queue" />
        <Stat label="Contracted deployments" value={String(stats.contractedDeps)} sub="active pipeline" />
        <Stat label="Open invoices" value={fmtEurCompact(stats.openInvoiceCents)} sub="ISSUED · PARTIAL · OVERDUE" />
        <Stat label="Live take rate" value={fmtBps(stats.corridorRunRateBps)} sub="enterprise default" />
        <Stat label="Review backlog" value={String(stats.pendingReview + stats.docsToVerify)} sub="listings + docs" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Listing review queue</CardTitle>
                <CardDescription>{stats.pendingReview} listing(s) awaiting approval</CardDescription>
              </div>
              <Link href="/admin/listings" className="text-sm font-medium text-weld-700">
                All →
              </Link>
            </div>
          </CardHeader>
          <CardBody className="space-y-2">
            {reviewQueue.length === 0 ? (
              <EmptyQueue icon={<ShieldCheck className="h-5 w-5" />} text="No listings awaiting review." />
            ) : (
              reviewQueue.slice(0, 5).map((l) => (
                <Link
                  key={l.id}
                  href={`/admin/listings`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-ink-100 px-3 py-2 hover:bg-ink-50"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink-900">{l.title}</div>
                    <div className="text-xs text-ink-500">
                      {l.org.name} · {l.city ?? l.region ?? l.country}
                    </div>
                  </div>
                  <StatusBadge status={l.status} />
                </Link>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Document verification queue</CardTitle>
                <CardDescription>{stats.docsToVerify} vault doc(s) pending</CardDescription>
              </div>
              <Link href="/admin/docs" className="text-sm font-medium text-weld-700">
                All →
              </Link>
            </div>
          </CardHeader>
          <CardBody className="space-y-2">
            {docQueue.length === 0 ? (
              <EmptyQueue icon={<FileCheck2 className="h-5 w-5" />} text="No documents awaiting verification." />
            ) : (
              docQueue.slice(0, 5).map((d) => (
                <Link
                  key={d.id}
                  href="/admin/docs"
                  className="flex items-center justify-between gap-3 rounded-lg border border-ink-100 px-3 py-2 hover:bg-ink-50"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink-900">{d.title}</div>
                    <div className="text-xs text-ink-500">
                      {d.org?.name ?? "—"} · {humanizeEnum(d.category)}
                    </div>
                  </div>
                  <Badge tone="amber">Pending</Badge>
                </Link>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Latest audit events across the platform</CardDescription>
            </div>
            <Link href="/admin/audit" className="text-sm font-medium text-weld-700">
              Full log →
            </Link>
          </div>
        </CardHeader>
        <CardBody>
          {audit.length === 0 ? (
            <EmptyQueue icon={<Inbox className="h-5 w-5" />} text="No audit events yet." />
          ) : (
            <ul className="space-y-2">
              {audit.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <span className="font-medium text-ink-900">{a.action}</span>
                    <span className="text-ink-400"> · {a.entityType}{a.entityId ? `:${a.entityId.slice(-6)}` : ""}</span>
                    {a.user && <span className="text-ink-500"> · {a.user.name}</span>}
                  </div>
                  <span className="whitespace-nowrap text-xs text-ink-400">{fmtDateTime(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function EmptyQueue({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-ink-400">
      {icon}
      <span>{text}</span>
    </div>
  );
}
