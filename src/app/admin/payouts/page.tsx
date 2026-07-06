import { requireRole } from "@/lib/session";
import { adminPayouts } from "@/lib/queries";
import { fmtEur, fmtEurCompact, fmtDate } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui/empty";
import { Card, CardBody } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { Stat } from "@/components/ui/stat";
import { Wallet } from "lucide-react";

export default async function AdminPayoutsPage() {
  const user = await requireRole("ADMIN", "STAFF");
  void user;
  const payouts = await adminPayouts();

  const scheduled = payouts.filter((p) => p.status === "SCHEDULED" || p.status === "PENDING");
  const paid = payouts.filter((p) => p.status === "PAID");
  const failed = payouts.filter((p) => p.status === "FAILED");
  const scheduledCents = scheduled.reduce((a, p) => a + p.netCents, 0);
  const paidCents = paid.reduce((a, p) => a + p.netCents, 0);

  return (
    <div>
      <PageHeader
        title="Payouts"
        description="Every partner payout minted at invoice issue. Scheduled payouts accrue on the partner dashboard until the invoice settles; paying the parent invoice flips all its payouts to PAID."
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Scheduled" value={fmtEurCompact(scheduledCents)} sub={`${scheduled.length} payout(s)`} />
        <Stat label="Paid out" value={fmtEurCompact(paidCents)} sub={`${paid.length} payout(s)`} />
        <Stat label="Failed" value={String(failed.length)} sub="voided invoices" />
        <Stat label="Total payouts" value={String(payouts.length)} sub="all statuses" />
      </div>

      {payouts.length === 0 ? (
        <EmptyState icon={<Wallet className="h-8 w-8" />} title="No payouts yet" description="Payouts are minted per site when a client issues an invoice." />
      ) : (
        <Card>
          <CardBody className="p-0">
            <Table>
              <THead>
                <TR>
                  <TH>Partner</TH>
                  <TH>Invoice</TH>
                  <TH>Client</TH>
                  <TH>Gross</TH>
                  <TH>Commission</TH>
                  <TH>Net</TH>
                  <TH>Scheduled</TH>
                  <TH>Paid</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                {payouts.length === 0 ? (
                  <EmptyRow colSpan={9} message="No payouts" />
                ) : (
                  payouts.map((p) => (
                    <TR key={p.id}>
                      <TD className="font-medium text-ink-900">{p.partnerOrg.name}</TD>
                      <TD className="font-mono text-xs">{p.invoice.invoiceNumber}</TD>
                      <TD>{p.invoice.clientOrg.name}</TD>
                      <TD>{fmtEur(p.grossCents)}</TD>
                      <TD className="text-red-600">-{fmtEur(p.commissionCents)}</TD>
                      <TD className="font-medium">{fmtEur(p.netCents)}</TD>
                      <TD className="text-ink-500">{fmtDate(p.scheduledFor)}</TD>
                      <TD className="text-ink-500">{fmtDate(p.paidAt)}</TD>
                      <TD>
                        <StatusBadge status={p.status} />
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
