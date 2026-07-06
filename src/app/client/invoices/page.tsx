import { requireRole } from "@/lib/session";
import { clientInvoices, readLineItems } from "@/lib/queries";
import { fmtEur, fmtEurCompact, fmtDate, fmtBps } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui/empty";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Stat } from "@/components/ui/stat";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { FileText } from "lucide-react";
import { PayInvoiceButton, VoidInvoiceButton } from "./invoice-actions";

// Line items are serialised JSON and their shape has evolved (seeded rows use
// `days`; the issue action writes `months` + `partnerOrgId` + `partnerNetCents`).
// Read defensively — every display field coerces a fallback so a legacy row can
// never 500 the page.
type LineItem = {
  siteId?: string;
  listingTitle?: string;
  partnerOrgId?: string;
  beds?: number;
  months?: number;
  days?: number;
  rateCents?: number;
  infraCents?: number;
  grossCents?: number;
  takeBps?: number;
  takeCents?: number;
  saasCents?: number;
  partnerNetCents?: number;
};

function monthsLabel(l: LineItem): string {
  const m = typeof l.months === "number" ? l.months : l.days ? l.days / 30.4375 : 0;
  return m.toFixed(2);
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-500">{label}</span>
      <span className="font-medium text-ink-800">{value}</span>
    </div>
  );
}

export default async function ClientInvoicesPage() {
  const user = await requireRole("CLIENT");
  const invoices = await clientInvoices(user);

  const open = invoices.filter((i) => ["ISSUED", "PARTIAL", "OVERDUE"].includes(i.status));
  const paid = invoices.filter((i) => i.status === "PAID");
  const openTotal = open.reduce((a, i) => a + i.totalCents, 0);
  const paidTotal = paid.reduce((a, i) => a + i.totalCents, 0);
  const vatRate = invoices[0]?.vatBps ?? 1900;

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="One consolidated invoice per deployment per billing window — gross housing+infra, plus enterprise take, SaaS subscription and 19% VAT."
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Open" value={fmtEurCompact(openTotal)} sub={`${open.length} invoice(s)`} />
        <Stat label="Paid" value={fmtEurCompact(paidTotal)} sub={`${paid.length} invoice(s)`} />
        <Stat label="Total invoices" value={String(invoices.length)} sub="all statuses" />
        <Stat label="VAT rate" value={fmtBps(vatRate)} sub="applied ex-VAT" />
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title="No invoices yet"
          description="Issue an invoice from a deployment's detail page once at least one site is confirmed."
        />
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const lines = readLineItems<LineItem>(inv.lineItems);
            const canPay = ["ISSUED", "PARTIAL", "OVERDUE"].includes(inv.status);
            const canVoid = inv.status !== "PAID" && inv.status !== "VOID";
            return (
              <Card key={inv.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle className="font-mono text-sm">{inv.invoiceNumber}</CardTitle>
                      <CardDescription>
                        {inv.deployment?.projectName ?? "Standalone bookings"} · {fmtDate(inv.billingPeriodStart)} →{" "}
                        {fmtDate(inv.billingPeriodEnd)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-ink-400">Total incl. VAT</div>
                        <div className="text-lg font-semibold text-ink-900">{fmtEur(inv.totalCents)}</div>
                      </div>
                      <StatusBadge status={inv.status} />
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="space-y-3">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
                    <Row label="Subtotal (host gross)" value={fmtEur(inv.subtotalCents)} />
                    <Row label="Enterprise take" value={fmtEur(inv.corridorTakeCents)} />
                    <Row label="SaaS subscription" value={fmtEur(inv.corridorSaasFeeCents)} />
                    <Row label={`VAT (${fmtBps(inv.vatBps)})`} value={fmtEur(inv.vatCents)} />
                    <Row label="Issued" value={fmtDate(inv.issuedAt)} />
                    <Row label="Due (NET 30)" value={fmtDate(inv.dueAt)} />
                    <Row label="Paid" value={fmtDate(inv.paidAt)} />
                  </div>

                  {lines.length > 0 && (
                    <details>
                      <summary className="cursor-pointer text-sm font-medium text-weld-700">
                        Site line items ({lines.length})
                      </summary>
                      <div className="mt-2 overflow-x-auto scrollbar-thin">
                        <Table>
                          <THead>
                            <TR>
                              <TH>Listing</TH>
                              <TH>Beds</TH>
                              <TH>Months</TH>
                              <TH>Rate</TH>
                              <TH>Gross</TH>
                              <TH>Take</TH>
                              <TH>SaaS</TH>
                            </TR>
                          </THead>
                          <TBody>
                            {lines.map((l, i) => (
                              <TR key={l.siteId ?? i}>
                                <TD>{l.listingTitle ?? "—"}</TD>
                                <TD>{l.beds ?? "—"}</TD>
                                <TD>{monthsLabel(l)}</TD>
                                <TD>{fmtEur(l.rateCents ?? 0)}</TD>
                                <TD>{fmtEur(l.grossCents ?? 0)}</TD>
                                <TD>
                                  {fmtBps(l.takeBps ?? 0)} · {fmtEur(l.takeCents ?? 0)}
                                </TD>
                                <TD>{fmtEur(l.saasCents ?? 0)}</TD>
                              </TR>
                            ))}
                          </TBody>
                        </Table>
                      </div>
                    </details>
                  )}

                  {(canPay || canVoid) && (
                    <div className="flex flex-wrap gap-2 border-t border-ink-100 pt-3">
                      {canPay && <PayInvoiceButton id={inv.id} />}
                      {canVoid && <VoidInvoiceButton id={inv.id} />}
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
