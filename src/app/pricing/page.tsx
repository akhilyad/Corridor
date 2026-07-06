import { MarketingShell } from "@/components/shell/marketing-shell";
import { WorkedExamplePanel } from "@/components/marketing/worked-example";
import { Stat } from "@/components/ui/stat";
import { ButtonLink } from "@/components/ui/button";
import { fmtBps } from "@/lib/utils";
import { DEFAULT_PRICING } from "@/lib/pricing";

const REVENUE = [
  {
    name: "Host commission",
    range: "8–10%",
    value: fmtBps(DEFAULT_PRICING.hostCommissionBps),
    who: "Withheld from partner payout",
    note: `Waived first 90 days for new partners (cold-start supply). Default ${fmtBps(DEFAULT_PRICING.hostCommissionBps)}.`,
  },
  {
    name: "Enterprise take",
    range: "12–15%",
    value: fmtBps(DEFAULT_PRICING.enterpriseTakeBpsDefault),
    who: "Charged to the client on top of booking",
    note: `The moat, priced on the transaction. Default blended ${fmtBps(DEFAULT_PRICING.enterpriseTakeBpsDefault)}; clamped to ${fmtBps(DEFAULT_PRICING.enterpriseTakeBpsMin)}–${fmtBps(DEFAULT_PRICING.enterpriseTakeBpsMax)} per deployment.`,
  },
  {
    name: "Per-site SaaS fee",
    range: "€750 / site / mo",
    value: "€750",
    who: "Charged to the client as a subscription",
    note: "Compliance + consolidated-billing subscription. The moat, priced as SaaS.",
  },
  {
    name: "VAT",
    range: "19%",
    value: fmtBps(DEFAULT_PRICING.vatBps),
    who: "Applied to the client's total",
    note: "German rate; retunable per config. Recoverable by the B2B client.",
  },
];

export default function PricingPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold text-ink-900">Compliance-anchored pricing</h1>
          <p className="mt-2 text-ink-600">
            Corridor doesn't take a flat marketplace cut. Revenue is layered
            across the transaction, the subscription, and the VAT the client
            recovers — so the model scales with deployment size, not listing count.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {REVENUE.map((r) => (
            <div key={r.name} className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
              <div className="text-xs font-medium uppercase tracking-wide text-ink-500">{r.name}</div>
              <div className="mt-1 text-2xl font-semibold text-weld-700">{r.value}</div>
              <div className="mt-0.5 text-xs text-ink-400">{r.who}</div>
              <p className="mt-3 text-xs leading-relaxed text-ink-600">{r.note}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Host commission band" value={`${fmtBps(DEFAULT_PRICING.hostCommissionBps)} def`} sub="waivable first 90 days" />
          <Stat label="Enterprise take band" value={`${fmtBps(DEFAULT_PRICING.enterpriseTakeBpsMin)}–${fmtBps(DEFAULT_PRICING.enterpriseTakeBpsMax)}`} sub={`${fmtBps(DEFAULT_PRICING.enterpriseTakeBpsDefault)} default`} />
          <Stat label="SaaS subscription" value="€750 / site / mo" sub="per confirmed site" />
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-semibold text-ink-900">The whitepaper worked example</h2>
          <p className="mt-1 text-sm text-ink-500">Computed live against the same engine as the calculator and in-product invoicing.</p>
          <div className="mt-5">
            <WorkedExamplePanel />
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start gap-3 rounded-xl border border-ink-200 bg-ink-50 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">Pilot deployments run free.</h2>
            <p className="mt-1 text-sm text-ink-500">No per-listing fee. Self-hostable. Take rates retunable by a platform admin.</p>
          </div>
          <div className="flex gap-2">
            <ButtonLink href="/calculator" variant="outline">Open calculator</ButtonLink>
            <ButtonLink href="/register">Create account</ButtonLink>
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
