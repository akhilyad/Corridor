import { MarketingShell } from "@/components/shell/marketing-shell";
import { Badge } from "@/components/ui/badge";
import { Building2, ShieldCheck, ScrollText, BadgeCheck, Wallet, Search } from "lucide-react";

const STEPS = [
  {
    icon: <Building2 className="h-5 w-5" />,
    n: "01",
    title: "Partner lists a housing + yard asset",
    body: "A supply partner fills a structured spec — sleepsTotal, parkingType, parkingLoadRatingT (axle load), storageClass, fenced yard, three-phase, heavy-vehicle access, mess room — alongside photos and the monthly rate. The infrastructure spec, not the bedroom count, is what makes it filterable to EPC.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    n: "02",
    title: "Compliance vault gets verified",
    body: "The partner uploads insurance, public & employer liability, ISO 45001, gas/electrical, background checks, and food hygiene to a per-org vault. Platform staff verify each (with magic-number MIME sniffing so a renamed .txt can't pose as a PDF), and expiry dates drive a renewal queue.",
  },
  {
    icon: <Search className="h-5 w-5" />,
    n: "03",
    title: "Procurement browses by project & infrastructure",
    body: "An EPC client filters live listings by country, nearby project type (offshore wind, data-centre, substation), secured-infra flags, and rate. The crew's project site is the anchor; distance-to-project is the sort key.",
  },
  {
    icon: <BadgeCheck className="h-5 w-5" />,
    n: "04",
    title: "Accreditation opens the door",
    body: "Before a partner can bid on a client's deployments, they must complete the client's approved-supplier accreditation cycle (6–12 months). Corridor tracks the cycle per client–partner pair, the required vault categories, and the target completion date, so the gating status is visible on both dashboards.",
  },
  {
    icon: <ScrollText className="h-5 w-5" />,
    n: "05",
    title: "Deployment + booking requests",
    body: "The client raises a deployment for a crew, allocates beds across the chosen sites, and sends booking requests. Partners accept, decline, or counter the monthly rate. Accepted requests become contracted bookings under the deployment.",
  },
  {
    icon: <Wallet className="h-5 w-5" />,
    n: "06",
    title: "Consolidated invoice + payouts",
    body: "Corridor raises one NET-30 invoice rolling up every confirmed site — gross housing + infra, +13% enterprise take, +€750/site/mo SaaS fee, +19% VAT — computed by the same engine as the calculator. Per-partner payouts are minted at issue and accrue on the partner dashboard immediately.",
  },
];

export default function HowItWorksPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="max-w-2xl">
          <Badge tone="sea" className="mb-3">End-to-end</Badge>
          <h1 className="text-3xl font-semibold text-ink-900">How Corridor works</h1>
          <p className="mt-2 text-ink-600">
            From an unlisted farmhouse-with-a-yard to a NET-30 invoice paid by a Tier-1 EPC —
            six steps, all run through one operations layer.
          </p>
        </div>
        <ol className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
              <div className="flex items-center justify-between">
                <span className="inline-flex rounded-lg bg-ink-100 p-2 text-ink-700">{s.icon}</span>
                <span className="text-xs font-semibold text-ink-300">{s.n}</span>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-ink-900">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </MarketingShell>
  );
}
