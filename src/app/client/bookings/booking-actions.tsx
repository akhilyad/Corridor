"use client";
import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { contractBookingAction, withdrawBookingAction } from "@/server/actions/bookings";
import { SubmitButton, FormError } from "@/components/forms";

/**
 * Client-side booking actions. Booking flow from the procurement side:
 *   REQUESTED → (host accepts) → PARTNER_ACCEPTED → contractBooking → CONTRACTED
 *   REQUESTED → (host counters) → COUNTERED        → contractBooking → CONTRACTED
 * The client can withdraw a still-open request at any point before contracting.
 * Each form `router.refresh()`es on success so the server-rendered status badge
 * and the action surface both update in place.
 */
export function ContractButton({ id }: { id: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState(contractBookingAction, null);
  React.useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton size="sm">Confirm & contract</SubmitButton>
      <FormError state={state} className="mt-1" />
    </form>
  );
}

export function WithdrawButton({ id }: { id: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState(withdrawBookingAction, null);
  React.useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton size="sm" variant="outline">
        Withdraw
      </SubmitButton>
      <FormError state={state} className="mt-1" />
    </form>
  );
}
