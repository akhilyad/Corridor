import Link from "next/link";
import { MarketingShell } from "@/components/shell/marketing-shell";
import { ButtonLink } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <MarketingShell>
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <p className="text-sm font-semibold text-weld-700">403</p>
        <h1 className="mt-2 text-2xl font-semibold">You can't reach that page</h1>
        <p className="mt-2 text-sm text-ink-500">
          Your account role doesn't have access to this section. If this is wrong, sign in with a different account.
        </p>
        <div className="mt-6 flex gap-2">
          <ButtonLink href="/login" variant="outline" size="md">Sign in</ButtonLink>
          <ButtonLink href="/" size="md">Back to home</ButtonLink>
        </div>
      </div>
    </MarketingShell>
  );
}
