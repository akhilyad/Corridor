import { requireRole } from "@/lib/session";
import { adminDeployments } from "@/lib/queries";
import { humanizeEnum, fmtEur, fmtEurCompact, fmtDate } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui/empty";
import { Card, CardBody } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";

export default async function AdminDeploymentsPage() {
  const user = await requireRole("ADMIN", "STAFF");
  void user;
  const deployments = await adminDeployments();

  return (
    <div>
      <PageHeader
        title="Deployments"
        description="Every crew deployment across all client orgs — the unit that actually matters to EPC procurement. Read-only back-office view; clients drive the lifecycle."
      />
      {deployments.length === 0 ? (
        <EmptyState icon={<Building2 className="h-8 w-8" />} title="No deployments yet" description="Client deployments will appear here once clients create them." />
      ) : (
        <Card>
          <CardBody className="p-0">
            <Table>
              <THead>
                <TR>
                  <TH>Code</TH>
                  <TH>Project</TH>
                  <TH>Client</TH>
                  <TH>Crew</TH>
                  <TH>Sites</TH>
                  <TH>Span</TH>
                  <TH>Gross</TH>
                  <TH>Corridor take</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                {deployments.length === 0 ? (
                  <EmptyRow colSpan={9} message="No deployments" />
                ) : (
                  deployments.map((d) => (
                    <TR key={d.id}>
                      <TD className="font-mono text-xs">{d.deploymentCode}</TD>
                      <TD>
                        <div className="font-medium text-ink-900">{d.projectName}</div>
                        <div className="text-xs text-ink-500">
                          {humanizeEnum(d.projectType)} · {d.projectCountry}
                        </div>
                      </TD>
                      <TD>{d.clientOrg.name}</TD>
                      <TD>{d.crewSize}</TD>
                      <TD>{d.sites.length}</TD>
                      <TD className="text-ink-500">
                        {fmtDate(d.startDate)} → {fmtDate(d.endDate)}
                      </TD>
                      <TD className="font-medium">{fmtEurCompact(d.totalGrossCents ?? 0)}</TD>
                      <TD className="text-ink-700">{fmtEur(d.corridorTakeCents ?? 0)}</TD>
                      <TD>
                        <StatusBadge status={d.status} />
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
