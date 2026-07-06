import { requireRole } from "@/lib/session";
import { adminInvoices } from "@/lib/queries";
import { fmtEur, fmtEurCompact, fmtBps, fmtDate } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui/empty";
import { Card, CardBody } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { Stat } from "@/components/ui/stat";
import { FileText } from "lucide-react";

export default async function AdminInvoicesPage() {
  const user = await requireRole("ADMIN", "STAFF");
  void user;
  const invoices = await adminInvoices();

  const open = invoices.filter((i) => ["ISSUED", "PARTIAL", "OVERDUE"].includes(i.status));
  const paid = invoices.filter((i) => i.status === "PAID");
  const corridorTakeTotal = invoices.reduce((a, i) => a + i.corridorTakeCents + i.corridorSaasFeeCents, 0);
  const openCents = open.reduce((a, i) => a + i.totalCents, 0);
  const collectedCents = paid.reduce((a, i) => a + i.totalCents, 0);

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Every consolidated invoice across all client orgs. The corridor take + SaaS fee columns are platform revenue; VAT remits to the tax authority."
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Open" value={fmtEurCompact(openCents)} sub={`${open.length} invoice(s)`} />
        <Stat label="Collected" value={fmtEurCompact(collectedCents)} sub={`${paid.length} paid`} />
        <Stat label="Platform revenue" value={fmtEurCompact(corridorTakeTotal)} sub="take + SaaS fees" />
        <Stat label="Total invoices" value={String(invoices.length)} sub="all statuses" />
      </div>

      {invoices.length === 0 ? (
        <EmptyState icon={<FileText className="h-8 w-8" />} title="No invoices yet" description="Invoices appear here once clients issue them from a deployment." />
      ) : (
        <Card>
          <CardBody className="p-0">
            <Table>
              <THead>
                <TR>
                  <TH>Invoice</TH>
                  <TH>Client</TH>
                  <TH>Project</TH>
                  <TH>Period</TH>
                  <TH>Subtotal</TH>
                  <TH>Take</TH>
                  <TH>SaaS</TH>
                  <TH>VAT</TH>
                  <TH>Total</TH>
                  <TH>Status</TH>
                  <TH>Due</TH>
                </TR>
              </THead>
              <TBody>
                {invoices.map((inv) => (
                  <TR key={inv.id}>
                    <TD className="font-mono text-xs">{inv.invoiceNumber}</TD>
                    <TD>{inv.clientOrg.name}</TD>
                    <TD className="text-ink-700">{inv.deployment?.projectName ?? "Standalone"}</TD>
                    <TD className="text-xs text-ink-500">
                      {fmtDate(inv.billingPeriodStart)}<br />→ {fmtDate(inv.billingPeriodEnd)}
                    </TD>
                    <TD>{fmtEur(inv.subtotalCents)}</TD>
                    <TD>{fmtEur(inv.corridorTakeCents)}</TD>
                    <TD>{fmtEur(inv.corridorSaasFeeCents)}</TD>
                    <TD>
                      {fmtEur(inv.vatCents)}
                      <div className="text-xs text-ink-500">{fmtBps(inv.vatBps)}</div>
                    </TD>
                    <TD className="font-medium">{fmtEur(inv.totalCents)}</TD>
                    <TD>
                      <StatusBadge status={inv.status} />
                    </TD>
                    <TD className="text-ink-500">{fmtDate(inv.dueAt)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
