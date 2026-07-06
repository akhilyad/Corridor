import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "amber" | "sea" | "green" | "red" | "violet" | "ink";

const tones: Record<Tone, string> = {
  neutral: "bg-ink-100 text-ink-700 border-ink-200",
  amber: "bg-weld-50 text-weld-700 border-weld-200",
  sea: "bg-sea-50 text-sea-700 border-sea-200",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  red: "bg-red-50 text-red-700 border-red-200",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
  ink: "bg-ink-900 text-white border-ink-900",
};

export function Badge({
  tone = "neutral",
  className,
  children,
  ...props
}: { tone?: Tone; className?: string; children: React.ReactNode } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/** Maps common lifecycle strings to a tone for consistent rendering. */
export function StatusBadge({ status }: { status: string }) {
  const tone = toneForStatus(status);
  return <Badge tone={tone}>{prettyStatus(status)}</Badge>;
}

export function toneForStatus(s: string): Tone {
  const v = s.toUpperCase();
  if (["LIVE", "APPROVED", "PAID", "ACTIVE", "VERIFIED", "COMPLETED", "CONTRACTED", "PARTNER_ACCEPTED", "CONFIRMED"].includes(v)) return "green";
  if (["PENDING_REVIEW", "PENDING", "REQUESTED", "IN_REVIEW", "EXPIRING_SOON", "QUOTE_SENT", "SCHEDULED", "CONDITIONAL"].includes(v)) return "amber";
  if (["REJECTED", "EXPIRED", "SUSPENDED", "OVERDUE", "PARTNER_DECLINED", "CANCELLED", "FAILED", "VOID", "WITHDRAWN"].includes(v)) return "red";
  if (["DRAFT", "NOT_STARTED"].includes(v)) return "neutral";
  return "neutral";
}

export function prettyStatus(s: string): string {
  return s
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}
