import { MarketingShell } from "@/components/shell/marketing-shell";
import { Stat } from "@/components/ui/stat";
import { MARKET_SIZE } from "@/lib/pricing";

const DRIVERS = [
  {
    title: "Offshore wind build-out",
    body: "DE/NL ≈ 30+ GW targeting 2030. Each phase moves a 400–800-person crew into a coastal staging port for 6–12 months and needs laydown yards, insured outbuildings, and heavy-vehicle access — not flats.",
  },
  {
    title: "Hyperscaler data-centre clusters",
    body: "Frankfurt, Hanau, Berlin, Hamburg-Moorburg, Amsterdam, Eemshaven — tile-on-tile builds run 18–36 months of round-the-clock construction crews that need mid-term infrastructure-equipped housing near site.",
  },
  {
    title: "Compliance tightening",
    body: "ISO 45001, employer & public liability, background-check mandates, and approved-supplier cycles are now table-stakes for any EPC contract. The procurement side already requires it; the supply side is unindexed.",
  },
  {
    title: "Permitting near build sites",
    body: "Local permitting makes purpose-built crew camps slow. Existing farmhouses with fenced yards and three-phase are already permitted — and they're the address procurement needs to bill to.",
  },
];

export default function MarketPage() {
  const cap = (n: number) => `€${(n / 1_000_000).toFixed(0)}M`;
  return (
    <MarketingShell>
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold text-ink-900">The market</h1>
          <p className="mt-2 text-ink-600">
            A mid-term, infrastructure-equipped housing layer for the crews wiring Europe —
            offshore wind on the coast, data-centre clusters inland, both gated by procurement
            compliance that nobody else has indexed.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Stat label="TAM (EUR)" value={`${cap(MARKET_SIZE.tamEurLow)}–${cap(MARKET_SIZE.tamEurHigh)}`} sub="EU-27 EPC housing" />
          <Stat label="SAM (EUR)" value={`${cap(MARKET_SIZE.samEurLow)}–${cap(MARKET_SIZE.samEurHigh)}`} sub="DE/NL offshore + DC" />
          <Stat label="Year-3 ARR (SOM)" value={`€${(MARKET_SIZE.somArrYear3Low / 1e6).toFixed(1)}–${(MARKET_SIZE.somArrYear3High / 1e6).toFixed(1)}M`} sub="serviceable target" />
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-semibold text-ink-900">Why now</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {DRIVERS.map((d) => (
              <div key={d.title} className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
                <h3 className="text-sm font-semibold text-ink-900">{d.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{d.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 rounded-xl border border-ink-200 bg-ink-50 p-6 text-sm text-ink-600">
          <p className="font-medium text-ink-800">Note on sizing</p>
          <p className="mt-1">
            Ranges are illustrative, drawn from public offshore-wind build-out targets and
            data-centre construction schedules. Project-site seed names (Borkum Riffgrund,
            Arkona, Wikinger, He Dreiht, Nordsee One, Frankfurt/Hanau/Berlin/Hamburg-Moorburg,
            Amsterdam, Eemshaven, Bremerhaven, Cuxhaven, Emden, Rostock/Sassnitz-Mukran) anchor
            real geography; crew and rate figures in the calculator are whitepaper-derived and
            not audit-grade.
          </p>
        </div>
      </div>
    </MarketingShell>
  );
}
