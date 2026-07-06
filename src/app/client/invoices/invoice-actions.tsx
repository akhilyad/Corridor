"use client";
import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { markInvoicePaidAction, voidInvoiceAction } from "@/server/actions/invoices";
import { SubmitButton, FormError } from "@/components/forms";

/**
 * Invoice settlement islands. Pay runs as a single transaction that flips the
 * invoice to PAID and every scheduled payout to PAID (releasing accrued partner
 * payouts). Void refuses a PAID invoice and flips any pending/scheduled payout
 * to FAILED. Both refresh the page on success.
 */
export function PayInvoiceButton({ id }: { id: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState(markInvoicePaidAction, null);
  React.useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton size="sm">Mark paid</SubmitButton>
      <FormError state={state} className="mt-1" />
    </form>
  );
}

export function VoidInvoiceButton({ id }: { id: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState(voidInvoiceAction, null);
  React.useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton size="sm" variant="danger">
        Void
      </SubmitButton>
      <FormError state={state} className="mt-1" />
    </form>
  );
}
