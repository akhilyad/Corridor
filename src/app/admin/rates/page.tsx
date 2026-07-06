import { requireRole } from "@/lib/session";
import { getActiveConfigFor } from "@/lib/queries";
import { fmtBps, fmtEur } from "@/lib/utils";
import { PageHeader } from "@/components/ui/empty";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TakeRateConfigForm } from "./rates-actions";

export default async function AdminRatesPage() {
  const user = await requireRole("ADMIN");
  // Take-rate configuration is admin-only — staff can see economics but not retune.
  void user;
  const cfg = await getActiveConfigFor();

  return (
    <div>
      <PageHeader
        title="Take-rate configuration"
        description="The single economic knob. These values flow into every new quote, deployment snapshot and invoice via getActiveConfigFor — historical rows are not migrated (lazy recompute). Changing the default take instantly retunes the marketplace."
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <PreviewRow label="Host commission" value={fmtBps(cfg.hostCommissionBps)} hint={cfg.hostWaiveFirst90Days ? "waived first 90d" : "no waiver"} />
        <PreviewRow label="Enterprise take" value={fmtBps(cfg.enterpriseTakeBpsDefault)} hint={`${fmtBps(cfg.enterpriseTakeBpsMin)}–${fmtBps(cfg.enterpriseTakeBpsMax)}`} />
        <PreviewRow label="SaaS fee" value={fmtEur(cfg.saasFeeCentsPerSiteMonth)} hint="per site / month" />
        <PreviewRow label="VAT" value={fmtBps(cfg.vatBps)} hint="applied ex-VAT" />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Edit live configuration</CardTitle>
            <CardDescription>Saving creates or updates the single active TakeRateConfig row and bumps every economics-rendering cache.</CardDescription>
          </div>
        </CardHeader>
        <CardBody>
          <TakeRateConfigForm current={cfg} />
        </CardBody>
      </Card>
    </div>
  );
}

function PreviewRow({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white px-4 py-3.5 shadow-card">
      <div className="text-[11px] font-medium uppercase tracking-wide text-ink-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-ink-900 tabular">{value}</div>
      <div className="mt-0.5 text-xs text-ink-500">{hint}</div>
    </div>
  );
}
