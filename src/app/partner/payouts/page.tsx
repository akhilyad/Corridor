import { requireRole } from "@/lib/session";
import { partnerPayouts } from "@/lib/queries";
import { fmtEur, fmtDate } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui/empty";
import { Card } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { StatusBadge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Wallet } from "lucide-react";

export default async function PartnerPayoutsPage() {
  const user = await requireRole("PARTNER");
  const payouts = await partnerPayouts(user);

  const accrued = payouts
    .filter((p) => p.status === "SCHEDULED" || p.status === "PENDING")
    .reduce((a, p) => a + p.netCents, 0);
  const paid = payouts.filter((p) => p.status === "PAID").reduce((a, p) => a + p.netCents, 0);

  return (
    <div>
      <PageHeader
        title="Payouts"
        description="Net host payouts Corridor collects on your behalf — minted when an invoice is issued and settled NET 30 once the client pays."
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Accrued" value={fmtEur(accrued)} sub="awaiting client payment" />
        <Stat label="Paid out" value={fmtEur(paid)} sub="lifetime" />
        <Stat label="Total payouts" value={String(payouts.length)} sub="all statuses" />
      </div>
      {payouts.length === 0 ? (
        <EmptyState
          icon={<Wallet className="h-8 w-8" />}
          title="No payouts yet"
          description="Payouts are minted automatically when Corridor issues a consolidated invoice for a crew deployment that includes your listings."
        />
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>Invoice</TH>
                <TH>Client / project</TH>
                <TH>Gross</TH>
                <TH>Commission</TH>
                <TH>Net</TH>
                <TH>Scheduled</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {payouts.map((p) => (
                <TR key={p.id}>
                  <TD>
                    <span className="font-mono text-xs text-ink-700">{p.invoice.invoiceNumber}</span>
                  </TD>
                  <TD>
                    <div className="text-ink-800">{p.invoice.clientOrg.name}</div>
                    {p.invoice.deployment && (
                      <div className="text-xs text-ink-400">{p.invoice.deployment.projectName}</div>
                    )}
                  </TD>
                  <TD>{fmtEur(p.grossCents)}</TD>
                  <TD className="text-red-600">-{fmtEur(p.commissionCents)}</TD>
                  <TD className="font-medium text-ink-900">{fmtEur(p.netCents)}</TD>
                  <TD>{fmtDate(p.scheduledFor)}</TD>
                  <TD>
                    <StatusBadge status={p.status} />
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
