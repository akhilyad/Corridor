"use client";
import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { requestBookingAction } from "@/server/actions/bookings";
import { Field, Input, Textarea, Select } from "@/components/ui/field";
import { SubmitButton, FormError } from "@/components/forms";

/**
 * Procurement "request to book" island. Posts to `requestBookingAction` with
 * the listingId (hidden), an optional deployment it should roll up into, the
 * requested stay window, headcount and a counter-offer rate (whole euros are
 * converted to cents in a hidden input — the storage unit). On success the
 * client is sent to their booking inbox to track the host's reply.
 */
export function RequestBookingForm({
  listingId,
  listingRateCents,
  deployments,
}: {
  listingId: string;
  listingRateCents: number;
  deployments: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(requestBookingAction, null);
  React.useEffect(() => {
    if (state?.ok) router.push("/client/bookings");
  }, [state, router]);

  const parsed: { id: string; code: string; name: string }[] = React.useMemo(() => {
    try {
      return JSON.parse(deployments);
    } catch {
      return [];
    }
  }, [deployments]);

  const [rateEur, setRateEur] = React.useState(
    listingRateCents > 0 ? String(Math.round(listingRateCents / 100)) : "",
  );
  const proposedCents = rateEur ? Math.round(Number(rateEur) * 100) : "";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="proposedMonthlyCents" value={proposedCents} />

      <Field
        label="Attach to deployment (optional)"
        htmlFor="deploymentId"
        hint="Ties this booking to a crew deployment so Corridor rolls it into the deployment's consolidated invoice."
      >
        <Select id="deploymentId" name="deploymentId" defaultValue="">
          <option value="">— standalone booking —</option>
          {parsed.map((d) => (
            <option key={d.id} value={d.id}>
              {d.code} — {d.name}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Requested move-in" htmlFor="requestedMoveIn">
          <Input id="requestedMoveIn" name="requestedMoveIn" type="date" required />
        </Field>
        <Field label="Requested move-out" htmlFor="requestedMoveOut">
          <Input id="requestedMoveOut" name="requestedMoveOut" type="date" required />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Headcount" htmlFor="headcount">
          <Input id="headcount" name="headcount" type="number" min={1} defaultValue={1} required />
        </Field>
        <Field label="Proposed rate (€/mo)" htmlFor="proposedMonthlyEur" hint="Defaults to the listing rate — counter with what your budget allows.">
          <Input
            id="proposedMonthlyEur"
            type="number"
            min={0}
            step={50}
            value={rateEur}
            onChange={(e) => setRateEur(e.target.value)}
            placeholder="e.g. 2200"
          />
        </Field>
      </div>

      <Field label="Message to host" htmlFor="message">
        <Textarea id="message" name="message" placeholder="Crew profile, shifts, any compliance needs…" />
      </Field>

      <FormError state={state} />
      <div className="flex justify-end">
        <SubmitButton>Send request</SubmitButton>
      </div>
    </form>
  );
}
