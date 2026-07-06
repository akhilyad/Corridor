"use client";
import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { verifyDocAction, rejectDocAction } from "@/server/actions/docs";
import { SubmitButton, FormError } from "@/components/forms";
import { Input, Textarea } from "@/components/ui/field";

/**
 * Compliance review islands. Verify stamps a vault doc VERIFIED (optionally with
 * reviewer notes); reject stamps it REJECTED with a reason. Each is its own
 * <form> so pending on one never blocks the other, and both refresh the queue.
 */
export function VerifyDocForm({ id }: { id: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState(verifyDocAction, null);
  React.useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <Input
        type="text"
        name="notes"
        placeholder="Reviewer notes (optional)"
        className="h-9 max-w-xs text-xs"
      />
      <div className="flex items-center gap-2">
        <SubmitButton size="sm">Verify</SubmitButton>
        <FormError state={state} />
      </div>
    </form>
  );
}

export function RejectDocForm({ id }: { id: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState(rejectDocAction, null);
  React.useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <Textarea
        name="reason"
        placeholder="Reason for rejection (required for partner notice)"
        rows={2}
        className="max-w-md text-xs"
      />
      <div className="flex items-center gap-2">
        <SubmitButton size="sm" variant="danger">
          Reject
        </SubmitButton>
        <FormError state={state} />
      </div>
    </form>
  );
}
