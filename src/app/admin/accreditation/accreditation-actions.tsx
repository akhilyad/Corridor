"use client";
import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createAccreditationAction, changeAccreditationStatusAction } from "@/server/actions/accreditation";
import { SubmitButton, FormError } from "@/components/forms";
import { Input, Select, Textarea, Field } from "@/components/ui/field";

type OrgLite = { id: string; name: string };

const ACCRED_STATUSES = [
  "NOT_STARTED",
  "IN_REVIEW",
  "CONDITIONAL",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
  "PENDING",
];

/**
 * Open a new approved-supplier cycle between a client (EPC firm / hyperscaler)
 * and a partner (housing vendor). Client + partner are seeded orgs only; staff
 * pick from the dropdowns. `requiredDocCategories` is a free-form whitespace/
 * comma list parsed by the action.
 */
export function CreateAccreditationForm({
  clients,
  partners,
}: {
  clients: OrgLite[];
  partners: OrgLite[];
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(createAccreditationAction, null);
  React.useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);
  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="Client (EPC / hyperscaler)" htmlFor="clientOrgId">
        <Select name="clientOrgId" id="clientOrgId" required>
          <option value="">Select client…</option>
          {clients.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Partner (housing vendor)" htmlFor="partnerOrgId">
        <Select name="partnerOrgId" id="partnerOrgId" required>
          <option value="">Select partner…</option>
          {partners.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Expected cycle (days)" htmlFor="expectedDurationDays" hint="Default 270 (~9 months)">
        <Input
          type="number"
          name="expectedDurationDays"
          id="expectedDurationDays"
          defaultValue={270}
          min={30}
          max={400}
        />
      </Field>
      <Field
        label="Required vault categories"
        htmlFor="requiredDocCategories"
        hint="Whitespace or comma separated, e.g. INSURANCE_CERT ISO_45001"
        className="sm:col-span-2"
      >
        <Input
          type="text"
          name="requiredDocCategories"
          id="requiredDocCategories"
          placeholder="INSURANCE_CERT PUBLIC_LIABILITY ISO_45001"
        />
      </Field>
      <Field label="Notes" htmlFor="notes" className="sm:col-span-2">
        <Textarea name="notes" id="notes" rows={3} placeholder="Cycle scope, contact, deadlines…" />
      </Field>
      <div className="sm:col-span-2 flex items-center gap-3">
        <SubmitButton>Open cycle</SubmitButton>
        <FormError state={state} />
      </div>
    </form>
  );
}

/**
 * Move an accreditation through its lifecycle. The action enforces the legal
 * transitions (NOT_STARTED → IN_REVIEW → CONDITIONAL/APPROVED/REJECTED → …);
 * an illegal jump is rejected with the from→to pair in the error.
 */
export function ChangeAccreditationStatusForm({
  id,
  current,
}: {
  id: string;
  current: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(changeAccreditationStatusAction, null);
  React.useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Move to" className="flex-shrink-0">
          <Select name="status" defaultValue={current} className="h-9 text-xs">
            {ACCRED_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </Field>
        <Input type="text" name="notes" placeholder="Notes (optional)" className="h-9 max-w-xs text-xs" />
        <SubmitButton size="sm">Apply</SubmitButton>
      </div>
      <FormError state={state} />
    </form>
  );
}
