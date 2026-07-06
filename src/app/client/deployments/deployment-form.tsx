"use client";
import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createDeploymentAction } from "@/server/actions/deployments";
import { humanizeEnum } from "@/lib/utils";
import { Field, Input, Textarea, Select } from "@/components/ui/field";
import { SubmitButton, FormError } from "@/components/forms";

/**
 * New-deployment creation island. Posts to `createDeploymentAction`, which
 * mints a `COR-{prefix}-{seq}` deployment code and returns the new id; on
 * success the client is sent straight to the deployment detail so they can
 * start adding sites. Housing budget is captured in whole euros (the form
 * unit) and converted to integer cents in a hidden input (the storage unit).
 */
const PROJECT_TYPES = ["WIND_OFFSHORE", "WIND_ONSHORE", "SOLAR", "DATACENTER", "SUBSTATION", "HYDRO", "H2", "GRID", "MIXED"];
const COUNTRIES = ["DE", "NL", "BE", "FR", "DK", "GB", "PL", "ES", "PT", "IE", "SE", "FI", "NO", "AT", "CH"];

export function DeploymentForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(createDeploymentAction, null);
  React.useEffect(() => {
    if (state?.ok) router.push(`/client/deployments/${state.data.id}`);
  }, [state, router]);

  const [budgetEur, setBudgetEur] = React.useState("");
  const budgetCents = budgetEur ? Math.round(Number(budgetEur) * 100) : "";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="housingBudgetCentsPerPersonMonth" value={budgetCents} />

      <Field label="Project name" htmlFor="projectName">
        <Input id="projectName" name="projectName" required placeholder="e.g. Borkum Riffgrund West 3" />
      </Field>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Project type" htmlFor="projectType">
          <Select id="projectType" name="projectType" defaultValue="WIND_OFFSHORE">
            {PROJECT_TYPES.map((t) => (
              <option key={t} value={t}>{humanizeEnum(t)}</option>
            ))}
          </Select>
        </Field>
        <Field label="Country" htmlFor="projectCountry">
          <Select id="projectCountry" name="projectCountry" defaultValue="DE">
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Region" htmlFor="projectRegion">
          <Input id="projectRegion" name="projectRegion" placeholder="optional" />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Crew size" htmlFor="crewSize">
          <Input id="crewSize" name="crewSize" type="number" min={1} defaultValue={6} required />
        </Field>
        <Field label="Start date" htmlFor="startDate">
          <Input id="startDate" name="startDate" type="date" required />
        </Field>
        <Field label="End date" htmlFor="endDate">
          <Input id="endDate" name="endDate" type="date" required />
        </Field>
      </div>

      <Field label="Housing budget (€/person/month)" htmlFor="housingBudgetEur" hint="Optional tender ceiling — left blank means uncapped.">
        <Input
          id="housingBudgetEur"
          type="number"
          min={0}
          step={50}
          value={budgetEur}
          onChange={(e) => setBudgetEur(e.target.value)}
          placeholder="e.g. 1400"
        />
      </Field>

      <Field label="Notes" htmlFor="notes" hint="Internal context — role mix, shifts, any compliance pre-conditions.">
        <Textarea id="notes" name="notes" placeholder="e.g. 600-person EPC crew split across wind-farm + substation sites…" />
      </Field>

      <FormError state={state} />
      <div className="flex justify-end">
        <SubmitButton>Create deployment</SubmitButton>
      </div>
    </form>
  );
}
