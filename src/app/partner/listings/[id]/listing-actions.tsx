"use client";
import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { submitListingForReviewAction, archiveListingAction } from "@/server/actions/listings";
import { SubmitButton, FormError } from "@/components/forms";

/**
 * Listing lifecycle controls for the partner. Two independent server-action
 * forms: submit-for-review (DRAFT → PENDING_REVIEW) and archive (→ ARCHIVED).
 * Each calls `router.refresh()` on success so the server-rendered status badge
 * updates without a full navigation.
 */
export function ListingLifecycleActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [submitState, submitAction] = useActionState(submitListingForReviewAction, null);
  const [archiveState, archiveAction] = useActionState(archiveListingAction, null);

  React.useEffect(() => {
    if (submitState?.ok || archiveState?.ok) router.refresh();
  }, [submitState, archiveState, router]);

  const isDraft = status === "DRAFT";
  const isArchived = status === "ARCHIVED";

  return (
    <div className="space-y-3">
      <div className="text-sm text-ink-600">
        {isDraft && "Submit for staff review when the infra spec and compliance are ready. Staff approve to take it live."}
        {status === "PENDING_REVIEW" && "Awaiting platform review. You'll see it flip to LIVE here once approved."}
        {status === "LIVE" && "Live on the marketplace. Visible to procurement and filterable by infrastructure."}
        {status === "SUSPENDED" && "Suspended by platform staff. Contact compliance for details."}
        {isArchived && "Archived — no longer visible to procurement. Re-edit and re-submit to revive."}
      </div>

      <div className="flex flex-wrap gap-3">
        {isDraft && (
          <form action={submitAction}>
            <input type="hidden" name="id" value={id} />
            <SubmitButton>Submit for review</SubmitButton>
            <FormError state={submitState} className="mt-2" />
          </form>
        )}

        {!isArchived && (
          <form action={archiveAction}>
            <input type="hidden" name="id" value={id} />
            <SubmitButton variant="outline">Archive listing</SubmitButton>
            <FormError state={archiveState} className="mt-2" />
          </form>
        )}
      </div>
    </div>
  );
}
