"use client";
import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { registerAction } from "@/server/actions/auth";
import { Field, Input, Select } from "@/components/ui/field";
import { SubmitButton, FormError } from "@/components/forms";
import { cn } from "@/lib/utils";

const COUNTRIES = ["DE", "NL", "BE", "FR", "DK", "GB", "PL", "ES", "PT", "IE", "SE", "FI", "NO", "AT", "CH"];

export function RegisterForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(registerAction, null);
  const [role, setRole] = React.useState<"PARTNER" | "CLIENT">("PARTNER");
  React.useEffect(() => {
    if (state?.ok) router.push(state.data.redirect);
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <RoleCard
          value="PARTNER"
          label="Supply partner"
          desc="List housing & secured yards"
          selected={role === "PARTNER"}
          onSelect={setRole}
        />
        <RoleCard
          value="CLIENT"
          label="Procurement / EPC"
          desc="House crews & raise POs"
          selected={role === "CLIENT"}
          onSelect={setRole}
        />
      </div>
      <input type="hidden" name="role" value={role} />
      <Field label="Full name" htmlFor="name">
        <Input id="name" name="name" autoComplete="name" required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Work email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Password" htmlFor="password" hint="Min 8 characters">
          <Input id="password" name="password" type="password" autoComplete="new-password" required />
        </Field>
      </div>
      <Field
        label={role === "PARTNER" ? "Company / operator name" : "Organisation name"}
        htmlFor="companyName"
      >
        <Input id="companyName" name="companyName" required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Country" htmlFor="country">
          <Select id="country" name="country" defaultValue="DE">
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="VAT ID (optional)" htmlFor="vatId">
          <Input id="vatId" name="vatId" />
        </Field>
      </div>
      <FormError state={state} />
      <SubmitButton className="w-full">Create account</SubmitButton>
    </form>
  );
}

function RoleCard({
  value,
  label,
  desc,
  selected,
  onSelect,
}: {
  value: "PARTNER" | "CLIENT";
  label: string;
  desc: string;
  selected: boolean;
  onSelect: (v: "PARTNER" | "CLIENT") => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        "rounded-lg border p-3 text-left transition",
        selected ? "border-weld-500 bg-weld-50" : "border-ink-200 bg-white hover:border-ink-300",
      )}
    >
      <div className="text-sm font-semibold text-ink-900">{label}</div>
      <div className="mt-0.5 text-xs text-ink-500">{desc}</div>
    </button>
  );
}
