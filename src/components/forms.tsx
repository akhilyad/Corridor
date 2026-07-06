"use client";
import * as React from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Shared form primitives for the `useActionState` server-action pattern.
 * `SubmitButton` reads `useFormStatus()` so it shows pending state without
 * each page wiring its own; `FormError` renders the action's `error` string.
 */

type ButtonProps = React.ComponentProps<typeof Button>;

export function SubmitButton({
  children,
  variant = "primary",
  size = "md",
  className,
  ...rest
}: {
  children: React.ReactNode;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className">) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size={size} loading={pending} className={className} {...rest}>
      {children}
    </Button>
  );
}

export function FormError({ state, className }: { state: { ok: boolean; error?: string } | null; className?: string }) {
  if (!state || state.ok || !state.error) return null;
  return <p className={cn("text-sm text-red-600", className)}>{state.error}</p>;
}
