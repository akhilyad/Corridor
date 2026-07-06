"use client";
import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  addDeploymentSiteAction,
  removeDeploymentSiteAction,
  setDeploymentStatusAction,
} from "@/server/actions/deployments";
import { issueInvoiceAction } from "@/server/actions/invoices";
import { Field, Input, Textarea, Select } from "@/components/ui/field";
import { SubmitButton, FormError } from "@/components/forms";

/**
 * Deployment-detail action islands. Each is an independent server-action form so
 * a pending submit on one never blocks another, and `router.refresh()` on any
 * ok update flips the server-rendered sites table / status badge / snapshot
 * without a full navigation.
 */

const STATUS_FLOW = ["DRAFT", "REQUESTED", "QUOTE_SENT", "CONTRACTED", "ACTIVE", "COMPLETED"];
const PAGEABLE_STATUSES = ["DRAFT", "REQUESTED", "QUOTE_SENT", "CONTRACTED", "ACTIVE", "COMPLETED", "CANCELLED"];

function eurToCents(eur: string): string {
  return eur ? String(Math.round(Number(eur) * 100)) : "";
}

export function RemoveSiteButton({ siteId }: { siteId: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState(removeDeploymentSiteAction, null);
  React.useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);
  return (
    <form action={formAction}>
      <input type="hidden" name="siteId" value={siteId} />
      <SubmitButton size="sm" variant="danger">
        Remove
      </SubmitButton>
      <FormError state={state} className="mt-1" />
    </form>
  );
}

export function DeploymentStatusForm({ deploymentId, current }: { deploymentId: string; current: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState(setDeploymentStatusAction, null);
  React.useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  const idx = STATUS_FLOW.indexOf(current);
  const recommended = idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : current;
  const isCancelled = current === "CANCELLED" || current === "COMPLETED";

  return (
    <form action={formAction} className="space-y-3 text-sm">
      <input type="hidden" name="id" value={deploymentId} />
      {isCancelled ? (
        <p className="text-ink-500">
          This deployment is <span className="font-medium text-ink-800">{current.toLowerCase()}</span> and can't be advanced further.
        </p>
      ) : (
        <>
          <p className="text-ink-500">
            Advancing to <span className="font-medium text-ink-800">CONTRACTED</span> marks all quoted sites CONFIRMED so invoicing can roll them up.
          </p>
          <Field label="New status" htmlFor="status">
            <Select id="status" name="status" defaultValue={recommended}>
              {PAGEABLE_STATUSES.map((s) => (
                <option key={s} value={s}>{s.toLowerCase().replace(/_/g, " ")}</option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end">
            <SubmitButton size="sm">Update status</SubmitButton>
          </div>
        </>
      )}
      <FormError state={state} />
    </form>
  );
}

export function IssueInvoiceForm({ deploymentId, start, end }: { deploymentId: string; start: string; end: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState(issueInvoiceAction, null);
  React.useEffect(() => {
    if (state?.ok) router.push("/client/invoices");
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-3 text-sm">
      <input type="hidden" name="deploymentId" value={deploymentId} />
      <p className="text-ink-500">
        One consolidated invoice rolls up every confirmed site over the billing window — gross housing+infra, +enterprise take, +€750/site/mo SaaS, +19% VAT.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Period start" htmlFor="periodStart">
          <Input id="periodStart" name="periodStart" type="date" defaultValue={start.slice(0, 10)} />
        </Field>
        <Field label="Period end" htmlFor="periodEnd">
          <Input id="periodEnd" name="periodEnd" type="date" defaultValue={end.slice(0, 10)} />
        </Field>
      </div>
      <Field label="Notes" htmlFor="invNotes">
        <Textarea id="invNotes" name="notes" placeholder="Optional PO / internal reference" />
      </Field>
      <FormError state={state} />
      <div className="flex justify-end">
        <SubmitButton size="sm">Issue consolidated invoice</SubmitButton>
      </div>
    </form>
  );
}

type ListingOpt = {
  id: string;
  title: string;
  city: string | null;
  country: string;
  sleepsTotal: number;
  monthlyRateCents: number;
  infraPremiumCents: number;
};
type PricingDefaults = {
  enterpriseTakeBpsDefault: number;
  hostCommissionBps: number;
  saasFeeCentsPerSiteMonth: number;
};

export function AddSiteForm({
  deploymentId,
  deploymentStart,
  deploymentEnd,
  listings,
  pricingDefaults,
}: {
  deploymentId: string;
  deploymentStart: string;
  deploymentEnd: string;
  listings: string;
  pricingDefaults: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(addDeploymentSiteAction, null);
  React.useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  const opts: ListingOpt[] = React.useMemo(() => {
    try {
      return JSON.parse(listings);
    } catch {
      return [];
    }
  }, [listings]);
  const pd: PricingDefaults = React.useMemo(() => {
    try {
      return JSON.parse(pricingDefaults);
    } catch {
      return { enterpriseTakeBpsDefault: 1300, hostCommissionBps: 900, saasFeeCentsPerSiteMonth: 75000 };
    }
  }, [pricingDefaults]);

  const [lid, setLid] = React.useState("");
  const [rate, setRate] = React.useState("");
  const [infra, setInfra] = React.useState("");
  const lookup = React.useMemo(() => new Map(opts.map((o) => [o.id, o])), [opts]);

  function onPick(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    setLid(v);
    const l = lookup.get(v);
    setRate(l ? String(Math.round(l.monthlyRateCents / 100)) : "");
    setInfra(l ? String(Math.round(l.infraPremiumCents / 100)) : "");
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="deploymentId" value={deploymentId} />
      <input type="hidden" name="monthlyRateCents" value={eurToCents(rate)} />
      <input type="hidden" name="infraPremiumCents" value={eurToCents(infra)} />

      <Field label="Listing" htmlFor="listingId" hint="Only live marketplace listings can be added as a site.">
        <Select id="listingId" name="listingId" value={lid} onChange={onPick} required>
          <option value="">— select a listing —</option>
          {opts.map((o) => (
            <option key={o.id} value={o.id}>
              {o.title} · {o.city || o.country} · sleeps {o.sleepsTotal}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Beds allocated" htmlFor="bedsAllocated">
          <Input id="bedsAllocated" name="bedsAllocated" type="number" min={1} defaultValue={6} required />
        </Field>
        <Field label="Rate (€/mo)" htmlFor="rateEur">
          <Input id="rateEur" type="number" min={0} step={50} value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
        <Field label="Infra (€/mo)" htmlFor="infraEur">
          <Input id="infraEur" type="number" min={0} step={50} value={infra} onChange={(e) => setInfra(e.target.value)} />
        </Field>
        <Field label="Host commission (bps)" htmlFor="commissionBps" hint={`default ${pd.hostCommissionBps} = ${pd.hostCommissionBps / 100}%`}>
          <Input id="commissionBps" name="commissionBps" type="number" min={0} max={5000} defaultValue={pd.hostCommissionBps} />
        </Field>
        <Field label="Enterprise take (bps)" htmlFor="enterpriseTakeBps" hint={`clamped to 12–15% band, default ${pd.enterpriseTakeBpsDefault}`}>
          <Input id="enterpriseTakeBps" name="enterpriseTakeBps" type="number" min={0} max={5000} defaultValue={pd.enterpriseTakeBpsDefault} />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Site start" htmlFor="siteStart">
          <Input id="siteStart" name="startDate" type="date" defaultValue={deploymentStart.slice(0, 10)} />
        </Field>
        <Field label="Site end" htmlFor="siteEnd">
          <Input id="siteEnd" name="endDate" type="date" defaultValue={deploymentEnd.slice(0, 10)} />
        </Field>
      </div>

      <FormError state={state} />
      <div className="flex justify-end">
        <SubmitButton>Add site</SubmitButton>
      </div>
    </form>
  );
}
