"use client";
import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/server/actions/auth";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton, FormError } from "@/components/forms";

export function LoginForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(loginAction, null);
  React.useEffect(() => {
    if (state?.ok) router.push(state.data.redirect);
  }, [state, router]);
  return (
    <form action={formAction} className="space-y-4">
      <Field label="Work email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <FormError state={state} />
      <SubmitButton className="w-full">Sign in</SubmitButton>
      <p className="text-center text-xs text-ink-400">Demo accounts are seeded — see the README.</p>
    </form>
  );
}
