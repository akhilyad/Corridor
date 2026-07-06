import { monthsBetween } from "@/lib/utils";

/**
 * Corridor pricing engine.
 *
 * The revenue model (whitepaper §3.3) is *compliance-anchored*, not a flat
 * marketplace cut:
 *
 *   - Host commission:        8–10% of gross booking, withheld from the
 *                             partner payout. Waived for a host's first 90 days
 *                             (cold-start supply acquisition).
 *   - Enterprise take:        12–15% of gross booking, charged to the client
 *                             *on top of* the booking (the moat, priced on
 *                             the transaction). Default blended 13%.
 *   - Per-site SaaS fee:      a recurring €750/site/month compliance +
 *                             consolidated-billing subscription, charged to the
 *                             client (the moat, priced as SaaS).
 *   - VAT:                    19% (German rate) applied to the client's total.
 *
 * Worked example reproduced from the whitepaper:
 *   crew 600 × 9 months × €1,400/person/month  =  €7,560,000 gross booking
 *   13% enterprise take                        =  €982,800  (≈ €983K, as documented)
 *   plus per-site SaaS subscription on top.
 *
 *   NB: the whitepaper text describes this as a "60-person crew"; the stated
 *   €7.56M / €983K figures only close at 600 person-months × 10, i.e. an implied
 *   ~600-person crew (or €14k/person/month). The engine below is correct and
 *   parameterised; the marketing calculator exposes a "Whitepaper reference"
 *   preset that loads 600 / 9 / €1,400 so the documented economics reproduce
 *   live, with this footnote shown in the UI.
 *
 * All money is integer EUR cents.
 */

export type PricingConfig = {
  hostCommissionBps: number; // 8-10% band; default 900
  hostWaiveFirst90Days: boolean;
  enterpriseTakeBpsMin: number; // 1200
  enterpriseTakeBpsMax: number; // 1500
  enterpriseTakeBpsDefault: number; // 1300
  saasFeeCentsPerSiteMonth: number; // 75000
  vatBps: number; // 1900
};

export const DEFAULT_PRICING: PricingConfig = {
  hostCommissionBps: 900,
  hostWaiveFirst90Days: true,
  enterpriseTakeBpsMin: 1200,
  enterpriseTakeBpsMax: 1500,
  enterpriseTakeBpsDefault: 1300,
  saasFeeCentsPerSiteMonth: 75_000,
  vatBps: 1900,
};

export type SiteInput = {
  monthlyRateCents: number; // housing-only base, per unit/month
  infraPremiumCents: number; // secured-infrastructure premium, per unit/month
  units: number; // beds allocated / units booked
  startDate: Date | string;
  endDate: Date | string;
  hostIsNewAndWithinWaiver: boolean; // true → host commission = 0 this period
  enterpriseTakeBps?: number; // override per-site (within [min,max])
};

export type SiteEconomics = {
  months: number;
  grossCents: number; // (rate + infra) × units × months
  hostCommissionCents: number; // withheld from partner
  partnerPayoutCents: number; // gross - host commission
  enterpriseTakeCents: number; // charged to client on top
  saasFeeCents: number; // per-site/month subscription
  corridorRevenueCents: number; // take + commission + saas
};

export type DeploymentEconomics = {
  sites: SiteEconomics[];
  totalGrossCents: number;
  totalHostCommissionCents: number;
  totalPartnerPayoutCents: number;
  totalEnterpriseTakeCents: number;
  totalSaasCents: number;
  clientSubtotalCents: number; // gross + enterprise take + saas (ex VAT)
  vatCents: number;
  clientTotalCents: number; // incl VAT
  totalCorridorRevenueCents: number; // take + commission + saas
  blendedTakeRateBps: number; // (take + commission) / gross
};

export function clampTakeBps(bps: number, cfg: PricingConfig = DEFAULT_PRICING): number {
  return Math.min(cfg.enterpriseTakeBpsMax, Math.max(cfg.enterpriseTakeBpsMin, bps));
}

/** Per-site economics. Pure function; trivially testable & cacheable. */
export function computeSiteEconomics(site: SiteInput, cfg: PricingConfig = DEFAULT_PRICING): SiteEconomics {
  const months = Math.max(0, monthsBetween(site.startDate, site.endDate));
  const grossCents = Math.round((site.monthlyRateCents + site.infraPremiumCents) * site.units * months);
  const takeBps = clampTakeBps(site.enterpriseTakeBps ?? cfg.enterpriseTakeBpsDefault, cfg);

  const hostCommissionCents =
    site.hostIsNewAndWithinWaiver && cfg.hostWaiveFirst90Days
      ? 0
      : Math.round((grossCents * cfg.hostCommissionBps) / 10000);

  const partnerPayoutCents = grossCents - hostCommissionCents;
  const enterpriseTakeCents = Math.round((grossCents * takeBps) / 10000);
  const saasFeeCents = Math.round(cfg.saasFeeCentsPerSiteMonth * months);
  const corridorRevenueCents = enterpriseTakeCents + hostCommissionCents + saasFeeCents;

  return {
    months,
    grossCents,
    hostCommissionCents,
    partnerPayoutCents,
    enterpriseTakeCents,
    saasFeeCents,
    corridorRevenueCents,
  };
}

/** Roll up a full deployment across N sites. */
export function computeDeploymentEconomics(sites: SiteInput[], cfg: PricingConfig = DEFAULT_PRICING): DeploymentEconomics {
  const computed = sites.map((s) => computeSiteEconomics(s, cfg));
  const totalGrossCents = computed.reduce((a, s) => a + s.grossCents, 0);
  const totalHostCommissionCents = computed.reduce((a, s) => a + s.hostCommissionCents, 0);
  const totalPartnerPayoutCents = computed.reduce((a, s) => a + s.partnerPayoutCents, 0);
  const totalEnterpriseTakeCents = computed.reduce((a, s) => a + s.enterpriseTakeCents, 0);
  const totalSaasCents = computed.reduce((a, s) => a + s.saasFeeCents, 0);

  const clientSubtotalCents = totalGrossCents + totalEnterpriseTakeCents + totalSaasCents;
  const vatCents = Math.round((clientSubtotalCents * cfg.vatBps) / 10000);
  const clientTotalCents = clientSubtotalCents + vatCents;

  const totalCorridorRevenueCents = totalEnterpriseTakeCents + totalHostCommissionCents + totalSaasCents;
  const blendedTakeRateBps =
    totalGrossCents > 0 ? Math.round(((totalEnterpriseTakeCents + totalHostCommissionCents) * 10000) / totalGrossCents) : 0;

  return {
    sites: computed,
    totalGrossCents,
    totalHostCommissionCents,
    totalPartnerPayoutCents,
    totalEnterpriseTakeCents,
    totalSaasCents,
    clientSubtotalCents,
    vatCents,
    clientTotalCents,
    totalCorridorRevenueCents,
    blendedTakeRateBps,
  };
}

/**
 * The headline calculator inputs as exposed on the marketing page + the
 * procurement "what-if" tool. Derives a single representative site from
 * crew-level numbers.
 */
export type CrewCalculatorInput = {
  crewSize: number;
  months: number;
  eurosPerPersonMonth: number; // housing + secured-infra premium, all-in
  siteCount: number; // how many lodging sites the crew is split across
  enterpriseTakeBps?: number;
  hostIsNew?: boolean; // toggles the 90-day host-commission waiver
};

export type CrewCalculatorResult = DeploymentEconomics & {
  grossPerPersonMonthCents: number;
  personMonths: number;
};

export function computeCrewScenario(
  input: CrewCalculatorInput,
  cfg: PricingConfig = DEFAULT_PRICING,
): CrewCalculatorResult {
  const ratePerPersonMonth = Math.round(input.eurosPerPersonMonth * 100);
  const perSiteUnits = input.crewSize > 0 ? Math.ceil(input.crewSize / input.siteCount) : 0;
  const months = Math.max(0, input.months);

  // Single representative-site model: each "unit" is one crew berth at the
  // all-in €/person/month. SaaS is charged per lodging site.
  const sites: SiteInput[] = Array.from({ length: Math.max(1, input.siteCount) }, () => ({
    monthlyRateCents: ratePerPersonMonth,
    infraPremiumCents: 0, // already folded into eurosPerPersonMonth
    units: perSiteUnits,
    startDate: new Date(0),
    endDate: new Date(months * 30.4375 * 86400 * 1000),
    hostIsNewAndWithinWaiver: !!input.hostIsNew,
    enterpriseTakeBps: input.enterpriseTakeBps,
  }));

  const econ = computeDeploymentEconomics(sites, cfg);
  return {
    ...econ,
    grossPerPersonMonthCents: ratePerPersonMonth,
    personMonths: input.crewSize * months,
  };
}

/** Whitepaper §3.3 worked example inputs, reproduced live. */
export const WHITEPAPER_REFERENCE: CrewCalculatorInput = {
  crewSize: 600,
  months: 9,
  eurosPerPersonMonth: 1400,
  siteCount: 6,
  enterpriseTakeBps: 1300,
  hostIsNew: false,
};

/** TAM/SAM/SOM from whitepaper §5, exposed for the market-sizing readout. */
export const MARKET_SIZE = {
  tamEurLow: 600_000_000,
  tamEurHigh: 1_200_000_000,
  samEurLow: 90_000_000,
  samEurHigh: 300_000_000,
  somArrYear3Low: 1_000_000,
  somArrYear3High: 9_000_000,
} as const;
