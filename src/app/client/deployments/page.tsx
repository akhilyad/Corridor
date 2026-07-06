import Link from "next/link";
import { requireRole } from "@/lib/session";
import { clientDeployments } from "@/lib/queries";
import { humanizeEnum, fmtEur, fmtDate } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui/empty";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Building2 } from "lucide-react";

export default async function ClientDeploymentsPage() {
  const user = await requireRole("CLIENT");
  const deployments = await clientDeployments(user);

  return (
    <div>
      <PageHeader
        title="Deployments"
        description="The crews you're housing through Corridor. Open one to add sites, advance the lifecycle, and issue consolidated invoices."
        actions={<ButtonLink href="/client/deployments/new" size="sm">+ New deployment</ButtonLink>}
      />
      {deployments.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-8 w-8" />}
          title="No deployments yet"
          description="Create your first deployment to start matching it against live secured-infra listings."
          action={<ButtonLink href="/client/deployments/new">+ New deployment</ButtonLink>}
        />
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>Code</TH>
                <TH>Project</TH>
                <TH>Crew</TH>
                <TH>Sites</TH>
                <TH>Span</TH>
                <TH>Gross</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {deployments.map((d) => (
                <TR key={d.id}>
                  <TD>
                    <Link href={`/client/deployments/${d.id}`} className="font-mono text-xs text-ink-500 hover:text-weld-700">
                      {d.deploymentCode}
                    </Link>
                  </TD>
                  <TD>
                    <Link href={`/client/deployments/${d.id}`} className="font-medium text-ink-900 hover:text-weld-700">
                      {d.projectName}
                    </Link>
                    <div className="text-xs text-ink-400">
                      {humanizeEnum(d.projectType)} · {d.projectCountry}
                    </div>
                  </TD>
                  <TD>{d.crewSize}</TD>
                  <TD>{d.sites.length}</TD>
                  <TD>
                    <div className="text-ink-700">{fmtDate(d.startDate)}</div>
                    <div className="text-xs text-ink-400">→ {fmtDate(d.endDate)}</div>
                  </TD>
                  <TD>{d.totalGrossCents != null ? fmtEur(d.totalGrossCents) : "—"}</TD>
                  <TD>
                    <StatusBadge status={d.status} />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
