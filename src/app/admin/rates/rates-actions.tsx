"use client";
import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { updateTakeRateConfigAction } from "@/server/actions/admin";
import { SubmitButton, FormError } from "@/components/forms";
import { Input, Checkbox, Field } from "@/components/ui/field";

type ConfigLite = {
  hostCommissionBps: number;
  hostWaiveFirst90Days: boolean;
  enterpriseTakeBpsMin: number;
  enterpriseTakeBpsMax: number;
  enterpriseTakeBpsDefault: number;
  saasFeeCentsPerSiteMonth: number;
  vatBps: number;
};

/**
 * The single economic knob. Every value feeds `getActiveConfigFor`, so saving
 * retunes all subsequent quotes/invoices immediately (lazy recompute — no
 * migration of historical rows). Basis points, cents, and the 90-day host waiver
 * are the only inputs.
 */
export function TakeRateConfigForm({ current }: { current: ConfigLite }) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateTakeRateConfigAction, null);
  React.useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);
  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Host commission (bps)" htmlFor="hostCommissionBps" hint="900 = 9.00% — waived first 90 days">
        <Input type="number" name="hostCommissionBps" id="hostCommissionBps" defaultValue={current.hostCommissionBps} min={0} max={5000} />
      </Field>
      <Field label="Enterprise take default (bps)" htmlFor="enterpriseTakeBpsDefault" hint="1300 = 13.00% whitepaper blended">
        <Input type="number" name="enterpriseTakeBpsDefault" id="enterpriseTakeBpsDefault" defaultValue={current.enterpriseTakeBpsDefault} min={0} max={5000} />
      </Field>
      <Field label="Enterprise take min (bps)" htmlFor="enterpriseTakeBpsMin" hint="1200 = 12.00%">
        <Input type="number" name="enterpriseTakeBpsMin" id="enterpriseTakeBpsMin" defaultValue={current.enterpriseTakeBpsMin} min={0} max={5000} />
      </Field>
      <Field label="Enterprise take max (bps)" htmlFor="enterpriseTakeBpsMax" hint="1500 = 15.00%; must be ≥ min">
        <Input type="number" name="enterpriseTakeBpsMax" id="enterpriseTakeBpsMax" defaultValue={current.enterpriseTakeBpsMax} min={0} max={5000} />
      </Field>
      <Field label="SaaS fee (cents / site / month)" htmlFor="saasFeeCentsPerSiteMonth" hint="75000 = €750/site/mo">
        <Input type="number" name="saasFeeCentsPerSiteMonth" id="saasFeeCentsPerSiteMonth" defaultValue={current.saasFeeCentsPerSiteMonth} min={0} max={10000000} />
      </Field>
      <Field label="VAT (bps)" htmlFor="vatBps" hint="1900 = 19.00% applied ex-VAT">
        <Input type="number" name="vatBps" id="vatBps" defaultValue={current.vatBps} min={0} max={10000} />
      </Field>
      <div className="sm:col-span-2">
        <Checkbox name="hostWaiveFirst90Days" defaultChecked={current.hostWaiveFirst90Days} label="Waive host commission first 90 days (cold-start supply incentive)" />
      </div>
      <div className="sm:col-span-2 flex items-center gap-3">
        <SubmitButton>Save take-rate configuration</SubmitButton>
        <FormError state={state} />
      </div>
    </form>
  );
}
