"use client";
import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { approveListingAction, suspendListingAction } from "@/server/actions/listings";
import { SubmitButton, FormError } from "@/components/forms";

/**
 * Listing review actions. Approve flips PENDING_REVIEW → LIVE (publishes to the
 * marketplace). Suspend flips LIVE → SUSPENDED (hides from browse). Both refresh
 * the review queue on success.
 */
export function ApproveListingButton({ id }: { id: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState(approveListingAction, null);
  React.useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton size="sm">Approve</SubmitButton>
      <FormError state={state} className="mt-1" />
    </form>
  );
}

export function SuspendListingButton({ id }: { id: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState(suspendListingAction, null);
  React.useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton size="sm" variant="danger">
        Suspend
      </SubmitButton>
      <FormError state={state} className="mt-1" />
    </form>
  );
}
