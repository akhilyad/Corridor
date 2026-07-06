"use client";
import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { uploadDocAction } from "@/server/actions/docs";
import { Field, Input, Select } from "@/components/ui/field";
import { SubmitButton, FormError } from "@/components/forms";

/**
 * Compliance-vault upload island. The form posts to `uploadDocAction` with
 * `encType="multipart/form-data"` so the file travels as a real File (not a
 * urlencoded string) — the action sniffs magic bytes against the declared
 * MIME so a renamed .txt can't pass as a PDF.
 *
 * A partner can scope an upload to their org-wide vault (ownerType=PARTNER)
 * or to a specific listing they own (ownerType=LISTING). The two scope
 * hidden inputs swap on the fly from a controlled <select>.
 */
const CATEGORIES = [
  "INSURANCE_CERT",
  "PUBLIC_LIABILITY",
  "EMPLOYER_LIABILITY",
  "SAFETY_ATTESTATION",
  "BACKGROUND_CHECK",
  "FIRE_SAFETY",
  "GAS_ELEC_CERT",
  "FOOD_HYGIENE",
  "ISO_45001",
  "ISO_9001",
  "ACCREDITATION",
  "CONTRACT",
  "OTHER",
] as const;

export function DocUploadForm({
  orgId,
  listings,
  maxBytesLabel,
}: {
  orgId: string;
  listings: string;
  maxBytesLabel: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(uploadDocAction, null);
  React.useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  const parsed: { id: string; title: string }[] = React.useMemo(() => {
    try {
      return JSON.parse(listings);
    } catch {
      return [];
    }
  }, [listings]);

  const [scope, setScope] = React.useState("org");
  const isListing = scope !== "org";

  return (
    <form action={formAction} encType="multipart/form-data" className="space-y-4">
      {isListing ? (
        <input type="hidden" name="ownerType" value="LISTING" />
      ) : (
        <input type="hidden" name="ownerType" value="PARTNER" />
      )}
      <input type="hidden" name="ownerId" value={isListing ? scope : orgId} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Document scope" htmlFor="scope">
          <Select id="scope" value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="org">Organisation-wide</option>
            {parsed.map((l) => (
              <option key={l.id} value={l.id}>
                Listing: {l.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Category" htmlFor="category">
          <Select id="category" name="category" defaultValue="INSURANCE_CERT">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.toLowerCase().replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Document title" htmlFor="title" hint="Optional — defaults to the file name">
        <Input id="title" name="title" placeholder="e.g. Public liability cover 2026" />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Issued date" htmlFor="issuedAt">
          <Input id="issuedAt" name="issuedAt" type="date" />
        </Field>
        <Field label="Expiry date" htmlFor="expiresAt" hint="Leave blank if it does not expire">
          <Input id="expiresAt" name="expiresAt" type="date" />
        </Field>
      </div>

      <Field label="File" htmlFor="file" hint={`PDF, PNG, JPEG or WEBP — up to ${maxBytesLabel}`}>
        <input
          id="file"
          name="file"
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/webp"
          required
          className="block w-full text-sm text-ink-700 file:mr-3 file:rounded-lg file:border file:border-ink-200 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink-800 hover:file:bg-ink-50"
        />
      </Field>

      <FormError state={state} />
      <div className="flex justify-end">
        <SubmitButton>Upload to vault</SubmitButton>
      </div>
    </form>
  );
}
