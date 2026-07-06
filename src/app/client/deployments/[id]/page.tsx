import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { browseListings, getActiveConfigFor, readRoleMix } from "@/lib/queries";
import { humanizeEnum, fmtEur, fmtEurCompact, fmtDate, fmtBps } from "@/lib/utils";
import { PageHeader } from "@/components/ui/empty";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Stat } from "@/components/ui/stat";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { AddSiteForm, DeploymentStatusForm, IssueInvoiceForm, RemoveSiteButton } from "./deployment-actions";

export default async function ClientDeploymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("CLIENT");
  const { id } = await params;
  const deployment = await prisma.deployment.findFirst({
    where: { id, clientOrgId: user.orgId! },
    include: {
      sites: { include: { listing: { include: { nearbyProject: true } }, partnerOrg: true } },
      clientOrg: true,
    },
  });
  if (!deployment) notFound();

  const [liveListings, cfg] = await Promise.all([browseListings({}), getActiveConfigFor()]);

  const pricingDefaults = JSON.stringify({
    enterpriseTakeBpsDefault: cfg.enterpriseTakeBpsDefault,
    hostCommissionBps: cfg.hostCommissionBps,
    saasFeeCentsPerSiteMonth: cfg.saasFeeCentsPerSiteMonth,
  });
  const listingsOpts = JSON.stringify(
    liveListings.map((l) => ({
      id: l.id,
      title: l.title,
      city: l.city,
      country: l.country,
      sleepsTotal: l.sleepsTotal,
      monthlyRateCents: l.monthlyRateCents,
      infraPremiumCents: l.infraPremiumCents,
    })),
  );

  const roleMix = readRoleMix(deployment.roleMix);
  const roleKeys = Object.keys(roleMix);
  const confirmedSites = deployment.sites.filter((s) => s.status === "CONFIRMED" || s.status === "ACTIVE");
  const canInvoice = confirmedSites.length > 0;

  const startIso = deployment.startDate.toISOString();
  const endIso = deployment.endDate.toISOString();

  return (
    <div>
      <PageHeader
        title={deployment.projectName}
        description={`${deployment.deploymentCode} · ${humanizeEnum(deployment.projectType)}`}
        actions={
          <div className="flex items-center gap-2">
            <ButtonLink href="/client/deployments" variant="outline" size="sm">Back</ButtonLink>
            <ButtonLink href="/client/browse" variant="subtle" size="sm">Browse listings</ButtonLink>
          </div>
        }
      />

      <div className="flex items-center gap-2 text-sm text-ink-500">
        <StatusBadge status={deployment.status} />
        <span>{deployment.clientOrg.name}</span>
        {deployment.projectRegion && <span>· {deployment.projectRegion}</span>}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Crew size" value={String(deployment.crewSize)} sub={roleKeys.length ? `${roleKeys.length} role types` : "—"} />
        <Stat label="Sites" value={String(deployment.sites.length)} sub={`${confirmedSites.length} confirmed`} />
        <Stat label="Span" value={fmtDate(deployment.startDate)} sub={`→ ${fmtDate(deployment.endDate)}`} />
        <Stat
          label="Snapshot gross"
          value={deployment.totalGrossCents != null ? fmtEurCompact(deployment.totalGrossCents) : "—"}
          sub="all sites"
        />
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Corridor economics snapshot</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
          <Row label="Gross booking" value={deployment.totalGrossCents != null ? fmtEur(deployment.totalGrossCents) : "—"} />
          <Row label="Enterprise take" value={deployment.corridorTakeCents != null ? fmtEur(deployment.corridorTakeCents) : "—"} />
          <Row label="SaaS subscription" value={deployment.corridorSaasFeeCents != null ? fmtEur(deployment.corridorSaasFeeCents) : "—"} />
          <Row label="Net to Corridor" value={deployment.totalNetToCorridorCents != null ? fmtEur(deployment.totalNetToCorridorCents) : "—"} />
        </CardBody>
      </Card>

      {roleKeys.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Role mix</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="flex flex-wrap gap-1.5">
              {roleKeys.map((k) => (
                <Badge key={k} tone="neutral">
                  {humanizeEnum(k)}: {roleMix[k]}
                </Badge>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Deployment sites</CardTitle>
        </CardHeader>
        <Table>
          <THead>
            <TR>
              <TH>Listing</TH>
              <TH>Partner</TH>
              <TH>Beds</TH>
              <TH>Rate</TH>
              <TH>Take</TH>
              <TH>Span</TH>
              <TH>Status</TH>
              <TH></TH>
            </TR>
          </THead>
          <TBody>
            {deployment.sites.length === 0 ? (
              <EmptyRow colSpan={8} message="No sites added yet — add one below." />
            ) : (
              deployment.sites.map((s) => (
                <TR key={s.id}>
                  <TD>
                    <Link href={`/client/browse/${s.listing.id}`} className="font-medium text-ink-900 hover:text-weld-700">
                      {s.listing.title}
                    </Link>
                    {s.listing.nearbyProject?.name && (
                      <div className="text-xs text-ink-400">near {s.listing.nearbyProject.name}</div>
                    )}
                  </TD>
                  <TD>{s.partnerOrg.name}</TD>
                  <TD>{s.bedsAllocated}</TD>
                  <TD>
                    <div className="text-ink-800">{fmtEur(s.monthlyRateCents)}/mo</div>
                    <div className="text-xs text-ink-400">+{fmtEur(s.infraPremiumCents)} infra</div>
                  </TD>
                  <TD>{fmtBps(s.enterpriseTakeBps)}</TD>
                  <TD>
                    <div className="text-ink-700">{fmtDate(s.startDate)}</div>
                    <div className="text-xs text-ink-400">→ {fmtDate(s.endDate)}</div>
                  </TD>
                  <TD>
                    <StatusBadge status={s.status} />
                  </TD>
                  <TD>{s.status === "QUOTE" && <RemoveSiteButton siteId={s.id} />}</TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Add a site</CardTitle>
        </CardHeader>
        <CardBody>
          <AddSiteForm
            deploymentId={deployment.id}
            deploymentStart={startIso}
            deploymentEnd={endIso}
            listings={listingsOpts}
            pricingDefaults={pricingDefaults}
          />
        </CardBody>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Advance status</CardTitle>
          </CardHeader>
          <CardBody>
            <DeploymentStatusForm deploymentId={deployment.id} current={deployment.status} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Issue invoice</CardTitle>
          </CardHeader>
          <CardBody>
            {canInvoice ? (
              <IssueInvoiceForm deploymentId={deployment.id} start={startIso} end={endIso} />
            ) : (
              <p className="text-sm text-ink-500">
                Confirm at least one site — advance the deployment to <span className="font-medium text-ink-800">CONTRACTED</span> — to issue a consolidated invoice.
              </p>
            )}
          </CardBody>
        </Card>
      </div>
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
