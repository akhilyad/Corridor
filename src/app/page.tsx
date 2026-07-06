import Link from "next/link";
import { MarketingShell } from "@/components/shell/marketing-shell";
import { WorkedExamplePanel } from "@/components/marketing/worked-example";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ScrollText, BadgeCheck, Building2, Truck, Wallet, FileCheck2, Search } from "lucide-react";

export default function HomePage() {
  return (
    <MarketingShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink-50 to-white" />
        <div className="mx-auto max-w-6xl px-4 py-20 lg:py-28">
          <div className="max-w-3xl">
            <Badge tone="sea" className="mb-4">Compliance-anchored · EU EPC</Badge>
            <h1 className="text-4xl font-semibold leading-tight text-ink-900 lg:text-5xl">
              Housing + secured yards + compliance, sold directly into EPC procurement.
            </h1>
            <p className="mt-5 text-lg text-ink-600">
              Corridor is the supply-and-compliance marketplace for mid-term,
              infrastructure-equipped workforce housing — built for the energy and
              data-center EPC crews wiring Europe. Vendor accreditation, secured
              yards, and consolidated multi-site invoicing in one ops layer.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/register" size="lg">Get started</ButtonLink>
              <ButtonLink href="/calculator" variant="outline" size="lg">See the math</ButtonLink>
              <ButtonLink href="/how-it-works" variant="ghost" size="lg">How it works</ButtonLink>
            </div>
            <p className="mt-4 text-sm text-ink-400">Free during pilot · no per-listing fee · self-hostable</p>
          </div>
        </div>
      </section>

      {/* Wedge */}
      <section className="border-y border-ink-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold text-ink-900">The wedge is secured infrastructure, not beds.</h2>
              <p className="mt-4 text-ink-600">
                Consumer mid-term rentals optimise for photos and kitchens. EPC crews need
                fenced laydown yards rated for axle load, three-phase power, insured
                outbuildings, heavy-vehicle access, mess rooms, and CCTV — all sitting next
                to a real offshore-wind or data-centre build. Corridor indexes exactly that,
                so procurement finds a vetted yard 4 km from the substation, not a flat 90 km away.
              </p>
              <ul className="mt-6 grid grid-cols-2 gap-3 text-sm">
                {[
                  "Fenced & laydown yards",
                  "Axle-load-rated parking",
                  "Three-phase power",
                  "Insured outbuildings",
                  "Heavy-vehicle access",
                  "Mess, laundry, CCTV",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-ink-700">
                    <ShieldCheck className="h-4 w-4 text-weld-600" /> {f}
                  </li>
                ))}
              </ul>
            </div>
            <WorkedExamplePanel />
          </div>
        </div>
      </section>

      {/* Three hero features */}
      <section className="bg-ink-50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-2xl font-semibold text-ink-900">Three operations that aren't optional in EPC</h2>
            <p className="mt-2 text-ink-600">
              The compliance-anchored revenue model exists because these three workflows are
              the actual blocker — not search.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={<ShieldCheck className="h-6 w-6" />}
              title="Compliance vault"
              body="Per-org and per-listing document storage with magic-number MIME sniffing, expiry-driven renewal queue, and staff verification. Insurance, liability, ISO 45001, gas/electrical, background checks — all attached to the bid, not in someone's inbox."
              tone="amber"
            />
            <FeatureCard
              icon={<ScrollText className="h-6 w-6" />}
              title="Consolidated invoicing"
              body="One NET-30 invoice rolls up every confirmed site under a deployment. Gross housing + infra, +13% enterprise take, +€750/site/mo SaaS fee, +19% VAT — computed by the same engine as the marketing calculator, with per-partner payouts minted at issue."
              tone="sea"
            />
            <FeatureCard
              icon={<BadgeCheck className="h-6 w-6" />}
              title="Accreditation tracker"
              body="The EPC approved-supplier cycle runs 6–12 months and gates every downstream booking. Corridor tracks the cycle per client–partner pair, the required vault categories, and the target completion date — so the moat is visible, not buried in procurement."
              tone="green"
            />
          </div>
        </div>
      </section>

      {/* Two-sided */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-6 md:grid-cols-2">
            <SideCard
              tag="For supply partners"
              icon={<Building2 className="h-5 w-5" />}
              items={[
                "List housing + secured yards with a structured infra spec",
                "Compliance vault with expiry-driven renewal queue",
                "Booking requests with accept / decline / counter",
                "Per-deployment payout estimates, accrued in real time",
                "See your accreditation status with every EPC client",
              ]}
              cta={{ href: "/register", label: "List your property" }}
            />
            <SideCard
              tag="For procurement / EPC clients"
              icon={<Search className="h-5 w-5" />}
              items={[
                "Browse filtered to country, project type, infrastructure & rate",
                "Raise deployments, allocate crew across multiple sites",
                "Booking requests to any listing, with counters",
                "Consolidated multi-site invoicing, NET-30, VAT-correct",
                "Approved-vendor tracker across your supply base",
              ]}
              cta={{ href: "/register", label: "House your crews" }}
            />
          </div>
        </div>
      </section>

      {/* Competitive table */}
      <section className="bg-ink-50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold text-ink-900">How Corridor differs</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full rounded-xl border border-ink-200 bg-white text-sm">
              <thead className="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-4 py-3 font-medium" />
                  <th className="px-4 py-3 font-medium">Consumer mid-term rental</th>
                  <th className="px-4 py-3 font-medium">In-house procurement</th>
                  <th className="px-4 py-3 font-medium text-weld-700">Corridor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                <CompareRow label="Secured-infra spec (yards, axle load, 3-phase)" a="—" b="Ad hoc emails" c="Structured & filterable" />
                <CompareRow label="Compliance vault + verification" a="—" b="Shared drive" c="Built-in, staff-verified" />
                <CompareRow label="Multi-site consolidated invoicing" a="—" b="Manual per site" c="One NET-30 invoice" />
                <CompareRow label="Approved-vendor accreditation" a="—" b="Spreadsheet" c="Tracked per cycle" />
                <CompareRow label="Pricing model" a="Guest fee + host cut" b="Opex / salaries" c="Take + SaaS + VAT" />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink-900 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-16 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Run a pilot deployment on Corridor.</h2>
            <p className="mt-2 text-ink-300">Free during pilot. Self-hostable. No per-listing fee.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/register" size="lg" variant="primary">Create account</ButtonLink>
            <ButtonLink href="/pricing" size="lg" variant="outline">See pricing</ButtonLink>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}

function FeatureCard({
  icon,
  title,
  body,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  tone: "amber" | "sea" | "green";
}) {
  const wrap: Record<string, string> = {
    amber: "bg-weld-50 text-weld-700",
    sea: "bg-sea-50 text-sea-700",
    green: "bg-emerald-50 text-emerald-700",
  };
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-card">
      <div className={`${wrap[tone]} inline-flex rounded-lg p-2`}>{icon}</div>
      <h3 className="mt-4 text-base font-semibold text-ink-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-600">{body}</p>
    </div>
  );
}

function SideCard({
  tag,
  icon,
  items,
  cta,
}: {
  tag: string;
  icon: React.ReactNode;
  items: string[];
  cta: { href: string; label: string };
}) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-card">
      <div className="flex items-center gap-2 text-ink-900">
        <span className="inline-flex rounded-lg bg-ink-100 p-2 text-ink-700">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">{tag}</span>
      </div>
      <ul className="mt-4 space-y-2 text-sm text-ink-700">
        {items.map((i) => (
          <li key={i} className="flex items-start gap-2">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-weld-500" />
            <span>{i}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5">
        <ButtonLink href={cta.href} variant="subtle" size="sm">{cta.label}</ButtonLink>
      </div>
    </div>
  );
}

function CompareRow({ label, a, b, c }: { label: string; a: string; b: string; c: string }) {
  return (
    <tr>
      <td className="px-4 py-3 font-medium text-ink-800">{label}</td>
      <td className="px-4 py-3 text-ink-500">{a}</td>
      <td className="px-4 py-3 text-ink-500">{b}</td>
      <td className="px-4 py-3 font-medium text-weld-700">{c}</td>
    </tr>
  );
}
