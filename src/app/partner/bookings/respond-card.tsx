"use client";
import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { respondBookingAction } from "@/server/actions/bookings";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton, FormError } from "@/components/forms";

/**
 * Per-booking response island. Three independent server-action forms funnel
 * into the same `respondBookingAction` with different `decision` values:
 * accept → PARTNER_ACCEPTED, decline → PARTNER_DECLINED, counter → COUNTERED
 * (carries a partner-proposed monthly amount in cents).
 *
 * The partner enters a counter figure in whole euros; we convert to integer
 * cents (the storage unit) in a hidden input so the action receives a number
 * directly. `router.refresh()` on any ok update makes the server-rendered
 * status badge flip without a full navigation.
 */
export function BookingResponseCard({ id }: { id: string }) {
  const router = useRouter();
  const [acceptState, acceptAction] = useActionState(respondBookingAction, null);
  const [declineState, declineAction] = useActionState(respondBookingAction, null);
  const [counterState, counterAction] = useActionState(respondBookingAction, null);
  const [counterEur, setCounterEur] = React.useState("");

  React.useEffect(() => {
    if (acceptState?.ok || declineState?.ok || counterState?.ok) router.refresh();
  }, [acceptState, declineState, counterState, router]);

  const counterCents = counterEur ? Math.round(Number(counterEur) * 100) : "";

  return (
    <div className="space-y-3 rounded-lg border border-ink-100 bg-ink-50/40 p-3">
      <div className="text-sm text-ink-600">Your response</div>
      <div className="flex flex-wrap gap-2">
        <form action={acceptAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="decision" value="accept" />
          <SubmitButton size="sm">Accept</SubmitButton>
          <FormError state={acceptState} className="mt-1" />
        </form>
        <form action={declineAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="decision" value="decline" />
          <SubmitButton size="sm" variant="danger">
            Decline
          </SubmitButton>
          <FormError state={declineState} className="mt-1" />
        </form>
      </div>
      <form action={counterAction} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="decision" value="counter" />
        <input type="hidden" name="counterMonthlyCents" value={counterCents} />
        <Field label="Counter (€/mo)" htmlFor={`counter-${id}`} className="min-w-[160px] flex-1">
          <Input
            id={`counter-${id}`}
            type="number"
            step="0.01"
            min={0}
            value={counterEur}
            onChange={(e) => setCounterEur(e.target.value)}
            placeholder="e.g. 2200"
          />
        </Field>
        <SubmitButton size="sm" variant="outline">
          Send counter
        </SubmitButton>
        <div className="w-full">
          <FormError state={counterState} />
        </div>
      </form>
    </div>
  );
}
