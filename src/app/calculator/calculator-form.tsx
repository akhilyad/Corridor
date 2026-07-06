"use client";
import * as React from "react";
import {
  computeCrewScenario,
  WHITEPAPER_REFERENCE,
  DEFAULT_PRICING,
  clampTakeBps,
  type CrewCalculatorInput,
} from "@/lib/pricing";
import { fmtEur, fmtEurCompact, fmtBps } from "@/lib/utils";
import { Stat } from "@/components/ui/stat";
import { Field, Input, Checkbox } from "@/components/ui/field";
import { Button, ButtonLink } from "@/components/ui/button";

export function CalculatorForm() {
  const [crew, setCrew] = React.useState(WHITEPAPER_REFERENCE.crewSize);
  const [months, setMonths] = React.useState(WHITEPAPER_REFERENCE.months);
  const [rate, setRate] = React.useState(WHITEPAPER_REFERENCE.eurosPerPersonMonth);
  const [sites, setSites] = React.useState(WHITEPAPER_REFERENCE.siteCount);
  const [takeBps, setTakeBps] = React.useState(WHITEPAPER_REFERENCE.enterpriseTakeBps ?? 1300);
  const [hostIsNew, setHostIsNew] = React.useState(false);

  const input: CrewCalculatorInput = {
    crewSize: Math.max(1, crew | 0),
    months: Math.max(0, months | 0),
    eurosPerPersonMonth: Math.max(0, rate),
    siteCount: Math.max(1, sites | 0),
    enterpriseTakeBps: clampTakeBps(takeBps, DEFAULT_PRICING),
    hostIsNew,
  };
  const r = computeCrewScenario(input, DEFAULT_PRICING);

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2 rounded-xl border border-ink-200 bg-white p-5 shadow-card">
        <div className="space-y-4">
          <Field label="Crew size" htmlFor="crew">
            <Input id="crew" type="number" min={1} max={5000} value={crew} onChange={(e) => setCrew(Number(e.target.value))} />
          </Field>
          <Field label="Duration (months)" htmlFor="months">
            <Input id="months" type="number" min={1} max={36} value={months} onChange={(e) => setMonths(Number(e.target.value))} />
          </Field>
          <Field label="All-in € / person / month" htmlFor="rate" hint="Housing + secured-infra premium">
            <Input id="rate" type="number" min={0} step={50} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Lodging sites" htmlFor="sites">
              <Input id="sites" type="number" min={1} max={200} value={sites} onChange={(e) => setSites(Number(e.target.value))} />
            </Field>
            <Field label={`Enterprise take ${fmtBps(takeBps)}`} htmlFor="take">
              <input
                id="take"
                type="range"
                min={DEFAULT_PRICING.enterpriseTakeBpsMin}
                max={DEFAULT_PRICING.enterpriseTakeBpsMax}
                step={50}
                value={takeBps}
                onChange={(e) => setTakeBps(Number(e.target.value))}
                className="mt-3 w-full accent-weld-500"
              />
            </Field>
          </div>
          <Checkbox label="New partner (waive host commission 90 days)" checked={hostIsNew} onChange={(e) => setHostIsNew(e.target.checked)} />
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => {
              setCrew(WHITEPAPER_REFERENCE.crewSize);
              setMonths(WHITEPAPER_REFERENCE.months);
              setRate(WHITEPAPER_REFERENCE.eurosPerPersonMonth);
              setSites(WHITEPAPER_REFERENCE.siteCount);
              setTakeBps(WHITEPAPER_REFERENCE.enterpriseTakeBps ?? 1300);
            }}>
              Load whitepaper reference
            </Button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-3 space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Gross booking" value={fmtEurCompact(r.totalGrossCents)} sub={`${r.personMonths.toLocaleString("en-IE")} person-mo`} />
          <Stat label="Corridor take" value={fmtEurCompact(r.totalEnterpriseTakeCents)} sub={`${fmtBps(input.enterpriseTakeBps ?? 1300)} enterprise`} />
          <Stat label="SaaS subscription" value={fmtEurCompact(r.totalSaasCents)} sub={`${sites} sites · €750/mo`} />
          <Stat label="Corridor revenue" value={fmtEurCompact(r.totalCorridorRevenueCents)} sub="take + comm + SaaS" valueClassName="text-weld-700" />
          <Stat label="Partner payout" value={fmtEurCompact(r.totalPartnerPayoutCents)} sub={hostIsNew ? "commission waived" : "after 9% comm"} />
          <Stat label="Client pays" value={fmtEurCompact(r.clientTotalCents)} sub={`${fmtBps(DEFAULT_PRICING.vatBps)} VAT incl`} />
        </div>
        <div className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-ink-500">Blended take rate</span>
            <span className="text-lg font-semibold text-ink-900">{fmtBps(r.blendedTakeRateBps)}</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-100">
            <div className="h-full rounded-full bg-weld-500" style={{ width: `${Math.min(100, r.blendedTakeRateBps / 20)}%` }} />
          </div>
          <p className="mt-2 text-xs text-ink-400">
            = (enterprise take + host commission) ÷ gross. The SaaS subscription is on top.
          </p>
        </div>
        <div className="rounded-xl border border-weld-200 bg-weld-50 p-4 text-sm text-weld-800">
          On {months} months for {crew} crew across {sites} sites, Corridor earns{" "}
          <strong>{fmtEur(r.totalCorridorRevenueCents)}</strong> incl. {fmtEur(r.totalSaasCents)} SaaS —
          the partner nets <strong>{fmtEur(r.totalPartnerPayoutCents)}</strong> and the client pays{" "}
          {fmtEur(r.clientTotalCents)} incl. VAT.
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/register" size="md">Start a real deployment</ButtonLink>
          <ButtonLink href="/pricing" variant="outline" size="md">See pricing breakdown</ButtonLink>
        </div>
      </div>
    </div>
  );
}
