import { computeCrewScenario, WHITEPAPER_REFERENCE, DEFAULT_PRICING, MARKET_SIZE } from "@/lib/pricing";
import { fmtEur, fmtEurCompact, fmtBps } from "@/lib/utils";
import { Stat } from "@/components/ui/stat";

/**
 * Reproduces the whitepaper §3.3 worked example *live* via the same
 * `computeCrewScenario` the procurement dashboard uses — so the marketing
 * number and the in-product number can never drift apart.
 */
export function WorkedExamplePanel() {
  const r = computeCrewScenario(WHITEPAPER_REFERENCE, DEFAULT_PRICING);
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-card">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-ink-900">Worked example, computed live</h3>
        <span className="text-xs text-ink-400">600 crew · 9 months · €1,400/person/mo · 6 sites</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Gross booking" value={fmtEurCompact(r.totalGrossCents)} sub="housing + infra" />
        <Stat label="Corridor take" value={fmtEurCompact(r.totalEnterpriseTakeCents)} sub={`${fmtBps(WHITEPAPER_REFERENCE.enterpriseTakeBps ?? 1300)} enterprise`} />
        <Stat label="SaaS subscription" value={fmtEurCompact(r.totalSaasCents)} sub="€750 / site / mo" />
        <Stat label="Corridor revenue" value={fmtEurCompact(r.totalCorridorRevenueCents)} sub="take + commission + SaaS" />
      </div>
      <div className="mt-4 rounded-lg bg-ink-50 p-3 text-xs text-ink-600">
        Client pays {fmtEur(r.clientTotalCents)} incl. {fmtBps(DEFAULT_PRICING.vatBps)} VAT · blended take {fmtBps(r.blendedTakeRateBps)} · partner payout {fmtEurCompact(r.totalPartnerPayoutCents)}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-ink-400">
        The whitepaper text describes this as a "60-person crew"; the stated €7.56M / €983K figures
        only close at 600 person-months, so the calculator loads 600 / 9 / €1,400 to reproduce the
        documented economics.
      </p>
      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-ink-100 pt-4">
        <Stat label="TAM (EUR)" value={`€${(MARKET_SIZE.tamEurLow / 1e6).toFixed(0)}–${(MARKET_SIZE.tamEurHigh / 1e6).toFixed(0)}M`} sub="EU-27 EPC housing" />
        <Stat label="SAM (EUR)" value={`€${(MARKET_SIZE.samEurLow / 1e6).toFixed(0)}–${(MARKET_SIZE.samEurHigh / 1e6).toFixed(0)}M`} sub="DE/NL offshore + DC" />
        <Stat label="Year-3 ARR" value={`€${(MARKET_SIZE.somArrYear3Low / 1e6).toFixed(1)}–${(MARKET_SIZE.somArrYear3High / 1e6).toFixed(1)}M`} sub="SOM target" />
      </div>
    </div>
  );
}
